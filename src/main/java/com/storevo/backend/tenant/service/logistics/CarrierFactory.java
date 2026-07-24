package com.storevo.backend.tenant.service.logistics;

import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class CarrierFactory {

    private final List<CarrierAdapter> adapters;

    public CarrierFactory(List<CarrierAdapter> adapters) {
        this.adapters = adapters;
    }

    public CarrierAdapter getAdapter(String carrierCode) {
        return adapters.stream()
                .filter(adapter -> adapter.supports(carrierCode))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No hay integración disponible para: " + carrierCode));
    }
}