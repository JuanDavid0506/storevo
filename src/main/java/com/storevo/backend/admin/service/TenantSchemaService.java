package com.storevo.backend.admin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantSchemaService {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    // Solo permite letras minúsculas, números y guiones bajos (máx. 64 chars en MySQL)
    private final Pattern schemaPattern = Pattern.compile("^[a-z0-9_]{1,64}$");

    public boolean schemaExistsInDatabase(String schemaName) {
        if (schemaName == null || !schemaPattern.matcher(schemaName).matches()) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
                Integer.class, schemaName
        );
        return count != null && count > 0;
    }

    public void createDatabaseSchema(String schemaName) {
        if (schemaName == null || !schemaPattern.matcher(schemaName).matches()) {
            throw new IllegalArgumentException("Nombre de esquema inválido: " + schemaName);
        }
        if (schemaExistsInDatabase(schemaName)) {
            throw new IllegalStateException("El esquema de base de datos ya está en uso: " + schemaName);
        }

        try {
            log.info("Creando esquema para nueva tienda: {}", schemaName);

            // 1. Crear el esquema en MySQL con soporte completo UTF-8
            jdbcTemplate.execute("CREATE SCHEMA `" + schemaName + "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // 2. Ejecutar el script base
            executeBaselineScript(schemaName);

            log.info("Esquema {} inicializado correctamente.", schemaName);
        } catch (Exception e) {
            log.error("Error al crear el esquema: {}", schemaName, e);
            throw new RuntimeException("No se pudo aprovisionar la tienda", e);
        }
    }

    private void executeBaselineScript(String schemaName) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("db/tenant-baseline.sql"));

        try (var connection = dataSource.getConnection()) {
            String previousCatalog = connection.getCatalog();
            try {
                // Cambiamos el contexto de MySQL al nuevo esquema
                connection.setCatalog(schemaName);
                populator.populate(connection);
            } finally {
                if (previousCatalog != null) {
                    connection.setCatalog(previousCatalog);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error ejecutando tablas base", e);
        }
    }
}