package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/dashboard/{slug}/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final StoreSettingsService storeSettingsService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        // 1. PRIMERO leemos los settings y lo guardamos
        StoreSettingsDto settings = storeSettingsService.getSettingsByStore(store);
        model.addAttribute("store", store);
        model.addAttribute("settings", settings);
        model.addAttribute("slug", slug);

        // Guardamos los settings en el request para que los otros métodos lo usen
        request.setAttribute("currentSettings", settings);

        // 2. LUEGO bajamos el switch a la base del cliente
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping
    public String showSettings(Model model, HttpServletRequest request) {
        // Ya no consultamos a la BD aquí, simplemente tomamos lo que cargó el ModelAttribute
        StoreSettingsDto settings = (StoreSettingsDto) request.getAttribute("currentSettings");

        model.addAttribute("settings", settings);
        model.addAttribute("pageTitle", "Configuración de Mi Tienda");
        return "dashboard/settings";
    }

    @PostMapping
    public String saveSettings(@PathVariable String slug, @ModelAttribute StoreSettingsDto settingsDto, HttpServletRequest request) {
        // La tienda ya fue cargada por el TenantFilter
        Store store = (Store) request.getAttribute("currentStore");

        // ¡LA SOLUCIÓN! Subimos el switch temporalmente a la base maestra para poder guardar
        TenantContext.setCurrentTenant("storevo_admin");

        // Ahora esto se guardará correctamente sin dar error de SQL
        storeSettingsService.updateSettings(store, settingsDto);

        return "redirect:/dashboard/" + slug + "/settings?success=true";
    }
}