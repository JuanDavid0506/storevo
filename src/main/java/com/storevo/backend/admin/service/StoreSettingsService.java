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
                        .primaryColor("#000000") // Tu color por defecto
                        .secondaryColor("#FFFFFF") // Tu color secundario
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

        // 3. Actualizamos los valores
        settings.setEmailContact(dto.getEmailContact());
        settings.setWhatsapp(dto.getWhatsapp());
        settings.setInstagram(dto.getInstagram());
        settings.setFacebook(dto.getFacebook());
        settings.setTiktok(dto.getTiktok());

        // Validamos que no vengan nulos para no romper los colores por defecto
        if (dto.getPrimaryColor() != null) settings.setPrimaryColor(dto.getPrimaryColor());
        if (dto.getSecondaryColor() != null) settings.setSecondaryColor(dto.getSecondaryColor());

        storeSettingsRepository.save(settings);
    }
}