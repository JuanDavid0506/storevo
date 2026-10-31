package com.storevo.backend.config.security;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.User;
import com.storevo.backend.admin.repository.UserRepository;
import com.storevo.backend.config.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
@RequiredArgsConstructor
public class DashboardOwnershipInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();
        if (uri == null) {
            return true;
        }

        boolean isDashboardRequest = uri.startsWith("/dashboard/");
        boolean isDraftPreviewRequest = uri.startsWith("/s/") && "draft".equalsIgnoreCase(request.getParameter("preview"));

        if (!isDashboardRequest && !isDraftPreviewRequest) {
            return true;
        }

        Store currentStore = (Store) request.getAttribute("currentStore");
        if (currentStore == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Tienda no encontrada");
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            if (isDraftPreviewRequest) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Debes iniciar sesión para previsualizar el borrador");
                return false;
            }
            response.sendRedirect("/login");
            return false;
        }

        String email = auth.getName();
        String previousTenant = TenantContext.getCurrentTenant();
        User user;
        try {
            TenantContext.setCurrentTenant(TenantContext.DEFAULT_TENANT);
            user = userRepository.findByEmail(email).orElse(null);
        } finally {
            TenantContext.setCurrentTenant(previousTenant);
        }

        if (user == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Usuario no válido");
            return false;
        }

        String role = user.getRole() != null ? user.getRole().trim() : "";
        boolean isSaasAdmin = "ADMIN_SAAS".equalsIgnoreCase(role) || "ROLE_ADMIN_SAAS".equalsIgnoreCase(role);
        boolean isOwner = user.getStore() != null
                && user.getStore().getId() != null
                && user.getStore().getId().equals(currentStore.getId());

        if (!isOwner && !isSaasAdmin) {
            log.warn("Acceso denegado: usuario {} intentó acceder a la tienda {}", email, currentStore.getSlug());
            TenantContext.clear();
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "No tienes permiso para acceder a esta tienda");
            return false;
        }

        request.setAttribute("currentUser", user);
        request.setAttribute("currentUserId", user.getId());
        return true;
    }
}