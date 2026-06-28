package com.storevo.backend.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WompiWebhookController {

    private final StoreRepository storeRepository;
    // 1. Inyectamos OrderService en lugar de OrderRepository
    private final OrderService orderService;

    @Value("${wompi.events-secret}")
    private String wompiEventsSecret;

    @PostMapping("/wompi")
    public ResponseEntity<String> handleWompiWebhook(@RequestBody JsonNode payload) {
        try {
            String eventType = payload.path("event").asText();
            if (!"transaction.updated".equals(eventType)) {
                return ResponseEntity.ok("Evento ignorado (No es una actualización de transacción)");
            }

            JsonNode transaction = payload.path("data").path("transaction");
            String transactionId = transaction.path("id").asText();
            String status = transaction.path("status").asText();
            String amountInCents = transaction.path("amount_in_cents").asText();
            String reference = transaction.path("reference").asText();
            String timestamp = payload.path("timestamp").asText();
            String signatureChecksum = payload.path("signature").path("checksum").asText();

            String cleanEventsSecret = wompiEventsSecret.trim();
            String rawSignature = transactionId + status + amountInCents + timestamp + cleanEventsSecret;
            String generatedChecksum = generateSha256(rawSignature);

            if (!generatedChecksum.equals(signatureChecksum)) {
                System.err.println("Wompi Webhook: FIRMA INVÁLIDA para referencia " + reference);
                return ResponseEntity.status(403).body("Firma inválida. Acceso denegado.");
            }

            String[] refParts = reference.split("__");
            if (refParts.length < 2) {
                return ResponseEntity.badRequest().body("Formato de referencia inválido");
            }

            String slug = refParts[0];
            Long orderId = Long.parseLong(refParts[1]);

            Optional<Store> storeOpt = storeRepository.findBySlug(slug);
            if (storeOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Tienda no encontrada en la base maestra");
            }

            try {
                TenantContext.setCurrentTenant(storeOpt.get().getSchemaName());

                // 2. ¡EL CAMBIO CRÍTICO! Delegamos al OrderService para que él descuente el stock
                if ("APPROVED".equals(status)) {
                    orderService.updateOrderStatus(orderId, OrderStatus.PAID);
                    System.out.println("✅ PAGO APROBADO: Orden " + orderId + " marcada como PAGADA y stock descontado.");
                } else if ("DECLINED".equals(status) || "ERROR".equals(status) || "VOIDED".equals(status)) {
                    orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
                    System.out.println("❌ PAGO RECHAZADO: Orden " + orderId + " marcada como CANCELADA y stock restaurado (si aplica).");
                }

            } finally {
                TenantContext.clear();
            }

            return ResponseEntity.ok("Conciliación completada exitosamente.");
        } catch (Exception e) {
            System.err.println("Error procesando Webhook de Wompi: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error interno procesando evento");
        }
    }

    private String generateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error calculando hash SHA-256 en Webhook", e);
        }
    }
}