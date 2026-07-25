package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Trae TODAS (para uso interno si se requiere)
    List<Category> findAllByOrderByDisplayOrderAsc();

    // NUEVO: Trae solo las categorías que NO tienen padre (La raíz del árbol)
    @Query("SELECT c FROM Category c WHERE c.parentCategory IS NULL ORDER BY c.displayOrder ASC")
    List<Category> findAllRootCategories();

    // Trae las principales activas para el Navbar público
    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.showInNav = true AND c.parentCategory IS NULL ORDER BY c.displayOrder ASC")
    List<Category> findRootNavCategories();

    // NUEVO: Para encontrar la categoría que acabamos de crear al vuelo
    Optional<Category> findTopByOrderByIdDesc();
}