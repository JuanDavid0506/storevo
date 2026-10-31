package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.WompiCheckoutData;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.model.StoreReview;
import com.storevo.backend.tenant.repository.StoreReviewRepository;
import com.storevo.backend.tenant.service.OrderService;
import com.storevo.backend.tenant.service.WompiService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Controller
@RequestMapping("/s/{slug}/order")
@RequiredArgsConstructor
public class OrderController {

    private final StoreSettingsService storeSettingsService;
    private final OrderService orderService;
    private final WompiService wompiService;
    private final StoreReviewRepository storeReviewRepository;

    @GetMapping("/{id}/success")
    public String orderSuccess(
            @PathVariable String slug,
            @PathVariable Long id,
            @RequestParam(name = "token") String token,
            HttpServletRequest request,
            Model model) {
        Order order = orderService.getOrderByIdAndToken(id, token);

        if (order.getStatus() == OrderStatus.PAID) {
            return "redirect:/s/" + slug + "/order/" + id + "/wompi-result?token=" + order.getPublicToken();
        }

        Store store = (Store) request.getAttribute("currentStore");

        model.addAttribute("order", order);
        model.addAttribute("pageTitle", "Pagar Pedido");

        try {
            TenantContext.clear();
            WompiCheckoutData checkoutData = wompiService.prepareCheckout(store, order);
            TenantContext.setCurrentTenant(store.getSchemaName());

            String scheme = request.getHeader("X-Forwarded-Proto") != null ? request.getHeader("X-Forwarded-Proto") : request.getScheme();
            String serverName = request.getServerName();
            int serverPort = request.getServerPort();
            String portSuffix = (serverPort == 80 || serverPort == 443) ? "" : ":" + serverPort;
            String baseUrl = scheme + "://" + serverName + portSuffix;

            String redirectUrl = baseUrl + "/s/" + slug + "/order/" + order.getId() + "/wompi-result?token=" + order.getPublicToken();

            model.addAttribute("paymentAvailable", true);
            model.addAttribute("wompiPublicKey", checkoutData.getPublicKey());
            model.addAttribute("wompiReference", checkoutData.getReference());
            model.addAttribute("amountInCents", checkoutData.getAmountInCents());
            model.addAttribute("wompiSignature", checkoutData.getSignature());
            model.addAttribute("wompiRedirectUrl", redirectUrl);

        } catch (RuntimeException e) {
            TenantContext.setCurrentTenant(store.getSchemaName());
            e.printStackTrace();
            model.addAttribute("paymentAvailable", false);
            model.addAttribute("paymentErrorMessage", e.getMessage());
        }

        return "storefront/order-success";
    }

