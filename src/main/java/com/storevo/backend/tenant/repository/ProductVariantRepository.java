package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    // Encuentra todas las variantes de un producto específico
    List<ProductVariant> findByProductId(Long productId);

    // Encuentra solo las variantes activas de un producto (útil para el catálogo público)
    List<ProductVariant> findByProductIdAndIsActiveTrue(Long productId);

    // Verifica que la variante exista y pertenezca estrictamente al producto indicado (Objetivo C2/C3)
    Optional<ProductVariant> findByIdAndProductId(Long id, Long productId);

    // Bloqueo pesimista para evitar condiciones de carrera al descontar o restaurar stock (Objetivo C6)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM ProductVariant v WHERE v.id = :id AND v.product.id = :productId")
    Optional<ProductVariant> findByIdAndProductIdWithLock(@Param("id") Long id, @Param("productId") Long productId);

    // Busca una variante exacta por su SKU (vital para escáneres de código de barras o importaciones)
    Optional<ProductVariant> findBySku(String sku);
}