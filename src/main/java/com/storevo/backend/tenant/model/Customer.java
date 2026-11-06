package com.storevo.backend.tenant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phone_key", nullable = false, unique = true, length = 40)
    private String phoneKey;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(name = "document_type", length = 10)
    private String documentType;

    @Column(length = 30)
    private String document;

    @Column(name = "verification_digit", length = 5)
    private String verificationDigit;

    @Column(name = "legal_name", length = 150)
    private String legalName;

    @Column(name = "tax_regime", length = 40)
    private String taxRegime;

    @Column(name = "requires_electronic_invoice")
    @Builder.Default
    private Boolean requiresElectronicInvoice = false;

    @Column(length = 200)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(name = "total_orders", nullable = false)
    @Builder.Default
    private Long totalOrders = 0L;

    @Column(name = "total_spent", nullable = false)
    @Builder.Default
    private Double totalSpent = 0.0;

    @Column(name = "last_order_date")
    private LocalDateTime lastOrderDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_channel", length = 20)
    private OrderChannel lastChannel;

    @Column(name = "password_hash", length = 255)
    @ToString.Exclude
    private String passwordHash;

    @Column(name = "has_account", nullable = false)
    @Builder.Default
    private Boolean hasAccount = false;

    @Column(name = "reset_password_token", length = 100)
    @ToString.Exclude
    private String resetPasswordToken;

    @Column(name = "reset_password_expires_at")
    private LocalDateTime resetPasswordExpiresAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "channels_csv", length = 60)
    private String channelsCsv;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.totalOrders == null) this.totalOrders = 0L;
        if (this.totalSpent == null) this.totalSpent = 0.0;
        if (this.requiresElectronicInvoice == null) this.requiresElectronicInvoice = false;
        if (this.hasAccount == null) this.hasAccount = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public List<OrderChannel> getParsedChannels() {
        List<OrderChannel> list = new ArrayList<>();
        if (this.channelsCsv == null || this.channelsCsv.isBlank()) {
            if (this.lastChannel != null) {
                list.add(this.lastChannel);
            }
            return list;
        }
        for (String part : this.channelsCsv.split(",")) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                try {
                    OrderChannel ch = OrderChannel.valueOf(trimmed);
                    if (!list.contains(ch)) {
                        list.add(ch);
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        }
        return list;
    }
}