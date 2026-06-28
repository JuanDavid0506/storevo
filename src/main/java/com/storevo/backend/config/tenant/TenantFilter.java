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

        String uri = request.getRequestURI();

        // 1. Siempre iniciamos en la base de datos maestra
        TenantContext.setCurrentTenant("storevo_admin");

        // 2. Si es una ruta de tienda (/s/) O una ruta de dashboard (/dashboard/)
        if (uri.startsWith("/s/") || uri.startsWith("/dashboard/")) {
            String[] pathParts = uri.split("/");
            // pathParts[0] = ""
            // pathParts[1] = "s" o "dashboard"
            // pathParts[2] = "{slug}"
            if (pathParts.length >= 3) {
                String slug = pathParts[2];
                Optional<Store> storeOpt = storeRepository.findBySlug(slug);
                if (storeOpt.isPresent()) {
                    request.setAttribute("currentStore", storeOpt.get());
                }
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
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