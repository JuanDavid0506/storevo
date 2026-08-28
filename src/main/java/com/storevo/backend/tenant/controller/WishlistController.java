package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.model.Product;
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
    private final com.storevo.backend.tenant.service.ProductService productService;

    @GetMapping
    public String viewWishlist(
            @PathVariable String slug,
            HttpServletRequest request,
            Model model) {

        String guestId = (String) request.getAttribute("guestId");

        Set<Long> productIds = wishlistManager.getWishlist(guestId);

        List<Product> products = new ArrayList<>();
        List<Long> deletedProductIds = new ArrayList<>();

        for (Long id : productIds) {
            try {
                Product p = productService.getProductById(id);
                products.add(p);

                if (Boolean.TRUE.equals(p.getIsDeleted())
                        || !Boolean.TRUE.equals(p.getIsActive())) {
                    deletedProductIds.add(id);
                }

            } catch (Exception ignored) {
                deletedProductIds.add(id);
            }
        }

        model.addAttribute("products", products);
        model.addAttribute("deletedProductIds", deletedProductIds);
        model.addAttribute("pageTitle", "Mis Favoritos");

        return "storefront/wishlist";
    }

    @PostMapping("/toggle-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleWishlistAjax(
            @PathVariable String slug,
            @RequestParam Long productId,
            HttpServletRequest request) {

        String guestId = (String) request.getAttribute("guestId");

        Product product = productService.getProductById(productId);

        if (Boolean.TRUE.equals(product.getIsDeleted())) {
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Este producto ha sido retirado del catálogo."
            ));
        }

        boolean isAdded = wishlistManager.toggleItem(
                guestId,
                productId
        );

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("added", isAdded);
        response.put(
                "wishlistCount",
                wishlistManager.getWishlistCount(guestId)
        );
        response.put(
                "message",
                isAdded
                        ? "Agregado a tu lista de deseos ❤️"
                        : "Eliminado de tus favoritos"
        );

        return ResponseEntity.ok(response);
    }
}