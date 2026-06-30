package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CategoryDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.service.CategoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/dashboard/{slug}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }
        model.addAttribute("store", store);
        model.addAttribute("slug", slug);
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping
    public String listCategories(Model model) {
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Categorías");
        return "dashboard/categories/index";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        CategoryDto dto = new CategoryDto();
        dto.setIsActive(true);
        dto.setShowInNav(true);
        dto.setDisplayOrder(0);

        model.addAttribute("category", dto);
        model.addAttribute("allCategories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Nueva Categoría");
        return "dashboard/categories/form";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable Long id, Model model) {
        Category category = categoryService.getCategoryById(id);
        CategoryDto dto = CategoryDto.builder()
                .id(category.getId())
                .parentId(category.getParentCategory() != null ? category.getParentCategory().getId() : null)
                .name(category.getName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .showInNav(category.getShowInNav())
                .displayOrder(category.getDisplayOrder())
                .build();

        model.addAttribute("category", dto);
        model.addAttribute("allCategories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Editar Categoría");
        return "dashboard/categories/form";
    }

    @PostMapping
    public String saveCategory(@PathVariable String slug, @ModelAttribute CategoryDto categoryDto) {
        categoryService.saveCategory(categoryDto);
        return "redirect:/dashboard/" + slug + "/categories?success=true";
    }

    @PostMapping("/{id}/toggle")
    public String toggleStatus(@PathVariable String slug, @PathVariable Long id) {
        categoryService.toggleStatus(id);
        return "redirect:/dashboard/" + slug + "/categories";
    }

    @PostMapping("/{id}/delete")
    public String deleteCategory(@PathVariable String slug, @PathVariable Long id) {
        categoryService.deleteCategory(id);
        return "redirect:/dashboard/" + slug + "/categories?deleted=true";
    }
}