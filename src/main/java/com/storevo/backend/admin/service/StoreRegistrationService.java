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
    public Store registerNewStore(String storeName, String slug, String emailContact) {
        String schemaName = "tenant_" + slug.replace("-", "_");

        Store newStore = Store.builder()
                .name(storeName)
                .slug(slug)
                .schemaName(schemaName)
                .status("ACTIVE")
                .build();

        newStore = storeRepository.save(newStore);

        // Paleta base neutra para la plantilla oficial del MVP
        String defaultPrimary = "#0F172A";
        String defaultSecondary = "#FFFFFF";

        StoreSettings defaultSettings = StoreSettings.builder()
                .store(newStore)
                .emailContact(emailContact)
                .primaryColor(defaultPrimary)
                .secondaryColor(defaultSecondary)
                .build();

        entityManager.persist(defaultSettings);

        tenantSchemaService.createDatabaseSchema(schemaName);

        return newStore;
    }
}