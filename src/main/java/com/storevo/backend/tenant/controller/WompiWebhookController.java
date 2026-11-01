package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.WompiEventPayload;
import com.storevo.backend.tenant.model.EventOrigin;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

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

        TenantContext.clear();

        // 1. Identificar la tienda en storevo_admin
        Store store = storeRepository.findBySlug(storeSlug).orElse(null);
        if (store == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // 2. Extraer configuración activa de Wompi en storevo_admin ANTES de cambiar al esquema de la tienda
        StoreIntegration wompiConfig = integrationRepository
                .findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI)
                .orElse(null);

        if (wompiConfig == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // 3. Exigir que el secreto de eventos exista y validar la firma en tiempo constante
        String eventSecret = wompiConfig.getExtraData();
        if (!isValidSignature(payload, eventSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 4. Cambiar al esquema real de la tienda para validar monto y actualizar la orden
        TenantContext.setCurrentTenant(store.getSchemaName());
        try {
            return processEvent(payload);
        } finally {
            TenantContext.clear();
        }
    }

    private ResponseEntity<Void> processEvent(WompiEventPayload payload) {
        if (payload == null || payload.getData() == null || payload.getData().getTransaction() == null) {
            return ResponseEntity.badRequest().build();
        }

        WompiEventPayload.Transaction tx = payload.getData().getTransaction();
        String reference = tx.getReference();
        String transactionId = tx.getId();
        String definitiveStatus = tx.getStatus();
        long paidCents = tx.getAmountInCents();

        Long orderId = extractOrderIdFromReference(reference);
        if (orderId == null) {
            System.out.println("Webhook Wompi: no se pudo extraer el ID del pedido de la referencia '" + reference + "'");
            return ResponseEntity.ok().build();
        }

        try {
            Order order = orderService.getOrderById(orderId);

            // Verificar que la referencia corresponda estrictamente al ID del pedido
            String idStr = String.valueOf(orderId);
            boolean matchesOrder = reference != null && (reference.equals(idStr)
                    || reference.matches(".*(?<!\\d)" + idStr + "(?!\\d).*"));
            if (!matchesOrder) {
                System.out.println("Alerta de seguridad Webhook Wompi: La referencia " + reference + " no corresponde al pedido #" + orderId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            // Verificar que el monto pagado en centavos coincida exactamente con el total del pedido
            long expectedCents = Math.round((order.getTotal() != null ? order.getTotal() : 0.0) * 100);
            if (paidCents != expectedCents) {
                System.out.println("Alerta de seguridad Webhook Wompi: Monto pagado (" + paidCents + ") difiere del pedido #" + orderId + " (" + expectedCents + ")");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            if ("APPROVED".equalsIgnoreCase(definitiveStatus)) {
                orderService.updateOrderStatus(orderId, OrderStatus.PAID, EventOrigin.WEBHOOK, null);
            } else if ("DECLINED".equalsIgnoreCase(definitiveStatus)
                    || "ERROR".equalsIgnoreCase(definitiveStatus)
                    || "VOIDED".equalsIgnoreCase(definitiveStatus)) {
                // Mantener el pedido en PENDING registrando el intento fallido para permitir reintentos
                orderService.recordPaymentAttemptFailure(orderId, transactionId, definitiveStatus.toUpperCase(Locale.ROOT));
            }
        } catch (Exception e) {
            System.out.println("No se pudo actualizar la orden desde el Webhook Wompi: " + e.getMessage());
        }

        return ResponseEntity.ok().build();
    }

    private boolean isValidSignature(WompiEventPayload payload, String secret) {
        if (secret == null || secret.isBlank()) {
            return false;
        }
        if (payload == null
                || payload.getData() == null
                || payload.getData().getTransaction() == null
                || payload.getSignature() == null
                || payload.getSignature().getChecksum() == null
                || payload.getSignature().getChecksum().isBlank()
                || payload.getTimestamp() == null) {
            return false;
        }
        try {
            String transactionId = payload.getData().getTransaction().getId();
            String status = payload.getData().getTransaction().getStatus();
            long amountInCents = payload.getData().getTransaction().getAmountInCents();
            String timestamp = payload.getTimestamp().toString();

            if (transactionId == null || status == null) {
                return false;
            }

            String rawString = transactionId + status + amountInCents + timestamp + secret.trim();

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawString.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            byte[] expectedBytes = hexString.toString().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8);
            byte[] providedBytes = payload.getSignature().getChecksum().trim().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8);

            return MessageDigest.isEqual(expectedBytes, providedBytes);
        } catch (Exception e) {
            return false;
        }
    }

    private Long extractOrderIdFromReference(String reference) {
        if (reference == null || reference.isBlank()) {
            return null;
        }
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