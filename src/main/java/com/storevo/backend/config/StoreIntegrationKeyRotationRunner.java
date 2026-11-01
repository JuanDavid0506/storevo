package com.storevo.backend.config;

import com.storevo.backend.config.security.CryptoConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class StoreIntegrationKeyRotationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final CryptoConverter cryptoConverter;

    @Value("${storevo.crypto.legacy-secret-key:}")
    private String legacySecretKey;

    @Override
    public void run(String... args) {
        if (legacySecretKey == null || legacySecretKey.isBlank()) {
            return;
        }

        log.info("StoreIntegrationKeyRotationRunner: verificando credenciales en store_integrations para rotar a la nueva llave AES...");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, api_key, api_secret, extra_data FROM store_integrations"
            );

            int rotatedCount = 0;
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                String apiKey = (String) row.get("api_key");
                String apiSecret = (String) row.get("api_secret");
                String extraData = (String) row.get("extra_data");

                String newApiKey = rotateFieldIfNeeded(apiKey);
                String newApiSecret = rotateFieldIfNeeded(apiSecret);
                String newExtraData = rotateFieldIfNeeded(extraData);

                if (!equalsNullable(apiKey, newApiKey)
                        || !equalsNullable(apiSecret, newApiSecret)
                        || !equalsNullable(extraData, newExtraData)) {
                    jdbcTemplate.update(
                            "UPDATE store_integrations SET api_key = ?, api_secret = ?, extra_data = ? WHERE id = ?",
                            newApiKey, newApiSecret, newExtraData, id
                    );
                    rotatedCount++;
                }
            }

            if (rotatedCount > 0) {
                log.info("StoreIntegrationKeyRotationRunner: se re-cifraron exitosamente {} registro(s) en store_integrations con la nueva llave AES.", rotatedCount);
            }
        } catch (Exception e) {
            log.warn("StoreIntegrationKeyRotationRunner: aviso durante verificación de rotación AES: {}", e.getMessage());
        }
    }

    private String rotateFieldIfNeeded(String dbValue) {
        if (dbValue == null || dbValue.isBlank()) {
            return dbValue;
        }
        try {
            // Intentamos re-cifrar únicamente si el valor aún está cifrado con la llave antigua
            return cryptoConverter.reEncryptFromLegacyKey(dbValue, legacySecretKey);
        } catch (Exception ignored) {
            // Ya está cifrado con la llave activa nueva
            return dbValue;
        }
    }

    private boolean equalsNullable(String a, String b) {
        return a == null ? b == null : a.equals(b);
    }
}