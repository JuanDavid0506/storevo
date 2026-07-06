package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    // PREPARACIÓN PARA FUTURO SISTEMA DE VARIANTES (Ej: Talla, Color)
    @Column(name = "variant_id", nullable = true)
    private Long variantId;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(nullable = false, length = 500)
    private String filePath;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortPosition = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // --- MAGIA DE CONVENCIÓN ---
    // Deriva la ruta del thumbnail al vuelo sin usar una columna extra en la base de datos.
    public String getThumbnailUrl() {
        if (this.filePath == null) return null;
        return this.filePath.replace(".webp", "_thumb.webp");
    }
}