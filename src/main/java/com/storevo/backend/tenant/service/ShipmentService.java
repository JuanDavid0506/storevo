package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.CarrierRepository;
import com.storevo.backend.tenant.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final OrderRepository orderRepository;
    private final CarrierRepository carrierRepository;
    private final OrderService orderService; // Inyectado para forzar la máquina de estados de Order

    @Transactional
    public Shipment createManualShipment(Long orderId, Long carrierId, String trackingNumber, Double weight, String dimensions, Long adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        Carrier carrier = carrierRepository.findById(carrierId)
                .orElseThrow(() -> new RuntimeException("Transportadora no encontrada"));

        // Creamos la infraestructura logística
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

        // Forzamos el cambio de estado del Pedido a través del OrderService (y su máquina de estados)
        // El origen será SYSTEM porque fue disparado automáticamente por el módulo logístico
        orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, EventOrigin.SYSTEM, adminUserId);

        return shipment;
    }
}