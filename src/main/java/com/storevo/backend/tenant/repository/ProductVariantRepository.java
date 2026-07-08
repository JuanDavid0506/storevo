package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    // Encuentra todas las variantes de un producto específico
    List<ProductVariant> findByProductId(Long productId);

    // Encuentra solo las variantes activas de un producto (útil para el catálogo público)
    List<ProductVariant> findByProductIdAndIsActiveTrue(Long productId);

    // Busca una variante exacta por su SKU (vital para escáneres de código de barras o importaciones)
    Optional<ProductVariant> findBySku(String sku);
}