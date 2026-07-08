package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isDeleted = false;

    // --- NUEVO: SOPORTE HÍBRIDO (Fase 2) ---
    @Column(name = "has_variants", nullable = false)
    @Builder.Default
    private Boolean hasVariants = false;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortPosition ASC")
    @Builder.Default
    private List<ProductOption> options = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variantsList = new ArrayList<>();
    // --------------------------------------

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("sortPosition ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes_json", columnDefinition = "json")
    private Map<String, String> attributes;

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

    public String getMainImageUrl() {
        if (this.images == null || this.images.isEmpty()) return null;
        return this.images.stream().filter(ProductImage::getIsPrimary).findFirst().orElse(this.images.get(0)).getFilePath();
    }

    public String getMainImageThumbnailUrl() {
        if (this.images == null || this.images.isEmpty()) return null;
        return this.images.stream().filter(ProductImage::getIsPrimary).findFirst().orElse(this.images.get(0)).getThumbnailUrl();
    }
}