package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.exception.OrderNotFoundException;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Controller
@RequestMapping("/s/{slug}/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final StoreSettingsService storeSettingsService;
    private final OrderService orderService;

    @Value("${wompi.public-key}")
    private String wompiPublicKey;

    @Value("${wompi.integrity-secret}")
    private String wompiIntegritySecret;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        // 1. PRIMERO leemos los settings
        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);

        // 2. LUEGO bajamos el switch
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping("/{id}/success")
    public String orderSuccess(@PathVariable String slug, @PathVariable Long id, HttpServletRequest request, Model model) {
        // ACTUALIZADO: Usamos la excepción de Dominio
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        // Generamos la referencia de Wompi.
        // YA NO SE GUARDA EN BD, ya que el Webhook es capaz de extraer el ID de este String.
        String wompiReference = slug + "__" + order.getId() + "__" + System.currentTimeMillis();
        long amountInCents = Math.round(order.getTotal() * 100);

        String cleanPublicKey = this.wompiPublicKey.trim();
        String cleanIntegritySecret = this.wompiIntegritySecret.trim();

        String rawSignature = wompiReference + amountInCents + "COP" + cleanIntegritySecret;
        String integritySignature = generateSha256(rawSignature);

        String scheme = request.getHeader("X-Forwarded-Proto") != null ? request.getHeader("X-Forwarded-Proto") : request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String portSuffix = (serverPort == 80 || serverPort == 443) ? "" : ":" + serverPort;
        String baseUrl = scheme + "://" + serverName + portSuffix;

        String redirectUrl = baseUrl + "/s/" + slug + "/order/" + order.getId() + "/wompi-result";

        model.addAttribute("order",          order);
        model.addAttribute("wompiReference", wompiReference);
        model.addAttribute("amountInCents",  amountInCents);
        model.addAttribute("wompiPublicKey", cleanPublicKey);
        model.addAttribute("wompiSignature", integritySignature);
        model.addAttribute("wompiRedirectUrl", redirectUrl);
        model.addAttribute("pageTitle",      "Pagar Pedido");

        return "storefront/order-success";
    }

    @GetMapping("/{id}/whatsapp")
    public String orderWhatsapp(@PathVariable String slug, @PathVariable Long id, HttpServletRequest request, Model model) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        Store store = (Store) request.getAttribute("currentStore");
        var settings = storeSettingsService.getSettingsByStore(store);

        model.addAttribute("order", order);
        model.addAttribute("pageTitle", "Pedido enviado por WhatsApp");

        String rawWhatsapp = settings != null ? settings.getWhatsapp() : null;
        if (rawWhatsapp == null || rawWhatsapp.isBlank()) {
            // La tienda todavía no configuró su número de WhatsApp: mostramos la
            // confirmación igual (el pedido ya quedó registrado) pero sin el botón.
            model.addAttribute("whatsappConfigured", false);
        } else {
            String message = orderService.buildWhatsappMessage(order);
            String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8);
            String normalizedNumber = normalizeWhatsappNumber(rawWhatsapp);
            model.addAttribute("whatsappConfigured", true);
            model.addAttribute("whatsappLink", "https://wa.me/" + normalizedNumber + "?text=" + encodedMessage);
        }

        return "storefront/order-whatsapp";
    }

    // Deja el número solo con dígitos y le antepone el indicativo de Colombia (57)
    // si detecta un celular local de 10 dígitos sin indicativo. Si el comerciante
    // ya guardó el número con indicativo, se respeta tal cual.
    private String normalizeWhatsappNumber(String raw) {
        String digitsOnly = raw.replaceAll("[^0-9]", "");
        if (digitsOnly.length() == 10) {
            return "57" + digitsOnly;
        }
        return digitsOnly;
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
            throw new RuntimeException("Error generando firma criptográfica", e);
        }
    }

    @GetMapping("/{id}/wompi-result")
    public String wompiReturn(
            @PathVariable String slug,
            @PathVariable Long id,
            @RequestParam(name = "id", required = false) String wompiTransactionId,
            Model model) {

        // 1. Verificamos la transacción en Wompi en tiempo real
        if (wompiTransactionId != null) {
            orderService.verifyTransactionWithWompi(id, wompiTransactionId);
        }

        // 2. Volvemos a consultar la base de datos para obtener el estado ACTUALIZADO
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        model.addAttribute("order", order);
        model.addAttribute("wompiTransactionId", wompiTransactionId);

        // 3. Verificamos el estado para decidir qué pantalla mostrar
        if (order.getStatus() == OrderStatus.CANCELLED) {
            model.addAttribute("pageTitle", "Pago Rechazado");
            return "storefront/order-failed";
        }

        // Si fue exitoso o sigue pendiente
        model.addAttribute("pageTitle", "Resultado del Pago");
        return "storefront/order-result";
    }
}