package com.storevo.backend.admin.repository;

import com.storevo.backend.admin.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    // Método personalizado para buscar una tienda por su slug (subdominio)
    Optional<Store> findBySlug(String slug);

    // Método personalizado para verificar si un slug ya está en uso
    boolean existsBySlug(String slug);
}