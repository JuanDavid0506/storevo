package com.storevo.backend.tenant.repository;

import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdAndPublicToken(Long id, String publicToken);

    List<Order> findAllByOrderByCreatedAtDesc();

    // Listado paginado del dashboard: búsqueda + estado + canal + rango de fechas en base de datos.
    @Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:channel IS NULL OR o.channel = :channel) AND " +
            "(:fromDate IS NULL OR o.createdAt >= :fromDate) AND " +
            "(:toDate IS NULL OR o.createdAt <= :toDate) AND " +
            "(:q IS NULL " +
            "  OR o.id = :orderId " +
            "  OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR o.customerPhone LIKE CONCAT('%', :q, '%'))")
    Page<Order> searchOrders(
            @Param("q") String q,
            @Param("orderId") Long orderId,
            @Param("status") OrderStatus status,
            @Param("channel") OrderChannel channel,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    // Sobrecarga de retrocompatibilidad
    default Page<Order> searchOrders(
            String q,
            Long orderId,
            OrderStatus status,
            OrderChannel channel,
            Pageable pageable) {
        return searchOrders(q, orderId, status, channel, null, null, pageable);
    }

    // 1. Sumar los ingresos totales solo de los pedidos que sí representan dinero real (PAGADO, EN PREPARACION, ENVIADO, DELIVERED)
    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.status IN (:statuses)")
    Double sumTotalByStatuses(@Param("statuses") List<OrderStatus> statuses);

    // 2. Contar pedidos por un estado específico
    Long countByStatus(OrderStatus status);

    // 3. Ranking de productos más vendidos excluyendo pedidos cancelados o reembolsados
    @Query("SELECT oi.productName, SUM(oi.quantity) as totalQty FROM OrderItem oi JOIN oi.order o WHERE o.status NOT IN (com.storevo.backend.tenant.model.OrderStatus.CANCELLED, com.storevo.backend.tenant.model.OrderStatus.REFUNDED) GROUP BY oi.productId, oi.productName ORDER BY totalQty DESC")
    List<Object[]> findTopSellingProducts();

    // 4. Estadísticas en bloque por producto (unidades vendidas y fecha de última venta válida)
    @Query("SELECT oi.productId, COALESCE(SUM(oi.quantity), 0), MAX(o.createdAt) " +
            "FROM OrderItem oi JOIN oi.order o " +
            "WHERE oi.productId IN :productIds AND o.status IN :validStatuses " +
            "GROUP BY oi.productId")
    List<Object[]> findProductSalesStatistics(
            @Param("productIds") List<Long> productIds,
            @Param("validStatuses") List<OrderStatus> validStatuses);

    @Query("SELECT o.customerName, o.customerPhone, o.city, COUNT(o.id), SUM(o.total), MAX(o.createdAt) " +
            "FROM Order o " +
            "GROUP BY o.customerPhone, o.customerName, o.city " +
            "ORDER BY MAX(o.createdAt) DESC")
    List<Object[]> findCustomerAggregates();
}