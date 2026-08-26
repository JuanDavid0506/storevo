package com.storevo.backend.tenant.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.EventOrigin;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.model.Shipment;
import com.storevo.backend.tenant.model.ShipmentStatus;
import com.storevo.backend.tenant.repository.ShipmentRepository;
import com.storevo.backend.tenant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

// Recibe los dos tipos de evento que Mi Paquete envía a la URL registrada con
// createWebHook (ver MiPaqueteAdapter.registerWebhook):
//   1. Creación de guía: trae "guideNumber", "pdfGuide", "pickupCode", "code".
//   2. Actualización de estado: trae "state", "tracking", "code".
// Ambos comparten el campo "code" (el mpCode), que es lo que usamos para
// encontrar el Shipment correspondiente (guardado como externalShipmentId al
// crear la guía).
@RestController
@RequestMapping("/api/webhooks/mipaquete")
@RequiredArgsConstructor
public class MiPaqueteWebhookController {

    private final StoreRepository storeRepository;
    private final ShipmentRepository shipmentRepository;
    private final OrderService orderService;

    @PostMapping("/{storeSlug}")
    @Transactional
    public ResponseEntity<Void> handleEvent(@PathVariable String storeSlug, @RequestBody JsonNode payload) {
        Store store = storeRepository.findBySlug(storeSlug).orElse(null);
        if (store == null) {
            return ResponseEntity.notFound().build();
        }

        // Igual que con el webhook de Wompi: esta ruta no pasa por TenantFilter
        // (no empieza con /s/ ni /dashboard/), así que sin este cambio explícito
        // se quedaría consultando el esquema storevo_admin en vez del de la tienda.
        TenantContext.setCurrentTenant(store.getSchemaName());
        try {
            processEvent(payload);
        } catch (Exception e) {
            System.out.println("Error procesando webhook de Mi Paquete: " + e.getMessage());
        } finally {
            TenantContext.clear();
        }

        return ResponseEntity.ok().build();
    }

    private void processEvent(JsonNode payload) {
        if (!payload.has("code")) {
            System.out.println("Webhook Mi Paquete sin 'code', se ignora: " + payload);
            return;
        }

        String mpCode = payload.get("code").asText();
        Shipment shipment = shipmentRepository.findByExternalShipmentId(mpCode).orElse(null);
        if (shipment == null) {
            System.out.println("Webhook Mi Paquete: no se encontró ningún envío con code=" + mpCode);
            return;
        }

        // El último elemento del arreglo "tracking" es el estado más reciente.
        String lastMessage = null;
        if (payload.has("tracking") && payload.get("tracking").isArray() && !payload.get("tracking").isEmpty()) {
            JsonNode lastEntry = payload.get("tracking").get(payload.get("tracking").size() - 1);
            lastMessage = lastEntry.path("updateState").asText(null);
        }

        if (payload.has("guideNumber")) {
            // Evento de creación de guía: reemplazamos el "PENDIENTE-{mpCode}"
            // provisional por el número de guía real, y guardamos el PDF si vino.
            shipment.setTrackingNumber(payload.get("guideNumber").asText());
            if (payload.has("pdfGuide") && payload.get("pdfGuide").isArray() && !payload.get("pdfGuide").isEmpty()) {
                shipment.setLabelPdfUrl(payload.get("pdfGuide").get(0).asText());
            }
            shipment.setStatus(ShipmentStatus.LABEL_CREATED);

        } else if (payload.has("state")) {
            // Evento de actualización de estado.
            ShipmentStatus mapped = mapMiPaqueteState(payload.get("state").asText());
            if (mapped != null) {
                shipment.setStatus(mapped);

                // Si Mi Paquete confirma la entrega, intentamos avanzar también el
                // pedido a DELIVERED. Va en un try/catch aparte porque esta
                // transición solo es válida si el pedido ya estaba en SHIPPED —
                // si el comerciante no había marcado ese paso manualmente, no
                // forzamos el estado del pedido, solo el del envío.
                if (mapped == ShipmentStatus.DELIVERED && shipment.getOrder() != null) {
                    try {
                        orderService.updateOrderStatus(shipment.getOrder().getId(), OrderStatus.DELIVERED, EventOrigin.WEBHOOK, null);
                    } catch (Exception e) {
                        System.out.println("No se pudo marcar el pedido como entregado automáticamente: " + e.getMessage());
                    }
                }
            }
        }

        // Guardamos siempre el texto crudo más reciente, incluso si no lo pudimos
        // mapear a nuestro enum — así nunca se pierde la información de Mi Paquete.
        if (lastMessage != null) {
            shipment.setLastTrackingMessage(lastMessage);
        }

        shipmentRepository.save(shipment);
    }

    // Traduce los textos de estado (en español, de longitud libre) que manda Mi
    // Paquete a nuestro enum interno. Si no reconoce el texto, devuelve null y no
    // tocamos el status — pero el texto crudo igual queda guardado en
    // lastTrackingMessage más arriba.
    private ShipmentStatus mapMiPaqueteState(String state) {
        if (state == null) return null;
        String normalized = state.toLowerCase();

        if (normalized.contains("entregado")) return ShipmentStatus.DELIVERED;
        if (normalized.contains("devuel") || normalized.contains("novedad")) return ShipmentStatus.RETURNED;
        if (normalized.contains("reparto") || normalized.contains("distribuci")) return ShipmentStatus.OUT_FOR_DELIVERY;
        if (normalized.contains("recolect") || normalized.contains("recogid")) return ShipmentStatus.PICKED_UP;
        if (normalized.contains("transito") || normalized.contains("tránsito")
                || normalized.contains("programado") || normalized.contains("procesando")) return ShipmentStatus.IN_TRANSIT;

        return null;
    }
}