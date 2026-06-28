package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.service.MetricsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard/{slug}")
@RequiredArgsConstructor
public class DashboardController {

    private final MetricsService metricsService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        // 1. Pasamos la data básica
        model.addAttribute("store", store);
        model.addAttribute("slug", slug);

        // 2. Bajamos el switch
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping
    public String showDashboard(Model model) {
        model.addAttribute("metrics", metricsService.getMetrics());
        model.addAttribute("pageTitle", "Panel de Control");
        return "dashboard/index";
    }
}