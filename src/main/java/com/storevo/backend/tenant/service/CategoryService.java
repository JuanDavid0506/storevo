package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CategoryDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    // Obtenemos el árbol base para el Dashboard
    public List<Category> getRootCategories() {
        return categoryRepository.findAllRootCategories();
    }

    public List<Category> getNavCategories() {
        return categoryRepository.findRootNavCategories();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    @Transactional
    public void saveCategory(CategoryDto dto) {
        Category category;
        if (dto.getId() != null) {
            category = getCategoryById(dto.getId());
        } else {
            category = new Category();
        }

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);
        category.setShowInNav(dto.getShowInNav() != null ? dto.getShowInNav() : false);
        category.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);

        if (dto.getParentId() != null) {
            category.setParentCategory(getCategoryById(dto.getParentId()));
        } else {
            category.setParentCategory(null);
        }

        categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    @Transactional
    public void toggleStatus(Long id) {
        Category category = getCategoryById(id);
        category.setIsActive(!category.getIsActive());
        categoryRepository.save(category);
    }
}