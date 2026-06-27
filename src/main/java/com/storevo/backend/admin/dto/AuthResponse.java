package com.storevo.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token; // El JWT
    private String storeSlug; // Útil para que el frontend sepa a qué subdominio redirigir
}