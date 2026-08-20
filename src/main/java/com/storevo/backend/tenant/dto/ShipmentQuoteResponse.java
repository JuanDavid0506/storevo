package com.storevo.backend.tenant.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShipmentQuoteResponse {
    private String carrierName;
    private String carrierCode;
    private Double price;
    private String estimatedDays;
}