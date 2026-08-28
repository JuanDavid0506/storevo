package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findBySessionId(String sessionId);
    Optional<WishlistItem> findBySessionIdAndProductId(String sessionId, Long productId);
    void deleteBySessionIdAndProductId(String sessionId, Long productId);
}