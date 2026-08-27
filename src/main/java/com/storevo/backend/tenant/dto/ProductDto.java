package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

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
    private Boolean isDraft;

    // --- NUEVO: SOPORTE HÍBRIDO ---
    private Boolean hasVariants;
    private Boolean isMadeToOrder;
    private List<OptionDto> options;
    private List<VariantDto> variants;
    // ------------------------------

    private List<String> attrKeys;
    private List<String> attrValues;
    private List<MultipartFile> newImages;
    private List<String> existingImages;
    private List<String> imageOrder;
    private String mainImageRef;

    // Subclases internas para mantener el transporte limpio
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OptionDto {
        private String name;
        private List<String> values; // Ej: ["S", "M", "L"]
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VariantDto {
        private String sku;
        private String barcode;
        private Double price;
        private Integer stock;
        private Double weight;
        private Map<String, String> combination; // Ej: {"Color": "Rojo", "Talla": "S"}
        private String imageRef;
    }
}