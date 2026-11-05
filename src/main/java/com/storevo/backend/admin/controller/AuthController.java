package com.storevo.backend.admin.controller;

import com.storevo.backend.admin.dto.AuthResponse;
import com.storevo.backend.admin.dto.LoginRequest;
import com.storevo.backend.admin.dto.RegisterRequest;
import com.storevo.backend.admin.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.storevo.backend.config.security.RateLimitService rateLimitService;

    @PostMapping("/auth/register")
    public String register(@ModelAttribute RegisterRequest request, HttpServletResponse response) {
        try {
            AuthResponse authResponse = authService.register(request);
            setJwtCookie(response, authResponse.getToken());
            return "redirect:/dashboard/" + authResponse.getStoreSlug();
        } catch (Exception e) {
            System.err.println("❌ ERROR DURANTE EL REGISTRO:");
            e.printStackTrace();
            return "redirect:/register?error=true";
        }
    }

    @PostMapping("/auth/login")
    public String login(
            @ModelAttribute LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response,
            RedirectAttributes redirectAttributes) {

        if (!rateLimitService.tryConsumeByIp(httpRequest, "auth_login", 8, java.time.Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("rateLimitError", com.storevo.backend.config.security.RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/login?rateLimit=true";
        }

        try {
            AuthResponse authResponse = authService.login(request);
            setJwtCookie(response, authResponse.getToken());
            return "redirect:/dashboard/" + authResponse.getStoreSlug();
        } catch (Exception e) {
            System.err.println("❌ ERROR DURANTE EL LOGIN:");
            e.printStackTrace();
            return "redirect:/login?error=true";
        }
    }

    @GetMapping({"/forgot-password", "/auth/forgot-password"})
    public String showForgotPasswordForm() {
        return "forgot-password";
    }

    @PostMapping({"/forgot-password", "/auth/forgot-password"})
    public String processForgotPassword(
            @RequestParam String email,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        if (!rateLimitService.tryConsumeByIp(request, "auth_forgot_password", 8, java.time.Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("errorMessage", com.storevo.backend.config.security.RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/forgot-password";
        }

        String baseUrl = resolveBaseUrl(request);
        authService.requestPasswordReset(email, baseUrl);
        redirectAttributes.addFlashAttribute(
                "successMessage",
                "Si el correo ingresado está registrado en Storevo, recibirás un enlace para restablecer tu contraseña en los próximos minutos."
        );
        return "redirect:/forgot-password?sent=true";
    }

    @GetMapping({"/reset-password", "/auth/reset-password"})
    public String showResetPasswordForm(
            @RequestParam(required = false) String token,
            Model model,
            RedirectAttributes redirectAttributes) {

        if (!authService.isResetPasswordTokenValid(token)) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    "El enlace de recuperación no es válido o ha expirado. Por favor solicita uno nuevo."
            );
            return "redirect:/forgot-password";
        }
        model.addAttribute("token", token.trim());
        return "reset-password";
    }

    @PostMapping({"/reset-password", "/auth/reset-password"})
    public String processResetPassword(
            @RequestParam String token,
            @RequestParam String password,
            @RequestParam(required = false) String confirmPassword,
            RedirectAttributes redirectAttributes) {

        try {
            if (confirmPassword != null && !password.equals(confirmPassword)) {
                redirectAttributes.addFlashAttribute("errorMessage", "Las contraseñas no coinciden.");
                return "redirect:/reset-password?token=" + token;
            }
            authService.resetPasswordWithToken(token, password);
            redirectAttributes.addFlashAttribute(
                    "resetSuccessMessage",
                    "¡Tu contraseña ha sido actualizada exitosamente! Ya puedes iniciar sesión."
            );
            return "redirect:/login?resetSuccess=true";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            if (authService.isResetPasswordTokenValid(token)) {
                return "redirect:/reset-password?token=" + token;
            }
            return "redirect:/forgot-password";
        }
    }

    private String resolveBaseUrl(HttpServletRequest request) {
        String scheme = request.getHeader("X-Forwarded-Proto") != null
                ? request.getHeader("X-Forwarded-Proto")
                : request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String portSuffix = (serverPort == 80 || serverPort == 443) ? "" : ":" + serverPort;
        return scheme + "://" + serverName + portSuffix;
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }
}