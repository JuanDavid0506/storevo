package com.storevo.backend.tenant.service.logistics;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.Shipment;
import com.storevo.backend.tenant.dto.ShipmentLabelResponse;
import com.storevo.backend.tenant.dto.ShipmentQuoteResponse;

import java.util.List;

public interface CarrierAdapter {

    boolean supports(String carrierCode);

    List<ShipmentQuoteResponse> quoteShipment(Store store, String originCode, String destCode, double weight, String dimensions);

    ShipmentLabelResponse createLabel(Store store, Order order, String carrierCode, double weight, String dimensions);

    String getTrackingStatus(Shipment shipment);
}