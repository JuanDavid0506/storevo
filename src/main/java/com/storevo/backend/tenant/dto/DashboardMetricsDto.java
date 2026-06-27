package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardMetricsDto {
    private Double totalRevenue;
    private Long totalOrdersCount;
    private Long pendingOrdersCount;
    private Long activeProductsCount;
    private List<Map<String, Object>> topSellingProducts;
}