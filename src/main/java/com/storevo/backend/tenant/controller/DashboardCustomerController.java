package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard/customers")
@RequiredArgsConstructor
public class DashboardCustomerController {

    private final CustomerService customerService;

    @GetMapping
    public String listCustomers(Model model) {
        model.addAttribute("customers", customerService.getAllCustomers());
        model.addAttribute("pageTitle", "Mis Clientes");
        return "dashboard/customers/index";
    }
}