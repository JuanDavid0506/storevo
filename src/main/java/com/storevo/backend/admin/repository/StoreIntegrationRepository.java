package com.storevo.backend.admin.repository;

import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreIntegrationRepository extends JpaRepository<StoreIntegration, Long> {

    // Busca la configuración activa de una integración específica para una tienda
    Optional<StoreIntegration> findByStoreAndIntegrationTypeAndIsActiveTrue(Store store, IntegrationType type);
}