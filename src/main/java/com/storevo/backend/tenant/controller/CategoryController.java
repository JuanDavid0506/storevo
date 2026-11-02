package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CategoryDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.repository.CategoryRepository;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.CloudinaryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Controller
@RequestMapping("/dashboard/{slug}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024; // 5 MB

    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;
    private final com.storevo.backend.tenant.service.StoreThemeService storeThemeService;

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
    public String listCategories(HttpServletRequest request, Model model) {
        Store store = (Store) request.getAttribute("currentStore");
        java.util.Set<Long> customDesignedCategoryIds = storeThemeService.getCustomCategoryIds(store);
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }
        // Solo mandamos la raíz, Thymeleaf se encarga de dibujar las hijas automáticamente
        model.addAttribute("rootCategories", categoryService.getRootCategories());
        model.addAttribute("productCounts", categoryService.getProductCountsByCategory());
        model.addAttribute("categoryImageMap", categoryService.getCategoryImagesMap());
        model.addAttribute("customDesignedCategoryIds", customDesignedCategoryIds);
        model.addAttribute("pageTitle", "Organización del Catálogo");
        return "dashboard/categories/index";
    }

    @GetMapping("/new")
    public String showCreateForm(@PathVariable String slug, @RequestParam(required = false) Long parentId, Model model, RedirectAttributes redirectAttributes) {
        if (parentId != null && !categoryService.canHaveChildren(parentId)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Esa categoría ya está en el nivel más profundo permitido (3 niveles) y no puede tener subcategorías.");
            return "redirect:/dashboard/" + slug + "/categories";
        }

        CategoryDto dto = new CategoryDto();
        dto.setIsActive(true);
        dto.setDisplayOrder(0);

        if (parentId != null) {
            dto.setParentId(parentId);
            dto.setShowInNav(false); // Las subcategorías NO van al navbar
            model.addAttribute("parentCategory", categoryService.getCategoryById(parentId));
        } else {
            dto.setShowInNav(true);  // Las principales SÍ van al navbar
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
                .imageUrl(category.getImageUrl())
                .isActive(category.getIsActive())
                .showInNav(category.getShowInNav())
                .displayOrder(category.getDisplayOrder())
                .build();

        model.addAttribute("category", dto);
        model.addAttribute("allRootCategories", categoryService.getRootCategories());
        model.addAttribute("pageTitle", "Editar Categoría");
        return "dashboard/categories/form";
    }

    @PostMapping
    public String saveCategory(
            @PathVariable String slug,
            @ModelAttribute CategoryDto categoryDto,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestParam(value = "image", required = false) MultipartFile altImageFile,
            @RequestParam(value = "removeImage", required = false) String removeImage,
            RedirectAttributes redirectAttributes) {
        try {
            MultipartFile fileToUpload = (imageFile != null && !imageFile.isEmpty())
                    ? imageFile
                    : ((altImageFile != null && !altImageFile.isEmpty()) ? altImageFile : null);

            if (fileToUpload != null && !fileToUpload.isEmpty()) {
                if (fileToUpload.getSize() > MAX_IMAGE_SIZE) {
                    throw new IllegalArgumentException("La imagen de la categoría supera el límite de 5 MB.");
                }
                if (fileToUpload.getContentType() == null
                        || !ALLOWED_TYPES.contains(fileToUpload.getContentType().toLowerCase())) {
                    throw new IllegalArgumentException("Formato de imagen no permitido. Usa JPG, PNG o WEBP.");
                }
                Map<String, String> up = cloudinaryService.uploadImage(
                        fileToUpload, TenantContext.getCurrentTenant() + "/categories");
                categoryDto.setImageUrl(up.get("secure_url"));
                categoryDto.setRemoveImage(false);
            } else if (removeImage != null
                    && ("true".equalsIgnoreCase(removeImage) || "on".equalsIgnoreCase(removeImage) || "1".equals(removeImage))) {
                categoryDto.setRemoveImage(true);
            }

            categoryService.saveCategory(categoryDto);
            redirectAttributes.addFlashAttribute("successMessage", "Categoría guardada correctamente.");
            return "redirect:/dashboard/" + slug + "/categories?success=true";
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/dashboard/" + slug + "/categories";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "No se pudo guardar la categoría: " + e.getMessage());
            return "redirect:/dashboard/" + slug + "/categories";
        }
    }

    // ==========================================
    // ENDPOINT PARA CREACIÓN RÁPIDA (AJAX)
    // ==========================================
    @PostMapping("/api/quick-add")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > quickAddCategory(
            @PathVariable String slug,
            @RequestBody Map<String, String> payload) {
        try {
            CategoryDto dto = new CategoryDto();
            dto.setName(payload.get("name"));
            dto.setIsActive(true);
            dto.setShowInNav(true);
            dto.setDisplayOrder(0);

            if (payload.get("parentId") != null && !payload.get("parentId").trim().isEmpty()) {
                dto.setParentId(Long.parseLong(payload.get("parentId")));
            }

            categoryService.saveCategory(dto);

            Category createdCategory = categoryRepository.findTopByOrderByIdDesc()
                    .orElseThrow(() -> new RuntimeException("No se encontró la categoría creada"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", createdCategory.getId());
            response.put("name", createdCategory.getName());
            response.put("parentId", createdCategory.getParentCategory() != null ? createdCategory.getParentCategory().getId() : null);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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