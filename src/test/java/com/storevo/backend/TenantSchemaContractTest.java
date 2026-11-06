package com.storevo.backend;

import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.model.Order;
import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Contrato entre la entidad JPA, tenant-baseline.sql (tiendas NUEVAS) y TenantSchemaMigrationRunner (tiendas EXISTENTES).
 * Las tres piezas deben declarar las mismas columnas, con el mismo tipo y la misma nulabilidad; si no, una tienda nueva y
 * una antigua terminarían con esquemas distintos.
 */
class TenantSchemaContractTest {

    private static final Path BASELINE = Path.of("src/main/resources/db/tenant-baseline.sql");
    private static final Path RUNNER = Path.of("src/main/java/com/storevo/backend/config/TenantSchemaMigrationRunner.java");

    /** Columnas que NO existían en la tabla original y se añaden por migración. */
    private static final List<String> EVOLVED_CUSTOMER_COLUMNS = List.of(
            "password_hash", "has_account", "reset_password_token", "reset_password_expires_at", "last_login_at",
            "password_changed_at", "email_verified_at", "email_verification_token", "email_verification_expires_at",
            "email_verification_sent_at");
    private static final List<String> EVOLVED_ORDER_COLUMNS = List.of("placed_with_account");

    /** Las 4 columnas de la verificación de correo: todas NULL, así las filas existentes no cambian. */
    private static final List<String> EMAIL_VERIFICATION_COLUMNS = List.of(
            "email_verified_at", "email_verification_token", "email_verification_expires_at", "email_verification_sent_at");

    private static String read(Path p) throws IOException {
        return Files.readString(p, StandardCharsets.UTF_8);
    }

    private static String createTableBody(String sql, String table) {
        Matcher m = Pattern.compile("CREATE TABLE IF NOT EXISTS " + table + " \\((.*?)\\) ENGINE", Pattern.DOTALL).matcher(sql);
        assertTrue(m.find(), "No se encontró CREATE TABLE " + table + " en el baseline");
        return m.group(1);
    }

    private static Field fieldFor(Class<?> entity, String column) {
        for (Field f : entity.getDeclaredFields()) {
            Column c = f.getAnnotation(Column.class);
            if (c != null && column.equals(c.name())) {
                return f;
            }
        }
        fail("La entidad " + entity.getSimpleName() + " no declara la columna " + column);
        return null;
    }

    private static String expectedSqlType(Field f) {
        Column c = f.getAnnotation(Column.class);
        Class<?> t = f.getType();
        if (t == String.class) {
            return "VARCHAR(" + c.length() + ")";
        }
        if (t == LocalDateTime.class) {
            return "DATETIME";
        }
        if (t == Boolean.class || t == boolean.class) {
            return "BOOLEAN";
        }
        fail("Tipo no soportado por el contrato: " + t + " en " + f.getName());
        return null;
    }

    private void assertColumnContract(Class<?> entity, String table, List<String> columns) throws IOException {
        String baseline = createTableBody(read(BASELINE), table);
        String runner = read(RUNNER);
        List<String> problems = new ArrayList<>();

        for (String col : columns) {
            Field field = fieldFor(entity, col);
            String type = expectedSqlType(field);
            boolean notNull = !field.getAnnotation(Column.class).nullable();

            Matcher inBaseline = Pattern.compile("(?m)^\\s*" + col + "\\s+(\\S+)([^\\n]*)").matcher(baseline);
            if (!inBaseline.find()) {
                problems.add(table + "." + col + ": falta en tenant-baseline.sql");
            } else {
                if (!inBaseline.group(1).replace(",", "").equalsIgnoreCase(type)) {
                    problems.add(table + "." + col + ": tipo en baseline '" + inBaseline.group(1) + "' != entidad '" + type + "'");
                }
                if (inBaseline.group(2).toUpperCase().contains("NOT NULL") != notNull) {
                    problems.add(table + "." + col + ": nulabilidad del baseline distinta de la entidad");
                }
            }

            Matcher inRunner = Pattern.compile("new ColumnMigration\\(\"" + table + "\", \"" + col + "\", \"([^\"]+)\"").matcher(runner);
            if (!inRunner.find()) {
                problems.add(table + "." + col + ": falta en TenantSchemaMigrationRunner (las tiendas existentes no la recibirían)");
            } else {
                String def = inRunner.group(1);
                if (!def.split("\\s+")[0].equalsIgnoreCase(type)) {
                    problems.add(table + "." + col + ": tipo en el runner '" + def + "' != entidad '" + type + "'");
                }
                if (def.toUpperCase().contains("NOT NULL") != notNull) {
                    problems.add(table + "." + col + ": nulabilidad del runner distinta de la entidad");
                }
            }
        }
        assertTrue(problems.isEmpty(), "Esquema desincronizado: " + problems);
    }

    @Test
    void customerEntityBaselineAndRunnerDeclareTheSameColumns() throws IOException {
        assertColumnContract(Customer.class, "customers", EVOLVED_CUSTOMER_COLUMNS);
    }

    @Test
    void orderEntityBaselineAndRunnerDeclareTheSameColumns() throws IOException {
        assertColumnContract(Order.class, "orders", EVOLVED_ORDER_COLUMNS);
    }

    @Test
    void emailVerificationColumnsAreNullableSoExistingRowsAreUntouched() throws IOException {
        String runner = read(RUNNER);
        for (String col : EMAIL_VERIFICATION_COLUMNS) {
            Matcher m = Pattern.compile("new ColumnMigration\\(\"customers\", \"" + col + "\", \"([^\"]+)\"").matcher(runner);
            assertTrue(m.find(), col);
            assertFalse(m.group(1).toUpperCase().contains("NOT NULL"), col + " debe ser NULL");
            assertFalse(m.group(1).toUpperCase().contains("DEFAULT"), col + ": sin valores por defecto que reescriban filas");
            assertTrue(fieldFor(Customer.class, col).getAnnotation(Column.class).nullable(), col);
        }
        // La migración no borra ni renombra nada
        assertFalse(runner.toUpperCase().contains("DROP COLUMN") || runner.toUpperCase().contains("DROP TABLE"));
    }

    @Test
    void theVerificationTokenIndexExistsInBothPlaces() throws IOException {
        assertTrue(read(BASELINE).contains("INDEX idx_customers_verification_token (email_verification_token)"));
        assertTrue(read(RUNNER).contains("new IndexMigration(\"customers\", \"idx_customers_verification_token\", \"`email_verification_token`\", false)"));
    }

    @Test
    void theTokenColumnFitsASha256HexDigest() {
        // 64 caracteres hex; la columna es de 100 (igual que el token de recuperación)
        int length = fieldFor(Customer.class, "email_verification_token").getAnnotation(Column.class).length();
        assertTrue(length >= 64, "la columna del token no cabe un SHA-256 en hexadecimal");
    }
}
