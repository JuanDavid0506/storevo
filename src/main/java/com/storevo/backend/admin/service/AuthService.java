package com.storevo.backend.admin.service;

import com.storevo.backend.admin.dto.AuthResponse;
import com.storevo.backend.admin.dto.LoginRequest;
import com.storevo.backend.admin.dto.RegisterRequest;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.User;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.repository.UserRepository;
import com.storevo.backend.config.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final StoreRegistrationService storeRegistrationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.storevo.backend.tenant.service.EmailNotificationService emailNotificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : "";
        if (cleanEmail.isEmpty()) {
            throw new RuntimeException("El correo electrónico es obligatorio");
        }

        // Validación 1: Correo duplicado
        if (userRepository.findByEmail(cleanEmail).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        // Validación 2: Formato de slug y colisión de slug o de schemaName normalizado
        String normalizedSlug = storeRegistrationService.normalizeAndValidateSlug(request.getSlug());
        String candidateSchema = storeRegistrationService.buildSchemaNameFromSlug(normalizedSlug);

        if (storeRepository.existsBySlug(normalizedSlug) || storeRepository.existsBySchemaName(candidateSchema)) {
            throw new RuntimeException("El enlace de la tienda ya está en uso");
        }

        // Creación neutra de la tienda con validación de esquema físico en MySQL
        Store newStore = storeRegistrationService.registerNewStore(
                request.getStoreName(),
                normalizedSlug,
                cleanEmail
        );

        User user = User.builder()
                .name(request.getOwnerName() != null ? request.getOwnerName().trim() : "")
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .store(newStore)
                .role("ROLE_STORE_OWNER")
                .build();

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .storeSlug(newStore.getSlug())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Si la contraseña está mal, esta línea lanza excepción y redirige al ?error=true
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Si pasó la autenticación, buscamos al usuario para generarle el JWT
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .storeSlug(user.getStore().getSlug())
                .build();
    }

    @Transactional
    public void requestPasswordReset(String rawEmail, String baseUrl) {
        if (rawEmail == null || rawEmail.isBlank()) {
            return;
        }
        String cleanEmail = rawEmail.trim().toLowerCase(java.util.Locale.ROOT);
        com.storevo.backend.config.tenant.TenantContext.clear();

        userRepository.findByEmail(cleanEmail).ifPresent(user -> {
            String token = java.util.UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordExpiresAt(java.time.LocalDateTime.now().plusMinutes(30));
            userRepository.save(user);

            String cleanBase = (baseUrl != null && !baseUrl.isBlank())
                    ? (baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl)
                    : "http://localhost:8080";
            String resetLink = cleanBase + "/reset-password?token=" + token;
            emailNotificationService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
        });
    }

    @Transactional(readOnly = true)
    public boolean isResetPasswordTokenValid(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        com.storevo.backend.config.tenant.TenantContext.clear();
        return userRepository.findByResetPasswordToken(token.trim())
                .filter(u -> u.getResetPasswordExpiresAt() != null
                        && u.getResetPasswordExpiresAt().isAfter(java.time.LocalDateTime.now()))
                .isPresent();
    }

    @Transactional
    public void resetPasswordWithToken(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("El enlace de recuperación no es válido o ha expirado.");
        }
        if (newPassword == null || newPassword.trim().length() < 8) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 8 caracteres.");
        }
        com.storevo.backend.config.tenant.TenantContext.clear();

        User user = userRepository.findByResetPasswordToken(token.trim())
                .orElseThrow(() -> new IllegalArgumentException("El enlace de recuperación no es válido o ya fue utilizado."));

        if (user.getResetPasswordExpiresAt() == null
                || !user.getResetPasswordExpiresAt().isAfter(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace de recuperación ha expirado. Solicita uno nuevo.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiresAt(null);
        userRepository.save(user);
    }
}