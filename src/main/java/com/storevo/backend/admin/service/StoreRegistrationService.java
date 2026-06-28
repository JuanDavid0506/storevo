package com.storevo.backend.admin.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.admin.repository.StoreRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreRegistrationService {

    private final StoreRepository storeRepository;
    private final TenantSchemaService tenantSchemaService;
    private final EntityManager entityManager;

    @Transactional
    public Store registerNewStore(String storeName, String slug, String emailContact, String businessType, String themeName) {
        String schemaName = "tenant_" + slug.replace("-", "_");

        Store newStore = Store.builder()
                .name(storeName)
                .slug(slug)
                .schemaName(schemaName)
                .status("ACTIVE")
                .build();

        newStore = storeRepository.save(newStore);

        // Magia de Colores: Asignamos paletas automáticas según la plantilla
        String primary = "#0F172A"; // Minimalista (Slate 900)
        String secondary = "#FFFFFF";

        if ("urbano".equals(themeName)) {
            primary = "#4F46E5"; // Indigo vibrante
            secondary = "#F3F4F6";
        } else if ("elegante".equals(themeName)) {
            primary = "#9CA3AF"; // Gris plata
            secondary = "#111827"; // Negro oscuro
        }

        StoreSettings defaultSettings = StoreSettings.builder()
                .store(newStore)
                .emailContact(emailContact)
                .businessType(businessType)
                .themeName(themeName)
                .primaryColor(primary)
                .secondaryColor(secondary)
                .build();

        entityManager.persist(defaultSettings);

        tenantSchemaService.createDatabaseSchema(schemaName);

        return newStore;
    }
}