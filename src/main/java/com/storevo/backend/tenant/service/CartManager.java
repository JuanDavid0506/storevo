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

    // NUEVO MÉTODO: Saber cuántas unidades de un producto ya están en la bolsa
    public int getItemQuantity(String slug, Long productId) {
        return getCart(slug).stream()
                .filter(item -> item.getProductId().equals(productId))
                .mapToInt(CartItemDto::getQuantity)
                .findFirst()
                .orElse(0);
    }

    public void addItem(String slug, CartItemDto newItem) {
        List<CartItemDto> cart = getCart(slug);

        Optional<CartItemDto> existingItem = cart.stream()
                .filter(item -> item.getProductId().equals(newItem.getProductId()))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + newItem.getQuantity());
        } else {
            cart.add(newItem);
        }
    }

    public void removeItem(String slug, Long productId) {
        getCart(slug).removeIf(item -> item.getProductId().equals(productId));
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