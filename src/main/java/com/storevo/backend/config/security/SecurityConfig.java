package com.storevo.backend.config.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
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
                // Permite cargar el iframe de previsualización de la tienda dentro del mismo dominio (Editor Visual)
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                )
                .authorizeHttpRequests(auth -> auth
                        // Permitimos la ruta /error para que Spring no lance 403 ocultando fallos reales
                        .requestMatchers("/error").permitAll()
                        // Landing Page, Recursos Estáticos, Imágenes y Plantillas de Tema
                        .requestMatchers("/", "/css/**", "/js/**", "/img/**", "/images/**", "/icons/**", "/uploads/**", "/theme-templates/**").permitAll()
                        // Rutas públicas de las tiendas de los clientes
                        .requestMatchers("/s/**").permitAll()
                        // Login y Webhooks
                        .requestMatchers("/login", "/register", "/auth/**").permitAll()
                        .requestMatchers("/api/v1/webhooks/**", "/api/webhooks/**").permitAll()
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
                        .logoutSuccessUrl("/")
                        .deleteCookies("jwt")
                        .permitAll()
                );

        return http.build();
    }
}