package com.storevo.backend.tenant.dto;

import com.storevo.backend.tenant.model.OrderChannel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerDto {
    // Campos base existentes
    private String name;
    private String phone;
    private String city;
    private Long totalOrders;
    private Double totalSpent;
    private LocalDateTime lastOrderDate;

    // Canales de compra (Punto 2: múltiples canales usados + último canal)
    @Builder.Default
    private List<OrderChannel> channels = new ArrayList<>();
    private OrderChannel lastChannel;

    // Campos logísticos y fiscales (Punto 3: almacenables sin restricción de plan)
    private String email;
    private String address;
    private String documentType;
    private String document;
    private String verificationDigit;
    private String legalName;
    private String taxRegime;
    private Boolean requiresElectronicInvoice;
}