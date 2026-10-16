package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "customer_city", length = 100)
    private String customerCity;

    @Column(nullable = false)
    @Builder.Default
    private Integer rating = 5;

    @Column(nullable = false, length = 500)
    private String comment;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private Boolean isVisible = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isVisible == null) this.isVisible = true;
        if (this.rating == null || this.rating < 1) this.rating = 5;
        if (this.rating > 5) this.rating = 5;
    }
}