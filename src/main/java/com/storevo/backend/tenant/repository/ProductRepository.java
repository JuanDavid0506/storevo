package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Para el Dashboard: Trae todo el inventario (activos e inactivos)
    List<Product> findAllByOrderByIdDesc();

    // Para la Tienda Pública (Sin filtro): Trae solo los productos activos
    List<Product> findAllByIsActiveTrueOrderByIdDesc();

    // Para la Tienda Pública (Con filtro): Trae productos activos que pertenezcan a las categorías enviadas
    @Query("SELECT p FROM Product p WHERE p.category.id IN :categoryIds AND p.isActive = true ORDER BY p.id DESC")
    List<Product> findActiveProductsByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    @Query("SELECT p FROM Product p WHERE " +
            "(:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
            "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
            "(:isActive IS NULL OR p.isActive = :isActive)")
    Page<Product> searchProducts(
            @Param("q") String q,
            @Param("categoryId") Long categoryId,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}