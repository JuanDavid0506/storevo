package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.dto.CategoryDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/dashboard/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public String listCategories(Model model) {
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Categorías");
        return "dashboard/categories/index";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        // Objeto vacío para el formulario de creación
        CategoryDto dto = new CategoryDto();
        dto.setIsActive(true); // Por defecto activo
        dto.setDisplayOrder(0); // Por defecto orden 0

        model.addAttribute("category", dto);
        model.addAttribute("pageTitle", "Nueva Categoría");
        return "dashboard/categories/form";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable Long id, Model model) {
        Category category = categoryService.getCategoryById(id);
        CategoryDto dto = CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .displayOrder(category.getDisplayOrder())
                .build();

        model.addAttribute("category", dto);
        model.addAttribute("pageTitle", "Editar Categoría");
        return "dashboard/categories/form";
    }

    @PostMapping
    public String saveCategory(@ModelAttribute CategoryDto categoryDto) {
        categoryService.saveCategory(categoryDto);
        return "redirect:/dashboard/categories?success=true";
    }

    @PostMapping("/{id}/toggle")
    public String toggleStatus(@PathVariable Long id) {
        categoryService.toggleStatus(id);
        return "redirect:/dashboard/categories";
    }

    @PostMapping("/{id}/delete")
    public String deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return "redirect:/dashboard/categories?deleted=true";
    }
}