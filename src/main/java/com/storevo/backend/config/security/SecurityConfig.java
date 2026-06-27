package com.storevo.backend.config.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // ¡NUEVO! Permitimos la ruta /error para que Spring no lance 403 ocultando fallos reales
                        .requestMatchers("/error").permitAll()

                        // Landing Page y Estilos
                        .requestMatchers("/", "/css/**", "/js/**", "/images/**", "/icons/**").permitAll()

                        // Rutas públicas de las tiendas de los clientes
                        .requestMatchers("/s/**").permitAll()

                        // Login y Webhooks
                        .requestMatchers("/login", "/register", "/auth/**").permitAll()
                        .requestMatchers("/api/v1/webhooks/**").permitAll()

                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                // Configuración del Logout
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .logoutSuccessUrl("/") // Redirige a la landing al salir
                        .deleteCookies("jwt")  // ¡Destruye la cookie!
                        .permitAll()
                );

        return http.build();
    }
}