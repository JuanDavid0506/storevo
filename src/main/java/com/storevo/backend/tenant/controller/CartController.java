package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.service.CartManager;
import com.storevo.backend.tenant.service.OrderService;
import com.storevo.backend.tenant.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/s/{slug}/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartManager cartManager;
    private final ProductService productService;
    private final StoreSettingsService storeSettingsService;
    private final OrderService orderService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) throw new RuntimeException("Tienda no encontrada");

        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);

        TenantContext.setCurrentTenant(store.getSchemaName());
        model.addAttribute("cartCount", cartManager.getCartCount(slug));
    }

    @GetMapping
    public String viewCart(@PathVariable String slug, Model model) {
        java.util.List<CartItemDto> cart = cartManager.getCart(slug);

        java.util.List<Long> deletedProductIds = new java.util.ArrayList<>();
        for (CartItemDto item : cart) {
            try {
                Product p = productService.getProductById(item.getProductId());
                if (p.getIsDeleted() || !p.getIsActive()) {
                    deletedProductIds.add(p.getId());
                }
            } catch (Exception e) {
                deletedProductIds.add(item.getProductId());
            }
        }

        model.addAttribute("cartItems", cart);
        model.addAttribute("deletedProductIds", deletedProductIds);
        model.addAttribute("cartTotal", cartManager.getTotal(slug));
        model.addAttribute("pageTitle", "Mi Bolsa");
        return "storefront/cart";
    }

    @PostMapping("/add-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addToCartAjax(
            @PathVariable String slug,
            @RequestParam Long productId,
            @RequestParam(defaultValue = "1") Integer quantity) {

        Map<String, Object> response = new HashMap<>();
        Product product = productService.getProductById(productId);
        if (product.getIsDeleted()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Este producto ha sido retirado del catálogo."));
        }

        int currentQtyInCart = cartManager.getItemQuantity(slug, productId);
        int availableStock = product.getStock();
        int remainingStock = availableStock - currentQtyInCart;

        if (remainingStock <= 0) {
            response.put("success", false);
            response.put("message", "Límite alcanzado. Solo disponemos de " + availableStock + " unidad(es).");
            response.put("cartCount", cartManager.getCartCount(slug));
            return ResponseEntity.ok(response);
        }

        int qtyToAdd = Math.min(quantity, remainingStock);

        CartItemDto item = CartItemDto.builder()
                .productId(product.getId())
                .name(product.getName())
                .price(product.getDiscountPrice() != null && product.getDiscountPrice() > 0 ? product.getDiscountPrice() : product.getPrice())
                .quantity(qtyToAdd)
                .imageUrl(product.getMainImageUrl()) // MÉTOD SEGURO NUEVO
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
    public ResponseEntity<Map<String, Object>> removeFromCartAjax(@PathVariable String slug, @RequestParam Long productId) {
        cartManager.removeItem(slug, productId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Producto retirado de la bolsa.");
        response.put("cartCount", cartManager.getCartCount(slug));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/remove")
    public String removeFromCart(@PathVariable String slug, @RequestParam Long productId, RedirectAttributes redirectAttributes) {
        cartManager.removeItem(slug, productId);
        redirectAttributes.addFlashAttribute("cartSuccess", "Producto eliminado de la bolsa");
        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/checkout/process")
    public String processCheckout(
            @PathVariable String slug, @RequestParam String customerName, @RequestParam String customerPhone,
            @RequestParam String address, @RequestParam String city, @RequestParam(required = false) String notes) {
        try {
            Order order = orderService.createOrderFromCart(slug, customerName, customerPhone, address, city, notes);
            return "redirect:/s/" + slug + "/order/" + order.getId() + "/success";
        } catch (Exception e) {
            return "redirect:/s/" + slug + "/cart/checkout?error=true";
        }
    }

    @GetMapping("/checkout")
    public String showCheckout(@PathVariable String slug, Model model) {
        if (cartManager.getCart(slug).isEmpty()) return "redirect:/s/" + slug + "/cart";
        model.addAttribute("cartItems", cartManager.getCart(slug));
        model.addAttribute("cartTotal", cartManager.getTotal(slug));
        model.addAttribute("pageTitle", "Finalizar Compra");
        return "storefront/checkout";
    }
}