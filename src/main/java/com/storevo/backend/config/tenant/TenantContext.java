package com.storevo.backend.config.tenant;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();
    public static final String DEFAULT_TENANT = "storevo_admin"; // Esquema por defecto

    public static void setCurrentTenant(String tenant) {
        log.debug("Estableciendo el tenant actual a: {}", tenant);
        CURRENT_TENANT.set(tenant);
    }

    public static String getCurrentTenant() {
        String tenant = CURRENT_TENANT.get();
        return tenant != null ? tenant : DEFAULT_TENANT;
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}