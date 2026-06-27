package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/dashboard/orders")
@RequiredArgsConstructor
public class DashboardOrderController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @GetMapping
    public String listOrders(Model model) {
        model.addAttribute("orders", orderRepository.findAllByOrderByCreatedAtDesc());
        // Enviamos la lista de estados posibles para el selector (dropdown)
        model.addAttribute("orderStatuses", OrderStatus.values());
        model.addAttribute("pageTitle", "Gestión de Pedidos");
        return "dashboard/orders/index";
    }
// Asegúrate de que OrderService esté inyectado en la parte superior de tu clase:
    // private final OrderService orderService;

    @PostMapping("/{id}/status")
    public String updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus status) {

        // Llamamos al servicio inteligente que actualiza el estado y gestiona el inventario
        orderService.updateOrderStatus(id, status);

        return "redirect:/dashboard/orders?success=true";
    }
}