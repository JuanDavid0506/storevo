package com.storevo.backend.config;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class TenantSchemaMigrationRunner implements CommandLineRunner {

    private final StoreRepository storeRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("TenantSchemaMigrationRunner: verificando esquemas de tiendas existentes...");
        List<Store> stores = storeRepository.findAll();

        for (Store store : stores) {
            String schema = store.getSchemaName();
            if (schema == null || schema.isBlank() || !schema.matches("^[a-z0-9_]+$")) {
                continue;
            }
            try {
                // 1. Columnas faltantes en orders
                addColumnIfMissing(schema, "orders", "public_token", "VARCHAR(64) NULL");
                addColumnIfMissing(schema, "orders", "customer_email", "VARCHAR(120) NULL");
                addColumnIfMissing(schema, "orders", "document_type", "VARCHAR(10) NULL");
                addColumnIfMissing(schema, "orders", "verification_digit", "VARCHAR(5) NULL");
                addColumnIfMissing(schema, "orders", "legal_name", "VARCHAR(150) NULL");
                addColumnIfMissing(schema, "orders", "tax_regime", "VARCHAR(40) NULL");
                addColumnIfMissing(schema, "orders", "requires_electronic_invoice", "BOOLEAN DEFAULT FALSE");

                // Generar UUID para pedidos anteriores que no tengan public_token
                jdbcTemplate.update(
                        "UPDATE `" + schema + "`.orders SET public_token = UUID() WHERE public_token IS NULL OR public_token = ''"
                );
                addUniqueIndexIfMissing(schema, "orders", "uk_orders_public_token", "public_token");

                // 2. Columnas faltantes en shipments
                addColumnIfMissing(schema, "shipments", "label_pdf_url", "VARCHAR(500) NULL");
                addColumnIfMissing(schema, "shipments", "last_tracking_message", "VARCHAR(255) NULL");

                // 3. Tabla store_reviews si no existe
                jdbcTemplate.execute(
                        "CREATE TABLE IF NOT EXISTS `" + schema + "`.store_reviews (" +
                                "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                                "  order_id BIGINT NOT NULL UNIQUE," +
                                "  customer_name VARCHAR(100) NOT NULL," +
                                "  customer_city VARCHAR(100) NULL," +
                                "  rating INT NOT NULL DEFAULT 5," +
                                "  comment VARCHAR(500) NOT NULL," +
                                "  is_visible BOOLEAN NOT NULL DEFAULT TRUE," +
                                "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                                "  FOREIGN KEY (order_id) REFERENCES `" + schema + "`.orders(id) ON DELETE CASCADE" +
                                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
                );

                log.info("TenantSchemaMigrationRunner: esquema {} sincronizado.", schema);
            } catch (Exception e) {
                log.error("TenantSchemaMigrationRunner: error sincronizando esquema {}: {}", schema, e.getMessage());
            }
        }
    }

    private void addColumnIfMissing(String schema, String table, String column, String definition) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS " +
                        "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, schema, table, column
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE `" + schema + "`.`" + table + "` ADD COLUMN `" + column + "` " + definition);
        }
    }

    private void addUniqueIndexIfMissing(String schema, String table, String indexName, String column) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS " +
                        "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
                Integer.class, schema, table, indexName
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE `" + schema + "`.`" + table + "` ADD CONSTRAINT `" + indexName + "` UNIQUE (`" + column + "`)");
        }
    }
}