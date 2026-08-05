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
            "(:isDraft IS NULL OR p.isDraft = :isDraft) AND " +
            "(:quick IS NULL " +
            "  OR (:quick = 'out_of_stock' AND p.stock <= 0) " +
            "  OR (:quick = 'sale' AND p.discountPrice > 0) " +
            "  OR (:quick = 'active' AND p.isActive = true AND p.isDeleted = false AND p.isDraft = false)" +
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

    List<Product> findByCategoryId(Long categoryId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId AND p.hasVariants = true AND p.isDeleted = false")
    Long countProductsWithVariantsByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT o.name FROM Product p JOIN p.options o WHERE p.category.id = :categoryId AND p.isDeleted = false GROUP BY o.name ORDER BY COUNT(o.id) DESC")
    List<String> findMostUsedOptionsByCategory(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT v.valueName FROM Product p JOIN p.options o JOIN o.values v WHERE p.category.id = :categoryId AND LOWER(o.name) = LOWER(:optionName) AND p.isDeleted = false GROUP BY v.valueName ORDER BY COUNT(v.id) DESC, MAX(p.id) DESC")
    List<String> findMostUsedOptionValuesByCategory(@Param("categoryId") Long categoryId, @Param("optionName") String optionName, Pageable pageable);

    // ==========================================
    // CONTADORES GLOBALES DE INVENTARIO
    // ==========================================
    public interface ProductCountsProjection {
        Long getTodos();
        Long getActivos();
        Long getOcultos();
        Long getBorradores();
        Long getPapelera();
    }

    @Query("SELECT " +
            "COUNT(CASE WHEN p.isDeleted = false THEN 1 END) as todos, " +
            "COUNT(CASE WHEN p.isActive = true AND p.isDeleted = false AND p.isDraft = false THEN 1 END) as activos, " +
            "COUNT(CASE WHEN p.isActive = false AND p.isDeleted = false AND p.isDraft = false THEN 1 END) as ocultos, " +
            "COUNT(CASE WHEN p.isDraft = true AND p.isDeleted = false THEN 1 END) as borradores, " +
            "COUNT(CASE WHEN p.isDeleted = true THEN 1 END) as papelera " +
            "FROM Product p")
    ProductCountsProjection countProductsByStatus();
}