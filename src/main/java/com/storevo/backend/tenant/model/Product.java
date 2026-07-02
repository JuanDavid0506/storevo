package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(name = "discount_price")
    private Double discountPrice;

    @Column(nullable = false)
    private Integer stock;

    // Relación con la Categoría (Fase 4)
    // Relación con la Categoría (Cambiado a EAGER por apagar OSIV)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(length = 100)
    private String brand;

    @Column(length = 50)
    private String sku;

    private Double weight;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // --- AGREGAR ESTE BLOQUE ---
    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isDeleted = false;
    // ---------------------------



    // --- CAMPOS DINÁMICOS JSON (La magia de Storevo) ---

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "images_json", columnDefinition = "json")
    private List<String> images; // Array de URLs de imágenes

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes_json", columnDefinition = "json")
    private Map<String, String> attributes; // Ej: {"Material": "Algodón", "Estilo": "Urbano"}

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variants_json", columnDefinition = "json")
    private List<Map<String, Object>> variants; // Ej: [{"talla": "M", "color": "Rojo", "stock": 5}]

    // ---------------------------------------------------

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}