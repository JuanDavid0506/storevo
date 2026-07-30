package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByIsDeletedFalseOrderByIdDesc();

    List<Product> findByIsActiveTrueAndIsDeletedFalseOrderByIdDesc();

    @Query("SELECT p FROM Product p WHERE p.category.id IN :categoryIds AND p.isActive = true AND p.isDeleted = false ORDER BY p.id DESC")
    List<Product> findActiveProductsByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    @Query("SELECT p FROM Product p WHERE " +
            "(:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
            "(:categoryIds IS NULL OR p.category.id IN :categoryIds) AND " +
            "(:isActive IS NULL OR p.isActive = :isActive) AND " +
            "(p.isDeleted = :isDeleted) AND " +
            "(:isDraft IS NULL OR p.isDraft = :isDraft) AND " + // <--- EL FILTRO DE BORRADOR
            "(:quick IS NULL " +
            "  OR (:quick = 'out_of_stock' AND p.stock <= 0) " +
            "  OR (:quick = 'sale' AND p.discountPrice > 0) " +
            "  OR (:quick = 'active' AND p.isActive = true AND p.isDeleted = false)" +
            ")")
    Page<Product> searchProducts(
            @Param("q") String q,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("isActive") Boolean isActive,
            @Param("isDeleted") Boolean isDeleted,
            @Param("isDraft") Boolean isDraft,
            @Param("quick") String quick,
            Pageable pageable);

    Optional<Product> findTopByOrderByIdDesc();
}