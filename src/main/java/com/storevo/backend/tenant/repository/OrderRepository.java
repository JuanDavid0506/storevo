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

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDesc();

    // Listado paginado del dashboard: búsqueda + estado + canal, todo resuelto en base de datos.
    // :orderId es el número de pedido exacto (null si el texto buscado no es numérico).
    // El orden lo aporta el Pageable (el servicio lo construye con una lista blanca).
    @Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:channel IS NULL OR o.channel = :channel) AND " +
            "(:q IS NULL " +
            "  OR o.id = :orderId " +
            "  OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "  OR o.customerPhone LIKE CONCAT('%', :q, '%'))")
    Page<Order> searchOrders(
            @Param("q") String q,
            @Param("orderId") Long orderId,
            @Param("status") OrderStatus status,
            @Param("channel") OrderChannel channel,
            Pageable pageable);

    // 1. Sumar los ingresos totales solo de los pedidos que sí representan dinero real (PAGADO, EN PREPARACION, ENVIADO, DELIVERED)
    @Query("SELECT COALESCE(SUM(o.total), 0.0) FROM Order o WHERE o.status IN (:statuses)")
    Double sumTotalByStatuses(@Param("statuses") List<OrderStatus> statuses);

    // 2. Contar pedidos por un estado específico
    Long countByStatus(OrderStatus status);

    // 3. Ranking de productos más vendidos agregando las cantidades de order_items
    @Query("SELECT oi.productName, SUM(oi.quantity) as totalQty FROM OrderItem oi GROUP BY oi.productId, oi.productName ORDER BY totalQty DESC")
    List<Object[]> findTopSellingProducts();


    // (Agrega esto debajo de tus otros métodos en OrderRepository)

    @Query("SELECT o.customerName, o.customerPhone, o.city, COUNT(o.id), SUM(o.total), MAX(o.createdAt) " +
            "FROM Order o " +
            "GROUP BY o.customerPhone, o.customerName, o.city " +
            "ORDER BY MAX(o.createdAt) DESC")
    List<Object[]> findCustomerAggregates();
}