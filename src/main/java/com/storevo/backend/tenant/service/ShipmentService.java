package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ShipmentLabelResponse;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.CarrierRepository;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.service.logistics.CarrierAdapter;
import com.storevo.backend.tenant.service.logistics.CarrierFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final OrderRepository orderRepository;
    private final CarrierRepository carrierRepository;
    private final OrderService orderService;
    private final CarrierFactory carrierFactory;
    private final StoreRepository storeRepository;
    private final StoreSettingsService storeSettingsService;
    private final PlatformTransactionManager transactionManager;
    private final EmailNotificationService emailNotificationService;

    @Transactional
    public Shipment createManualShipment(Long orderId, Long carrierId, String trackingNumber, Double weight, String dimensions, Long adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        Carrier carrier = carrierRepository.findById(carrierId)
                .orElseThrow(() -> new RuntimeException("Transportadora no encontrada"));

        Shipment shipment = Shipment.builder()
                .order(order)
                .carrier(carrier)
                .trackingNumber(trackingNumber)
                .weight(weight)
                .dimensions(dimensions)
                .packageNumber(order.getShipments().size() + 1)
                .status(ShipmentStatus.CREATED)
                .build();

        order.getShipments().add(shipment);
        orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, EventOrigin.SYSTEM, adminUserId);

        notifyShipmentCreatedSafely(null, order, shipment);
        return shipment;
    }

    @Transactional
    public Shipment createIntegratedShipment(Store store, Long orderId, Long carrierId, String integrationCode, Double weight, String dimensions, Long adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        Carrier carrier = carrierRepository.findById(carrierId)
                .orElseThrow(() -> new RuntimeException("Transportadora no encontrada"));

        // 1. Fábrica
        CarrierAdapter adapter = carrierFactory.getAdapter(integrationCode);

        // 2. Ejecutar con parámetros completos
        ShipmentLabelResponse apiResponse = adapter.createLabel(store, order, carrier.getCode(), weight, dimensions);

        // 3. Persistir el envío incluyendo labelPdfUrl devuelto por el adaptador (Objetivo A5)
        Shipment shipment = Shipment.builder()
                .order(order)
                .carrier(carrier)
                .trackingNumber(apiResponse.getTrackingNumber())
                .externalShipmentId(apiResponse.getExternalShipmentId())
                .labelPdfUrl(apiResponse.getLabelPdfUrl())
                .weight(weight)
                .dimensions(dimensions)
                .packageNumber(order.getShipments().size() + 1)
                .status(ShipmentStatus.CREATED)
                .build();

        order.getShipments().add(shipment);

        // 4. Cambiar estado de la orden
        orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, EventOrigin.SYSTEM, adminUserId);

        notifyShipmentCreatedSafely(store, order, shipment);
        return shipment;
    }

    private void notifyShipmentCreatedSafely(Store providedStore, Order order, Shipment shipment) {
        try {
            if (shipment.getCarrier() != null) {
                shipment.getCarrier().getName();
                shipment.getCarrier().getTrackingUrlTemplate();
            }
            String currentSchema = TenantContext.getCurrentTenant();
            Store resolvedStore = providedStore;
            StoreSettingsDto settings = null;

            if (currentSchema != null && !currentSchema.isBlank()) {
                try {
                    TenantContext.clear();
                    TransactionTemplate tx = new TransactionTemplate(transactionManager);
                    tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                    tx.setReadOnly(true);
                    final Store storeRef = resolvedStore;
                    Store[] holder = new Store[]{storeRef};
                    settings = tx.execute(status -> {
                        if (holder[0] == null) {
                            holder[0] = storeRepository.findBySchemaName(currentSchema).orElse(null);
                        }
                        return holder[0] != null ? storeSettingsService.getSettingsByStore(holder[0]) : null;
                    });
                    resolvedStore = holder[0];
                } finally {
                    TenantContext.setCurrentTenant(currentSchema);
                }
            }

            emailNotificationService.sendOrderShippedToCustomer(resolvedStore, settings, order, shipment);
        } catch (Exception ignored) {
            // Nunca afectar la transacción del envío por un fallo de correo
        }
    }
}