package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.service.CartManager;
import com.storevo.backend.tenant.service.ProductService;
import com.storevo.backend.tenant.service.WishlistManager;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Controller
@RequestMapping("/s/{slug}/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistManager wishlistManager;
    private final CartManager cartManager;
    private final ProductService productService;
    private final StoreSettingsService storeSettingsService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) throw new RuntimeException("Tienda no encontrada");

        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);

        TenantContext.setCurrentTenant(store.getSchemaName());
        model.addAttribute("cartCount", cartManager.getCartCount(slug));
        // Inyectamos estado de Favoritos globalmente
        model.addAttribute("wishlistCount", wishlistManager.getWishlistCount(slug));
        model.addAttribute("wishlistProductIds", wishlistManager.getWishlist(slug));
    }

    @GetMapping
    public String viewWishlist(@PathVariable String slug, Model model) {
        Set<Long> productIds = wishlistManager.getWishlist(slug);
        List<Product> products = new ArrayList<>();
        List<Long> deletedProductIds = new ArrayList<>();

        for (Long id : productIds) {
            try {
                Product p = productService.getProductById(id);
                products.add(p); // Lo agregamos a la lista para mostrar su tarjeta

                // Si está eliminado (Soft Delete) o inactivo, lo marcamos
                if (p.getIsDeleted() || !p.getIsActive()) {
                    deletedProductIds.add(id);
                }
            } catch (Exception ignored) {
                // Si fue borrado físicamente antes de implementar el soft delete
                deletedProductIds.add(id);
            }
        }

        model.addAttribute("products", products);
        model.addAttribute("deletedProductIds", deletedProductIds); // Enviamos lista de inválidos
        model.addAttribute("pageTitle", "Mis Favoritos");
        return "storefront/wishlist";
    }

    @PostMapping("/toggle-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleWishlistAjax(@PathVariable String slug, @RequestParam Long productId) {

        // --- AGREGAR SEGURIDAD: Evitar agregar productos eliminados ---
        Product product = productService.getProductById(productId);
        if (product.getIsDeleted()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Este producto ha sido retirado del catálogo."));
        }
        // --------------------------------------------------------------

        boolean isAdded = wishlistManager.toggleItem(slug, productId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("added", isAdded);
        response.put("wishlistCount", wishlistManager.getWishlistCount(slug));
        response.put("message", isAdded ? "Agregado a tu lista de deseos ❤️" : "Eliminado de tus favoritos");

        return ResponseEntity.ok(response);
    }
}