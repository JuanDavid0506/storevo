package com.storevo.backend.tenant.exception;

public class ShipmentRequiredException extends RuntimeException {
    public ShipmentRequiredException(Long orderId) {
        super("El pedido #" + orderId + " no puede pasar a estado ENVIADO porque no tiene ninguna guía de envío (Shipment) asociada.");
    }
}