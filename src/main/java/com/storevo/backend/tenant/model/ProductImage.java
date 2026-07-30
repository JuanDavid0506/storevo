package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

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

    @Column(name = "variant_id")
    private Long variantId;

    // ALMACENAMIENTO CLOUDINARY
    @Column(name = "secure_url", nullable = false, length = 500)
    private String secureUrl;

    @Column(name = "public_id", nullable = false)
    private String publicId;

    @Column(name = "alt_text", length = 255)
    private String altText;

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

    // Miniatura dinámica de Cloudinary al vuelo (300x300 optimizada)
    public String getThumbnailUrl() {
        if (this.secureUrl == null) return null;
        return this.secureUrl.replaceFirst("/upload/", "/upload/c_fill,h_300,w_300,q_auto,f_auto/");
    }
}