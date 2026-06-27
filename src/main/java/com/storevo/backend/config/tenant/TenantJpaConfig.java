package com.storevo.backend.config.tenant;

import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class TenantJpaConfig {

    @Bean
    public HibernatePropertiesCustomizer hibernateCustomizer(
            TenantConnectionProvider tenantConnectionProvider,
            TenantIdentifierResolver tenantIdentifierResolver) {

        return (Map<String, Object> hibernateProperties) -> {
            // Le decimos a Hibernate qué clase se encarga de proveer las conexiones
            hibernateProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, tenantConnectionProvider);

            // Le decimos a Hibernate qué clase sabe cuál es el tenant actual (el ThreadLocal)
            hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantIdentifierResolver);
        };
    }
}