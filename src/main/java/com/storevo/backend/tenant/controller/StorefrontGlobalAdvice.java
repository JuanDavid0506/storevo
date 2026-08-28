package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.service.CartManager;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.WishlistManager;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.UUID;

@ControllerAdvice(assignableTypes = {
        StoreFrontController.class,
        CartController.class,
        WishlistController.class,
        OrderController.class
})
@RequiredArgsConstructor
public class StorefrontGlobalAdvice {

    private final StoreSettingsService storeSettingsService;
    private final CategoryService categoryService;
    private final CartManager cartManager;
    private final WishlistManager wishlistManager;

    @ModelAttribute
    public void loadGlobalStoreData(Model model, HttpServletRequest request, HttpServletResponse response) {
        Store store = (Store) request.getAttribute("currentStore");

        @SuppressWarnings("unchecked")
        Map<String, String> pathVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String slug = (pathVariables != null) ? pathVariables.get("slug") : null;

        if (store == null || slug == null) {
            return;
        }

        // --- NUEVO: Generación e Inyección de la Cédula (Cookie UUID a 30 días) ---
        String guestId = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("storevo_guest_id".equals(cookie.getName())) {
                    guestId = cookie.getValue();
                    break;
                }
            }
        }

        // Si es su primera vez en la tienda, le creamos la cédula
        if (guestId == null) {
            guestId = UUID.randomUUID().toString();
            Cookie cookie = new Cookie("storevo_guest_id", guestId);
            cookie.setMaxAge(30 * 24 * 60 * 60); // 30 días de vida
            cookie.setPath("/"); // Disponible en toda la tienda
            cookie.setHttpOnly(true); // Blindado contra ataques XSS
            response.addCookie(cookie);
        }

        // Guardamos el guestId en el request para que los Managers lo lean fácilmente
        request.setAttribute("guestId", guestId);
        // --------------------------------------------------------------------------

        // 1. Consultar base de datos de ADMIN antes de cambiar el contexto
        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);

        // 2. Bajar el switch: Cambiar al esquema del Tenant
        TenantContext.setCurrentTenant(store.getSchemaName());

        // 3. Consultar base de datos del TENANT para Navbar y Colecciones
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("navCategories", categoryService.getNavCategories());

        // (Aún pasamos solo el slug; en el siguiente paso los Managers leerán el guestId)
        model.addAttribute("cartCount", cartManager.getCartCount(slug));
        model.addAttribute("wishlistCount", wishlistManager.getWishlistCount(slug));
        model.addAttribute("wishlistProductIds", wishlistManager.getWishlist(slug));
    }
}