package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
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
    private final StoreIntegrationRepository integrationRepository; // Inyectamos la Bóveda

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        // 1. PRIMERO leemos los settings. (Estamos en el esquema storevo_admin por defecto aquí)
        StoreSettingsDto settings = storeSettingsService.getSettingsByStore(store);

        // Extraemos Wompi de la Bóveda
        integrationRepository.findByStoreAndIntegrationType(store, IntegrationType.WOMPI)
                .ifPresent(wompi -> {
                    settings.setWompiActive(wompi.isActive());
                    settings.setWompiEnvironment(wompi.getEnvironment());
                    settings.setWompiPublicKey(wompi.getApiKey());
                    // NO enviamos las llaves privadas al HTML por seguridad
                });

        // Extraemos Mi Paquete de la Bóveda
        integrationRepository.findByStoreAndIntegrationType(store, IntegrationType.MI_PAQUETE)
                .ifPresent(mp -> {
                    settings.setMiPaqueteActive(mp.isActive());
                    settings.setMiPaqueteEnvironment(mp.getEnvironment());
                });

        model.addAttribute("store", store);
        model.addAttribute("settings", settings);
        model.addAttribute("slug", slug);

        request.setAttribute("currentSettings", settings);

        // 2. LUEGO bajamos el switch a la base del cliente
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping
    public String showSettings(Model model, HttpServletRequest request) {
        StoreSettingsDto settings = (StoreSettingsDto) request.getAttribute("currentSettings");

        model.addAttribute("settings", settings);
        model.addAttribute("pageTitle", "Configuración de Mi Tienda");
        return "dashboard/settings";
    }

    @PostMapping
    public String saveSettings(@PathVariable String slug, @ModelAttribute StoreSettingsDto settingsDto, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");

        // ¡LA SOLUCIÓN! Subimos el switch temporalmente a la base maestra para poder guardar
        TenantContext.setCurrentTenant("storevo_admin");

        // 1. Guardamos la configuración de la tienda
        storeSettingsService.updateSettings(store, settingsDto);

        // 2. Guardamos Wompi en la Bóveda
        StoreIntegration wompi = integrationRepository
                .findByStoreAndIntegrationType(store, IntegrationType.WOMPI)
                .orElse(new StoreIntegration());

        wompi.setStore(store);
        wompi.setIntegrationType(IntegrationType.WOMPI);
        wompi.setActive(settingsDto.isWompiActive());
        wompi.setEnvironment(settingsDto.getWompiEnvironment() != null ? settingsDto.getWompiEnvironment() : "SANDBOX");

        if (settingsDto.getWompiPublicKey() != null && !settingsDto.getWompiPublicKey().isBlank()) {
            wompi.setApiKey(settingsDto.getWompiPublicKey());
        }
        if (settingsDto.getWompiPrivateKey() != null && !settingsDto.getWompiPrivateKey().isBlank()) {
            wompi.setApiSecret(settingsDto.getWompiPrivateKey()); // JPA lo cifra con AES automáticamente
        }
        if (settingsDto.getWompiEventsSecret() != null && !settingsDto.getWompiEventsSecret().isBlank()) {
            wompi.setExtraData(settingsDto.getWompiEventsSecret()); // JPA lo cifra con AES automáticamente
        }
        integrationRepository.save(wompi);

        // 3. Guardamos Mi Paquete en la Bóveda
        StoreIntegration miPaquete = integrationRepository
                .findByStoreAndIntegrationType(store, IntegrationType.MI_PAQUETE)
                .orElse(new StoreIntegration());

        miPaquete.setStore(store);
        miPaquete.setIntegrationType(IntegrationType.MI_PAQUETE);
        miPaquete.setActive(settingsDto.isMiPaqueteActive());
        miPaquete.setEnvironment(settingsDto.getMiPaqueteEnvironment() != null ? settingsDto.getMiPaqueteEnvironment() : "SANDBOX");

        if (settingsDto.getMiPaqueteApiKey() != null && !settingsDto.getMiPaqueteApiKey().isBlank()) {
            miPaquete.setApiKey(settingsDto.getMiPaqueteApiKey()); // JPA lo cifra con AES automáticamente
        }
        integrationRepository.save(miPaquete);

        return "redirect:/dashboard/" + slug + "/settings?success=true";
    }
}