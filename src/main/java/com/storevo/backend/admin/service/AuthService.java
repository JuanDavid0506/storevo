package com.storevo.backend.admin.service;

import com.storevo.backend.admin.dto.AuthResponse;
import com.storevo.backend.admin.dto.LoginRequest;
import com.storevo.backend.admin.dto.RegisterRequest;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.User;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final StoreRegistrationService storeRegistrationService; // Reutilizamos el orquestador de tiendas

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Validar si el email ya existe (puedes agregar validaciones más robustas luego)
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        // 2. Crear la tienda y aprovisionar su esquema de base de datos
        Store newStore = storeRegistrationService.registerNewStore(
                request.getStoreName(),
                request.getSlug(),
                request.getEmail()
        );

        // 3. Crear el usuario dueño de la tienda
        User user = User.builder()
                .name(request.getOwnerName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // ¡Siempre encriptada!
                .store(newStore)
                .role("ROLE_STORE_OWNER")
                .build();

        userRepository.save(user);

        // 4. Generar el Token JWT
        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .storeSlug(newStore.getSlug())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // 1. Spring Security verifica que el email y la contraseña coincidan
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Si pasa la línea anterior, las credenciales son correctas. Buscamos al usuario.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        // 3. Generamos un nuevo token
        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .storeSlug(user.getStore().getSlug())
                .build();
    }
}