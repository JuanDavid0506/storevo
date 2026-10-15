package com.storevo.backend.tenant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ThemeConfigDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.CloudinaryService;
import com.storevo.backend.tenant.service.StoreThemeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Controller
@RequestMapping("/dashboard/{slug}/template")
@RequiredArgsConstructor
public class DashboardTemplateController {

    private final StoreThemeService storeThemeService;
    private final CategoryService categoryService;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;

    private static final long MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");

    @GetMapping
    public String showEditor(@PathVariable String slug, HttpServletRequest request, Model model) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        ThemeConfigDto draftTheme = storeThemeService.getRawThemeConfig(store, true);

        String themeJson = "{}";
        try {
            themeJson = objectMapper.writeValueAsString(draftTheme);
        } catch (Exception e) {
            e.printStackTrace();
        }

        List<Map<String, Object>> flatCategories = new ArrayList<>();
        try {
            if (store != null) {
                TenantContext.setCurrentTenant(store.getSchemaName());
            }
            List<Category> roots = categoryService.getRootCategories();
            flattenCategories(roots, "", flatCategories);
        } catch (Exception e) {
            e.printStackTrace();
        }

        String categoriesJson = "[]";
        try {
            categoriesJson = objectMapper.writeValueAsString(flatCategories);
        } catch (Exception e) {
            e.printStackTrace();
        }

        model.addAttribute("store", store);
        model.addAttribute("slug", slug);
        model.addAttribute("pageTitle", "Diseño de Tienda");
        model.addAttribute("themeJson", themeJson);
        model.addAttribute("categoriesJson", categoriesJson);

        return "dashboard/template/editor";
    }

    @PostMapping("/save-draft")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> saveDraft(
            @PathVariable String slug,
            @RequestBody ThemeConfigDto themeConfig,
            HttpServletRequest request) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tienda no encontrada."));
        }

        try {
            storeThemeService.saveDraftTheme(store, themeConfig);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Borrador guardado. Vista previa actualizada."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error al guardar borrador: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/publish")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> publishTheme(
            @PathVariable String slug,
            @RequestBody ThemeConfigDto themeConfig,
            HttpServletRequest request) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tienda no encontrada."));
        }

        try {
            storeThemeService.publishTheme(store, themeConfig);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "¡Diseño publicado exitosamente en tu tienda!"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error al publicar plantilla: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/discard-draft")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> discardDraft(
            @PathVariable String slug,
            HttpServletRequest request) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tienda no encontrada."));
        }

        try {
            ThemeConfigDto publishedTheme = storeThemeService.discardDraft(store);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "theme", publishedTheme,
                    "message", "Cambios descartados. Se restauró tu diseño publicado actual."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "No se pudieron descartar los cambios."
            ));
        }
    }

    @PostMapping("/reset")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> resetToDefault(
            @PathVariable String slug,
            HttpServletRequest request) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tienda no encontrada."));
        }

        try {
            ThemeConfigDto defaultTheme = storeThemeService.buildDefaultTheme(store.getName(), "#6366f1", "#0f172a", null);
            storeThemeService.saveDraftTheme(store, defaultTheme);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "theme", defaultTheme,
                    "message", "Borrador restablecido al diseño inicial de fábrica."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "No se pudo restablecer la plantilla."
            ));
        }
    }

    @PostMapping("/upload-image")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> uploadThemeBannerImage(
            @PathVariable String slug,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tienda no válida."));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Selecciona una imagen válida."));
        }

        if (file.getSize() > MAX_BANNER_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "La imagen supera el límite de 10MB."));
        }

        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType().toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Formato no permitido. Usa JPG, PNG o WEBP."));
        }

        try {
            String folderTenant = store.getSchemaName() + "/theme";
            Map<String, String> uploadResult = cloudinaryService.uploadImage(file, folderTenant);
            String secureUrl = uploadResult.get("secure_url");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "url", secureUrl,
                    "message", "Imagen subida correctamente."
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "No se pudo subir la imagen: " + e.getMessage()
            ));
        }
    }

    private void flattenCategories(List<Category> categories, String prefix, List<Map<String, Object>> result) {
        if (categories == null) return;
        for (Category cat : categories) {
            String fullName = prefix.isEmpty() ? cat.getName() : prefix + " › " + cat.getName();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", cat.getId());
            item.put("name", fullName);
            result.add(item);

            if (cat.getSubCategories() != null && !cat.getSubCategories().isEmpty()) {
                flattenCategories(cat.getSubCategories(), fullName, result);
            }
        }
    }
}