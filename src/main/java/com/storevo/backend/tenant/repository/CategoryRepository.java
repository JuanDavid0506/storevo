package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Traer todas las categorías ordenadas por el campo de ordenamiento ascendente
    List<Category> findAllByOrderByDisplayOrderAsc();
}