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
import com.storevo.backend.tenant.service.CustomerEmailVerificationService;
import com.storevo.backend.tenant.service.CustomerService;
import com.storevo.backend.tenant.service.EmailVerificationPolicy;
import com.storevo.backend.tenant.service.PasswordPolicy;
import com.storevo.backend.tenant.service.StoreThemeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
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
    private final CustomerEmailVerificationService verificationService;
    private final EmailVerificationPolicy verificationPolicy;

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

        // Barrera de verificación: SOLO el portal. Comprar (carrito/checkout) con una cuenta sin verificar sigue funcionando.
        EmailVerificationPolicy.Access access = verificationPolicy.accessFor(loggedCustomer, LocalDateTime.now());
        if (access == EmailVerificationPolicy.Access.BLOCKED) {
            return renderVerificationRequired(loggedCustomer, model);
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
        model.addAttribute("activeTab", resolveAccountTab(tab));
        model.addAttribute("orderStats", buildOrderStats(customerOrders));
        model.addAttribute("pageTitle", "Mi Cuenta");
        addPasswordPolicy(model);
        if (access == EmailVerificationPolicy.Access.GRACE) {
            addGraceBanner(model, loggedCustomer);
        }
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
        addPasswordPolicy(model);
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

    @GetMapping("/register")
    public String showRegisterPage(@PathVariable String slug, @RequestParam(required = false) String redirect) {
        String safeRedirect = sanitizeRedirect(slug, redirect);
        return "redirect:/s/" + slug + "/account/login?tab=register"
                + (safeRedirect != null ? "&redirect=" + safeRedirect : "");
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
            String welcome = "¡Bienvenido(a), " + customer.getName() + "! Tu cuenta ha sido creada y sincronizada.";
            if (verificationPolicy.isEnabled()) {
                // La sesión se inicia igual (se puede comprar), pero el portal exige verificar el correo
                issueVerificationSafely(customer.getId(), store);
                welcome = "¡Bienvenido(a), " + customer.getName() + "! Te enviamos un enlace a "
                        + CustomerEmailVerificationService.maskEmail(customer.getEmail()) + " para verificar tu correo.";
            }
            redirectAttributes.addFlashAttribute("accountSuccess", welcome);
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

    @PostMapping("/logout")
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

        if (!rateLimitService.tryConsumeByIp(request, "cust_profile_" + slug, 10, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("accountError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account?tab=shipping";
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        if (verificationPolicy.accessFor(loggedCustomer, LocalDateTime.now()) == EmailVerificationPolicy.Access.BLOCKED) {
            return "redirect:/s/" + slug + "/account";
        }

        try {
            Customer updated = customerService.updateAuthenticatedCustomerProfile(
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
            String success = "Tus datos de envío y facturación se actualizaron correctamente.";
            boolean emailChanged = updated.getEmail() != null
                    && (loggedCustomer.getEmail() == null || !loggedCustomer.getEmail().equalsIgnoreCase(updated.getEmail()));
            if (emailChanged && verificationPolicy.isEnabled() && store != null) {
                // Un correo nuevo no hereda la verificación del anterior: se envía un enlace al correo nuevo
                CustomerEmailVerificationService.SendResult sent = issueVerificationSafely(updated.getId(), store);
                success += sent == CustomerEmailVerificationService.SendResult.SENT
                        ? " Te enviamos un enlace para verificar tu nuevo correo."
                        : " Tu nuevo correo debe verificarse: solicita el enlace desde el aviso de verificación.";
            }
            redirectAttributes.addFlashAttribute("accountSuccess", success);
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("accountError", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("accountError", "No se pudieron actualizar tus datos en este momento.");
        }

        return "redirect:/s/" + slug + "/account?tab=shipping";
    }

    @PostMapping("/password")
    public String updatePassword(
            @PathVariable String slug,
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            @RequestParam(required = false) String confirmPassword,
            HttpServletRequest request,
            HttpServletResponse response,
            RedirectAttributes redirectAttributes) {

        Customer loggedCustomer = (Customer) request.getAttribute("loggedCustomer");
        if (loggedCustomer == null) {
            return "redirect:/s/" + slug + "/account/login";
        }

        if (!rateLimitService.tryConsumeByIp(request, "cust_password_" + slug, 5, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("accountError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account?tab=security";
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        if (verificationPolicy.accessFor(loggedCustomer, LocalDateTime.now()) == EmailVerificationPolicy.Access.BLOCKED) {
            return "redirect:/s/" + slug + "/account";
        }

        if (confirmPassword != null && !newPassword.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("accountError", "La confirmación de la nueva contraseña no coincide.");
            return "redirect:/s/" + slug + "/account?tab=security";
        }

        try {
            customerService.changeCustomerPassword(loggedCustomer.getId(), currentPassword, newPassword);
            // El cambio invalida las sesiones anteriores (password_changed_at); se emite una nueva para este dispositivo
            if (store != null) {
                setCustomerJwtCookie(request, response, store, slug, loggedCustomer.getId(), false);
            }
            redirectAttributes.addFlashAttribute("accountSuccess", "Tu contraseña ha sido actualizada exitosamente.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("accountError", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("accountError", "No se pudo cambiar la contraseña.");
        }

        return "redirect:/s/" + slug + "/account?tab=security";
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

        if (!rateLimitService.tryConsumeByIp(request, "cust_reset_view_" + slug, 20, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account/forgot-password";
        }

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
        addPasswordPolicy(model);
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

        if (!rateLimitService.tryConsumeByIp(request, "cust_reset_submit_" + slug, 6, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account/forgot-password";
        }

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

    // =========================================================================
    // VERIFICACIÓN DE CORREO
    // =========================================================================

    /** Página a la que llega el comprador desde el enlace del correo: pide confirmar con un botón (un GET no consume el token). */
    @GetMapping("/verify-email")
    public String showVerifyEmail(
            @PathVariable String slug,
            @RequestParam(required = false) String token,
            HttpServletRequest request,
            Model model,
            RedirectAttributes redirectAttributes) {

        if (!rateLimitService.tryConsumeByIp(request, "cust_verify_view_" + slug, 20, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account/login";
        }
        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        CustomerEmailVerificationService.TokenState state = verificationService.inspectToken(token);
        model.addAttribute("verifyState", state.name());
        model.addAttribute("token", state == CustomerEmailVerificationService.TokenState.VALID ? token.trim() : null);
        model.addAttribute("pageTitle", "Verificar correo");
        return "storefront/account/verify-email";
    }

    @PostMapping("/verify-email")
    public String processVerifyEmail(
            @PathVariable String slug,
            @RequestParam String token,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        if (!rateLimitService.tryConsumeByIp(request, "cust_verify_submit_" + slug, 10, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/account/login";
        }
        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        CustomerEmailVerificationService.Verification result = verificationService.verifyWithToken(token);
        if (result.result() == CustomerEmailVerificationService.VerifyResult.VERIFIED) {
            Customer logged = (Customer) request.getAttribute("loggedCustomer");
            boolean sameSession = logged != null && logged.getId() != null && logged.getId().equals(result.customerId());
            if (sameSession) {
                redirectAttributes.addFlashAttribute("accountSuccess", "¡Correo verificado! Ya puedes usar tu cuenta con normalidad.");
                return "redirect:/s/" + slug + "/account";
            }
            redirectAttributes.addFlashAttribute("authSuccess", "¡Correo verificado! Inicia sesión para entrar a tu cuenta.");
            return "redirect:/s/" + slug + "/account/login";
        }
        // Vencido o ya usado: la página del enlace explica qué pasó y ofrece pedir uno nuevo
        return "redirect:/s/" + slug + "/account/verify-email?token=" + URLEncoder.encode(token == null ? "" : token.trim(), StandardCharsets.UTF_8);
    }

    /**
     * Reenvío del enlace de verificación. Con sesión: a la cuenta de la sesión. Sin sesión (p. ej. enlace vencido): por correo, y la
     * respuesta es SIEMPRE la misma exista o no la cuenta (no se revela qué correos están registrados).
     */
    @PostMapping("/resend-verification")
    public String resendVerification(
            @PathVariable String slug,
            @RequestParam(required = false) String email,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        Customer logged = (Customer) request.getAttribute("loggedCustomer");
        String back = logged != null ? "/s/" + slug + "/account" : "/s/" + slug + "/account/login";

        if (!rateLimitService.tryConsumeByIp(request, "cust_verify_resend_" + slug, 5, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute(logged != null ? "accountError" : "authError", RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:" + back;
        }
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return "redirect:/";
        }
        TenantContext.setCurrentTenant(store.getSchemaName());

        if (logged != null) {
            CustomerEmailVerificationService.SendResult sent = issueVerificationSafely(logged.getId(), store);
            switch (sent) {
                case SENT -> redirectAttributes.addFlashAttribute("accountSuccess",
                        "Te enviamos un nuevo enlace a " + CustomerEmailVerificationService.maskEmail(logged.getEmail()) + ". Revisa también la carpeta de spam.");
                case COOLDOWN -> redirectAttributes.addFlashAttribute("accountError",
                        "Ya te enviamos un enlace hace un momento. Espera " + Math.max(1, verificationService.secondsUntilResend(logged))
                                + " segundos para pedir otro.");
                default -> redirectAttributes.addFlashAttribute("accountSuccess", "Tu correo ya está verificado.");
            }
            return "redirect:" + back;
        }

        try {
            StoreSettingsDto settings = loadSettings(store);
            verificationService.resendForEmail(email, store, settings, appBaseUrl);
        } catch (Exception e) {
            log.warn("No se pudo reenviar la verificación de correo en la tienda '{}': {}", slug, e.getMessage());
        }
        redirectAttributes.addFlashAttribute("authSuccess",
                "Si existe una cuenta pendiente de verificación con ese correo, te enviamos un nuevo enlace.");
        return "redirect:" + back;
    }

    /**
     * Corrige el correo de una cuenta SIN verificar (p. ej. se escribió mal al registrarse). Sin esta salida, quien se equivoca al
     * escribirlo quedaría atrapado en la pantalla de verificación. El correo nuevo vuelve a quedar sin verificar y recibe un enlace.
     */
    @PostMapping("/change-unverified-email")
    public String changeUnverifiedEmail(
            @PathVariable String slug,
            @RequestParam String email,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        Customer logged = (Customer) request.getAttribute("loggedCustomer");
        if (logged == null) {
            return "redirect:/s/" + slug + "/account/login";
        }
        String back = "redirect:/s/" + slug + "/account";

        if (!rateLimitService.tryConsumeByIp(request, "cust_verify_email_change_" + slug, 5, Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("accountError", RateLimitService.RATE_LIMIT_MESSAGE);
            return back;
        }
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return "redirect:/";
        }
        TenantContext.setCurrentTenant(store.getSchemaName());

        if (logged.getEmailVerifiedAt() != null) {
            return back; // ya verificado: el cambio de correo se hace desde "Datos de envío"
        }

        try {
            Customer updated = customerService.updateAuthenticatedCustomerProfile(
                    logged.getId(), null, null, email, null, null, null, null, null, null, null, null);
            CustomerEmailVerificationService.SendResult sent = issueVerificationSafely(updated.getId(), store);
            redirectAttributes.addFlashAttribute("accountSuccess", sent == CustomerEmailVerificationService.SendResult.SENT
                    ? "Actualizamos tu correo y te enviamos un enlace a " + CustomerEmailVerificationService.maskEmail(updated.getEmail()) + "."
                    : "Actualizamos tu correo. Pide el enlace nuevo en unos segundos con «Reenviar enlace de verificación».");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("accountError", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("accountError", "No se pudo cambiar el correo en este momento.");
        }
        return back;
    }

    /** Pantalla única que ve el portal cuando el correo no está verificado y no hay plazo de gracia. */
    private String renderVerificationRequired(Customer customer, Model model) {
        model.addAttribute("customer", customer);
        model.addAttribute("maskedEmail", CustomerEmailVerificationService.maskEmail(customer.getEmail()));
        model.addAttribute("resendWaitSeconds", verificationService.secondsUntilResend(customer));
        model.addAttribute("pageTitle", "Verifica tu correo");
        return "storefront/account/verify-required";
    }

    /** Aviso persistente de las cuentas existentes que aún están dentro del plazo de gracia. */
    private void addGraceBanner(Model model, Customer customer) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> banner = new LinkedHashMap<>();
        banner.put("daysLeft", verificationPolicy.graceDaysLeft(now));
        banner.put("deadline", verificationPolicy.graceDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        banner.put("maskedEmail", CustomerEmailVerificationService.maskEmail(customer.getEmail()));
        banner.put("resendWaitSeconds", verificationService.secondsUntilResend(customer, now));
        model.addAttribute("emailVerificationGrace", banner);
    }

    /** Emite y envía el enlace sin romper el flujo del comprador si algo falla (correo caído, esquema, etc.). */
    private CustomerEmailVerificationService.SendResult issueVerificationSafely(Long customerId, Store store) {
        try {
            StoreSettingsDto settings = loadSettings(store);
            return verificationService.issueAndSend(customerId, store, settings, appBaseUrl);
        } catch (Exception e) {
            log.warn("No se pudo emitir la verificación de correo (cliente {}): {}", customerId, e.getMessage());
            return CustomerEmailVerificationService.SendResult.NOT_APPLICABLE;
        } finally {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }
    }

    private StoreSettingsDto loadSettings(Store store) {
        String tenant = store.getSchemaName();
        try {
            TenantContext.clear();
            return storeSettingsService.getSettingsByStore(store);
        } finally {
            TenantContext.setCurrentTenant(tenant);
        }
    }

    /**
     * Publica la política de contraseñas (única fuente de verdad: {@link PasswordPolicy}) para que las plantillas
     * generen la lista de requisitos y el JS de validación en tiempo real con exactamente las reglas del servidor.
     */
    private static void addPasswordPolicy(Model model) {
        model.addAttribute("passwordRules", PasswordPolicy.rules());
        model.addAttribute("passwordRulesJson", PasswordPolicy.rulesJson());
    }

    private static final Set<String> ACCOUNT_TABS = Set.of("orders", "shipping", "billing", "security");

    /** Sección activa del portal. "profile" se conserva como alias de "shipping" por compatibilidad con enlaces antiguos. */
    static String resolveAccountTab(String rawTab) {
        if (rawTab == null) {
            return "orders";
        }
        String tab = rawTab.trim().toLowerCase(Locale.ROOT);
        if ("profile".equals(tab)) {
            return "shipping";
        }
        return ACCOUNT_TABS.contains(tab) ? tab : "orders";
    }

    /**
     * Indicadores del encabezado calculados EXCLUSIVAMENTE desde los pedidos que se muestran al comprador
     * (no desde Customer.totalOrders/totalSpent, que también cuentan pedidos de invitado que el portal no expone).
     * "En curso" = pedidos que aún no terminaron: ni entregados, ni cancelados, ni reembolsados.
     */
    static Map<String, Long> buildOrderStats(List<Order> shownOrders) {
        long total = 0;
        long inProgress = 0;
        long delivered = 0;
        if (shownOrders != null) {
            for (Order order : shownOrders) {
                if (order == null) {
                    continue;
                }
                total++;
                OrderStatus status = order.getStatus();
                if (status == OrderStatus.DELIVERED) {
                    delivered++;
                } else if (status != OrderStatus.CANCELLED && status != OrderStatus.REFUNDED) {
                    inProgress++;
                }
            }
        }
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("inProgress", inProgress);
        stats.put("delivered", delivered);
        return stats;
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