package com.storevo.backend.config;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class TenantSchemaMigrationRunner implements CommandLineRunner {

    private final StoreRepository storeRepository;
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    private static final Pattern VALID_SCHEMA_PATTERN = Pattern.compile("^[a-z0-9_]+$");

    /**
     * Estructura evolutiva para declarar nuevas columnas y su SQL opcional de inicialización (backfill).
     */
    private record ColumnMigration(String table, String column, String definition, String backfillSql) {
        ColumnMigration(String table, String column, String definition) {
            this(table, column, definition, null);
        }
    }

    /**
     * Estructura evolutiva para declarar índices únicos o compuestos sobre tablas existentes.
     */
    private record IndexMigration(String table, String indexName, String columnsSql, boolean unique) {}

    /**
     * Catálogo evolutivo de columnas por tabla.
     * Para agregar nuevas columnas en el futuro (ej. en orders), basta con añadir una entrada aquí.
     */
    private static final List<ColumnMigration> TENANT_COLUMN_MIGRATIONS = List.of(
            // --- Evolución de categories ---
            new ColumnMigration("categories", "image_url", "VARCHAR(500) NULL"),
            new ColumnMigration("categories", "show_in_nav", "BOOLEAN NOT NULL DEFAULT TRUE"),
            new ColumnMigration("categories", "display_order", "INT NOT NULL DEFAULT 0"),

            // --- Evolución de products ---
            new ColumnMigration("products", "brand_id", "BIGINT NULL"),
            new ColumnMigration("products", "has_variants", "BOOLEAN NOT NULL DEFAULT FALSE"),
            new ColumnMigration("products", "is_made_to_order", "BOOLEAN NOT NULL DEFAULT FALSE"),
            new ColumnMigration("products", "is_featured", "BOOLEAN NOT NULL DEFAULT FALSE"),
            new ColumnMigration("products", "attributes_json", "JSON NULL"),
            new ColumnMigration("products", "is_deleted", "BOOLEAN NOT NULL DEFAULT FALSE"),
            new ColumnMigration("products", "is_draft", "BOOLEAN NOT NULL DEFAULT FALSE"),
            new ColumnMigration("products", "version", "BIGINT NOT NULL DEFAULT 0"),

            // --- Evolución de product_variants ---
            new ColumnMigration("product_variants", "version", "BIGINT NOT NULL DEFAULT 0"),

            // --- Evolución de product_images ---
            new ColumnMigration("product_images", "variant_id", "BIGINT NULL"),

            // --- Evolución de orders (token público, customer_id, datos DIAN y control de stock) ---
            new ColumnMigration("orders", "customer_id", "BIGINT NULL"),
            new ColumnMigration(
                    "orders",
                    "public_token",
                    "VARCHAR(64) NULL",
                    "UPDATE `%s`.orders SET public_token = UUID() WHERE public_token IS NULL OR public_token = ''"
            ),
            new ColumnMigration("orders", "customer_email", "VARCHAR(120) NULL"),
            new ColumnMigration("orders", "document_type", "VARCHAR(10) NULL"),
            new ColumnMigration("orders", "customer_document", "VARCHAR(30) NULL"),
            new ColumnMigration("orders", "verification_digit", "VARCHAR(5) NULL"),
            new ColumnMigration("orders", "legal_name", "VARCHAR(150) NULL"),
            new ColumnMigration("orders", "tax_regime", "VARCHAR(40) NULL"),
            new ColumnMigration("orders", "requires_electronic_invoice", "BOOLEAN DEFAULT FALSE"),
            new ColumnMigration(
                    "orders",
                    "stock_deducted",
                    "BOOLEAN NOT NULL DEFAULT FALSE",
                    "UPDATE `%s`.orders SET stock_deducted = TRUE WHERE status IN ('PAID', 'CONFIRMED', 'PREPARING', 'PACKED', 'SHIPPED', 'DELIVERED')"
            ),

            // --- Evolución de shipments ---
            new ColumnMigration("shipments", "label_pdf_url", "VARCHAR(500) NULL"),
            new ColumnMigration("shipments", "last_tracking_message", "VARCHAR(255) NULL")
    );

    private static final List<IndexMigration> TENANT_INDEX_MIGRATIONS = List.of(
            new IndexMigration("orders", "uk_orders_public_token", "`public_token`", true),
            new IndexMigration("orders", "idx_orders_customer_id", "`customer_id`, `created_at`", false),
            new IndexMigration("orders", "idx_orders_status_created", "`status`, `created_at`", false),
            new IndexMigration("orders", "idx_orders_customer_phone", "`customer_phone`, `created_at`", false),
            new IndexMigration("order_items", "idx_order_items_product", "`product_id`, `order_id`", false),
            new IndexMigration("shipments", "idx_shipments_external_id", "`external_shipment_id`", false)
    );

    @Override
    public void run(String... args) {
        List<Store> stores = storeRepository.findAll();
        if (stores.isEmpty()) {
            return;
        }

        log.info("TenantSchemaMigrationRunner: verificando y migrando {} esquema(s) de tiendas...", stores.size());

        for (Store store : stores) {
            if (store == null || "SUSPENDED".equalsIgnoreCase(store.getStatus())) {
                continue;
            }
            String schema = store.getSchemaName();
            if (schema == null || schema.isBlank() || !VALID_SCHEMA_PATTERN.matcher(schema).matches()) {
                log.warn("TenantSchemaMigrationRunner: esquema inválido omitido para tienda id={}: {}", store.getId(), schema);
                continue;
            }
            migrateSingleTenantSchema(schema);
        }

        log.info("TenantSchemaMigrationRunner: migración multi-tenant finalizada.");
    }

    public void migrateSingleTenantSchema(String schema) {
        try {
            // 1. Asegurar que el esquema exista en MySQL
            jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS `" + schema + "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // 2. Ejecutar tenant-baseline.sql de forma idempotente para crear tablas nuevas que falten (ej. brands, store_reviews)
            executeIdempotentBaselineTables(schema);

            // 3. Aplicar migraciones de columnas faltantes en tablas ya existentes
            for (ColumnMigration migration : TENANT_COLUMN_MIGRATIONS) {
                boolean added = addColumnIfMissing(schema, migration.table(), migration.column(), migration.definition());
                if (migration.backfillSql() != null && !migration.backfillSql().isBlank()) {
                    // Para public_token garantizamos siempre que ningún registro quede nulo;
                    // para otros backfills solo se ejecuta cuando se crea la columna por primera vez.
                    if (added || "public_token".equals(migration.column())) {
                        jdbcTemplate.update(String.format(migration.backfillSql(), schema));
                    }
                }
            }

            // 4. Aplicar índices únicos y de rendimiento faltantes
            for (IndexMigration idx : TENANT_INDEX_MIGRATIONS) {
                addIndexIfMissing(schema, idx.table(), idx.indexName(), idx.columnsSql(), idx.unique());
            }

            // 5. Poblar tabla customers y vincular orders.customer_id desde pedidos históricos (Objetivo A7)
            backfillCustomersFromExistingOrders(schema);

            log.info("TenantSchemaMigrationRunner: esquema '{}' sincronizado correctamente.", schema);
        } catch (Exception e) {
            log.error("TenantSchemaMigrationRunner: error migrando esquema '{}': {}", schema, e.getMessage());
        }
    }

    private void backfillCustomersFromExistingOrders(String schema) {
        if (!tableExists(schema, "customers") || !tableExists(schema, "orders")) {
            return;
        }
        Integer unlinkedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM `" + schema + "`.orders WHERE customer_id IS NULL",
                Integer.class
        );
        if (unlinkedCount == null || unlinkedCount == 0) {
            return;
        }

        // 1. Insertar o actualizar clientes consolidados desde los pedidos existentes
        String upsertCustomersSql =
                "INSERT INTO `" + schema + "`.customers (" +
                        "  phone_key, name, phone, email, document_type, document, verification_digit, " +
                        "  legal_name, tax_regime, requires_electronic_invoice, address, city, " +
                        "  total_orders, total_spent, last_order_date, last_channel, channels_csv, created_at, updated_at" +
                        ") " +
                        "SELECT " +
                        "  CASE " +
                        "    WHEN REGEXP_REPLACE(o.customer_phone, '[^0-9]', '') LIKE '57__________' " +
                        "      THEN SUBSTRING(REGEXP_REPLACE(o.customer_phone, '[^0-9]', ''), 3) " +
                        "    WHEN REGEXP_REPLACE(o.customer_phone, '[^0-9]', '') <> '' " +
                        "      THEN LEFT(REGEXP_REPLACE(o.customer_phone, '[^0-9]', ''), 35) " +
                        "    ELSE CONCAT('NAME_', MIN(o.id)) " +
                        "  END AS phone_key, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(o.customer_name ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS name, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(o.customer_phone ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS phone, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.customer_email, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS email, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.document_type, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS document_type, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.customer_document, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS document, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.verification_digit, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS verification_digit, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.legal_name, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS legal_name, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.tax_regime, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS tax_regime, " +
                        "  MAX(COALESCE(o.requires_electronic_invoice, 0)) AS requires_electronic_invoice, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.address, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS address, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(NULLIF(o.city, '') ORDER BY o.created_at DESC SEPARATOR '||'), '||', 1) AS city, " +
                        "  COUNT(o.id) AS total_orders, " +
                        "  COALESCE(SUM(CASE WHEN o.status NOT IN ('CANCELLED', 'REFUNDED') THEN o.total ELSE 0 END), 0) AS total_spent, " +
                        "  MAX(o.created_at) AS last_order_date, " +
                        "  SUBSTRING_INDEX(GROUP_CONCAT(o.channel ORDER BY o.created_at DESC SEPARATOR ','), ',', 1) AS last_channel, " +
                        "  GROUP_CONCAT(DISTINCT o.channel ORDER BY o.channel ASC SEPARATOR ',') AS channels_csv, " +
                        "  MIN(o.created_at) AS created_at, " +
                        "  NOW() AS updated_at " +
                        "FROM `" + schema + "`.orders o " +
                        "GROUP BY phone_key " +
                        "ON DUPLICATE KEY UPDATE " +
                        "  total_orders = VALUES(total_orders), " +
                        "  total_spent = VALUES(total_spent), " +
                        "  last_order_date = VALUES(last_order_date), " +
                        "  last_channel = VALUES(last_channel), " +
                        "  channels_csv = VALUES(channels_csv)";

        jdbcTemplate.execute(upsertCustomersSql);

        // 2. Vincular orders.customer_id con el registro correspondiente en customers
        String linkOrdersSql =
                "UPDATE `" + schema + "`.orders o " +
                        "JOIN `" + schema + "`.customers c ON c.phone_key = (" +
                        "  CASE " +
                        "    WHEN REGEXP_REPLACE(o.customer_phone, '[^0-9]', '') LIKE '57__________' " +
                        "      THEN SUBSTRING(REGEXP_REPLACE(o.customer_phone, '[^0-9]', ''), 3) " +
                        "    WHEN REGEXP_REPLACE(o.customer_phone, '[^0-9]', '') <> '' " +
                        "      THEN LEFT(REGEXP_REPLACE(o.customer_phone, '[^0-9]', ''), 35) " +
                        "    ELSE CONCAT('NAME_', o.id) " +
                        "  END" +
                        ") " +
                        "SET o.customer_id = c.id " +
                        "WHERE o.customer_id IS NULL";

        int linked = jdbcTemplate.update(linkOrdersSql);
        log.info("TenantSchemaMigrationRunner: {} pedido(s) histórico(s) vinculados a la tabla customers en '{}'", linked, schema);
    }

    private void executeIdempotentBaselineTables(String schema) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setContinueOnError(true);
        populator.addScript(new ClassPathResource("db/tenant-baseline.sql"));

        try (Connection connection = dataSource.getConnection()) {
            String previousCatalog = connection.getCatalog();
            try {
                connection.setCatalog(schema);
                populator.populate(connection);
            } finally {
                if (previousCatalog != null) {
                    connection.setCatalog(previousCatalog);
                }
            }
        } catch (Exception e) {
            log.warn("TenantSchemaMigrationRunner: aviso al aplicar baseline en '{}': {}", schema, e.getMessage());
        }
    }

    private boolean addColumnIfMissing(String schema, String table, String column, String definition) {
        if (!tableExists(schema, table)) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS " +
                        "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, schema, table, column
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE `" + schema + "`.`" + table + "` ADD COLUMN `" + column + "` " + definition);
            log.info("TenantSchemaMigrationRunner: columna '{}.{}' agregada en '{}'", table, column, schema);
            return true;
        }
        return false;
    }

    private void addIndexIfMissing(String schema, String table, String indexName, String columnsSql, boolean unique) {
        if (!tableExists(schema, table)) {
            return;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS " +
                        "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
                Integer.class, schema, table, indexName
        );
        if (count == null || count == 0) {
            String sql = unique
                    ? "ALTER TABLE `" + schema + "`.`" + table + "` ADD CONSTRAINT `" + indexName + "` UNIQUE (" + columnsSql + ")"
                    : "CREATE INDEX `" + indexName + "` ON `" + schema + "`.`" + table + "` (" + columnsSql + ")";
            jdbcTemplate.execute(sql);
        }
    }

    private boolean tableExists(String schema, String table) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                Integer.class, schema, table
        );
        return count != null && count > 0;
    }
}