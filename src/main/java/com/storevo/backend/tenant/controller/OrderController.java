package com.storevo.backend.tenant.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Controller
@RequestMapping("/s/{slug}/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final StoreSettingsService storeSettingsService;
    private final OrderService orderService; // <-- Inyectamos el servicio inteligente

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model) {
        TenantContext.setCurrentTenant("tenant_" + slug);
        Store store = storeRepository.findBySlug(slug).orElseThrow();
        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);
    }

    @GetMapping("/{id}/success")
    public String orderSuccess(@PathVariable String slug, @PathVariable Long id, Model model) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        String wompiReference = slug + "-" + order.getId() + "-" + System.currentTimeMillis();
        long amountInCents = Math.round(order.getTotal() * 100);

        order.setWompiTransactionId(wompiReference);
        orderRepository.save(order);

        String wompiPublicKey = "pub_test_rXNURvf5usUF3DkyAQnu702qYj9fS8ts";
        String wompiIntegritySecret = "test_integrity_SdYPQHAW9XUM4vjFq17eIZwaXoSzzvBw";

        String rawSignature = wompiReference + amountInCents + "COP" + wompiIntegritySecret;
        String integritySignature = generateSha256(rawSignature);

        model.addAttribute("order", order);
        model.addAttribute("wompiReference", wompiReference);
        model.addAttribute("amountInCents", amountInCents);
        model.addAttribute("wompiPublicKey", wompiPublicKey);
        model.addAttribute("wompiSignature", integritySignature);
        model.addAttribute("pageTitle", "Pagar Pedido");

        return "storefront/order-success";
    }

    private String generateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generando firma criptográfica", e);
        }
    }

    @GetMapping("/{id}/wompi-result")
    public String wompiReturn(
            @PathVariable String slug,
            @PathVariable Long id,
            @RequestParam(name = "id", required = false) String wompiTransactionId,
            Model model) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        // VERIFICACIÓN ACTIVA (Soluciona el problema de Localhost)
        // Si el pedido sigue PENDIENTE y Wompi nos devuelve un ID de transacción en la URL...
        if (wompiTransactionId != null && order.getStatus() == OrderStatus.PENDING) {
            try {
                // Consultamos directamente a la API de Wompi para saber la verdad absoluta
                RestTemplate restTemplate = new RestTemplate();
                String wompiUrl = "https://sandbox.wompi.co/v1/transactions/" + wompiTransactionId;
                ResponseEntity<JsonNode> response = restTemplate.getForEntity(wompiUrl, JsonNode.class);

                if (response.getBody() != null) {
                    String status = response.getBody().get("data").get("status").asText();

                    // Si Wompi dice que fue aprobado, ejecutamos el descuento del stock
                    if ("APPROVED".equals(status)) {
                        orderService.updateOrderStatus(id, OrderStatus.PAID);
                        order = orderRepository.findById(id).orElse(order); // Refrescamos el pedido
                    }
                    // Si fue rechazado, lo cancelamos limpiamente
                    else if ("DECLINED".equals(status) || "ERROR".equals(status) || "VOIDED".equals(status)) {
                        orderService.updateOrderStatus(id, OrderStatus.CANCELLED);
                        order = orderRepository.findById(id).orElse(order);
                    }
                }
            } catch (Exception e) {
                System.out.println("Error verificando la transacción con Wompi: " + e.getMessage());
            }
        }

        model.addAttribute("order", order);
        model.addAttribute("wompiTransactionId", wompiTransactionId);
        model.addAttribute("pageTitle", "Resultado del Pago");

        return "storefront/order-result";
    }
}