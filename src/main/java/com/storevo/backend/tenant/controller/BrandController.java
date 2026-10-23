package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.service.BrandService;
import com.storevo.backend.tenant.service.CloudinaryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;
import java.util.Set;

@Controller
@RequestMapping("/dashboard/{slug}/brands")
@RequiredArgsConstructor
public class BrandController {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_LOGO_SIZE = 5L * 1024 * 1024;

    private final BrandService brandService;
    private final CloudinaryService cloudinaryService;

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
    public String list(Model model) {
        model.addAttribute("brands", brandService.getAllBrands());
        model.addAttribute("productCounts", brandService.getProductCountsByBrand());
        model.addAttribute("pageTitle", "Marcas");
        return "dashboard/brands/index";
    }

    @PostMapping("/new")
    public String create(@PathVariable String slug, @RequestParam String name, RedirectAttributes ra) {
        try {
            brandService.create(name);
            ra.addFlashAttribute("successMessage", "Marca creada.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/dashboard/" + slug + "/brands";
    }

    @PostMapping("/{id}/update")
    public String update(@PathVariable String slug,
                         @PathVariable Long id,
                         @RequestParam String name,
                         @RequestParam(required = false) String isActive,
                         @RequestParam(required = false) String removeLogo,
                         @RequestParam(value = "logo", required = false) MultipartFile logo,
                         RedirectAttributes ra) {
        try {
            String logoUrl = null;
            if (logo != null && !logo.isEmpty()) {
                if (logo.getSize() > MAX_LOGO_SIZE) {
                    throw new IllegalArgumentException("El logo supera el límite de 5 MB.");
                }
                if (logo.getContentType() == null || !ALLOWED_TYPES.contains(logo.getContentType().toLowerCase())) {
                    throw new IllegalArgumentException("Formato no permitido. Usa JPG, PNG o WEBP.");
                }
                Map<String, String> up = cloudinaryService.uploadImage(logo, TenantContext.getCurrentTenant() + "/brands");
                logoUrl = up.get("secure_url");
            }
            brandService.update(id, name, isActive != null, logoUrl, removeLogo != null);
            ra.addFlashAttribute("successMessage", "Marca actualizada.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("errorMessage", e.getMessage());
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "No se pudo guardar la marca: " + e.getMessage());
        }
        return "redirect:/dashboard/" + slug + "/brands";
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable String slug, @PathVariable Long id, RedirectAttributes ra) {
        try {
            brandService.delete(id);
            ra.addFlashAttribute("successMessage", "Marca eliminada.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/dashboard/" + slug + "/brands";
    }
}