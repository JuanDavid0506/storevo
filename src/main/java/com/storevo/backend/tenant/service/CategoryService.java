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

    // Calcula el nivel actual en el árbol (1 = Raíz, 2 = Nivel 2, 3 = Nivel 3)
    private int getCategoryLevel(Category category) {
        if (category == null) return 0;
        int level = 1;
        Category current = category.getParentCategory();
        while (current != null) {
            level++;
            current = current.getParentCategory();
        }
        return level;
    }

    // Calcula la profundidad interna (hijos anidados) que posee esta categoría
    private int getMaxDepth(Category category) {
        if (category.getSubCategories() == null || category.getSubCategories().isEmpty()) {
            return 1;
        }
        int maxChildDepth = 0;
        for (Category child : category.getSubCategories()) {
            maxChildDepth = Math.max(maxChildDepth, getMaxDepth(child));
        }
        return 1 + maxChildDepth;
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
            Category parent = getCategoryById(dto.getParentId());

            // 1. Validar el límite estricto de 3 niveles
            int parentLevel = getCategoryLevel(parent);
            int myInternalDepth = (category.getId() != null) ? getMaxDepth(category) : 1;

            if (parentLevel + myInternalDepth > 3) {
                throw new RuntimeException("Movimiento inválido: Supera el límite de 3 niveles de jerarquía (Principal > Sub > Sub-sub).");
            }

            // 2. Prevenir referencia circular (asignarse a sí misma o a un hijo como padre)
            Category checkCycle = parent;
            while (checkCycle != null) {
                if (checkCycle.getId().equals(category.getId())) {
                    throw new RuntimeException("Movimiento inválido: No puedes asignar un hijo como padre de su categoría actual.");
                }
                checkCycle = checkCycle.getParentCategory();
            }

            category.setParentCategory(parent);
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