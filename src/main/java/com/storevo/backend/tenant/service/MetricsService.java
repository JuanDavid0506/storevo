package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.DashboardMetricsDto;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public DashboardMetricsDto getMetrics() {
        // Definimos los estados que ya representan flujo de caja aprobado
        List<OrderStatus> validStatuses = Arrays.asList(
                OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED
        );

        Double totalRevenue = orderRepository.sumTotalByStatuses(validStatuses);
        Long totalOrders = orderRepository.count();
        Long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        Long activeProducts = productRepository.count(); // Cantidad de productos en catálogo

        // Procesar el ranking de productos más vendidos (Limitado a Top 5)
        List<Object[]> rawTopProducts = orderRepository.findTopSellingProducts();
        List<Map<String, Object>> topProductsList = new ArrayList<>();

        int limit = Math.min(rawTopProducts.size(), 5);
        for (int i = 0; i < limit; i++) {
            Object[] row = rawTopProducts.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("units", row[1]);
            topProductsList.add(item);
        }

        return DashboardMetricsDto.builder()
                .totalRevenue(totalRevenue)
                .totalOrdersCount(totalOrders)
                .pendingOrdersCount(pendingOrders)
                .activeProductsCount(activeProducts)
                .topSellingProducts(topProductsList)
                .build();
    }
}