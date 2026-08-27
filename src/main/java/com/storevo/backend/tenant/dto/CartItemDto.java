package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {
    private Long productId;

    // --- FASE 2: VARIANTES ---
    private Long variantId;
    private String variantText; // Ej: "Rojo • M"
    // -------------------------

    private String name;
    private Double price;
    private Integer quantity;
    private String imageUrl;
    private Boolean isMadeToOrder;

    public Double getSubtotal() {
        return this.price * this.quantity;
    }
}