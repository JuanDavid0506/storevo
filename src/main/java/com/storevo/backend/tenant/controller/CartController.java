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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@lombok.extern.slf4j.Slf4j
@Controller
@RequestMapping("/s/{slug}/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartManager cartManager;
    private final ProductService productService;
    private final OrderService orderService;
    private final com.storevo.backend.tenant.service.CustomerService customerService;
    private final com.storevo.backend.tenant.service.CouponService couponService;
    private final com.storevo.backend.config.security.RateLimitService rateLimitService;
    private final ProductVariantRepository variantRepository;
    private final StoreIntegrationRepository integrationRepository;

    private boolean isCartItemValidAndPopulateMaxStock(CartItemDto item, Map<String, Integer> itemMaxStock) {
        if (item == null || item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
            return false;
        }
        String itemKey = item.getProductId() + "-" + item.getVariantId();
        try {
            Product p = productService.getProductById(item.getProductId());
            if (!productService.isProductPubliclyVisible(p)) {
                return false;
            }
            ProductVariant v = null;
            if (Boolean.TRUE.equals(p.getHasVariants())) {
                if (item.getVariantId() == null) {
                    return false;
                }
                v = variantRepository.findByIdAndProductId(item.getVariantId(), p.getId()).orElse(null);
                if (v == null || !Boolean.TRUE.equals(v.getIsActive())) {
                    return false;
                }
                if (!Boolean.TRUE.equals(p.getIsMadeToOrder()) && itemMaxStock != null) {
                    itemMaxStock.put(itemKey, v.getStock() != null ? v.getStock() : 0);
                }
            } else {
                if (item.getVariantId() != null) {
                    return false;
                }
                if (!Boolean.TRUE.equals(p.getIsMadeToOrder()) && itemMaxStock != null) {
                    itemMaxStock.put(itemKey, p.getStock() != null ? p.getStock() : 0);
                }
            }

            Double effectivePrice = cartManager.resolveEffectivePrice(p, v);
            return effectivePrice != null && effectivePrice > 0.0;
        } catch (Exception e) {
            return false;
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public String viewCart(@PathVariable String slug, HttpServletRequest request, Model model) {
        String guestId = (String) request.getAttribute("guestId");
        List<CartItemDto> cart = cartManager.getCart(guestId);
        List<String> invalidItemKeys = new ArrayList<>();
        Map<String, Integer> itemMaxStock = new HashMap<>();

        for (CartItemDto item : cart) {
            String itemKey = item.getProductId() + "-" + item.getVariantId();
            if (!isCartItemValidAndPopulateMaxStock(item, itemMaxStock)) {
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

        ResponseEntity< Map<String, Object> > response = addToCartAjax(slug, productId, variantId, quantity, request);
        if (response.getBody() != null && Boolean.TRUE.equals(response.getBody().get("success"))) {
            redirectAttributes.addFlashAttribute("cartSuccess", response.getBody().get("message"));
        } else if (response.getBody() != null) {
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
            if (!productService.isProductPubliclyVisible(product)) {
                cartManager.removeItem(guestId, productId, variantId);
                redirectAttributes.addFlashAttribute("cartError", "Este producto ya no está disponible.");
                return "redirect:/s/" + slug + "/cart";
            }

            boolean isMadeToOrder = Boolean.TRUE.equals(product.getIsMadeToOrder());
            int availableStock;
            ProductVariant variant = null;

            if (Boolean.TRUE.equals(product.getHasVariants())) {
                if (variantId == null) {
                    cartManager.removeItem(guestId, productId, null);
                    redirectAttributes.addFlashAttribute("cartError", "Debe seleccionar las opciones del producto.");
                    return "redirect:/s/" + slug + "/cart";
                }
                variant = variantRepository.findByIdAndProductId(variantId, product.getId()).orElse(null);
                if (variant == null) {
                    cartManager.removeItem(guestId, productId, variantId);
                    redirectAttributes.addFlashAttribute("cartError", "La variante seleccionada no pertenece a este producto.");
                    return "redirect:/s/" + slug + "/cart";
                }
                if (!Boolean.TRUE.equals(variant.getIsActive())) {
                    cartManager.removeItem(guestId, productId, variantId);
                    redirectAttributes.addFlashAttribute("cartError", "La variante seleccionada ya no está disponible.");
                    return "redirect:/s/" + slug + "/cart";
                }
                availableStock = variant.getStock() != null ? variant.getStock() : 0;
            } else {
                if (variantId != null) {
                    cartManager.removeItem(guestId, productId, variantId);
                    redirectAttributes.addFlashAttribute("cartError", "La variante seleccionada no pertenece a este producto.");
                    return "redirect:/s/" + slug + "/cart";
                }
                availableStock = product.getStock() != null ? product.getStock() : 0;
            }

            Double itemPrice = cartManager.resolveEffectivePrice(product, variant);
            if (itemPrice == null || itemPrice <= 0.0) {
                cartManager.removeItem(guestId, productId, variantId);
                redirectAttributes.addFlashAttribute("cartError", "Este producto no tiene un precio válido.");
                return "redirect:/s/" + slug + "/cart";
            }

            String itemVariantText = cartManager.buildVariantText(variant);
            String imageUrl = cartManager.resolveItemImageUrl(product, variant);

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
                    .variantId(variant != null ? variant.getId() : null)
                    .name(product.getName())
                    .variantText(itemVariantText)
                    .price(itemPrice)
                    .quantity(finalQty)
                    .imageUrl(imageUrl)
                    .isMadeToOrder(isMadeToOrder)
                    .build();
            cartManager.addItem(guestId, updatedItem);
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("cartError", e.getMessage() != null ? e.getMessage() : "No se pudo actualizar la cantidad.");
        }
        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/add-ajax")
    @ResponseBody
    @Transactional
    public ResponseEntity< Map<String, Object> > addToCartAjax(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "1") Integer quantity,
            HttpServletRequest request) {

        String guestId = (String) request.getAttribute("guestId");
        Map<String, Object> response = new HashMap<>();

        if (quantity == null || quantity <= 0) {
            return ResponseEntity.ok(Map.of("success", false, "message", "La cantidad debe ser mayor a cero."));
        }

        Product product;
        try {
            product = productService.getProductById(productId);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Producto no encontrado."));
        }

        if (!productService.isProductPubliclyVisible(product)) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Producto no disponible."));
        }

        boolean isMadeToOrder = Boolean.TRUE.equals(product.getIsMadeToOrder());
        int availableStock;
        ProductVariant variant = null;

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (variantId == null) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Debe seleccionar las opciones del producto."));
            }

            variant = variantRepository.findByIdAndProductId(variantId, product.getId()).orElse(null);
            if (variant == null) {
                return ResponseEntity.ok(Map.of("success", false, "message", "La variante seleccionada no pertenece a este producto."));
            }
            if (!Boolean.TRUE.equals(variant.getIsActive())) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Esta combinación no está disponible."));
            }

            availableStock = variant.getStock() != null ? variant.getStock() : 0;
        } else {
            if (variantId != null) {
                return ResponseEntity.ok(Map.of("success", false, "message", "La variante seleccionada no pertenece a este producto."));
            }
            availableStock = product.getStock() != null ? product.getStock() : 0;
        }

        Double itemPrice = cartManager.resolveEffectivePrice(product, variant);
        if (itemPrice == null || itemPrice <= 0.0) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Este producto no tiene un precio válido disponible."));
        }

        String itemVariantText = cartManager.buildVariantText(variant);
        String imageUrl = cartManager.resolveItemImageUrl(product, variant);
        Long verifiedVariantId = variant != null ? variant.getId() : null;

        int qtyToAdd = quantity;
        if (!isMadeToOrder) {
            int currentQtyInCart = cartManager.getItemQuantity(guestId, product.getId(), verifiedVariantId);
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
                .variantId(verifiedVariantId)
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
    // ===================== COMPRA DIRECTA ("Comprar ahora") =====================
    // Usa un carrito aislado (guestId + ":direct") para no mezclar la compra con la bolsa normal.

    private static final String DIRECT_SUFFIX = ":direct";

    private String resolveCartKey(String guestId, String mode) {
        return "direct".equals(mode) ? guestId + DIRECT_SUFFIX : guestId;
    }

    private ResponseEntity<Map<String, Object>> buyNowError(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/buy-now")
    @ResponseBody
    @Transactional
    public ResponseEntity<Map<String, Object>> buyNow(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "1") Integer quantity,
            HttpServletRequest request) {

        String guestId = (String) request.getAttribute("guestId");
        String directKey = guestId + DIRECT_SUFFIX;

        if (quantity == null || quantity <= 0) {
            return buyNowError("La cantidad debe ser mayor a cero.");
        }

        Product product;
        try {
            product = productService.getProductById(productId);
        } catch (Exception e) {
            return buyNowError("Producto no encontrado.");
        }

        if (!productService.isProductPubliclyVisible(product)) {
            return buyNowError("Producto no disponible.");
        }

        boolean isMadeToOrder = Boolean.TRUE.equals(product.getIsMadeToOrder());
        int availableStock;
        ProductVariant variant = null;

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (variantId == null) {
                return buyNowError("Debes seleccionar las opciones del producto.");
            }
            variant = variantRepository.findByIdAndProductId(variantId, product.getId()).orElse(null);
            if (variant == null) {
                return buyNowError("La variante seleccionada no pertenece a este producto.");
            }
            if (!Boolean.TRUE.equals(variant.getIsActive())) {
                return buyNowError("Esta combinación no está disponible.");
            }
            availableStock = variant.getStock() != null ? variant.getStock() : 0;
        } else {
            if (variantId != null) {
                return buyNowError("La variante seleccionada no pertenece a este producto.");
            }
            availableStock = product.getStock() != null ? product.getStock() : 0;
        }

        Double itemPrice = cartManager.resolveEffectivePrice(product, variant);
        if (itemPrice == null || itemPrice <= 0.0) {
            return buyNowError("Este producto no tiene un precio válido disponible.");
        }

        // El stock se valida SOLO contra la cantidad pedida: lo que haya en la bolsa normal no cuenta.
        if (!isMadeToOrder) {
            if (availableStock <= 0) {
                return buyNowError("Este producto está agotado.");
            }
            if (quantity > availableStock) {
                return buyNowError("Solo disponemos de " + availableStock + " unidad(es) de este producto.");
            }
        }

        Long verifiedVariantId = variant != null ? variant.getId() : null;
        CartItemDto item = CartItemDto.builder()
                .productId(product.getId())
                .variantId(verifiedVariantId)
                .name(product.getName())
                .variantText(cartManager.buildVariantText(variant))
                .price(itemPrice)
                .quantity(quantity)
                .imageUrl(cartManager.resolveItemImageUrl(product, variant))
                .isMadeToOrder(isMadeToOrder)
                .build();

        // Siempre se parte de un carrito directo vacío: solo queda el producto elegido
        cartManager.clearCart(directKey);
        cartManager.addItem(directKey, item);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("redirectUrl", "/s/" + slug + "/cart/checkout?mode=direct");
        // La bolsa normal no se toca: el contador del navbar sigue contando solo guestId
        response.put("cartCount", cartManager.getCartCount(guestId));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/remove-ajax")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > removeFromCartAjax(
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

    @PostMapping("/apply-coupon")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > applyCouponAjax(
            @PathVariable String slug,
            @RequestParam String code,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false, defaultValue = "false") Boolean onlyInStockItems,
            HttpServletRequest request) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        String guestId = (String) request.getAttribute("guestId");
        boolean isDirect = "direct".equalsIgnoreCase(mode);
        String cartSessionId = isDirect ? (guestId + ":direct") : guestId;

        Map<String, Object> res = new HashMap<>();
        try {
            List<CartItemDto> items = cartManager.getCart(cartSessionId);
            double applicableSubtotal = items.stream()
                    .filter(i -> !Boolean.TRUE.equals(onlyInStockItems) || !Boolean.TRUE.equals(i.getIsMadeToOrder()))
                    .filter(i -> i.getPrice() != null && i.getPrice() > 0 && i.getQuantity() != null && i.getQuantity() > 0)
                    .mapToDouble(CartItemDto::getSubtotal)
                    .sum();

            com.storevo.backend.tenant.service.CouponService.CouponEvaluation eval =
                    couponService.validateAndCalculateDiscount(code, applicableSubtotal);

            res.put("valid", true);
            res.put("code", eval.code());
            res.put("discountType", eval.discountType().name());
            res.put("discountValue", eval.discountValue());
            res.put("discountAmount", eval.discountAmount());
            res.put("message", "¡Cupón " + eval.code() + " aplicado!");
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            res.put("valid", false);
            res.put("message", e.getMessage());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("valid", false);
            res.put("message", "No se pudo validar el cupón en este momento.");
            return ResponseEntity.ok(res);
        }
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
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false, defaultValue = "SHIPPING") String deliveryMethod,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false, defaultValue = "false") Boolean onlyInStockItems,
            @RequestParam(required = false) String couponCode,
            @RequestParam(required = false, defaultValue = "false") Boolean saveProfileData,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        String guestId = (String) request.getAttribute("guestId");
        boolean isDirect = "direct".equalsIgnoreCase(mode);
        String cartSessionId = isDirect ? (guestId + ":direct") : guestId;

        if (!rateLimitService.tryConsumeByIp(request, "checkout_submit_" + slug, 6, java.time.Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("checkoutError", com.storevo.backend.config.security.RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/cart/checkout" + (isDirect ? "?mode=direct" : "");
        }

        List<CartItemDto> currentCart = cartManager.getCart(cartSessionId);
        boolean hasMadeToOrderItem = currentCart.stream()
                .anyMatch(item -> Boolean.TRUE.equals(item.getIsMadeToOrder()));

        if (hasMadeToOrderItem && !Boolean.TRUE.equals(onlyInStockItems)) {
            redirectAttributes.addFlashAttribute("checkoutError", "Tu carrito tiene productos bajo pedido. Por favor, elige pagar solo los productos disponibles o coordina tu pedido por WhatsApp.");
            return "redirect:/s/" + slug + "/cart/checkout" + (isDirect ? "?mode=direct" : "");
        }

        String finalDoc = formatDocumentWithDv(customerDocument, verificationDigit);
        com.storevo.backend.tenant.model.Customer loggedCustomer =
                (com.storevo.backend.tenant.model.Customer) request.getAttribute("loggedCustomer");
        Long authCustomerId = loggedCustomer != null ? loggedCustomer.getId() : null;

        if (authCustomerId != null && Boolean.TRUE.equals(saveProfileData)) {
            try {
                customerService.updateAuthenticatedCustomerProfile(
                        authCustomerId, customerName, customerPhone, customerEmail,
                        city, address, documentType, customerDocument, verificationDigit,
                        legalName, taxRegime, requiresElectronicInvoice
                );
            } catch (Exception ignored) {
            }
        }

        try {
            Order order = orderService.createOrderFromCart(
                    cartSessionId, customerName, customerPhone, customerEmail,
                    documentType, finalDoc, verificationDigit, legalName, taxRegime, requiresElectronicInvoice,
                    address, city, deliveryMethod, notes, OrderChannel.ONLINE,
                    Boolean.TRUE.equals(onlyInStockItems),
                    couponCode,
                    authCustomerId
            );
            return "redirect:/s/" + slug + "/order/" + order.getPublicToken() + "/success";
        } catch (com.storevo.backend.tenant.exception.InsufficientStockException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("checkoutError", e.getMessage());
            return "redirect:/s/" + slug + "/cart/checkout" + (isDirect ? "?mode=direct" : "");
        } catch (Exception e) {
            log.error("Error inesperado procesando checkout ONLINE en tienda '{}': {}", slug, e.getMessage(), e);
            redirectAttributes.addFlashAttribute("checkoutError", "No pudimos procesar tu pedido en este momento. Por favor verifica tus datos e inténtalo nuevamente.");
            return "redirect:/s/" + slug + "/cart/checkout" + (isDirect ? "?mode=direct" : "");
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
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false, defaultValue = "SHIPPING") String deliveryMethod,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String couponCode,
            @RequestParam(required = false, defaultValue = "false") Boolean saveProfileData,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        boolean isDirectCheck = "direct".equalsIgnoreCase(mode);
        if (!rateLimitService.tryConsumeByIp(request, "checkout_submit_" + slug, 6, java.time.Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("checkoutError", com.storevo.backend.config.security.RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/cart/checkout" + (isDirectCheck ? "?mode=direct" : "");
        }

        String guestId = (String) request.getAttribute("guestId");
        boolean isDirect = "direct".equalsIgnoreCase(mode);
        String cartSessionId = isDirect ? (guestId + ":direct") : guestId;
        String finalDoc = formatDocumentWithDv(customerDocument, verificationDigit);
        com.storevo.backend.tenant.model.Customer loggedCustomer =
                (com.storevo.backend.tenant.model.Customer) request.getAttribute("loggedCustomer");
        Long authCustomerId = loggedCustomer != null ? loggedCustomer.getId() : null;

        if (authCustomerId != null && Boolean.TRUE.equals(saveProfileData)) {
            try {
                customerService.updateAuthenticatedCustomerProfile(
                        authCustomerId, customerName, customerPhone, customerEmail,
                        city, address, documentType, customerDocument, verificationDigit,
                        legalName, taxRegime, requiresElectronicInvoice
                );
            } catch (Exception ignored) {
            }
        }

        try {
            Order order = orderService.createOrderFromCart(
                    cartSessionId, customerName, customerPhone, customerEmail,
                    documentType, finalDoc, verificationDigit, legalName, taxRegime, requiresElectronicInvoice,
                    address, city, deliveryMethod, notes, OrderChannel.WHATSAPP,
                    false,
                    couponCode,
                    authCustomerId
            );
            return "redirect:/s/" + slug + "/order/" + order.getPublicToken() + "/whatsapp";
        } catch (com.storevo.backend.tenant.exception.InsufficientStockException | IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("checkoutError", e.getMessage());
            return "redirect:/s/" + slug + "/cart/checkout" + (isDirect ? "?mode=direct" : "");
        } catch (Exception e) {
            log.error("Error inesperado procesando checkout WHATSAPP en tienda '{}': {}", slug, e.getMessage(), e);
            redirectAttributes.addFlashAttribute("checkoutError", "No pudimos procesar tu pedido en este momento. Por favor verifica tus datos e inténtalo nuevamente.");
            return "redirect:/s/" + slug + "/cart/checkout" + (isDirect ? "?mode=direct" : "");
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
    public String showCheckout(
            @PathVariable String slug,
            @RequestParam(required = false) String mode,
            HttpServletRequest request,
            Model model,
            RedirectAttributes redirectAttributes) {
        String guestId = (String) request.getAttribute("guestId");
        boolean isDirect = "direct".equalsIgnoreCase(mode);
        String cartSessionId = isDirect ? (guestId + ":direct") : guestId;

        List<CartItemDto> cart = cartManager.getCart(cartSessionId);
        if (cart.isEmpty()) return "redirect:/s/" + slug + "/cart";

        for (CartItemDto item : cart) {
            if (!isCartItemValidAndPopulateMaxStock(item, null)) {
                if (isDirect) {
                    cartManager.clearCart(cartSessionId);
                }
                redirectAttributes.addFlashAttribute("cartError", "Tu bolsa contiene productos o variantes no disponibles. Por favor, revísala antes de continuar.");
                return "redirect:/s/" + slug + "/cart";
            }
        }

        boolean hasMadeToOrderItem = cart.stream().anyMatch(item -> Boolean.TRUE.equals(item.getIsMadeToOrder()));
        boolean hasInStockItem = cart.stream().anyMatch(item -> !Boolean.TRUE.equals(item.getIsMadeToOrder()));

        Store store = (Store) request.getAttribute("currentStore");
        TenantContext.clear();
        boolean wompiEnabled = integrationRepository.findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI).isPresent();
        TenantContext.setCurrentTenant(store.getSchemaName());

        boolean hasMixedCart = wompiEnabled && hasMadeToOrderItem && hasInStockItem;
        int inStockItemsCount = cart.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsMadeToOrder()))
                .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                .sum();
        Double inStockSubtotal = cart.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsMadeToOrder()))
                .filter(item -> item.getPrice() != null && item.getPrice() > 0 && item.getQuantity() != null && item.getQuantity() > 0)
                .mapToDouble(CartItemDto::getSubtotal)
                .sum();

        model.addAttribute("cartItems", cart);
        model.addAttribute("cartTotal", cartManager.getTotal(cartSessionId));
        model.addAttribute("hasMadeToOrderItem", hasMadeToOrderItem);
        model.addAttribute("hasMixedCart", hasMixedCart);
        model.addAttribute("inStockItemsCount", inStockItemsCount);
        model.addAttribute("inStockSubtotal", inStockSubtotal);
        model.addAttribute("wompiEnabled", wompiEnabled);
        model.addAttribute("isDirectBuy", isDirect);
        model.addAttribute("directProductId", isDirect && !cart.isEmpty() ? cart.get(0).getProductId() : null);
        model.addAttribute("pageTitle", "Finalizar Compra");

        return "storefront/checkout";
    }
}