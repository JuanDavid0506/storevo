package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

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
    private Long categoryId;
    private String brand;
    private String sku;
    private Double weight;
    private Boolean isActive;
    private String mainImageUrl;

    // NUEVO: Listas paralelas para recibir especificaciones dinámicas desde el HTML
    private List<String> attrKeys;
    private List<String> attrValues;
}