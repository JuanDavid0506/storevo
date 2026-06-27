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

        // 1. Crear la tienda (Pendiente de pago)
        Store newStore = Store.builder()
                .name(storeName)
                .slug(slug)
                .schemaName(schemaName)
                .status("ACTIVE") // Asumimos que se activa tras el pago
                .build();

        newStore = storeRepository.save(newStore);

        // 2. Crear su configuración visual por defecto
        StoreSettings defaultSettings = StoreSettings.builder()
                .store(newStore)
                .emailContact(emailContact)
                .primaryColor("#000000")
                .secondaryColor("#FFFFFF")
                .build();

        entityManager.persist(defaultSettings);

        // 3. Crear físicamente la base de datos para este cliente
        tenantSchemaService.createDatabaseSchema(schemaName);

        return newStore;
    }
}