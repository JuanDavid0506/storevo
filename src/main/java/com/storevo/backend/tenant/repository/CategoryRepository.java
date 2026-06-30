package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Trae TODAS para el dashboard
    List<Category> findAllByOrderByDisplayOrderAsc();

    // Trae SOLO las principales que deben ir en el Menú de la tienda pública
    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.showInNav = true AND c.parentCategory IS NULL ORDER BY c.displayOrder ASC")
    List<Category> findRootNavCategories();
}