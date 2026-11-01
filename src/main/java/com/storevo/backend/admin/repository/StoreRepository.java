package com.storevo.backend.admin.repository;

import com.storevo.backend.admin.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    // Método personalizado para buscar una tienda por su slug (subdominio)
    Optional<Store> findBySlug(String slug);

    // Permite resolver la tienda a partir del esquema de base de datos actual (TenantContext)
    Optional<Store> findBySchemaName(String schemaName);

    // Método personalizado para verificar si un slug ya está en uso
    boolean existsBySlug(String slug);

    // Verifica si el nombre del esquema normalizado (tenant_xxx) ya existe en otra tienda (Objetivo C7)
    boolean existsBySchemaName(String schemaName);
}