package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final MetricsService metricsService;

    @GetMapping
    public String showDashboard(Model model) {
        model.addAttribute("metrics", metricsService.getMetrics());
        model.addAttribute("pageTitle", "Panel de Control");
        return "dashboard/index";
    }
}