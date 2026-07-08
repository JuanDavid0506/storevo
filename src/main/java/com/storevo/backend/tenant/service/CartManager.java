package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CartItemDto;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.SessionScope;

import java.util.*;

@Component
@SessionScope
public class CartManager {

    private final Map<String, List<CartItemDto>> storeCarts = new HashMap<>();

    public List<CartItemDto> getCart(String slug) {
        return storeCarts.computeIfAbsent(slug, k -> new ArrayList<>());
    }

    // ACTUALIZADO: Filtra por Producto Y Variante
    public int getItemQuantity(String slug, Long productId, Long variantId) {
        return getCart(slug).stream()
                .filter(item -> item.getProductId().equals(productId) && Objects.equals(item.getVariantId(), variantId))
                .mapToInt(CartItemDto::getQuantity)
                .findFirst()
                .orElse(0);
    }

    public void addItem(String slug, CartItemDto newItem) {
        List<CartItemDto> cart = getCart(slug);

        Optional<CartItemDto> existingItem = cart.stream()
                .filter(item -> item.getProductId().equals(newItem.getProductId()) && Objects.equals(item.getVariantId(), newItem.getVariantId()))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + newItem.getQuantity());
        } else {
            cart.add(newItem);
        }
    }

    // ACTUALIZADO: Elimina la línea exacta de la variante
    public void removeItem(String slug, Long productId, Long variantId) {
        getCart(slug).removeIf(item -> item.getProductId().equals(productId) && Objects.equals(item.getVariantId(), variantId));
    }

    public Double getTotal(String slug) {
        return getCart(slug).stream()
                .mapToDouble(CartItemDto::getSubtotal)
                .sum();
    }

    public int getCartCount(String slug) {
        return getCart(slug).stream()
                .mapToInt(CartItemDto::getQuantity)
                .sum();
    }

    public void clearCart(String slug) {
        storeCarts.remove(slug);
    }
}