package com.storevo.backend.admin.config;

import com.storevo.backend.admin.model.Feature;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.SubscriptionPlan;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// Crea los 3 planes de suscripción si todavía no existen, y le asigna el plan PRO
// (pagos + envíos) a cualquier tienda que hoy no tenga ningún plan asignado.
//
// Por qué existe esto: TenantPlanService.hasFeature() devuelve false para CUALQUIER
// tienda con plan = null, así que sin este seeder ninguna tienda puede usar Wompi ni
// Mi Paquete aunque ya tenga sus credenciales bien configuradas — quedan bloqueadas
// en el "portero" antes de siquiera llegar a revisar las llaves.
//
// Corre una sola vez por arranque y no le hace nada a una tienda que ya tenga plan
// (no pisa asignaciones manuales que hayas hecho tú).
@Component
@RequiredArgsConstructor
@Slf4j
public class PlanSeeder implements CommandLineRunner {

    private final SubscriptionPlanRepository planRepository;
    private final StoreRepository storeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        SubscriptionPlan basic = ensurePlan("BASIC", "Catálogo + WhatsApp", Set.of());
        SubscriptionPlan pro = ensurePlan("PRO", "Ventas Online + Envíos",
                Set.of(Feature.ONLINE_PAYMENTS, Feature.SHIPPING_INTEGRATION));
        SubscriptionPlan enterprise = ensurePlan("ENTERPRISE", "Ventas + Facturación Electrónica",
                Set.of(Feature.ONLINE_PAYMENTS, Feature.SHIPPING_INTEGRATION, Feature.DIAN_ELECTRONIC_BILLING));

        List<Store> storesWithoutPlan = storeRepository.findAll().stream()
                .filter(store -> store.getPlan() == null)
                .collect(Collectors.toList());

        if (!storesWithoutPlan.isEmpty()) {
            storesWithoutPlan.forEach(store -> store.setPlan(pro));
            storeRepository.saveAll(storesWithoutPlan);
            log.info("PlanSeeder: se asignó el plan PRO a {} tienda(s) que no tenían plan.", storesWithoutPlan.size());
        }
    }

    private SubscriptionPlan ensurePlan(String code, String name, Set<Feature> features) {
        return planRepository.findByCode(code).orElseGet(() -> {
            SubscriptionPlan plan = SubscriptionPlan.builder()
                    .code(code)
                    .name(name)
                    .features(new HashSet<>(features))
                    .build();
            log.info("PlanSeeder: creando el plan {} ({})", code, name);
            return planRepository.save(plan);
        });
    }
}