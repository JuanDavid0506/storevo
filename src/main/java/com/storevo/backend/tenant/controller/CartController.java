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
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/s/{slug}/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartManager cartManager;
    private final ProductService productService;
    private final StoreSettingsService storeSettingsService;
    private final OrderService orderService;

    // Configuración global para estas rutas usando el Patrón Store-in-Request
    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        // 1. MIENTRAS estamos en storevo_admin leemos los settings
        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);

        // 2. Bajamos el switch a la base de datos del cliente
        TenantContext.setCurrentTenant(store.getSchemaName());

        // 3. AHORA que estamos en el cliente, contamos los items del carrito
        model.addAttribute("cartCount", cartManager.getCartCount(slug));
    }

    @GetMapping
    public String viewCart(@PathVariable String slug, Model model) {
        model.addAttribute("cartItems", cartManager.getCart(slug));
        model.addAttribute("cartTotal", cartManager.getTotal(slug));
        model.addAttribute("pageTitle", "Mi Bolsa");
        return "storefront/cart";
    }

    @PostMapping("/add")
    public String addToCart(@PathVariable String slug, @RequestParam Long productId, @RequestParam(defaultValue = "1") Integer quantity) {
        Product product = productService.getProductById(productId);

        CartItemDto item = CartItemDto.builder()
                .productId(product.getId())
                .name(product.getName())
                .price(product.getDiscountPrice() != null && product.getDiscountPrice() > 0 ? product.getDiscountPrice() : product.getPrice())
                .quantity(quantity)
                .imageUrl(product.getImages() != null && !product.getImages().isEmpty() ? product.getImages().get(0) : null)
                .build();

        cartManager.addItem(slug, item);
        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/remove")
    public String removeFromCart(@PathVariable String slug, @RequestParam Long productId) {
        cartManager.removeItem(slug, productId);
        return "redirect:/s/" + slug + "/cart";
    }

    @PostMapping("/checkout/process")
    public String processCheckout(
            @PathVariable String slug,
            @RequestParam String customerName,
            @RequestParam String customerPhone,
            @RequestParam String address,
            @RequestParam String city,
            @RequestParam(required = false) String notes) {

        try {
            Order order = orderService.createOrderFromCart(slug, customerName, customerPhone, address, city, notes);
            return "redirect:/s/" + slug + "/order/" + order.getId() + "/success";
        } catch (Exception e) {
            return "redirect:/s/" + slug + "/cart/checkout?error=true";
        }
    }

    @GetMapping("/checkout")
    public String showCheckout(@PathVariable String slug, Model model) {
        if (cartManager.getCart(slug).isEmpty()) {
            return "redirect:/s/" + slug + "/cart";
        }
        model.addAttribute("cartItems", cartManager.getCart(slug));
        model.addAttribute("cartTotal", cartManager.getTotal(slug));
        model.addAttribute("pageTitle", "Finalizar Compra");
        return "storefront/checkout";
    }
}