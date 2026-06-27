package com.storevo.backend.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WompiWebhookController {

    private final ObjectMapper objectMapper;
    private final OrderService orderService;

    @PostMapping("/wompi")
    public ResponseEntity<?> handleWompiWebhook(@RequestBody String payload) {
        try {
            JsonNode event = objectMapper.readTree(payload);
            JsonNode data = event.get("data").get("transaction");

            String reference = data.get("reference").asText();
            String wompiStatus = data.get("status").asText(); // APPROVED, DECLINED, ERROR...

            // Tu referencia tiene el formato: slug-orderId-timestamp
            String[] parts = reference.split("-");
            if (parts.length < 3) return ResponseEntity.ok("Referencia ignorada");

            String slug = parts[0];
            Long orderId = Long.parseLong(parts[1]);

            // 1. Cambiamos el contexto de BD al esquema de esa tienda específica
            TenantContext.setCurrentTenant("tenant_" + slug);

            // 2. Mapeamos el resultado a tu sistema
            if ("APPROVED".equals(wompiStatus)) {
                orderService.updateOrderStatus(orderId, OrderStatus.PAID);
            } else if ("DECLINED".equals(wompiStatus) || "ERROR".equals(wompiStatus) || "VOIDED".equals(wompiStatus)) {
                // Al ponerlo en CANCELLED, el OrderService se encarga de devolver el stock a la base de datos
                orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
            }

            return ResponseEntity.ok("Webhook procesado correctamente");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error procesando webhook");
        } finally {
            // Limpiamos el hilo de seguridad
            TenantContext.clear();
        }
    }
}