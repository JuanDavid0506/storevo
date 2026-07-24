package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.exception.InvalidOrderStatusException;
import com.storevo.backend.tenant.exception.ShipmentRequiredException;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.CarrierRepository;
import com.storevo.backend.tenant.service.OrderService;
import com.storevo.backend.tenant.service.ShipmentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/dashboard/{slug}/orders")
@RequiredArgsConstructor
public class DashboardOrderController {

    private final OrderService orderService;
    private final CarrierRepository carrierRepository; // FASE 3.2
    private final ShipmentService shipmentService;     // FASE 3.2

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) throw new RuntimeException("Tienda no encontrada en la petición");

        model.addAttribute("store", store);
        model.addAttribute("slug", slug);
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping
    public String listOrders(Model model) {
        model.addAttribute("orders", orderService.getAllOrders());
        model.addAttribute("pageTitle", "Gestión de Pedidos");
        return "dashboard/orders/index";
    }

    @GetMapping("/{id}")
    public String orderDetail(@PathVariable Long id, Model model) {
        Order order = orderService.getOrderById(id);
        model.addAttribute("order", order);
        model.addAttribute("orderStatuses", OrderStatus.values());

        // FASE 3.2: Cargamos las transportadoras activas para el Modal
        model.addAttribute("carriers", carrierRepository.findByIsActiveTrueOrderByNameAsc());

        model.addAttribute("pageTitle", "Pedido #" + order.getId());
        return "dashboard/orders/detail";
    }

    @PostMapping("/{id}/status-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateStatusAjax(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {

        Long currentUserId = 1L; // Temporal

        System.out.println("🚀 [ADMIN] Solicitud de cambio de estado recibida. Nuevo estado: " + status.name());

        Map<String, Object> response = new HashMap<>();
        try {
            OrderHistory history = orderService.updateOrderStatus(id, status, EventOrigin.ADMIN, currentUserId);

            response.put("success", true);
            response.put("message", "Estado actualizado correctamente a " + status.getDisplayName());
            response.put("history", mapHistoryToDto(history));
            response.put("newBadge", status.getBadgeClasses());
            response.put("newName", status.getDisplayName());

            System.out.println("✅ [ADMIN] Estado guardado en BD exitosamente.");

        } catch (ShipmentRequiredException e) {
            response.put("success", false);
            response.put("message", "Operación rechazada: " + e.getMessage());
        } catch (InvalidOrderStatusException e) {
            response.put("success", false);
            response.put("message", "Operación rechazada: Transición de estado no permitida.");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Ocurrió un error al actualizar el estado.");
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/notes-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addInternalNoteAjax(
            @PathVariable Long id,
            @RequestParam String note) {

        Long currentUserId = 1L; // Temporal

        Map<String, Object> response = new HashMap<>();
        try {
            OrderNote internalNote = orderService.addInternalNote(id, note, currentUserId);

            response.put("success", true);
            response.put("message", "Nota interna agregada");
            response.put("note", mapNoteToDto(internalNote));
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al guardar la nota interna.");
        }

        return ResponseEntity.ok(response);
    }

    // --- NUEVO FASE 3.2: Endpoint para procesar el Modal de Despacho ---
    @PostMapping("/{id}/shipments-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createShipmentAjax(
            @PathVariable Long id,
            @RequestParam Long carrierId,
            @RequestParam(required = false) String trackingNumber,
            @RequestParam(required = false) Double weight,
            @RequestParam(required = false) String dimensions) {

        Long currentUserId = 1L; // Temporal

        Map<String, Object> response = new HashMap<>();
        try {
            Shipment shipment = shipmentService.createManualShipment(id, carrierId, trackingNumber, weight, dimensions, currentUserId);
            response.put("success", true);
            response.put("message", "¡Envío generado exitosamente! El pedido ha avanzado a estado ENVIADO.");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al generar el envío: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> mapHistoryToDto(OrderHistory history) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", history.getId());
        dto.put("eventType", history.getEventType().name());
        dto.put("origin", history.getOrigin().name());
        dto.put("description", history.getDescription());
        dto.put("createdAt", history.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        dto.put("createdBy", "Admin (ID: " + history.getUserId() + ")");
        return dto;
    }

    private Map<String, Object> mapNoteToDto(OrderNote note) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", note.getId());
        dto.put("note", note.getNote());
        dto.put("createdAt", note.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        dto.put("createdBy", "Admin (ID: " + note.getUserId() + ")");
        return dto;
    }
}