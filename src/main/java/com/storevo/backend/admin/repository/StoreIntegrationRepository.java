package com.storevo.backend.admin.repository;

import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreIntegrationRepository extends JpaRepository<StoreIntegration, Long> {

    // 1. Usado por el Dashboard: Busca la configuración sin importar si está apagada o encendida
    Optional<StoreIntegration> findByStoreAndIntegrationType(Store store, IntegrationType type);

    // 2. Usado por el motor (Checkout/Webhooks): Busca SOLO si la integración está activa
    Optional<StoreIntegration> findByStoreAndIntegrationTypeAndIsActiveTrue(Store store, IntegrationType type);
}