package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.EventOrigin;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.CartItemRepository;
import com.storevo.backend.tenant.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantCleanupScheduler {

    private static final Pattern VALID_SCHEMA_PATTERN = Pattern.compile("^[a-z0-9_]+$");

    private final StoreRepository storeRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final PlatformTransactionManager transactionManager;

    /**
     * Se ejecuta cada hora para limpiar en cada tienda activa:
     * 1. Carritos de compra directa (:direct) con más de 24 horas.
     * 2. Carritos normales abandonados con más de 7 días.
     * 3. Pedidos ONLINE en estado PENDING con más de 48 horas sin pago.
     */
    @Scheduled(fixedDelay = 3600000L, initialDelay = 60000L)
    public void cleanupAbandonedCartsAndExpiredOrders() {
        List<Store> stores;
        TenantContext.clear();
        try {
            stores = storeRepository.findAll();
        } catch (Exception e) {
            log.warn("TenantCleanupScheduler: no se pudo obtener la lista de tiendas: {}", e.getMessage());
            return;
        } finally {
            TenantContext.clear();
        }

        if (stores == null || stores.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime directCartCutoff = now.minusHours(24);
        LocalDateTime regularCartCutoff = now.minusDays(7);
        LocalDateTime pendingOrderCutoff = now.minusHours(48);

        for (Store store : stores) {
            if (store == null || "SUSPENDED".equalsIgnoreCase(store.getStatus())) {
                continue;
            }
            String schema = store.getSchemaName();
            if (schema == null || schema.isBlank() || !VALID_SCHEMA_PATTERN.matcher(schema).matches()) {
                continue;
            }

            TenantContext.setCurrentTenant(schema);
            try {
                TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
                txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

                int[] cartCounts = new int[2];
                List<Long> expiredOrderIds = txTemplate.execute(status -> {
                    cartCounts[0] = cartItemRepository.deleteExpiredDirectCartItems(directCartCutoff);
                    cartCounts[1] = cartItemRepository.deleteExpiredRegularCartItems(regularCartCutoff);

                    return orderRepository.findExpiredOrders(
                                    OrderStatus.PENDING,
                                    OrderChannel.ONLINE,
                                    pendingOrderCutoff
                            ).stream()
                            .map(Order::getId)
                            .toList();
                });

                int cancelledCount = 0;
                if (expiredOrderIds != null) {
                    for (Long expiredOrderId : expiredOrderIds) {
                        if (expiredOrderId == null) continue;
                        try {
                            TransactionTemplate orderTxTemplate = new TransactionTemplate(transactionManager);
                            orderTxTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                            orderTxTemplate.executeWithoutResult(orderStatus ->
                                    orderService.updateOrderStatus(
                                            expiredOrderId,
                                            OrderStatus.CANCELLED,
                                            EventOrigin.SYSTEM,
                                            null,
                                            "Pedido cancelado automáticamente por expiración del tiempo de pago"
                                    )
                            );
                            cancelledCount++;
                        } catch (Exception ex) {
                            log.warn("TenantCleanupScheduler [{}]: no se pudo cancelar pedido vencido #{}: {}",
                                    schema, expiredOrderId, ex.getMessage());
                        }
                    }
                }

                if (cartCounts[0] > 0 || cartCounts[1] > 0 || cancelledCount > 0) {
                    log.info("TenantCleanupScheduler [{}]: eliminados {} ítem(s) :direct, {} ítem(s) de bolsa y cancelados {} pedido(s) PENDING vencidos.",
                            schema, cartCounts[0], cartCounts[1], cancelledCount);
                }
            } catch (Exception e) {
                log.warn("TenantCleanupScheduler: error ejecutando limpieza en esquema '{}': {}", schema, e.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }
}