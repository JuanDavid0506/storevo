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
            // Redirigimos usando el slug que viene en la respuesta del AuthService
            return "redirect:/dashboard/" + authResponse.getStoreSlug();
        } catch (Exception e) {
            return "redirect:/auth/register?error=true";
        }
    }

    @PostMapping("/login")
    public String login(@ModelAttribute LoginRequest request, HttpServletResponse response) {
        try {
            AuthResponse authResponse = authService.login(request);
            setJwtCookie(response, authResponse.getToken());
            // Redirigimos usando el slug que viene en la respuesta del AuthService
            return "redirect:/dashboard/" + authResponse.getStoreSlug();
        } catch (Exception e) {
            return "redirect:/auth/login?error=true";
        }
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60);
        response.addCookie(cookie);
    }
}