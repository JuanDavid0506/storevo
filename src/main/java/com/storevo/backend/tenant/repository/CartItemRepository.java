package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findBySessionId(String sessionId);
    Optional<CartItem> findBySessionIdAndProductIdAndVariantId(String sessionId, Long productId, Long variantId);
    void deleteBySessionId(String sessionId);
    void deleteBySessionIdAndProductIdAndVariantId(String sessionId, Long productId, Long variantId);

    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.sessionId LIKE '%:direct' AND c.createdAt < :cutoff")
    int deleteExpiredDirectCartItems(@Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.sessionId NOT LIKE '%:direct' AND c.createdAt < :cutoff")
    int deleteExpiredRegularCartItems(@Param("cutoff") LocalDateTime cutoff);
}