package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "product_images", indexes = {
        @Index(name = "idx_file_hash", columnList = "file_hash")
})
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

    @Column(name = "variant_id")
    private Long variantId;

    @Column(nullable = false, length = 255)
    private String fileName;

    // NUEVO: Auditoría del nombre del archivo subido por el cliente
    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    @Column(nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    @Column(name = "alt_text", length = 255)
    private String altText;

    private Integer width;
    private Integer height;

    @Column(name = "mime_type", length = 50)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    // NUEVO: Campo JSON dinámico para el futuro motor de Inteligencia Artificial
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_tags", columnDefinition = "json")
    private Map<String, Object> aiTags;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortPosition = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // NUEVO: Fecha de modificación
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

    public String getThumbnailUrl() {
        if (this.filePath == null) return null;
        return this.filePath.replace(".webp", "_thumb.webp");
    }
}