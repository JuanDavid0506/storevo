package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.security.JwtService;
import com.storevo.backend.config.security.RateLimitService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.dto.ThemeConfigDto;
import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.model.StoreReview;
import com.storevo.backend.tenant.repository.StoreReviewRepository;
import com.storevo.backend.tenant.service.CustomerService;
import com.storevo.backend.tenant.service.StoreThemeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/s/{slug}/account")
@RequiredArgsConstructor
public class StoreCustomerAuthController {

    private final CustomerService customerService;
    private final StoreReviewRepository storeReviewRepository;
    private final StoreSettingsService storeSettingsService;
    private final StoreThemeService storeThemeService;
    private final JwtService jwtService;
    private final RateLimitService rateLimitService;

    @Value("${storevo.mail.base-url:http://localhost:8080}")
    private String appBaseUrl;

    @GetMapping
    public String accountDashboard(
            @PathVariable String slug,
            @RequestParam(required = false, defaultValue = "orders") String tab,
            HttpServletRequest request,
            Model model) {

        Customer loggedCustomer = (Customer) request.getAttribute("loggedCustomer");
        if (loggedCustomer == null) {
            return "redirect:/s/" + slug + "/account/login";
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        List<Order> customerOrders = customerService.getOrdersForAuthenticatedCustomer(loggedCustomer.getId());
        List<Order> pendingOnlineOrders = customerOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDING && o.getChannel() == OrderChannel.ONLINE)
                .collect(Collectors.toList());

        Map<Long, StoreReview> reviewsByOrderId = new HashMap<>();
        for (Order order : customerOrders) {
            if (order.getId() != null) {
                storeReviewRepository.findByOrderId(order.getId())
                        .ifPresent(rev -> reviewsByOrderId.put(order.getId(), rev));
            }
        }

        model.addAttribute("customer", loggedCustomer);
        model.addAttribute("customerOrders", customerOrders);
        model.addAttribute("pendingOnlineOrders", pendingOnlineOrders);
        model.addAttribute("reviewsByOrderId", reviewsByOrderId);
        model.addAttribute("activeTab", "profile".equalsIgnoreCase(tab) ? "profile" : "orders");
        model.addAttribute("pageTitle", "Mi Cuenta");
        return "storefront/account/index";
    }

    @GetMapping("/login")
    public String showLoginAndRegisterPage(
            @PathVariable String slug,
            @RequestParam(required = false, defaultValue = "login") String tab,
            @RequestParam(required = false) String redirect,
            HttpServletRequest request,
            Model model) {

        Customer loggedCustomer = (Customer) request.getAttribute("loggedCustomer");
        String safeRedirect = sanitizeRedirect(slug, redirect);
        if (loggedCustomer != null) {
            return "redirect:" + (safeRedirect != null ? safeRedirect : "/s/" + slug + "/account");
        }

        model.addAttribute("activeTab", "register".equalsIgnoreCase(tab) ? "register" : "login");
        model.addAttribute("redirectUrl", safeRedirect);
        model.addAttribute("pageTitle", "register".equalsIgnoreCase(tab) ? "Crear Cuenta" : "Iniciar Sesión");
        return "storefront/account/login";
    }

