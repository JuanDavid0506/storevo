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
    private final StoreRepository storeRepository; // Añadimos esto para validar el slug
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final StoreRegistrationService storeRegistrationService;

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
                // Usar getters explícitos evita los bloqueos de Hibernate Lazy Loading
                .storeSlug(user.getStore().getSlug())
                .build();
    }
}