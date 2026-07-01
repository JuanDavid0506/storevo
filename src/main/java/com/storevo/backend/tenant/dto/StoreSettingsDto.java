package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StoreSettingsDto {
    private String storeName;
    private String emailContact;
    private String whatsapp;
    private String instagram;
    private String facebook;
    private String tiktok;
    private String primaryColor;
    private String secondaryColor;
    private Boolean showShippingPolicy;
    private String shippingPolicyText;
    private Boolean showReturnPolicy;
    private String returnPolicyText;
}