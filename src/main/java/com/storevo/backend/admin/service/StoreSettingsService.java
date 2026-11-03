package com.storevo.backend.admin.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.repository.StoreSettingsRepository;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.service.logistics.DaneCityResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreSettingsService {

    private final StoreSettingsRepository storeSettingsRepository;
    private final StoreRepository storeRepository;

    public StoreSettingsDto getSettingsByStore(Store store) {
        StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId())
                .orElse(StoreSettings.builder()
                        .store(store)
                        .primaryColor("#0F172A") // Color oficial neutro del MVP
                        .secondaryColor("#FFFFFF")
                        .build());

        return StoreSettingsDto.builder()
                .storeName(store.getName())
                .emailContact(settings.getEmailContact())
                .whatsapp(settings.getWhatsapp())
                .instagram(settings.getInstagram())
                .facebook(settings.getFacebook())
                .tiktok(settings.getTiktok())
                .primaryColor(settings.getPrimaryColor())
                .secondaryColor(settings.getSecondaryColor())
                .logoUrl(settings.getLogoUrl())
                // MAPEO DE POLÍTICAS (Lectura BD -> Vista)
                .showShippingPolicy(settings.getShowShippingPolicy() != null ? settings.getShowShippingPolicy() : true)
                .shippingPolicyText(settings.getShippingPolicyText())
                .showReturnPolicy(settings.getShowReturnPolicy() != null ? settings.getShowReturnPolicy() : true)
                .returnPolicyText(settings.getReturnPolicyText())
                .shippingBusinessNit(settings.getShippingBusinessNit())
                .shippingContactPhone(settings.getShippingContactPhone())
                .shippingContactEmail(settings.getShippingContactEmail())
                .shippingPickupAddress(settings.getShippingPickupAddress())
                .shippingPickupCity(settings.getShippingPickupCity())
                // Tarifas simples de envío y recogida en tienda (Objetivo M1)
                .localShippingRate(settings.getLocalShippingRate())
                .nationalShippingRate(settings.getNationalShippingRate())
                .freeShippingThreshold(settings.getFreeShippingThreshold())
                .allowStorePickup(Boolean.TRUE.equals(settings.getAllowStorePickup()))
                .build();
    }

    @Transactional
    public void updateSettings(Store store, StoreSettingsDto dto) {
        // 1. Actualizamos el nombre en la tabla Store
        store.setName(dto.getStoreName());
        storeRepository.save(store);

        // 2. Buscamos o creamos la configuración
        StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId())
                .orElse(StoreSettings.builder().store(store).build());

        // 3. Actualizamos los valores generales
        settings.setEmailContact(dto.getEmailContact());
        settings.setWhatsapp(dto.getWhatsapp());
        settings.setInstagram(dto.getInstagram());
        settings.setFacebook(dto.getFacebook());
        settings.setTiktok(dto.getTiktok());

        if (dto.getPrimaryColor() != null) settings.setPrimaryColor(dto.getPrimaryColor());
        if (dto.getSecondaryColor() != null) settings.setSecondaryColor(dto.getSecondaryColor());
        if (dto.getLogoUrl() != null) settings.setLogoUrl(dto.getLogoUrl());

        // 4. MAPEO DE POLÍTICAS (Guardado Formulario -> BD)
        settings.setShowShippingPolicy(dto.getShowShippingPolicy() != null ? dto.getShowShippingPolicy() : false);
        settings.setShippingPolicyText(dto.getShippingPolicyText());

        settings.setShowReturnPolicy(dto.getShowReturnPolicy() != null ? dto.getShowReturnPolicy() : false);
        settings.setReturnPolicyText(dto.getReturnPolicyText());

        // 5. Datos de remitente para envíos
        settings.setShippingBusinessNit(dto.getShippingBusinessNit());
        settings.setShippingContactPhone(dto.getShippingContactPhone());
        settings.setShippingContactEmail(dto.getShippingContactEmail());
        settings.setShippingPickupAddress(dto.getShippingPickupAddress());
        settings.setShippingPickupCity(dto.getShippingPickupCity());

        // 6. Tarifas simples de envío y recogida en tienda (Objetivo M1)
        settings.setLocalShippingRate(sanitizeNonNegativeRate(dto.getLocalShippingRate()));
        settings.setNationalShippingRate(sanitizeNonNegativeRate(dto.getNationalShippingRate()));
        settings.setFreeShippingThreshold(sanitizeNonNegativeRate(dto.getFreeShippingThreshold()));
        settings.setAllowStorePickup(Boolean.TRUE.equals(dto.getAllowStorePickup()));

        storeSettingsRepository.save(settings);
    }

    /**
     * Calcula en el servidor el costo de envío aplicable al pedido (Objetivo M1).
     */
    public double calculateShippingCost(
            StoreSettingsDto settings,
            double subtotal,
            String destinationCity,
            String deliveryMethod) {

        if (settings == null || subtotal <= 0.0) {
            return 0.0;
        }

        // 1. Si el cliente eligió recogida en tienda y la tienda lo tiene habilitado, el costo es $0
        if ("PICKUP".equalsIgnoreCase(deliveryMethod) && Boolean.TRUE.equals(settings.getAllowStorePickup())) {
            return 0.0;
        }

        // 2. Si existe tope de envío gratis (> 0) y el subtotal lo alcanza o supera, el envío es $0
        Double freeThreshold = settings.getFreeShippingThreshold();
        if (freeThreshold != null && freeThreshold > 0.0 && subtotal >= freeThreshold) {
            return 0.0;
        }

        Double localRate = sanitizeNonNegativeRate(settings.getLocalShippingRate());
        Double nationalRate = sanitizeNonNegativeRate(settings.getNationalShippingRate());

        String pickupCityNorm = settings.getShippingPickupCity() != null && !settings.getShippingPickupCity().isBlank()
                ? DaneCityResolver.normalizeStatic(settings.getShippingPickupCity())
                : "";
        String destCityNorm = destinationCity != null && !destinationCity.isBlank()
                ? DaneCityResolver.normalizeStatic(destinationCity)
                : "";

        boolean isLocalCity = !pickupCityNorm.isEmpty() && !destCityNorm.isEmpty() && pickupCityNorm.equals(destCityNorm);

        if (isLocalCity) {
            if (localRate != null) return localRate;
            if (nationalRate != null) return nationalRate;
            return 0.0;
        }

        if (nationalRate != null) return nationalRate;
        if (localRate != null) return localRate;
        return 0.0;
    }

    private Double sanitizeNonNegativeRate(Double value) {
        if (value == null || Double.isNaN(value) || Double.isInfinite(value) || value < 0.0) {
            return null;
        }
        return value;
    }
}