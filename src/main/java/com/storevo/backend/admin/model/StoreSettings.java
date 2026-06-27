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

    // Relación 1 a 1 con la tabla principal de tiendas
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false, unique = true)
    private Store store;

    @Column(name = "primary_color", length = 7)
    private String primaryColor = "#000000"; // Color por defecto (Negro premium)

    @Column(name = "secondary_color", length = 7)
    private String secondaryColor = "#FFFFFF"; // Color secundario por defecto (Blanco)

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