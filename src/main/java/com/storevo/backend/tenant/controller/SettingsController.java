package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.UserRepository;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.security.Principal;

@Controller
@RequestMapping("/dashboard/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final StoreSettingsService storeSettingsService;
    private final UserRepository userRepository;

    private Store getCurrentStore(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"))
                .getStore();
    }

    @GetMapping
    public String showSettings(Model model, Principal principal) {
        Store store = getCurrentStore(principal);
        StoreSettingsDto settings = storeSettingsService.getSettingsByStore(store);

        model.addAttribute("settings", settings);
        model.addAttribute("pageTitle", "Configuración de Mi Tienda");
        return "dashboard/settings";
    }

    @PostMapping
    public String saveSettings(@ModelAttribute StoreSettingsDto settingsDto, Principal principal) {
        Store store = getCurrentStore(principal);
        storeSettingsService.updateSettings(store, settingsDto);

        return "redirect:/dashboard/settings?success=true";
    }
}