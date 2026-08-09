package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CategoryDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.repository.CategoryRepository;
import com.storevo.backend.tenant.service.CategoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/dashboard/{slug}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // Inyectamos el repositorio para el endpoint de guardado rápido (AJAX)
    private final CategoryRepository categoryRepository;

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
        // Solo mandamos la raíz, Thymeleaf se encarga de dibujar las hijas automáticamente
        model.addAttribute("rootCategories", categoryService.getRootCategories());
        model.addAttribute("productCounts", categoryService.getProductCountsByCategory());
        model.addAttribute("pageTitle", "Organización del Catálogo");
        return "dashboard/categories/index";
    }

    @GetMapping("/new")
    public String showCreateForm(@PathVariable String slug, @RequestParam(required = false) Long parentId, Model model, RedirectAttributes redirectAttributes) {
        // Si el padre ya está en el nivel 3 (Principal > Sub > Sub-sub), no lo dejamos
        // ni llegar al formulario: evitamos el viaje en falso de llenar todo y que
        // falle al guardar por el límite de jerarquía.
        if (parentId != null && !categoryService.canHaveChildren(parentId)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Esa categoría ya está en el nivel más profundo permitido (3 niveles) y no puede tener subcategorías.");
            return "redirect:/dashboard/" + slug + "/categories";
        }

        CategoryDto dto = new CategoryDto();
        dto.setIsActive(true);
        dto.setDisplayOrder(0);

        // Si viene un ID padre en la URL, lo pre-configuramos
        if (parentId != null) {
            dto.setParentId(parentId);
            dto.setShowInNav(false); // ❌ Las subcategorías NO van al navbar
            model.addAttribute("parentCategory", categoryService.getCategoryById(parentId));
        } else {
            dto.setShowInNav(true);  // ✅ Las principales SÍ van al navbar
        }

        model.addAttribute("category", dto);
        model.addAttribute("pageTitle", parentId != null ? "Nueva Subcategoría" : "Nueva Categoría Principal");
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
        model.addAttribute("allRootCategories", categoryService.getRootCategories()); // Para poder moverla en edición
        model.addAttribute("pageTitle", "Editar Categoría");
        return "dashboard/categories/form";
    }

    @PostMapping
    public String saveCategory(@PathVariable String slug, @ModelAttribute CategoryDto categoryDto, RedirectAttributes redirectAttributes) {
        try {
            categoryService.saveCategory(categoryDto);
            return "redirect:/dashboard/" + slug + "/categories?success=true";
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/dashboard/" + slug + "/categories";
        }
    }

    // ==========================================
    // ENDPOINT PARA CREACIÓN RÁPIDA (AJAX)
    // ==========================================
    @PostMapping("/api/quick-add")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> quickAddCategory(
            @PathVariable String slug,
            @RequestBody Map<String, String> payload) {

        try {
            // 1. Usamos el DTO para que tu CategoryService aplique TODA la lógica de negocio
            // (Limpieza de caché, generación de slugs, multi-tenant, etc.)
            CategoryDto dto = new CategoryDto();
            dto.setName(payload.get("name"));
            dto.setIsActive(true);
            dto.setShowInNav(true);
            dto.setDisplayOrder(0);

            if (payload.get("parentId") != null && !payload.get("parentId").trim().isEmpty()) {
                dto.setParentId(Long.parseLong(payload.get("parentId")));
            }

            // 2. Delegamos el guardado a tu servicio principal
            categoryService.saveCategory(dto);

            // 3. Recuperamos la categoría recién creada para obtener su ID real
            Category createdCategory = categoryRepository.findTopByOrderByIdDesc()
                    .orElseThrow(() -> new RuntimeException("No se encontró la categoría creada"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", createdCategory.getId());
            response.put("name", createdCategory.getName());
            response.put("parentId", createdCategory.getParentCategory() != null ? createdCategory.getParentCategory().getId() : null);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/toggle")
    public String toggleStatus(@PathVariable String slug, @PathVariable Long id) {
        categoryService.toggleStatus(id);
        return "redirect:/dashboard/" + slug + "/categories";
    }

    @PostMapping("/{id}/delete")
    public String deleteCategory(@PathVariable String slug, @PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            categoryService.deleteCategory(id);
            redirectAttributes.addFlashAttribute("successMessage", "Categoría eliminada correctamente.");
            return "redirect:/dashboard/" + slug + "/categories?deleted=true";
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/dashboard/" + slug + "/categories";
        }
    }

    @PostMapping("/{id}/reorder")
    public String reorderCategory(@PathVariable String slug, @PathVariable Long id, @RequestParam String direction) {
        categoryService.reorderCategory(id, direction);
        return "redirect:/dashboard/" + slug + "/categories";
    }
}