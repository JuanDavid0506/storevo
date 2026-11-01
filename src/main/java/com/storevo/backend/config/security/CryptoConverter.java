package com.storevo.backend.config.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Set;

@Component
@Converter
public class CryptoConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int AES_256_KEY_BYTES = 32; // 256 bits

    private static final Set<String> FORBIDDEN_EXAMPLE_KEYS = Set.of(
            "4gqkgl4vdcwl0cmflti7b6hfothsenmn",
            "storevosupersecretkey2026_cambiarenproduccion",
            "changeme",
            "12345678901234567890123456789012",
            "abcdefghijklmnopqrstuvwxzy123456"
    );

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SecretKeySpec activeKeySpec;
    private final SecretKeySpec legacyKeySpec;

    public CryptoConverter(
            @Value("${storevo.crypto.secret-key}") String secretKey,
            @Value("${storevo.crypto.legacy-secret-key:}") String legacySecretKey) {

        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("Error crítico de seguridad (C8): La variable de entorno STOREVO_CRYPTO_SECRET_KEY es obligatoria.");
        }
        String trimmed = secretKey.trim();
        if (FORBIDDEN_EXAMPLE_KEYS.contains(trimmed.toLowerCase())) {
            throw new IllegalStateException("Error crítico de seguridad (C8): STOREVO_CRYPTO_SECRET_KEY utiliza una clave por defecto o de ejemplo prohibida.");
        }
        byte[] rawBytes = trimmed.getBytes(StandardCharsets.UTF_8);
        if (rawBytes.length < AES_256_KEY_BYTES) {
            throw new IllegalStateException("Error crítico de seguridad (C8): STOREVO_CRYPTO_SECRET_KEY debe tener al menos 32 bytes (256 bits). Longitud actual: " + rawBytes.length + " bytes.");
        }
        // Usamos los primeros 32 bytes exactos para AES-256
        this.activeKeySpec = new SecretKeySpec(Arrays.copyOf(rawBytes, AES_256_KEY_BYTES), ALGORITHM);

        if (legacySecretKey != null && !legacySecretKey.isBlank()) {
            byte[] legacyBytes = legacySecretKey.trim().getBytes(StandardCharsets.UTF_8);
            if (legacyBytes.length < AES_256_KEY_BYTES) {
                throw new IllegalStateException("STOREVO_CRYPTO_LEGACY_SECRET_KEY debe tener al menos 32 bytes si se define para rotación.");
            }
            this.legacyKeySpec = new SecretKeySpec(Arrays.copyOf(legacyBytes, AES_256_KEY_BYTES), ALGORITHM);
        } else {
            this.legacyKeySpec = null;
        }
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        return encryptWithKey(attribute, this.activeKeySpec);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        try {
            return decryptWithKey(dbData, this.activeKeySpec);
        } catch (Exception primaryError) {
            if (this.legacyKeySpec != null) {
                try {
                    return decryptWithKey(dbData, this.legacyKeySpec);
                } catch (Exception ignored) {
                    // Lanzar el error principal abajo
                }
            }
            throw new RuntimeException("Error descifrando la credencial", primaryError);
        }
    }

    /**
     * Utilidad segura de rotación AES (Objetivo C8):
     * Descifra un valor cifrado con la llave AES antigua y lo vuelve a cifrar con un IV nuevo
     * utilizando la llave activa configurada en el entorno.
     */
    public String reEncryptFromLegacyKey(String encryptedWithOldKey, String oldSecretKey) {
        if (encryptedWithOldKey == null || encryptedWithOldKey.isBlank()) {
            return encryptedWithOldKey;
        }
        SecretKeySpec oldSpec;
        if (oldSecretKey != null && !oldSecretKey.isBlank()) {
            byte[] oldBytes = oldSecretKey.trim().getBytes(StandardCharsets.UTF_8);
            if (oldBytes.length < AES_256_KEY_BYTES) {
                throw new IllegalArgumentException("La llave antigua proporcionada debe tener al menos 32 bytes.");
            }
            oldSpec = new SecretKeySpec(Arrays.copyOf(oldBytes, AES_256_KEY_BYTES), ALGORITHM);
        } else if (this.legacyKeySpec != null) {
            oldSpec = this.legacyKeySpec;
        } else {
            throw new IllegalStateException("No se proporcionó llave antigua ni STOREVO_CRYPTO_LEGACY_SECRET_KEY para la rotación.");
        }

        String plainText = decryptWithKey(encryptedWithOldKey, oldSpec);
        return encryptWithKey(plainText, this.activeKeySpec);
    }

    private String encryptWithKey(String plainText, SecretKeySpec keySpec) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encryptedBytes.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encryptedBytes, 0, combined, iv.length, encryptedBytes.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Error cifrando la credencial", e);
        }
    }

    private String decryptWithKey(String base64CipherText, SecretKeySpec keySpec) {
        try {
            byte[] combined = Base64.getDecoder().decode(base64CipherText);
            if (combined.length <= GCM_IV_LENGTH_BYTES) {
                throw new IllegalArgumentException("Payload cifrado inválido.");
            }

            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byte[] encryptedBytes = new byte[combined.length - GCM_IV_LENGTH_BYTES];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, encryptedBytes, 0, encryptedBytes.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error descifrando la credencial", e);
        }
    }
}