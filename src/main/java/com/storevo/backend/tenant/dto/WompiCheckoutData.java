package com.storevo.backend.tenant.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WompiCheckoutData {
    private String publicKey;
    private String reference;
    private String signature;
    private long amountInCents;
    private String currency;
    private String environment;
}