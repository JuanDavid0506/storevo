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
    private String name;
    private Double price;
    private Integer quantity;
    private String imageUrl;

    public Double getSubtotal() {
        return this.price * this.quantity;
    }
}