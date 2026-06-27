package com.storevo.backend.config.tenant;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TenantFilter extends OncePerRequestFilter {

    private final StoreRepository storeRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String serverName = request.getServerName(); // Ej: storevo-production.up.railway.app
        String subdomain = extractSubdomain(serverName);

        // CONDICIÓN MEJORADA:
        // Si el dominio contiene "railway.app", es nuestro entorno de producción base (Landing Page)
        // Por lo tanto, no ejecutamos la lógica de búsqueda de tiendas (Multi-Tenant).
        boolean isBaseDomain = serverName.contains("railway.app") || serverName.equals("localhost");

        if (!isBaseDomain && subdomain != null && !subdomain.equals("www") && !subdomain.equals("admin")) {
            // Buscamos la tienda en la base de datos de administración
            Optional<Store> storeOpt = storeRepository.findBySlug(subdomain);

            if (storeOpt.isPresent() && storeOpt.get().getStatus().equals("ACTIVE")) {
                // Si existe y está activa, seteamos el schema_name
                TenantContext.setCurrentTenant(storeOpt.get().getSchemaName());
            } else {
                // Si la tienda no existe o está suspendida, devolvemos error 404
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Tienda no encontrada o inactiva");
                return; // Cortamos la ejecución aquí
            }
        }

        try {
            // Continuar con la petición normal (cargará la Landing Page)
            filterChain.doFilter(request, response);
        } finally {
            // MUY IMPORTANTE: Limpiar el contexto
            TenantContext.clear();
        }
    }

    private String extractSubdomain(String serverName) {
        // Lógica simple para extraer subdominio.
        // Ej: mitienda.storevo.com -> mitienda
        // Ej local: mitienda.localhost -> mitienda
        String[] parts = serverName.split("\\.");
        if (parts.length >= 2 && !serverName.equals("localhost")) {
            return parts[0];
        }
        return null; // No hay subdominio (petición a la web principal de Storevo)
    }
}