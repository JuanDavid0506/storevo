package com.storevo.backend.admin.service;

import com.storevo.backend.admin.model.Feature;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TenantPlanService {

    private final StoreRepository storeRepository;

    /**
     * Verifica de forma silenciosa si la tienda tiene acceso a la característica.
     * Ideal para mostrar/ocultar botones en el frontend (Ej: Ocultar botón Wompi).
     */
    @Transactional(readOnly = true)
    public boolean hasFeature(Store store, Feature feature) {
        if (store == null || store.getId() == null) {
            return false;
        }

        // Reconectamos la tienda a la sesión de base de datos actual para evitar LazyInitializationException
        Store attachedStore = storeRepository.findById(store.getId()).orElse(null);

        if (attachedStore == null || attachedStore.getPlan() == null || attachedStore.getPlan().getFeatures() == null) {
            return false;
        }
        return attachedStore.getPlan().getFeatures().contains(feature);
    }

    /**
     * Verifica y lanza un error duro si no hay acceso.
     * Ideal para bloquear los Endpoints del Backend por seguridad.
     */
    @Transactional(readOnly = true)
    public void validateFeatureOrThrow(Store store, Feature feature) {
        if (!hasFeature(store, feature)) {
            throw new RuntimeException("Tu plan de suscripción actual no incluye esta funcionalidad: " + feature.name());
        }
    }
}