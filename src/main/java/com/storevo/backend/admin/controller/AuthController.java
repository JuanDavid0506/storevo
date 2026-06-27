package com.storevo.backend.admin.controller;

import com.storevo.backend.admin.dto.AuthResponse;
import com.storevo.backend.admin.dto.LoginRequest;
import com.storevo.backend.admin.dto.RegisterRequest;
import com.storevo.backend.admin.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public String register(@ModelAttribute RegisterRequest request, HttpServletResponse response) {
        try {
            AuthResponse authResponse = authService.register(request);
            setJwtCookie(response, authResponse.getToken());
            return "redirect:/dashboard";
        } catch (Exception e) {
            return "redirect:/register?error=true";
        }
    }

    @PostMapping("/login")
    public String login(@ModelAttribute LoginRequest request, HttpServletResponse response) {
        try {
            AuthResponse authResponse = authService.login(request);
            setJwtCookie(response, authResponse.getToken());
            return "redirect:/dashboard";
        } catch (Exception e) {
            return "redirect:/login?error=true"; // Contraseña o usuario incorrecto
        }
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true); // El navegador no dejará que Javascript lea esto (Antirrobo)
        cookie.setPath("/"); // Disponible en toda la aplicación
        cookie.setMaxAge(24 * 60 * 60); // Expira en 1 día
        // cookie.setSecure(true); // ¡Descomentar cuando subas a producción con HTTPS!
        response.addCookie(cookie);
    }
}