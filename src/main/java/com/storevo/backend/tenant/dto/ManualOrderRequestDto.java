package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualOrderRequestDto {

    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String documentType;
    private String customerDocument;
    private String verificationDigit;
    private String legalName;
    private String taxRegime;
    private Boolean requiresElectronicInvoice;

    private String deliveryMethod; // SHIPPING o PICKUP
    private String city;
    private String address;
    private Double customShippingCost; // Si es null, calcula automáticamente según tarifas de la tienda
    private String notes;

    private String channel;       // WHATSAPP u ONLINE
    private String initialStatus; // PENDING (genera link de cobro), CONFIRMED o PAID (descuenta stock de inmediato)
    private String paymentMethod; // Ej: "Link de pago Wompi", "Efectivo / Mostrador", "Transferencia / Nequi", "Contraentrega"

    @Builder.Default
    private List<ManualOrderItemDto> items = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualOrderItemDto {
        private Long productId;
        private Long variantId;
        private Integer quantity;
    }
}