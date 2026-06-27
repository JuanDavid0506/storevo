package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private Double discountPrice;
    private Integer stock;
    private Long categoryId; // Solo necesitamos el ID para enlazarlo
    private String brand;
    private String sku;
    private Double weight;
    private Boolean isActive;
    private String mainImageUrl; // Temporal para la URL de la imagen principal
}