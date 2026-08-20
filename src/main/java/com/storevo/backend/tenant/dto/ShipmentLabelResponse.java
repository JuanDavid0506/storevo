package com.storevo.backend.tenant.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShipmentLabelResponse {
    private String trackingNumber;
    private String externalShipmentId;
    private String labelPdfUrl;
}