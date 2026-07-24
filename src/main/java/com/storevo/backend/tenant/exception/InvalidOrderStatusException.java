package com.storevo.backend.tenant.exception;

import com.storevo.backend.tenant.model.OrderStatus;

public class InvalidOrderStatusException extends RuntimeException {
    public InvalidOrderStatusException(OrderStatus current, OrderStatus next) {
        super("Transición de estado no válida: No se puede pasar de " + current + " a " + next);
    }
}