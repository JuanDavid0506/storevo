package com.storevo.backend.admin.repository;

import com.storevo.backend.admin.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    // Método personalizado para buscar una tienda por su slug (subdominio)
    Optional<Store> findBySlug(String slug);

    // Permite resolver la tienda a partir del esquema de base de datos actual
    // (TenantContext) — lo usa InventoryService para saber si la tienda que está
    // operando ahora mismo controla o no su inventario, sin que cada llamador
    // tenga que pasarle el Store explícitamente.
    Optional<Store> findBySchemaName(String schemaName);

    // Método personalizado para verificar si un slug ya está en uso
    boolean existsBySlug(String slug);
}