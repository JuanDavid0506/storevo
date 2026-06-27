package com.storevo.backend.tenant.model;

public enum OrderStatus {
    PENDING,    // Pendiente de pago
    PAID,       // Pagado (Aprobado por Wompi)
    PREPARING,  // Preparando pedido
    SHIPPED,    // Enviado
    DELIVERED,  // Entregado
    CANCELLED   // Cancelado o pago rechazado
}