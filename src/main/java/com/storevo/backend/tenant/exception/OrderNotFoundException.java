package com.storevo.backend.tenant.exception;

public class OrderNotFoundException extends RuntimeException {
    public OrderNotFoundException(Long id) {
        super("No se encontró el pedido con el ID: " + id);
    }
}