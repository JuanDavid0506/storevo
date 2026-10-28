package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    Optional<Brand> findBySlug(String slug);

    List<Brand> findAllByOrderByNameAsc();

    long countByIsActive(Boolean isActive);

    @Query("SELECT COUNT(b) FROM Brand b WHERE b.logoUrl IS NULL OR b.logoUrl = ''")
    long countWithoutLogo();

    /**
     * Listado paginado del dashboard.
     * status: all | active | hidden | nologo  (q llega siempre como texto, "" = sin búsqueda)
     */
    @Query("SELECT b FROM Brand b WHERE LOWER(b.name) LIKE LOWER(CONCAT('%', :q, '%')) AND (" +
            ":status = 'all' " +
            "OR (:status = 'active' AND b.isActive = true) " +
            "OR (:status = 'hidden' AND b.isActive = false) " +
            "OR (:status = 'nologo' AND (b.logoUrl IS NULL OR b.logoUrl = '')))")
    Page<Brand> search(@Param("q") String q, @Param("status") String status, Pageable pageable);

    /** Mismo filtro, ordenado por cantidad de productos (de más a menos) y luego por nombre. */
    @Query(value = "SELECT b FROM Brand b WHERE LOWER(b.name) LIKE LOWER(CONCAT('%', :q, '%')) AND (" +
            ":status = 'all' " +
            "OR (:status = 'active' AND b.isActive = true) " +
            "OR (:status = 'hidden' AND b.isActive = false) " +
            "OR (:status = 'nologo' AND (b.logoUrl IS NULL OR b.logoUrl = ''))) " +
            "ORDER BY (SELECT COUNT(p) FROM Product p WHERE p.brandRef = b AND p.isDeleted = false) DESC, " +
            "LOWER(b.name) ASC",
            countQuery = "SELECT COUNT(b) FROM Brand b WHERE LOWER(b.name) LIKE LOWER(CONCAT('%', :q, '%')) AND (" +
                    ":status = 'all' " +
                    "OR (:status = 'active' AND b.isActive = true) " +
                    "OR (:status = 'hidden' AND b.isActive = false) " +
                    "OR (:status = 'nologo' AND (b.logoUrl IS NULL OR b.logoUrl = '')))")
    Page<Brand> searchOrderByProducts(@Param("q") String q, @Param("status") String status, Pageable pageable);
}