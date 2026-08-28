package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findBySessionId(String sessionId);
    Optional<CartItem> findBySessionIdAndProductIdAndVariantId(String sessionId, Long productId, Long variantId);
    void deleteBySessionId(String sessionId);
    void deleteBySessionIdAndProductIdAndVariantId(String sessionId, Long productId, Long variantId);
}