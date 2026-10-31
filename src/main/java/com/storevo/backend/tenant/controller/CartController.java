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
    private final ProductService productService;
    private final OrderService orderService;
    private final ProductVariantRepository variantRepository;
    private final StoreIntegrationRepository integrationRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public String viewCart(@PathVariable String slug, HttpServletRequest request, Model model) {
        String guestId = (String) request.getAttribute("guestId");
        java.util.List<CartItemDto> cart = cartManager.getCart(guestId);

        java.util.List<String> invalidItemKeys = new java.util.ArrayList<>();
        Map<String, Integer> itemMaxStock = new HashMap<>();

        for (CartItemDto item : cart) {
            String itemKey = item.getProductId() + "-" + item.getVariantId();
            try {
                Product p = productService.getProductById(item.getProductId());
                if (p.getIsDeleted() || !p.getIsActive()) {
                    invalidItemKeys.add(itemKey);
                    continue;
                }
                if (item.getVariantId() != null) {
                    ProductVariant v = variantRepository.findById(item.getVariantId()).orElse(null);
                    if (v == null || !v.getIsActive()) {
                        invalidItemKeys.add(itemKey);
                    } else if (!Boolean.TRUE.equals(p.getIsMadeToOrder())) {
                        itemMaxStock.put(itemKey, v.getStock() != null ? v.getStock() : 0);
                    }
                } else if (!Boolean.TRUE.equals(p.getIsMadeToOrder())) {
                    itemMaxStock.put(itemKey, p.getStock() != null ? p.getStock() : 0);
                }
            } catch (Exception e) {
                invalidItemKeys.add(itemKey);
            }
        }

        model.addAttribute("cartItems", cart);
        model.addAttribute("invalidItemKeys", invalidItemKeys);
        model.addAttribute("itemMaxStock", itemMaxStock);
        model.addAttribute("cartTotal", cartManager.getTotal(guestId));
        model.addAttribute("pageTitle", "Mi Bolsa");
        return "storefront/cart";
    }

    @PostMapping("/add")
    @Transactional
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

    @PostMapping("/update")
    @Transactional
    public String updateCartItemQuantity(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam Integer quantity,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        String guestId = (String) request.getAttribute("guestId");

        if (quantity == null || quantity <= 0) {
            cartManager.removeItem(guestId, productId, variantId);
            redirectAttributes.addFlashAttribute("cartSuccess", "Producto eliminado de tu bolsa.");
            return "redirect:/s/" + slug + "/cart";
        }

        try {
            Product product = productService.getProductById(productId);
            if (product.getIsDeleted() || !product.getIsActive()) {
                cartManager.removeItem(guestId, productId, variantId);
                redirectAttributes.addFlashAttribute("cartError", "Este producto ya no está disponible.");
                return "redirect:/s/" + slug + "/cart";
            }

            boolean isMadeToOrder = Boolean.TRUE.equals(product.getIsMadeToOrder());
            int availableStock = product.getStock() != null ? product.getStock() : 0;
            Double itemPrice = product.getDiscountPrice() != null && product.getDiscountPrice() > 0 ? product.getDiscountPrice() : product.getPrice();
            String itemVariantText = null;
            String imageUrl = product.getMainImageUrl();

            if (variantId != null && product.getHasVariants()) {
                ProductVariant variant = variantRepository.findById(variantId).orElse(null);
                if (variant == null || !variant.getIsActive()) {
                    cartManager.removeItem(guestId, productId, variantId);
                    redirectAttributes.addFlashAttribute("cartError", "La variante seleccionada ya no está disponible.");
                    return "redirect:/s/" + slug + "/cart";
                }
                availableStock = variant.getStock() != null ? variant.getStock() : 0;
                itemPrice = variant.getPrice() != null && variant.getPrice() > 0 ? variant.getPrice() : itemPrice;
                itemVariantText = variant.getOptionValues().stream()
                        .map(ov -> ov.getValueName())
                        .collect(Collectors.joining(" • "));
                if (variant.getImages() != null && !variant.getImages().isEmpty()) {
                    imageUrl = variant.getImages().get(0).getThumbnailUrl();
                    if (imageUrl == null) imageUrl = variant.getImages().get(0).getSecureUrl();
                }
            }

            int finalQty = quantity;
            if (!isMadeToOrder) {
                if (availableStock <= 0) {
                    redirectAttributes.addFlashAttribute("cartError", "Producto sin stock disponible.");
                    return "redirect:/s/" + slug + "/cart";
                }
                if (quantity > availableStock) {
                    finalQty = availableStock;
                    redirectAttributes.addFlashAttribute("cartError", "Solo disponemos de " + availableStock + " unidad(es) en inventario.");
                }
            }

            cartManager.removeItem(guestId, productId, variantId);
            CartItemDto updatedItem = CartItemDto.builder()
                    .productId(product.getId())
                    .variantId(variantId)
                    .name(product.getName())
                    .variantText(itemVariantText)
                    .price(itemPrice)
                    .quantity(finalQty)
                    .imageUrl(imageUrl)
                    .isMadeToOrder(isMadeToOrder)
                    .build();
            cartManager.addItem(guestId, updatedItem);

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("cartError", "No se pudo actualizar la cantidad.");
        }

        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/add-ajax")
    @ResponseBody
    @Transactional
    public ResponseEntity<Map<String, Object>> addToCartAjax(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "1") Integer quantity,
            HttpServletRequest request) {

        String guestId = (String) request.getAttribute("guestId");
        Map<String, Object> response = new HashMap<>();
        Product product = productService.getProductById(productId);
        if (product.getIsDeleted() || !product.getIsActive()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Producto no disponible."));
        }

        boolean isMadeToOrder = Boolean.TRUE.equals(product.getIsMadeToOrder());

        int availableStock = product.getStock() != null ? product.getStock() : 0;
        Double itemPrice = product.getDiscountPrice() != null && product.getDiscountPrice() > 0 ? product.getDiscountPrice() : product.getPrice();
        String itemVariantText = null;
        String imageUrl = product.getMainImageUrl();

        if (variantId != null && product.getHasVariants()) {
            ProductVariant variant = variantRepository.findById(variantId)
                    .orElseThrow(() -> new RuntimeException("Variante no encontrada"));

            if (!variant.getIsActive()) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Esta combinación no está disponible."));
            }

            availableStock = variant.getStock() != null ? variant.getStock() : 0;
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
            int currentQtyInCart = cartManager.getItemQuantity(guestId, productId, variantId);
            int remainingStock = availableStock - currentQtyInCart;

            if (remainingStock <= 0) {
                response.put("success", false);
                response.put("message", "Límite alcanzado. Solo disponemos de " + availableStock + " unidad(es).");
                response.put("cartCount", cartManager.getCartCount(guestId));
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

        cartManager.addItem(guestId, item);
        response.put("cartCount", cartManager.getCartCount(guestId));
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
            @RequestParam(required = false) Long variantId,
            HttpServletRequest request) {

        String guestId = (String) request.getAttribute("guestId");
        cartManager.removeItem(guestId, productId, variantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Producto retirado de la bolsa.");
        response.put("cartCount", cartManager.getCartCount(guestId));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/remove")
    public String removeFromCart(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        String guestId = (String) request.getAttribute("guestId");
        cartManager.removeItem(guestId, productId, variantId);

        redirectAttributes.addFlashAttribute("cartSuccess", "Producto eliminado de la bolsa");
        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/checkout/process")
    public String processCheckout(
            @PathVariable String slug,
            @RequestParam String customerName,
            @RequestParam String customerPhone,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String customerDocument,
            @RequestParam(required = false) String verificationDigit,
            @RequestParam(required = false) String legalName,
            @RequestParam(required = false) String taxRegime,
            @RequestParam(required = false, defaultValue = "false") Boolean requiresElectronicInvoice,
            @RequestParam String address,
            @RequestParam String city,
            @RequestParam(required = false) String notes,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        String guestId = (String) request.getAttribute("guestId");
        boolean hasMadeToOrderItem = cartManager.getCart(guestId).stream()
                .anyMatch(item -> Boolean.TRUE.equals(item.getIsMadeToOrder()));

        if (hasMadeToOrderItem) {
            redirectAttributes.addFlashAttribute("checkoutError", "Tu carrito tiene productos bajo pedido. Por favor, utiliza el botón de WhatsApp.");
            return "redirect:/s/" + slug + "/cart/checkout";
        }

        String finalDoc = formatDocumentWithDv(customerDocument, verificationDigit);

        try {
            Order order = orderService.createOrderFromCart(
                    guestId, customerName, customerPhone, customerEmail,
                    documentType, finalDoc, verificationDigit, legalName, taxRegime, requiresElectronicInvoice,
                    address, city, notes, OrderChannel.ONLINE
            );
            return "redirect:/s/" + slug + "/order/" + order.getId() + "/success?token=" + order.getPublicToken();
        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("checkoutError", e.getMessage() != null ? e.getMessage() : "No se pudo procesar tu pedido. Verifica los datos e intenta nuevamente.");
            return "redirect:/s/" + slug + "/cart/checkout";
        }
    }

    @PostMapping("/checkout/whatsapp")
    public String processCheckoutWhatsapp(
            @PathVariable String slug,
            @RequestParam String customerName,
            @RequestParam String customerPhone,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String customerDocument,
            @RequestParam(required = false) String verificationDigit,
            @RequestParam(required = false) String legalName,
            @RequestParam(required = false) String taxRegime,
            @RequestParam(required = false, defaultValue = "false") Boolean requiresElectronicInvoice,
            @RequestParam String address,
            @RequestParam String city,
            @RequestParam(required = false) String notes,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        String guestId = (String) request.getAttribute("guestId");
        String finalDoc = formatDocumentWithDv(customerDocument, verificationDigit);

        try {
            Order order = orderService.createOrderFromCart(
                    guestId, customerName, customerPhone, customerEmail,
                    documentType, finalDoc, verificationDigit, legalName, taxRegime, requiresElectronicInvoice,
                    address, city, notes, OrderChannel.WHATSAPP
            );
            return "redirect:/s/" + slug + "/order/" + order.getId() + "/whatsapp?token=" + order.getPublicToken();
        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("checkoutError", e.getMessage() != null ? e.getMessage() : "No se pudo registrar tu pedido. Verifica los datos e intenta nuevamente.");
            return "redirect:/s/" + slug + "/cart/checkout";
        }
    }

    private String formatDocumentWithDv(String doc, String dv) {
        if (doc == null || doc.isBlank()) return doc;
        String cleanDoc = doc.trim();
        if (dv != null && !dv.isBlank() && !cleanDoc.contains("-")) {
            return cleanDoc + "-" + dv.trim();
        }
        return cleanDoc;
    }

    @GetMapping("/checkout")
    public String showCheckout(@PathVariable String slug, HttpServletRequest request, Model model) {
        String guestId = (String) request.getAttribute("guestId");
        java.util.List<CartItemDto> cart = cartManager.getCart(guestId);

        if (cart.isEmpty()) return "redirect:/s/" + slug + "/cart";

        boolean hasMadeToOrderItem = cart.stream().anyMatch(item -> Boolean.TRUE.equals(item.getIsMadeToOrder()));

        Store store = (Store) request.getAttribute("currentStore");

        TenantContext.clear();
        boolean wompiEnabled = integrationRepository.findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI).isPresent();
        TenantContext.setCurrentTenant(store.getSchemaName());

        model.addAttribute("cartItems", cart);
        model.addAttribute("cartTotal", cartManager.getTotal(guestId));
        model.addAttribute("hasMadeToOrderItem", hasMadeToOrderItem);
        model.addAttribute("wompiEnabled", wompiEnabled);
        model.addAttribute("pageTitle", "Finalizar Compra");
        return "storefront/checkout";
    }
}