    @PostMapping("/login")
    public String processCustomerLogin(
            @PathVariable String slug,
            @RequestParam String identifier,
            @RequestParam String password,
            @RequestParam(required = false, defaultValue = "false") Boolean rememberMe,
            @RequestParam(required = false) String redirect,
            HttpServletRequest request,
            HttpServletResponse response,
            RedirectAttributes redirectAttributes) {

        String safeRedirect = sanitizeRedirect(slug, redirect);
        String redirectParam = safeRedirect != null ? "&redirect=" + safeRedirect : "";

        if (!rateLimitService.tryConsumeByIp(request, "cust_login_" + slug, 10, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account/login?tab=login" + redirectParam;
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return "redirect:/";
        }
        TenantContext.setCurrentTenant(store.getSchemaName());

        String rawGuestId = (String) request.getAttribute("rawGuestId");

        try {
            Customer customer = customerService.authenticateCustomer(identifier, password, rawGuestId);
            setCustomerJwtCookie(request, response, store, slug, customer.getId(), Boolean.TRUE.equals(rememberMe));
            redirectAttributes.addFlashAttribute("accountSuccess", "¡Hola de nuevo, " + customer.getName() + "!");
            return "redirect:" + (safeRedirect != null ? safeRedirect : "/s/" + slug + "/account");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("authError", e.getMessage());
            redirectAttributes.addFlashAttribute("lastIdentifier", identifier);
            return "redirect:/s/" + slug + "/account/login?tab=login" + redirectParam;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("authError", "No pudimos iniciar sesión en este momento. Intenta nuevamente.");
            return "redirect:/s/" + slug + "/account/login?tab=login" + redirectParam;
        }
    }

    @PostMapping("/register")
    public String processCustomerRegister(
            @PathVariable String slug,
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam String password,
            @RequestParam(required = false) String confirmPassword,
            @RequestParam(required = false, defaultValue = "true") Boolean rememberMe,
            @RequestParam(required = false) String redirect,
            HttpServletRequest request,
            HttpServletResponse response,
            RedirectAttributes redirectAttributes) {

        String safeRedirect = sanitizeRedirect(slug, redirect);
        String redirectParam = safeRedirect != null ? "&redirect=" + safeRedirect : "";

        if (!rateLimitService.tryConsumeByIp(request, "cust_register_" + slug, 6, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account/login?tab=register" + redirectParam;
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return "redirect:/";
        }
        TenantContext.setCurrentTenant(store.getSchemaName());

        if (confirmPassword != null && !password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("authError", "Las contraseñas no coinciden.");
            redirectAttributes.addFlashAttribute("regName", name);
            redirectAttributes.addFlashAttribute("regEmail", email);
            redirectAttributes.addFlashAttribute("regPhone", phone);
            return "redirect:/s/" + slug + "/account/login?tab=register" + redirectParam;
        }

        String rawGuestId = (String) request.getAttribute("rawGuestId");

        try {
            Customer customer = customerService.registerCustomerAccount(name, email, phone, password, rawGuestId);
            setCustomerJwtCookie(request, response, store, slug, customer.getId(), Boolean.TRUE.equals(rememberMe));
            redirectAttributes.addFlashAttribute(
                    "accountSuccess",
                    "¡Bienvenido(a), " + customer.getName() + "! Tu cuenta ha sido creada y sincronizada."
            );
            return "redirect:" + (safeRedirect != null ? safeRedirect : "/s/" + slug + "/account");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("authError", e.getMessage());
            redirectAttributes.addFlashAttribute("regName", name);
            redirectAttributes.addFlashAttribute("regEmail", email);
            redirectAttributes.addFlashAttribute("regPhone", phone);
            return "redirect:/s/" + slug + "/account/login?tab=register" + redirectParam;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("authError", "No pudimos crear tu cuenta en este momento. Verifica tus datos.");
            return "redirect:/s/" + slug + "/account/login?tab=register" + redirectParam;
        }
    }

    @RequestMapping(value = "/logout", method = {RequestMethod.POST, RequestMethod.GET})
    public String logoutCustomer(
            @PathVariable String slug,
            HttpServletRequest request,
            HttpServletResponse response) {

        clearCustomerJwtCookie(request, response, slug);
        return "redirect:/s/" + slug;
    }

    @PostMapping("/profile")
    public String updateProfile(
            @PathVariable String slug,
            @RequestParam String name,
            @RequestParam String phone,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String document,
            @RequestParam(required = false) String verificationDigit,
            @RequestParam(required = false) String legalName,
            @RequestParam(required = false) String taxRegime,
            @RequestParam(required = false, defaultValue = "false") Boolean requiresElectronicInvoice,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        Customer loggedCustomer = (Customer) request.getAttribute("loggedCustomer");
        if (loggedCustomer == null) {
            return "redirect:/s/" + slug + "/account/login";
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        try {
            customerService.updateAuthenticatedCustomerProfile(
                    loggedCustomer.getId(),
                    name,
                    phone,
                    email,
                    city,
                    address,
                    documentType,
                    document,
                    verificationDigit,
                    legalName,
                    taxRegime,
                    requiresElectronicInvoice
            );
            redirectAttributes.addFlashAttribute("accountSuccess", "Tus datos de envío y facturación se actualizaron correctamente.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("accountError", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("accountError", "No se pudieron actualizar tus datos en este momento.");
        }

        return "redirect:/s/" + slug + "/account?tab=profile";
    }

    @PostMapping("/password")
    public String updatePassword(
            @PathVariable String slug,
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            @RequestParam(required = false) String confirmPassword,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        Customer loggedCustomer = (Customer) request.getAttribute("loggedCustomer");
        if (loggedCustomer == null) {
            return "redirect:/s/" + slug + "/account/login";
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        if (confirmPassword != null && !newPassword.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("accountError", "La confirmación de la nueva contraseña no coincide.");
            return "redirect:/s/" + slug + "/account?tab=profile";
        }

        try {
            customerService.changeCustomerPassword(loggedCustomer.getId(), currentPassword, newPassword);
            redirectAttributes.addFlashAttribute("accountSuccess", "Tu contraseña ha sido actualizada exitosamente.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("accountError", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("accountError", "No se pudo cambiar la contraseña.");
        }

        return "redirect:/s/" + slug + "/account?tab=profile";
    }

    @GetMapping("/forgot-password")
    public String showForgotPasswordPage(@PathVariable String slug, Model model) {
        model.addAttribute("pageTitle", "Recuperar Contraseña");
        return "storefront/account/forgot-password";
    }

    @PostMapping("/forgot-password")
    public String processForgotPassword(
            @PathVariable String slug,
            @RequestParam String emailOrPhone,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        if (!rateLimitService.tryConsumeByIp(request, "cust_forgot_" + slug, 6, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account/forgot-password";
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return "redirect:/";
        }

        TenantContext.clear();
        StoreSettingsDto settings = storeSettingsService.getSettingsByStore(store);
        TenantContext.setCurrentTenant(store.getSchemaName());

        customerService.requestCustomerPasswordReset(emailOrPhone, store, settings, appBaseUrl);

        redirectAttributes.addFlashAttribute(
                "authSuccess",
                "Si tus datos están asociados a un correo en nuestra tienda, te hemos enviado un enlace para crear tu nueva contraseña."
        );
        return "redirect:/s/" + slug + "/account/forgot-password?sent=true";
    }

    @GetMapping("/reset-password")
    public String showResetPasswordPage(
            @PathVariable String slug,
            @RequestParam(required = false) String token,
            HttpServletRequest request,
            Model model,
            RedirectAttributes redirectAttributes) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        if (!customerService.isCustomerResetTokenValid(token)) {
            redirectAttributes.addFlashAttribute(
                    "authError",
                    "El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo."
            );
            return "redirect:/s/" + slug + "/account/forgot-password";
        }

        model.addAttribute("token", token.trim());
        model.addAttribute("pageTitle", "Nueva Contraseña");
        return "storefront/account/reset-password";
    }

    @PostMapping("/reset-password")
    public String processResetPassword(
            @PathVariable String slug,
            @RequestParam String token,
            @RequestParam String password,
            @RequestParam(required = false) String confirmPassword,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        if (confirmPassword != null && !password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("authError", "Las contraseñas no coinciden.");
            return "redirect:/s/" + slug + "/account/reset-password?token=" + token;
        }

        try {
            customerService.resetCustomerPasswordWithToken(token, password);
            redirectAttributes.addFlashAttribute(
                    "authSuccess",
                    "¡Contraseña actualizada con éxito! Ya puedes iniciar sesión en tu cuenta."
            );
            return "redirect:/s/" + slug + "/account/login";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("authError", e.getMessage());
            if (customerService.isCustomerResetTokenValid(token)) {
                return "redirect:/s/" + slug + "/account/reset-password?token=" + token;
            }
            return "redirect:/s/" + slug + "/account/forgot-password";
        }
    }

    private void setCustomerJwtCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            Store store,
            String slug,
            Long customerId,
            boolean rememberMe) {

        String token = jwtService.generateCustomerToken(customerId, store.getSchemaName(), slug, rememberMe);
        long maxAgeSeconds = rememberMe ? (60L * 60 * 24 * 30) : (60L * 60 * 24);

        ResponseCookie cookie = ResponseCookie
                .from(JwtService.buildCustomerCookieName(slug), token)
                .httpOnly(true)
                .secure(request.isSecure())
                .path("/s/" + slug)
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearCustomerJwtCookie(HttpServletRequest request, HttpServletResponse response, String slug) {
        ResponseCookie cookie = ResponseCookie
                .from(JwtService.buildCustomerCookieName(slug), "")
                .httpOnly(true)
                .secure(request.isSecure())
                .path("/s/" + slug)
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String sanitizeRedirect(String slug, String rawRedirect) {
        if (rawRedirect == null || rawRedirect.isBlank()) {
            return null;
        }
        String clean = rawRedirect.trim();
        String expectedPrefix = "/s/" + slug;
        if (clean.startsWith(expectedPrefix) && !clean.startsWith("//") && !clean.contains("://")) {
            return clean;
        }
        return null;
    }
}