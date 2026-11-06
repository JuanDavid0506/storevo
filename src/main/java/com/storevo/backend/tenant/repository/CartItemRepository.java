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
    // findFirst: tolera filas duplicadas (cart_items no tiene índice único) sin lanzar IncorrectResultSizeDataAccessException
    Optional<CartItem> findFirstBySessionIdAndProductIdAndVariantIdOrderByIdAsc(String sessionId, Long productId, Long variantId);
    void deleteBySessionId(String sessionId);

    // Lectura con bloqueo (SELECT ... FOR UPDATE): usada al fusionar la bolsa de invitado en la cuenta.
    // Un login concurrente espera a que el primero confirme y entonces ya no ve filas que fusionar.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CartItem c WHERE c.sessionId = :sessionId ORDER BY c.id ASC")
    List<CartItem> findBySessionIdForUpdate(@Param("sessionId") String sessionId);
    void deleteBySessionIdAndProductIdAndVariantId(String sessionId, Long productId, Long variantId);

    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.sessionId LIKE '%:direct' AND c.createdAt < :cutoff")
    int deleteExpiredDirectCartItems(@Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.sessionId NOT LIKE '%:direct' AND c.sessionId NOT LIKE 'cust:%' AND c.createdAt < :cutoff")
    int deleteExpiredRegularCartItems(@Param("cutoff") LocalDateTime cutoff);
}