    @GetMapping("/{id}/whatsapp")
    public String orderWhatsapp(
            @PathVariable String slug,
            @PathVariable Long id,
            @RequestParam(name = "token") String token,
            HttpServletRequest request,
            Model model) {
        Order order = orderService.getOrderByIdAndToken(id, token);
        Store store = (Store) request.getAttribute("currentStore");

        TenantContext.clear();
        var settings = storeSettingsService.getSettingsByStore(store);
        TenantContext.setCurrentTenant(store.getSchemaName());

        model.addAttribute("order", order);
        model.addAttribute("existingReview", storeReviewRepository.findByOrderId(id).orElse(null));
        model.addAttribute("pageTitle", "Pedido enviado por WhatsApp");

        String rawWhatsapp = settings != null ? settings.getWhatsapp() : null;
        if (rawWhatsapp == null || rawWhatsapp.isBlank()) {
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

    @GetMapping("/{id}/wompi-result")
    public String wompiReturn(
            @PathVariable String slug,
            @PathVariable Long id,
            @RequestParam(name = "token") String token,
            @RequestParam(name = "id", required = false) String wompiTransactionId,
            @RequestParam(name = "txId", required = false) String altTransactionId,
            HttpServletRequest request,
            Model model) {

        Store store = (Store) request.getAttribute("currentStore");
        Order verifiedOrder = orderService.getOrderByIdAndToken(id, token);

        String resolvedTxId = (altTransactionId != null && !altTransactionId.isBlank())
                ? altTransactionId.trim()
                : (wompiTransactionId != null && !wompiTransactionId.isBlank() && !wompiTransactionId.trim().equals(String.valueOf(id))
                ? wompiTransactionId.trim() : null);

        String wompiTxStatus = null;
        if (resolvedTxId != null) {
            wompiTxStatus = orderService.verifyTransactionWithWompi(store, verifiedOrder.getId(), resolvedTxId);
        }

        TenantContext.setCurrentTenant(store.getSchemaName());
        Order order = orderService.getOrderByIdAndToken(id, token);

        model.addAttribute("order", order);
        model.addAttribute("wompiTransactionId", resolvedTxId);
        model.addAttribute("wompiTxStatus", wompiTxStatus);
        model.addAttribute("existingReview", storeReviewRepository.findByOrderId(id).orElse(null));

        boolean paymentFailed = "DECLINED".equals(wompiTxStatus)
                || "ERROR".equals(wompiTxStatus)
                || "VOIDED".equals(wompiTxStatus)
                || "INVALID".equals(wompiTxStatus)
                || order.getStatus() == OrderStatus.CANCELLED;

        if (paymentFailed) {
            model.addAttribute("pageTitle", "Pago Rechazado");
            return "storefront/order-failed";
        }

        model.addAttribute("pageTitle", "Resultado del Pago");
        return "storefront/order-result";
    }

    /**
     * Registra una reseña 100% real asociada a un pedido existente de la tienda.
     */
    @PostMapping("/{id}/review")
    public String submitOrderReview(
            @PathVariable String slug,
            @PathVariable Long id,
            @RequestParam(name = "token") String token,
            @RequestParam(defaultValue = "5") Integer rating,
            @RequestParam String comment,
            @RequestParam(defaultValue = "result") String origin,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        Order order = orderService.getOrderByIdAndToken(id, token);

        String redirectTarget = "whatsapp".equalsIgnoreCase(origin)
                ? "redirect:/s/" + slug + "/order/" + id + "/whatsapp?token=" + order.getPublicToken() + "&reviewed=true"
                : "redirect:/s/" + slug + "/order/" + id + "/wompi-result?token=" + order.getPublicToken();

        try {
            if (order.getStatus() == OrderStatus.CANCELLED) {
                return redirectTarget;
            }

            if (storeReviewRepository.findByOrderId(id).isPresent()) {
                redirectAttributes.addFlashAttribute("reviewSuccess", "¡Ya habíamos registrado tu calificación para este pedido!");
                return redirectTarget;
            }

            String cleanComment = comment != null ? comment.trim() : "";
            if (cleanComment.length() < 4) {
                redirectAttributes.addFlashAttribute("reviewError", "Por favor escribe un comentario breve sobre tu experiencia.");
                return redirectTarget;
            }
            if (cleanComment.length() > 500) {
                cleanComment = cleanComment.substring(0, 500);
            }

            int safeRating = Math.max(1, Math.min(rating != null ? rating : 5, 5));

            StoreReview review = StoreReview.builder()
                    .orderId(order.getId())
                    .customerName(order.getCustomerName())
                    .customerCity(order.getCity())
                    .rating(safeRating)
                    .comment(cleanComment)
                    .isVisible(true)
                    .build();

            storeReviewRepository.save(review);
            redirectAttributes.addFlashAttribute("reviewSuccess", "¡Muchas gracias! Tu calificación verificada ya fue publicada en la tienda.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("reviewError", "No se pudo guardar tu reseña en este momento.");
        }

        return redirectTarget;
    }

    private String normalizeWhatsappNumber(String raw) {
        String digitsOnly = raw.replaceAll("[^0-9]", "");
        if (digitsOnly.length() == 10) {
            return "57" + digitsOnly;
        }
        return digitsOnly;
    }
}