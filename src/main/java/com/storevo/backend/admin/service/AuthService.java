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
    private final StoreRegistrationService storeRegistrationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
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
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .storeSlug(user.getStore().getSlug())
                .build();
    }
}