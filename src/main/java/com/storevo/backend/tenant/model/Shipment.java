package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carrier_id", nullable = false)
    private Carrier carrier;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "external_shipment_id", length = 100)
    private String externalShipmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ShipmentStatus status = ShipmentStatus.CREATED;

    @Column(name = "package_number", nullable = false)
    @Builder.Default
    private Integer packageNumber = 1;

    private Double weight;

    @Column(length = 50)
    private String dimensions;

    @Column(name = "created_at", nullable = false, updatable = false)
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

    // MAGIA ARQUITECTÓNICA: Generación dinámica del tracking
    public String getDynamicTrackingUrl() {
        if (this.carrier != null && this.carrier.getTrackingUrlTemplate() != null && this.trackingNumber != null) {
            return this.carrier.getTrackingUrlTemplate().replace("{trackingNumber}", this.trackingNumber);
        }
        return null;
    }
}