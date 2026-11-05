package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false)
    private Double discountValue;

    @Column(name = "min_purchase_amount")
    private Double minPurchaseAmount;

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.code != null) {
            this.code = this.code.trim().toUpperCase(Locale.ROOT);
        }
        if (this.usedCount == null || this.usedCount < 0) {
            this.usedCount = 0;
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.code != null) {
            this.code = this.code.trim().toUpperCase(Locale.ROOT);
        }
        if (this.usedCount == null || this.usedCount < 0) {
            this.usedCount = 0;
        }
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return this.expiresAt != null && !this.expiresAt.isAfter(LocalDateTime.now());
    }

    public boolean isUsageLimitReached() {
        return this.maxUses != null && this.maxUses > 0 && this.usedCount != null && this.usedCount >= this.maxUses;
    }
}