package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.WompiEventPayload;
import com.storevo.backend.tenant.model.EventOrigin;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/webhooks/wompi")
@RequiredArgsConstructor
public class WompiWebhookController {

    private final StoreIntegrationRepository integrationRepository;
    private final StoreRepository storeRepository;
    private final OrderService orderService;

    @PostMapping("/{storeSlug}")
    public ResponseEntity<Void> handleWompiEvent(
            @PathVariable String storeSlug,
            @RequestBody WompiEventPayload payload) {

        // 1. Identificar la tienda usando el método findBySlug
        Store store = storeRepository.findBySlug(storeSlug)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));

        // IMPORTANTE: esta ruta (/api/webhooks/wompi/**) no pasa por TenantFilter
        // (que solo cambia de esquema para /s/** y /dashboard/**), así que sin este
        // cambio explícito el resto del método seguiría consultando el esquema
        // "storevo_admin" en vez del esquema real de la tienda — y la orden nunca
        // se encontraría, fallando en silencio. Por eso lo hacemos a mano aquí,
        // con su try/finally para no dejar el hilo "pegado" a este tenant.
        TenantContext.setCurrentTenant(store.getSchemaName());
        try {
            return processEvent(store, payload);
        } finally {
            TenantContext.clear();
        }
    }

    private ResponseEntity<Void> processEvent(Store store, WompiEventPayload payload) {
        // 2. Extraer configuración de Wompi
        StoreIntegration wompiConfig = integrationRepository
                .findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI)
                .orElseThrow(() -> new RuntimeException("Configuración de Wompi no encontrada."));

        // 3. Validar la firma usando el secreto de Eventos (extraData en la bóveda)
        String eventSecret = wompiConfig.getExtraData();
        if (!isValidSignature(payload, eventSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // Falsificación detectada
        }

        // 4. Procesar el estado del pago y actualizar la orden usando tu lógica exacta
        String reference = payload.getData().getTransaction().getReference();
        Long orderId = extractOrderIdFromReference(reference);

        if (orderId != null) {
            String definitiveStatus = payload.getData().getTransaction().getStatus();

            try {
                if ("APPROVED".equals(definitiveStatus)) {
                    orderService.updateOrderStatus(orderId, OrderStatus.PAID, EventOrigin.WEBHOOK, null);
                } else if ("DECLINED".equals(definitiveStatus) || "ERROR".equals(definitiveStatus) || "VOIDED".equals(definitiveStatus)) {
                    orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED, EventOrigin.WEBHOOK, null);
                }
            } catch (Exception e) {
                // Captura controlada para no fallar el Webhook ante excepciones de negocio
                // (ej: la orden ya estaba en un estado que no permite esta transición).
                // OJO: esto es distinto del bug de esquema — este catch es a propósito,
                // porque Wompi reintenta el webhook si respondemos error, y no queremos
                // reintentos infinitos por una regla de negocio que nunca va a cambiar.
                System.out.println("No se pudo actualizar la orden desde el Webhook Wompi: " + e.getMessage());
            }
        } else {
            System.out.println("Webhook Wompi: no se pudo extraer el ID del pedido de la referencia '" + reference + "'");
        }

        return ResponseEntity.ok().build();
    }

    private boolean isValidSignature(WompiEventPayload payload, String secret) {
        try {
            String transactionId = payload.getData().getTransaction().getId();
            String status = payload.getData().getTransaction().getStatus();
            long amountInCents = payload.getData().getTransaction().getAmountInCents();
            String timestamp = payload.getTimestamp().toString();

            String rawString = transactionId + status + amountInCents + timestamp + secret;

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawString.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            String generatedSignature = hexString.toString();
            return generatedSignature.equals(payload.getSignature().getChecksum());
        } catch (Exception e) {
            return false;
        }
    }

    private Long extractOrderIdFromReference(String reference) {
        try {
            // Extrae el ID de tu formato "STOREVO-ID-TIMESTAMP"
            String[] parts = reference.split("-");
            if (parts.length >= 2) {
                return Long.parseLong(parts[1]);
            }
        } catch (Exception e) {
            // Ignorar
        }
        return null;
    }
}