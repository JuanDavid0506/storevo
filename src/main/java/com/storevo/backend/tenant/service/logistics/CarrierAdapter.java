package com.storevo.backend.tenant.service.logistics;

import com.storevo.backend.tenant.model.Shipment;

public interface CarrierAdapter {
    boolean supports(String carrierCode);

    // Aquí a futuro devolveremos un DTO con la guía, la etiqueta PDF, etc.
    // public QuotingResponse quoteShipment(Order order);
    // public LabelResponse createLabel(Shipment shipment);

    String getTrackingStatus(Shipment shipment);
}