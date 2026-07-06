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
        // Validación 1: Correo duplicado
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        // Validación 2: Slug/Enlace duplicado (Evita el error SQL 1062)
        if (storeRepository.findBySlug(request.getSlug()).isPresent()) {
            throw new RuntimeException("El enlace de la tienda ya está en uso");
        }

        // Creación neutra de la tienda
        Store newStore = storeRegistrationService.registerNewStore(
                request.getStoreName(),
                request.getSlug(),
                request.getEmail()
        );

        User user = User.builder()
                .name(request.getOwnerName())
                .email(request.getEmail())
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