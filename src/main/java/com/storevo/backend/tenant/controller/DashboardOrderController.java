package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/dashboard/{slug}/orders")
@RequiredArgsConstructor
public class DashboardOrderController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

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
    public String listOrders(Model model) {
        // ACTUALIZADO: Usamos el Service para evitar el Lazy Initialization en Thymeleaf
        model.addAttribute("orders", orderService.getAllOrders());
        model.addAttribute("orderStatuses", OrderStatus.values());
        model.addAttribute("pageTitle", "Gestión de Pedidos");
        return "dashboard/orders/index";
    }

    @PostMapping("/{id}/status")
    public String updateOrderStatus(@PathVariable String slug, @PathVariable Long id, @RequestParam OrderStatus status) {
        orderService.updateOrderStatus(id, status);
        return "redirect:/dashboard/" + slug + "/orders?success=true";
    }
}