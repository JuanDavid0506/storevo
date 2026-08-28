package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductVariant;
import com.storevo.backend.tenant.repository.ProductVariantRepository;
import com.storevo.backend.tenant.service.CartManager;
import com.storevo.backend.tenant.service.OrderService;
import com.storevo.backend.tenant.service.ProductService;
import com.storevo.backend.tenant.service.WishlistManager;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/s/{slug}/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartManager cartManager;
    private final WishlistManager wishlistManager;
    private final ProductService productService;
    private final OrderService orderService;
    private final ProductVariantRepository variantRepository;
    private final StoreIntegrationRepository integrationRepository; // <-- NUEVO: Para consultar si Wompi existe

    @GetMapping
    @Transactional(readOnly = true)
    public String viewCart(@PathVariable String slug, Model model) {
        java.util.List<CartItemDto> cart = cartManager.getCart(slug);

        java.util.List<String> invalidItemKeys = new java.util.ArrayList<>();
        for (CartItemDto item : cart) {
            try {
                Product p = productService.getProductById(item.getProductId());
                if (p.getIsDeleted() || !p.getIsActive()) {
                    invalidItemKeys.add(item.getProductId() + "-" + item.getVariantId());
                    continue;
                }
                if (item.getVariantId() != null) {
                    ProductVariant v = variantRepository.findById(item.getVariantId()).orElse(null);
                    if (v == null || !v.getIsActive()) {
                        invalidItemKeys.add(item.getProductId() + "-" + item.getVariantId());
                    }
                }
            } catch (Exception e) {
                invalidItemKeys.add(item.getProductId() + "-" + item.getVariantId());
            }
        }

        model.addAttribute("cartItems", cart);
        model.addAttribute("invalidItemKeys", invalidItemKeys);
        model.addAttribute("cartTotal", cartManager.getTotal(slug));
        model.addAttribute("pageTitle", "Mi Bolsa");
        return "storefront/cart";
    }

    @PostMapping("/add")
    @Transactional(readOnly = true)
    public String addToCartTraditional(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "1") Integer quantity,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        ResponseEntity<Map<String, Object>> response = addToCartAjax(slug, productId, variantId, quantity, request);

        if (Boolean.TRUE.equals(response.getBody().get("success"))) {
            redirectAttributes.addFlashAttribute("cartSuccess", response.getBody().get("message"));
        } else {
            redirectAttributes.addFlashAttribute("cartError", response.getBody().get("message"));
        }

        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/add-ajax")
    @ResponseBody
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> addToCartAjax(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "1") Integer quantity,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();
        Product product = productService.getProductById(productId);
        if (product.getIsDeleted() || !product.getIsActive()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Producto no disponible."));
        }

        Store store = (Store) request.getAttribute("currentStore");
        boolean isMadeToOrder = Boolean.TRUE.equals(product.getIsMadeToOrder());

        int availableStock = product.getStock();
        Double itemPrice = product.getDiscountPrice() != null && product.getDiscountPrice() > 0 ? product.getDiscountPrice() : product.getPrice();
        String itemVariantText = null;
        String imageUrl = product.getMainImageUrl();

        if (variantId != null && product.getHasVariants()) {
            ProductVariant variant = variantRepository.findById(variantId)
                    .orElseThrow(() -> new RuntimeException("Variante no encontrada"));

            if (!variant.getIsActive()) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Esta combinación no está disponible."));
            }

            availableStock = variant.getStock();
            itemPrice = variant.getPrice() != null && variant.getPrice() > 0 ? variant.getPrice() : itemPrice;

            itemVariantText = variant.getOptionValues().stream()
                    .map(ov -> ov.getValueName())
                    .collect(Collectors.joining(" • "));

            if (variant.getImages() != null && !variant.getImages().isEmpty()) {
                imageUrl = variant.getImages().get(0).getThumbnailUrl();
                if (imageUrl == null) imageUrl = variant.getImages().get(0).getSecureUrl();
            }
        } else if (product.getHasVariants()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Debe seleccionar las opciones del producto."));
        }

        int qtyToAdd = quantity;

        if (!isMadeToOrder) {
            int currentQtyInCart = cartManager.getItemQuantity(slug, productId, variantId);
            int remainingStock = availableStock - currentQtyInCart;

            if (remainingStock <= 0) {
                response.put("success", false);
                response.put("message", "Límite alcanzado. Solo disponemos de " + availableStock + " unidad(es).");
                response.put("cartCount", cartManager.getCartCount(slug));
                return ResponseEntity.ok(response);
            }

            qtyToAdd = Math.min(quantity, remainingStock);
        }

        CartItemDto item = CartItemDto.builder()
                .productId(product.getId())
                .variantId(variantId)
                .name(product.getName())
                .variantText(itemVariantText)
                .price(itemPrice)
                .quantity(qtyToAdd)
                .imageUrl(imageUrl)
                .isMadeToOrder(isMadeToOrder)
                .build();

        cartManager.addItem(slug, item);
        response.put("cartCount", cartManager.getCartCount(slug));
        response.put("success", true);

        if (qtyToAdd < quantity) {
            response.put("message", "Solo pudimos agregar " + qtyToAdd + " unidad(es) por límite de stock.");
            response.put("isWarning", true);
        } else {
            response.put("message", "¡Agregado a tu bolsa de compras!");
            response.put("isWarning", false);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/remove-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> removeFromCartAjax(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId) {

        cartManager.removeItem(slug, productId, variantId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Producto retirado de la bolsa.");
        response.put("cartCount", cartManager.getCartCount(slug));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/remove")
    public String removeFromCart(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            RedirectAttributes redirectAttributes) {

        cartManager.removeItem(slug, productId, variantId);
        redirectAttributes.addFlashAttribute("cartSuccess", "Producto eliminado de la bolsa");
        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/checkout/process")
    public String processCheckout(
            @PathVariable String slug, @RequestParam String customerName, @RequestParam String customerPhone,
            @RequestParam(required = false) String customerDocument, @RequestParam String address,
            @RequestParam String city, @RequestParam(required = false) String notes,
            RedirectAttributes redirectAttributes) { // <-- NUEVO: Para pasar el mensaje de error

        boolean hasMadeToOrderItem = cartManager.getCart(slug).stream()
                .anyMatch(item -> Boolean.TRUE.equals(item.getIsMadeToOrder()));

        if (hasMadeToOrderItem) {
            redirectAttributes.addFlashAttribute("checkoutError", "Tu carrito tiene productos bajo pedido. Por favor, utiliza el botón de WhatsApp.");
            return "redirect:/s/" + slug + "/cart/checkout";
        }

        try {
            Order order = orderService.createOrderFromCart(slug, customerName, customerPhone, customerDocument, address, city, notes, OrderChannel.ONLINE);
            return "redirect:/s/" + slug + "/order/" + order.getId() + "/success";
        } catch (Exception e) {
            e.printStackTrace(); // <-- VITAL: Escupe la línea exacta del fallo en la consola
            redirectAttributes.addFlashAttribute("checkoutError", e.getMessage() != null ? e.getMessage() : "Error interno de base de datos. Revisa la consola.");
            return "redirect:/s/" + slug + "/cart/checkout";
        }
    }

    @PostMapping("/checkout/whatsapp")
    public String processCheckoutWhatsapp(
            @PathVariable String slug, @RequestParam String customerName, @RequestParam String customerPhone,
            @RequestParam(required = false) String customerDocument, @RequestParam String address,
            @RequestParam String city, @RequestParam(required = false) String notes,
            RedirectAttributes redirectAttributes) {
        try {
            Order order = orderService.createOrderFromCart(slug, customerName, customerPhone, customerDocument, address, city, notes, OrderChannel.WHATSAPP);
            return "redirect:/s/" + slug + "/order/" + order.getId() + "/whatsapp";
        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("checkoutError", e.getMessage() != null ? e.getMessage() : "Error interno. Revisa la consola.");
            return "redirect:/s/" + slug + "/cart/checkout";
        }
    }

    @GetMapping("/checkout")
    public String showCheckout(@PathVariable String slug, HttpServletRequest request, Model model) {
        java.util.List<CartItemDto> cart = cartManager.getCart(slug);
        if (cart.isEmpty()) return "redirect:/s/" + slug + "/cart";

        boolean hasMadeToOrderItem = cart.stream().anyMatch(item -> Boolean.TRUE.equals(item.getIsMadeToOrder()));

        Store store = (Store) request.getAttribute("currentStore");

        // 1. Apagamos el contexto temporalmente para volver a la BD de Administración
        TenantContext.clear();

        // 2. Consultamos la integración de Wompi (ahora sí buscará en la tabla correcta)
        boolean wompiEnabled = integrationRepository.findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI).isPresent();

        // 3. Volvemos a bajar el switch hacia la base de datos de la Tienda
        TenantContext.setCurrentTenant(store.getSchemaName());

        model.addAttribute("cartItems", cart);
        model.addAttribute("cartTotal", cartManager.getTotal(slug));
        model.addAttribute("hasMadeToOrderItem", hasMadeToOrderItem);
        model.addAttribute("wompiEnabled", wompiEnabled);
        model.addAttribute("pageTitle", "Finalizar Compra");
        return "storefront/checkout";
    }
}