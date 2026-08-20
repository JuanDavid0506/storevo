package com.storevo.backend.admin.service;

import com.storevo.backend.admin.model.Feature;
import com.storevo.backend.admin.model.Store;
import org.springframework.stereotype.Service;

@Service
public class TenantPlanService {

    /**
     * Verifica de forma silenciosa si la tienda tiene acceso a la característica.
     * Ideal para mostrar/ocultar botones en el frontend (Ej: Ocultar botón Wompi).
     */
    public boolean hasFeature(Store store, Feature feature) {
        if (store == null || store.getPlan() == null || store.getPlan().getFeatures() == null) {
            return false;
        }
        return store.getPlan().getFeatures().contains(feature);
    }

    /**
     * Verifica y lanza un error duro si no hay acceso.
     * Ideal para bloquear los Endpoints del Backend por seguridad.
     */
    public void validateFeatureOrThrow(Store store, Feature feature) {
        if (!hasFeature(store, feature)) {
            throw new RuntimeException("Tu plan de suscripción actual no incluye esta funcionalidad: " + feature.name());
        }
    }
}