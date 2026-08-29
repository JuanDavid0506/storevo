package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.CartItem;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductVariant;
import com.storevo.backend.tenant.repository.CartItemRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartManager {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional(readOnly = true)
    public List<CartItemDto> getCart(String sessionId) {
        if (sessionId == null) return List.of();

        List<CartItem> dbItems = cartItemRepository.findBySessionId(sessionId);
        return dbItems.stream().map(item -> {
            Product p = item.getProduct();
            ProductVariant v = item.getVariant();

            double finalPrice = p.getPrice();
            if (p.getDiscountPrice() != null && p.getDiscountPrice() > 0) {
                finalPrice = p.getDiscountPrice();
            }
            if (v != null && v.getPrice() != null) {
                finalPrice = v.getPrice();
            }

            String imageUrl = null;
            if (p.getImages() != null && !p.getImages().isEmpty()) {
                imageUrl = p.getImages().get(0).getSecureUrl();
            }

            return CartItemDto.builder()
                    .productId(p.getId())
                    .variantId(v != null ? v.getId() : null)
                    .name(p.getName())
                    .price(finalPrice)
                    .quantity(item.getQuantity())
                    .imageUrl(imageUrl)
                    .isMadeToOrder(p.getIsMadeToOrder())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getItemQuantity(String sessionId, Long productId, Long variantId) {
        if (sessionId == null) return 0;
        return cartItemRepository.findBySessionIdAndProductIdAndVariantId(sessionId, productId, variantId)
                .map(CartItem::getQuantity)
                .orElse(0);
    }

    @Transactional
    public void addItem(String sessionId, CartItemDto newItem) {
        if (sessionId == null) return;

        Optional<CartItem> existingOpt = cartItemRepository.findBySessionIdAndProductIdAndVariantId(
                sessionId, newItem.getProductId(), newItem.getVariantId());

        if (existingOpt.isPresent()) {
            CartItem existing = existingOpt.get();
            existing.setQuantity(existing.getQuantity() + newItem.getQuantity());
            cartItemRepository.save(existing);
        } else {
            Product product = productRepository.findById(newItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            ProductVariant variant = null;
            if (newItem.getVariantId() != null) {
                variant = variantRepository.findById(newItem.getVariantId()).orElse(null);
            }

            CartItem newItemEntity = CartItem.builder()
                    .sessionId(sessionId)
                    .product(product)
                    .variant(variant)
                    .quantity(newItem.getQuantity())
                    .build();
            cartItemRepository.save(newItemEntity);
        }
    }

    @Transactional
    public void removeItem(String sessionId, Long productId, Long variantId) {
        if (sessionId == null) return;
        cartItemRepository.deleteBySessionIdAndProductIdAndVariantId(sessionId, productId, variantId);
    }

    @Transactional(readOnly = true)
    public Double getTotal(String sessionId) {
        return getCart(sessionId).stream()
                .mapToDouble(CartItemDto::getSubtotal)
                .sum();
    }

    @Transactional(readOnly = true)
    public int getCartCount(String sessionId) {
        return getCart(sessionId).stream()
                .mapToInt(CartItemDto::getQuantity)
                .sum();
    }

    @Transactional
    public void clearCart(String sessionId) {
        if (sessionId == null) return;
        cartItemRepository.deleteBySessionId(sessionId);
    }
}