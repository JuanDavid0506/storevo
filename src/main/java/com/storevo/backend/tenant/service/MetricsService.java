package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.repository.StoreSettingsRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.DashboardMetricsDto;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final StoreSettingsRepository storeSettingsRepository;
    private final StoreIntegrationRepository storeIntegrationRepository;
    private final PlatformTransactionManager transactionManager;

    private static final List<OrderStatus> VALID_SALES_STATUSES = List.of(
            OrderStatus.PAID,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.PACKED,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED
    );

    private record AdminOnboardingContext(
            String slug,
            boolean brandCustomized,
            boolean salesChannelConfigured
    ) {}

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

        // Alertas de Stock Bajo / Agotados (stock <= 5, limitado a los 6 más urgentes)
        long lowStockTotalCount = productRepository.countLowStockActiveProducts(LOW_STOCK_THRESHOLD);
        List<Product> lowStockEntities = productRepository.findLowStockActiveProducts(
                LOW_STOCK_THRESHOLD, PageRequest.of(0, 6));
        List< Map<String, Object> > lowStockList = new ArrayList<>();
        for (Product p : lowStockEntities) {
            if (p == null) continue;
            int currentStock = p.getStock() != null ? p.getStock() : 0;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("name", p.getName());
            item.put("sku", p.getSku());
            item.put("stock", currentStock);
            item.put("outOfStock", currentStock <= 0);
            item.put("imageUrl", p.getMainImageThumbnailUrl() != null ? p.getMainImageThumbnailUrl() : p.getMainImageUrl());
            lowStockList.add(item);
        }

        // Checklist de Puesta en Marcha (4 pasos)
        AdminOnboardingContext adminCtx = loadAdminOnboardingContext();
        String slug = adminCtx.slug();

        boolean step1Done = adminCtx.brandCustomized();
        boolean step2Done = activeProducts != null && activeProducts > 0;
        boolean step3Done = adminCtx.salesChannelConfigured();
        boolean step4Done = totalOrders != null && totalOrders > 0;

        List< Map<String, Object> > steps = new ArrayList<>();
        steps.add(buildOnboardingStep(
                1,
                "Personaliza el diseño e identidad de tu tienda",
                "Configura colores, fuentes y secciones visuales en el editor de plantilla.",
                step1Done,
                "/dashboard/" + slug + "/template",
                "Ir al Editor Visual"
        ));
        steps.add(buildOnboardingStep(
                2,
                "Agrega tu primer producto activo al catálogo",
                "Sube fotos, precios y existencias para que tus clientes puedan comprar.",
                step2Done,
                "/dashboard/" + slug + "/products/new",
                "Crear Producto"
        ));
        steps.add(buildOnboardingStep(
                3,
                "Configura tu canal de ventas (WhatsApp o Wompi)",
                "Activa tu número de WhatsApp o conecta la pasarela de pagos Wompi.",
                step3Done,
                "/dashboard/" + slug + "/settings",
                "Configurar Ventas"
        ));
        steps.add(buildOnboardingStep(
                4,
                "Comparte tu enlace y recibe tu primer pedido",
                "Comparte tu tienda en redes sociales o registra una venta asistida.",
                step4Done,
                "/s/" + slug,
                "Abrir mi Tienda"
        ));

        int completedSteps = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0) + (step4Done ? 1 : 0);
        int progressPercent = (completedSteps * 100) / 4;

        return DashboardMetricsDto.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : 0.0)
                .totalOrdersCount(totalOrders)
                .pendingOrdersCount(pendingOrders)
                .activeProductsCount(activeProducts)
                .topSellingProducts(topProductsList)
                .lowStockProductsCount(lowStockTotalCount)
                .lowStockProducts(lowStockList)
                .onboardingProgressPercent(progressPercent)
                .onboardingCompleted(completedSteps == 4)
                .onboardingSteps(steps)
                .build();
    }

    private Map<String, Object> buildOnboardingStep(
            int number,
            String title,
            String description,
            boolean completed,
            String actionUrl,
            String actionLabel) {

        Map<String, Object> step = new LinkedHashMap<>();
        step.put("number", number);
        step.put("title", title);
        step.put("description", description);
        step.put("completed", completed);
        step.put("actionUrl", actionUrl);
        step.put("actionLabel", actionLabel);
        return step;
    }

    private AdminOnboardingContext loadAdminOnboardingContext() {
        String currentSchema = TenantContext.getCurrentTenant();
        if (currentSchema == null || currentSchema.isBlank() || TenantContext.DEFAULT_TENANT.equalsIgnoreCase(currentSchema)) {
            return new AdminOnboardingContext("", false, false);
        }
        try {
            TenantContext.clear();
            TransactionTemplate tx = new TransactionTemplate(transactionManager);
            tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            tx.setReadOnly(true);
            AdminOnboardingContext result = tx.execute(status -> {
                Store store = storeRepository.findBySchemaName(currentSchema).orElse(null);
                if (store == null) {
                    return new AdminOnboardingContext("", false, false);
                }
                StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId()).orElse(null);
                boolean hasLogo = settings != null && settings.getLogoUrl() != null && !settings.getLogoUrl().isBlank();
                boolean hasPublishedTheme = settings != null && settings.getPublishedThemeJson() != null && !settings.getPublishedThemeJson().isBlank();
                boolean hasCustomColor = settings != null && settings.getPrimaryColor() != null
                        && !settings.getPrimaryColor().isBlank()
                        && !"#0F172A".equalsIgnoreCase(settings.getPrimaryColor().trim());
                boolean brandCustomized = hasLogo || hasPublishedTheme || hasCustomColor;

                boolean hasWhatsapp = settings != null && settings.getWhatsapp() != null && !settings.getWhatsapp().isBlank();
                boolean hasWompi = storeIntegrationRepository
                        .findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI)
                        .isPresent();
                boolean salesChannelConfigured = hasWhatsapp || hasWompi;

                return new AdminOnboardingContext(store.getSlug(), brandCustomized, salesChannelConfigured);
            });
            return result != null ? result : new AdminOnboardingContext("", false, false);
        } catch (Exception e) {
            return new AdminOnboardingContext("", false, false);
        } finally {
            TenantContext.setCurrentTenant(currentSchema);
        }
    }
}