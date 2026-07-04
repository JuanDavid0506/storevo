package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    // --- SISTEMA DE IMÁGENES FÍSICAS ---
    private List<MultipartFile> newImages; // Archivos subidos en el input
    private List<String> existingImages;   // URLs de las imágenes que ya existían y no fueron borradas
    private List<String> imageOrder;       // Array con el orden exacto (mezcla URLs existentes y nombres de archivos nuevos)
    private String mainImageRef;           // Referencia a la imagen elegida con la estrella (⭐)

    // Ficha técnica
    private List<String> attrKeys;
    private List<String> attrValues;
}