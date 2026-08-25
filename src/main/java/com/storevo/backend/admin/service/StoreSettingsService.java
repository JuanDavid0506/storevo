package com.storevo.backend.admin.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.repository.StoreSettingsRepository;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
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

                // MAPEO DE POLÍTICAS (Lectura BD -> Vista)
                // Se valida contra null por si es una tienda antigua creada antes de la migración
                .showShippingPolicy(settings.getShowShippingPolicy() != null ? settings.getShowShippingPolicy() : true)
                .shippingPolicyText(settings.getShippingPolicyText())
                .showReturnPolicy(settings.getShowReturnPolicy() != null ? settings.getShowReturnPolicy() : true)
                .returnPolicyText(settings.getReturnPolicyText())

                .shippingBusinessNit(settings.getShippingBusinessNit())
                .shippingContactPhone(settings.getShippingContactPhone())
                .shippingContactEmail(settings.getShippingContactEmail())
                .shippingPickupAddress(settings.getShippingPickupAddress())
                .shippingPickupCity(settings.getShippingPickupCity())
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

        // 4. MAPEO DE POLÍTICAS (Guardado Formulario -> BD)
        // Spring MVC manda nulo si un checkbox no está marcado, por lo que asignamos false en ese caso
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

        storeSettingsRepository.save(settings);
    }
}