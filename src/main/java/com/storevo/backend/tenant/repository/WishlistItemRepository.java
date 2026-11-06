package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findBySessionId(String sessionId);
    Optional<WishlistItem> findBySessionIdAndProductId(String sessionId, Long productId);
    void deleteBySessionIdAndProductId(String sessionId, Long productId);
    void deleteBySessionId(String sessionId);

    // Lectura con bloqueo (SELECT ... FOR UPDATE) para fusionar favoritos de invitado sin carreras
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT w FROM WishlistItem w WHERE w.sessionId = :sessionId ORDER BY w.id ASC")
    List<WishlistItem> findBySessionIdForUpdate(@org.springframework.data.repository.query.Param("sessionId") String sessionId);
}