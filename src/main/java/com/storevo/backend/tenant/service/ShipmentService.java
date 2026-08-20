package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.tenant.dto.ShipmentLabelResponse;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.CarrierRepository;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.service.logistics.CarrierAdapter;
import com.storevo.backend.tenant.service.logistics.CarrierFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final OrderRepository orderRepository;
    private final CarrierRepository carrierRepository;
    private final OrderService orderService;
    private final CarrierFactory carrierFactory;

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

        // 3. Persistir el envío pendiente
        Shipment shipment = Shipment.builder()
                .order(order)
                .carrier(carrier)
                .trackingNumber(apiResponse.getTrackingNumber())
                .externalShipmentId(apiResponse.getExternalShipmentId())
                .weight(weight)
                .dimensions(dimensions)
                .packageNumber(order.getShipments().size() + 1)
                .status(ShipmentStatus.CREATED)
                .build();

        order.getShipments().add(shipment);

        // 4. Cambiar estado de la orden
        orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, EventOrigin.SYSTEM, adminUserId);

        return shipment;
    }
}