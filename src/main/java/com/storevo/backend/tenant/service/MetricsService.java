package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.DashboardMetricsDto;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    private static final List<OrderStatus> VALID_SALES_STATUSES = List.of(
            OrderStatus.PAID,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.PACKED,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED
    );

    @Transactional(readOnly = true)
    public DashboardMetricsDto getMetrics() {
        Double totalRevenue = orderRepository.sumTotalByStatuses(VALID_SALES_STATUSES);
        Long totalOrders = orderRepository.count();
        Long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);

        ProductRepository.ProductCountsProjection productCounts = productRepository.countProductsByStatus();
        Long activeProducts = (productCounts != null && productCounts.getActivos() != null)
                ? productCounts.getActivos()
                : 0L;

        // Top 5 productos más vendidos filtrados por estados válidos y limitados con Pageable en BD
        List<Object[]> rawTopProducts = orderRepository.findTopSellingProducts(
                VALID_SALES_STATUSES, PageRequest.of(0, 5));
        List< Map<String, Object> > topProductsList = new ArrayList<>();

        for (Object[] row : rawTopProducts) {
            if (row == null) continue;
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("units", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            topProductsList.add(item);
        }

        return DashboardMetricsDto.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : 0.0)
                .totalOrdersCount(totalOrders)
                .pendingOrdersCount(pendingOrders)
                .activeProductsCount(activeProducts)
                .topSellingProducts(topProductsList)
                .build();
    }
}