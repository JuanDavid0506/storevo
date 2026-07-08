package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Product product;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "product_variant_values",
            joinColumns = @JoinColumn(name = "variant_id"),
            inverseJoinColumns = @JoinColumn(name = "option_value_id")
    )
    @Builder.Default
    private List<ProductOptionValue> optionValues = new ArrayList<>();

    // RELACIÓN FLEXIBLE DE IMÁGENES
    @OneToMany(mappedBy = "variantId", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @Column(length = 100)
    private String sku;

    @Column(length = 100)
    private String barcode;

    private Double price;
    @Column(name = "compare_at_price")
    private Double compareAtPrice;
    @Column(name = "cost_price")
    private Double costPrice;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(name = "low_stock_alert")
    private Integer lowStockAlert;

    private Double weight;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}