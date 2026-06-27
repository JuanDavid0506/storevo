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

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    @Transactional
    public void saveCategory(CategoryDto dto) {
        Category category;
        if (dto.getId() != null) {
            category = getCategoryById(dto.getId()); // Actualizar
        } else {
            category = new Category(); // Crear nueva
        }

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        // category.setImageUrl(dto.getImageUrl()); // TODO: Fase de subida de archivos

        // Manejo de nulos desde los checkboxes del formulario HTML
        category.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);
        category.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);

        categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        // En el futuro, aquí validaremos que la categoría no tenga productos antes de borrarla
        categoryRepository.deleteById(id);
    }

    @Transactional
    public void toggleStatus(Long id) {
        Category category = getCategoryById(id);
        category.setIsActive(!category.getIsActive());
        categoryRepository.save(category);
    }
}