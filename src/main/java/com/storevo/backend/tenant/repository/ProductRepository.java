package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Brand;
import com.storevo.backend.tenant.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByIsDeletedFalseOrderByIdDesc();

    List<Product> findByIsActiveTrueAndIsDeletedFalseOrderByIdDesc();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isDeleted = false AND p.isDraft = false ORDER BY p.id DESC")
    List<Product> findActiveNewestProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isDeleted = false AND p.isDraft = false AND p.discountPrice IS NOT NULL AND p.discountPrice > 0 AND (p.price IS NULL OR p.discountPrice < p.price) ORDER BY p.id DESC")
    List<Product> findActiveOfferProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id IN :categoryIds AND p.isActive = true AND p.isDeleted = false ORDER BY p.id DESC")
    List<Product> findActiveProductsByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    @Query("SELECT p FROM Product p WHERE p.category.id IN :categoryIds AND p.isActive = true AND p.isDeleted = false AND p.isDraft = false ORDER BY p.id DESC")
    List<Product> findActiveProductsByCategoryIds(@Param("categoryIds") List<Long> categoryIds, Pageable pageable);

    @Query("SELECT p FROM Product p LEFT JOIN p.brandRef b WHERE p.isActive = true AND p.isDeleted = false AND p.isDraft = false " +
            "AND ((:brandId IS NOT NULL AND b.id = :brandId AND (b.isActive IS NULL OR b.isActive = true)) " +
            "OR (:brandName IS NOT NULL AND :brandName <> '' AND LOWER(p.brand) = LOWER(:brandName) AND (b IS NULL OR b.isActive = true))) " +
            "ORDER BY p.id DESC")
    List<Product> findActiveProductsByBrand(@Param("brandId") Long brandId,
                                            @Param("brandName") String brandName,
                                            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isDeleted = false AND p.isDraft = false AND p.isFeatured = true ORDER BY p.id DESC")
    List<Product> findActiveFeaturedProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.id IN :ids AND p.isActive = true AND p.isDeleted = false AND p.isDraft = false")
    List<Product> findActivePublicProductsByIdIn(@Param("ids") Collection<Long> ids);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isDeleted = false AND p.isDraft = false " +
            "AND (:q IS NULL OR :q = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "ORDER BY p.id DESC")
    List<Product> searchActiveProductsForPicker(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
            "(:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
            "(:categoryIds IS NULL OR p.category.id IN :categoryIds) AND " +
            "(:isActive IS NULL OR p.isActive = :isActive) AND " +
            "(p.isDeleted = :isDeleted) AND " +
            "(:isDraft IS NULL OR p.isDraft = :isDraft) AND " +
            "(:quick IS NULL " +
            "  OR (:quick = 'out_of_stock' AND p.stock <= 0) " +
            "  OR (:quick = 'sale' AND p.discountPrice > 0) " +
            "  OR (:quick = 'featured' AND p.isFeatured = true AND p.isDeleted = false) " +
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

    @Query(value = "SELECT p FROM Product p LEFT JOIN p.brandRef b WHERE " +
            "p.isActive = true AND p.isDeleted = false AND p.isDraft = false AND " +
            "(b IS NULL OR b.isActive = true) AND " +
            "(:categoryIds IS NULL OR p.category.id IN :categoryIds) AND " +
            "(:brandId IS NULL OR b.id = :brandId) AND " +
            "(:brandName IS NULL OR :brandName = '' OR LOWER(p.brand) = LOWER(:brandName)) AND " +
            "(:q IS NULL OR :q = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
            "(:onlyOffers IS NULL OR :onlyOffers = false OR (p.discountPrice IS NOT NULL AND p.discountPrice > 0 AND (p.price IS NULL OR p.discountPrice < p.price))) AND " +
            "(:onlyFeatured IS NULL OR :onlyFeatured = false OR p.isFeatured = true) AND " +
            "(:onlyInStock IS NULL OR :onlyInStock = false OR p.isMadeToOrder = true OR p.stock > 0) AND " +
            "(:minPrice IS NULL OR (CASE WHEN p.discountPrice IS NOT NULL AND p.discountPrice > 0 AND (p.price IS NULL OR p.discountPrice < p.price) THEN p.discountPrice ELSE p.price END) >= :minPrice) AND " +
            "(:maxPrice IS NULL OR (CASE WHEN p.discountPrice IS NOT NULL AND p.discountPrice > 0 AND (p.price IS NULL OR p.discountPrice < p.price) THEN p.discountPrice ELSE p.price END) <= :maxPrice) AND " +
            "(:cursorId IS NULL OR p.id < :cursorId)",
            countQuery = "SELECT COUNT(p) FROM Product p LEFT JOIN p.brandRef b WHERE " +
                    "p.isActive = true AND p.isDeleted = false AND p.isDraft = false AND " +
                    "(b IS NULL OR b.isActive = true) AND " +
                    "(:categoryIds IS NULL OR p.category.id IN :categoryIds) AND " +
                    "(:brandId IS NULL OR b.id = :brandId) AND " +
                    "(:brandName IS NULL OR :brandName = '' OR LOWER(p.brand) = LOWER(:brandName)) AND " +
                    "(:q IS NULL OR :q = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
                    "  OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')) " +
                    "  OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
                    "(:onlyOffers IS NULL OR :onlyOffers = false OR (p.discountPrice IS NOT NULL AND p.discountPrice > 0 AND (p.price IS NULL OR p.discountPrice < p.price))) AND " +
                    "(:onlyFeatured IS NULL OR :onlyFeatured = false OR p.isFeatured = true) AND " +
                    "(:onlyInStock IS NULL OR :onlyInStock = false OR p.isMadeToOrder = true OR p.stock > 0) AND " +
                    "(:minPrice IS NULL OR (CASE WHEN p.discountPrice IS NOT NULL AND p.discountPrice > 0 AND (p.price IS NULL OR p.discountPrice < p.price) THEN p.discountPrice ELSE p.price END) >= :minPrice) AND " +
                    "(:maxPrice IS NULL OR (CASE WHEN p.discountPrice IS NOT NULL AND p.discountPrice > 0 AND (p.price IS NULL OR p.discountPrice < p.price) THEN p.discountPrice ELSE p.price END) <= :maxPrice) AND " +
                    "(:cursorId IS NULL OR :cursorId IS NOT NULL)")
    Page<Product> searchPublicCatalogPaginated(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("brandId") Long brandId,
            @Param("brandName") String brandName,
            @Param("q") String q,
            @Param("onlyOffers") Boolean onlyOffers,
            @Param("onlyFeatured") Boolean onlyFeatured,
            @Param("onlyInStock") Boolean onlyInStock,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    Optional<Product> findTopByOrderByIdDesc();

    // ===== MARCAS =====
    @Query("SELECT p.brandRef.id, COUNT(p) FROM Product p WHERE p.isDeleted = false AND p.brandRef IS NOT NULL GROUP BY p.brandRef.id")
    List<Object[]> countProductsGroupedByBrand();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.brandRef.id = :brandId AND p.isDeleted = false")
    long countActiveByBrand(@Param("brandId") Long brandId);

    @Modifying
    @Query("UPDATE Product p SET p.brand = :name WHERE p.brandRef = :brand")
    int syncBrandName(@Param("brand") Brand brand, @Param("name") String name);

    @Modifying
    @Query("UPDATE Product p SET p.brand = NULL, p.brandRef = NULL WHERE p.brandRef = :brand")
    int clearBrand(@Param("brand") Brand brand);

    List<Product> findByCategoryId(Long categoryId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId AND p.hasVariants = true AND p.isDeleted = false")
    Long countProductsWithVariantsByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId AND p.isDeleted = false")
    long countByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT p.category.id, COUNT(p) FROM Product p WHERE p.isDeleted = false AND p.category IS NOT NULL GROUP BY p.category.id")
    List<Object[]> countProductsGroupedByCategory();

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
        Long getDestacados();
    }

    @Query("SELECT " +
            "COUNT(CASE WHEN p.isDeleted = false THEN 1 END) as todos, " +
            "COUNT(CASE WHEN p.isActive = true AND p.isDeleted = false AND p.isDraft = false THEN 1 END) as activos, " +
            "COUNT(CASE WHEN p.isActive = false AND p.isDeleted = false AND p.isDraft = false THEN 1 END) as ocultos, " +
            "COUNT(CASE WHEN p.isDraft = true AND p.isDeleted = false THEN 1 END) as borradores, " +
            "COUNT(CASE WHEN p.isDeleted = true THEN 1 END) as papelera, " +
            "COUNT(CASE WHEN p.isFeatured = true AND p.isDeleted = false THEN 1 END) as destacados " +
            "FROM Product p")
    ProductCountsProjection countProductsByStatus();
}