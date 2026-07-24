package com.storevo.backend.tenant.exception;

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String productName) {
        super("Stock insuficiente en el momento de la compra para: " + productName);
    }
}