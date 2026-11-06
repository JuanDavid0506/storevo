package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ThemeConfigDto;
import com.storevo.backend.tenant.service.CartManager;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.StoreThemeService;
import com.storevo.backend.tenant.service.WishlistManager;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.servlet.HandlerMapping;
import com.storevo.backend.tenant.dto.ThemeGlobalStylesDto;
import com.storevo.backend.tenant.service.ThemeFonts;

import java.util.Map;
import java.util.UUID;

@ControllerAdvice(assignableTypes = {
        StoreFrontController.class,
        CartController.class,
        WishlistController.class,
        OrderController.class,
        StoreCustomerAuthController.class
})
@RequiredArgsConstructor
public class StorefrontGlobalAdvice {

    private final StoreSettingsService storeSettingsService;
    private final StoreThemeService storeThemeService;
    private final CategoryService categoryService;
    private final CartManager cartManager;
    private final WishlistManager wishlistManager;
    private final com.storevo.backend.config.security.JwtService jwtService;
    private final com.storevo.backend.tenant.service.CustomerService customerService;

    @ModelAttribute
    public void loadGlobalStoreData(Model model, HttpServletRequest request, HttpServletResponse response) {
        Store store = (Store) request.getAttribute("currentStore");

        @SuppressWarnings("unchecked")
        Map<String, String> pathVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String slug = (pathVariables != null) ? pathVariables.get("slug") : null;

        if (store == null || slug == null) {
            return;
        }

        // --- GENERACIÓN DE LA CÉDULA DE INVITADO (COOKIE UUID) ---
        String rawGuestId = null;
        String customerToken = null;
        String expectedCustCookieName = com.storevo.backend.config.security.JwtService.buildCustomerCookieName(slug);

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("storevo_guest_id".equals(cookie.getName())) {
                    rawGuestId = cookie.getValue();
                } else if (expectedCustCookieName.equals(cookie.getName())) {
                    customerToken = cookie.getValue();
                }
            }
        }

        if (rawGuestId == null || rawGuestId.isBlank()) {
            rawGuestId = UUID.randomUUID().toString();
            org.springframework.http.ResponseCookie guestCookie = org.springframework.http.ResponseCookie
                    .from("storevo_guest_id", rawGuestId)
                    .httpOnly(true)
                    .secure(request.isSecure())
                    .path("/")
                    .maxAge(60L * 60 * 24 * 30) // 30 días
                    .sameSite("Lax")
                    .build();
            response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, guestCookie.toString());
        }

        request.setAttribute("rawGuestId", rawGuestId);

        // 1. Consultar base de datos de ADMIN antes de cambiar el contexto
        TenantContext.clear();
        var settings = storeSettingsService.getSettingsByStore(store);
        boolean isDraftPreview = "draft".equalsIgnoreCase(request.getParameter("preview"));
        ThemeConfigDto theme = storeThemeService.getRawThemeConfig(store, isDraftPreview);

        model.addAttribute("store", store);
        model.addAttribute("settings", settings);
        model.addAttribute("slug", slug);
        model.addAttribute("theme", theme);
        model.addAttribute("isDraftPreview", isDraftPreview);

        // Google Fonts: en la vista previa del editor todas; en la tienda pública solo las 2 activas
        ThemeGlobalStylesDto themeStyles = theme != null ? theme.getGlobalStyles() : null;
        String fontsUrl = isDraftPreview
                ? ThemeFonts.buildAllFontsUrl()
                : ThemeFonts.buildActiveFontsUrl(
                themeStyles != null ? themeStyles.getHeadingFont() : null,
                themeStyles != null ? themeStyles.getBodyFont() : null);
        model.addAttribute("fontsUrl", fontsUrl);

        // 2. Bajar el switch: Cambiar al esquema del Tenant
        TenantContext.setCurrentTenant(store.getSchemaName());

        // 3. Resolver sesión aislada del comprador en esta tienda (si existe cookie storevo_cust_{slug})
        String activeSessionId = rawGuestId;
        com.storevo.backend.tenant.model.Customer loggedCustomer = null;

        if (customerToken != null && !customerToken.isBlank()) {
            Long validatedCustomerId = jwtService.extractValidatedCustomerId(
                    customerToken, store.getSchemaName(), slug);
            if (validatedCustomerId != null) {
                com.storevo.backend.tenant.model.Customer candidate =
                        customerService.getCustomerEntityById(validatedCustomerId);
                if (candidate != null && Boolean.TRUE.equals(candidate.getHasAccount())
                        && !isTokenIssuedBeforePasswordChange(customerToken, candidate)) {
                    loggedCustomer = candidate;
                    activeSessionId = CartManager.buildCustomerSessionId(loggedCustomer.getId());
                }
            }
            if (loggedCustomer == null) {
                org.springframework.http.ResponseCookie clearCookie = org.springframework.http.ResponseCookie
                        .from(expectedCustCookieName, "")
                        .httpOnly(true)
                        .secure(request.isSecure())
                        .path("/s/" + slug)
                        .maxAge(0)
                        .sameSite("Lax")
                        .build();
                response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, clearCookie.toString());
            }
        }

        request.setAttribute("guestId", activeSessionId);
        request.setAttribute("loggedCustomer", loggedCustomer);
        model.addAttribute("loggedCustomer", loggedCustomer);
        model.addAttribute("customerPendingOrdersCount",
                loggedCustomer != null ? customerService.countPendingOrdersByCustomerId(loggedCustomer.getId()) : 0L);

        // 4. Consultar base de datos del TENANT para Navbar y Colecciones (con fotos en los 3 niveles)
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("navCategories", categoryService.getNavCategories());
        model.addAttribute("categoryImageMap", categoryService.getCategoryImagesMap());

        // 5. Contadores de Bolsa y Favoritos del visitante o comprador autenticado
        model.addAttribute("cartCount", cartManager.getCartCount(activeSessionId));
        model.addAttribute("wishlistCount", wishlistManager.getWishlistCount(activeSessionId));
        model.addAttribute("wishlistProductIds", wishlistManager.getWishlist(activeSessionId));
    }

    /**
     * Un cambio o restablecimiento de contraseña invalida todas las sesiones emitidas antes de ese momento.
     * Se compara a resolución de segundos porque el claim iat del JWT no guarda milisegundos.
     */
    private boolean isTokenIssuedBeforePasswordChange(String token, com.storevo.backend.tenant.model.Customer customer) {
        if (customer.getPasswordChangedAt() == null) {
            return false;
        }
        java.util.Date issuedAt = jwtService.extractCustomerTokenIssuedAt(token);
        if (issuedAt == null) {
            return true;
        }
        long changedAtSeconds = customer.getPasswordChangedAt()
                .atZone(java.time.ZoneId.systemDefault())
                .toEpochSecond();
        long issuedAtSeconds = issuedAt.toInstant().getEpochSecond();
        return issuedAtSeconds < changedAtSeconds;
    }
}