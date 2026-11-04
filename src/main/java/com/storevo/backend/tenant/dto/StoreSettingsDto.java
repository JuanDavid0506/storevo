package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreSettingsDto {

    // --- Información General ---
    private String storeName;
    private String emailContact;
    private String primaryColor;
    private String secondaryColor;
    private String logoUrl;

    // --- Redes Sociales ---
    private String whatsapp;
    private String instagram;
    private String facebook;
    private String tiktok;

    // --- Políticas de la Tienda ---
    private Boolean showShippingPolicy;
    private String shippingPolicyText;
    private Boolean showReturnPolicy;
    private String returnPolicyText;

    // --- Datos de remitente para envíos ---
    private String shippingBusinessNit;
    private String shippingContactPhone;
    private String shippingContactEmail;
    private String shippingPickupAddress;
    private String shippingPickupCity;

    // --- Tarifas Simples de Envío y Recogida en Tienda (Objetivo M1) ---
    private Double localShippingRate;
    private Double nationalShippingRate;
    private Double freeShippingThreshold;
    private Boolean allowStorePickup;

    // --- Wompi ---
    private boolean wompiActive;
    private String wompiEnvironment;
    private String wompiPublicKey;
    private String wompiPrivateKey;
    private String wompiEventsSecret;
    private String wompiIntegritySecret;

    // --- Mi Paquete ---
    private boolean miPaqueteActive;
    private String miPaqueteEnvironment;
    private String miPaqueteApiKey;
}