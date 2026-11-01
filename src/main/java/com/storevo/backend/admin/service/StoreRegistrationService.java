package com.storevo.backend.admin.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.admin.repository.StoreRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class StoreRegistrationService {

    private final StoreRepository storeRepository;
    private final TenantSchemaService tenantSchemaService;
    private final EntityManager entityManager;

    // Permite solo letras minúsculas, números y guiones simples intermedios (3 a 50 caracteres)
    private static final Pattern VALID_SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");

    private static final Set<String> RESERVED_SLUGS = Set.of(
            "admin", "api", "auth", "dashboard", "login", "register", "storevo", "www", "mail", "support"
    );

    public String normalizeAndValidateSlug(String rawSlug) {
        if (rawSlug == null || rawSlug.isBlank()) {
            throw new IllegalArgumentException("El enlace (slug) de la tienda es obligatorio.");
        }
        String normalized = rawSlug.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() < 3 || normalized.length() > 50) {
            throw new IllegalArgumentException("El enlace de la tienda debe tener entre 3 y 50 caracteres.");
        }
        if (!VALID_SLUG_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("El enlace de la tienda solo puede contener letras minúsculas, números y guiones intermedios (ej: mi-tienda).");
        }
        if (RESERVED_SLUGS.contains(normalized)) {
            throw new IllegalArgumentException("Ese enlace de tienda está reservado por el sistema.");
        }
        return normalized;
    }

    public String buildSchemaNameFromSlug(String normalizedSlug) {
        return "tenant_" + normalizedSlug.replace("-", "_");
    }

    @Transactional
    public Store registerNewStore(String storeName, String slug, String emailContact) {
        String cleanSlug = normalizeAndValidateSlug(slug);
        String schemaName = buildSchemaNameFromSlug(cleanSlug);

        if (storeRepository.existsBySlug(cleanSlug)
                || storeRepository.existsBySchemaName(schemaName)
                || tenantSchemaService.schemaExistsInDatabase(schemaName)) {
            throw new IllegalStateException("El enlace o esquema de la tienda ya está en uso.");
        }

        String cleanStoreName = (storeName != null && !storeName.isBlank()) ? storeName.trim() : cleanSlug;

        Store newStore = Store.builder()
                .name(cleanStoreName)
                .slug(cleanSlug)
                .schemaName(schemaName)
                .status("ACTIVE")
                .build();
        newStore = storeRepository.save(newStore);

        // Paleta base neutra para la plantilla oficial del MVP
        String defaultPrimary = "#0F172A";
        String defaultSecondary = "#FFFFFF";

        StoreSettings defaultSettings = StoreSettings.builder()
                .store(newStore)
                .emailContact(emailContact != null ? emailContact.trim() : null)
                .primaryColor(defaultPrimary)
                .secondaryColor(defaultSecondary)
                .build();

        entityManager.persist(defaultSettings);

        tenantSchemaService.createDatabaseSchema(schemaName);

        return newStore;
    }
}