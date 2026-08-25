package com.storevo.backend.admin.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false, unique = true)
    private Store store;

    // NUEVOS CAMPOS PARA EL ONBOARDING MÁGICO
    @Column(name = "business_type", length = 50)
    private String businessType;

    @Column(name = "theme_name", length = 50)
    private String themeName;

    @Column(name = "primary_color", length = 7)
    private String primaryColor;

    @Column(name = "secondary_color", length = 7)
    private String secondaryColor;

    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    @Column(name = "banner_url", length = 255)
    private String bannerUrl;

    @Column(length = 50)
    private String whatsapp;

    @Column(length = 100)
    private String instagram;

    @Column(length = 100)
    private String facebook;

    @Column(length = 100)
    private String tiktok;

    @Column(name = "email_contact", length = 150)
    private String emailContact;

    @Column(name = "show_shipping_policy", columnDefinition = "boolean default true")
    private Boolean showShippingPolicy;

    @Column(name = "shipping_policy_text", columnDefinition = "TEXT")
    private String shippingPolicyText;

    @Column(name = "show_return_policy", columnDefinition = "boolean default true")
    private Boolean showReturnPolicy;

    @Column(name = "return_policy_text", columnDefinition = "TEXT")
    private String returnPolicyText;

    // --- Datos de remitente para envíos (Mi Paquete y futuras transportadoras) ---
    @Column(name = "shipping_business_nit", length = 30)
    private String shippingBusinessNit;

    @Column(name = "shipping_contact_phone", length = 20)
    private String shippingContactPhone;

    @Column(name = "shipping_contact_email", length = 150)
    private String shippingContactEmail;

    @Column(name = "shipping_pickup_address", length = 255)
    private String shippingPickupAddress;

    @Column(name = "shipping_pickup_city", length = 100)
    private String shippingPickupCity;

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