package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.WishlistItem;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistManager {

    private final WishlistItemRepository wishlistRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Set<Long> getWishlist(String sessionId) {
        if (sessionId == null) return new HashSet<>();
        List<WishlistItem> items = wishlistRepository.findBySessionId(sessionId);
        return items.stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toSet());
    }

    @Transactional
    public boolean toggleItem(String sessionId, Long productId) {
        if (sessionId == null) return false;

        var existing = wishlistRepository.findBySessionIdAndProductId(sessionId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return false;
        } else {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            WishlistItem newItem = WishlistItem.builder()
                    .sessionId(sessionId)
                    .product(product)
                    .build();
            wishlistRepository.save(newItem);
            return true;
        }
    }

    @Transactional(readOnly = true)
    public int getWishlistCount(String sessionId) {
        if (sessionId == null) return 0;
        return wishlistRepository.findBySessionId(sessionId).size();
    }
}