package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsDto {
    private Double totalRevenue;
    private Long totalOrdersCount;
    private Long pendingOrdersCount;
    private Long activeProductsCount;
    private List< Map<String, Object> > topSellingProducts;

    // Alertas de Stock Bajo / Agotados (stock <= 5)
    @Builder.Default
    private Long lowStockProductsCount = 0L;

    @Builder.Default
    private List< Map<String, Object> > lowStockProducts = new ArrayList<>();

    // Checklist de Puesta en Marcha (Onboarding)
    @Builder.Default
    private Integer onboardingProgressPercent = 0;

    @Builder.Default
    private Boolean onboardingCompleted = false;

    @Builder.Default
    private List< Map<String, Object> > onboardingSteps = new ArrayList<>();
}