package com.storevo.backend.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

@Service
public class JwtService {

    private static final long EXPIRATION_TIME = 86400000L;
    private static final int MIN_SECRET_BYTES = 32; // 256 bits mínimo

    private static final Set<String> FORBIDDEN_EXAMPLE_SECRETS = Set.of(
            "storevosupersecretkey2026_cambiarenproduccion",
            "4gqkgl4vdcwl0cmflti7b6hfothsenmn",
            "changeme",
            "secret",
            "default_jwt_secret_key_change_me_now",
            "12345678901234567890123456789012"
    );

    private final Key signingKey;

    public JwtService(@Value("${security.jwt.secret}") String secretKey) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("Error crítico de seguridad (C8): La variable de entorno JWT_SECRET es obligatoria y no puede estar vacía.");
        }
        String trimmed = secretKey.trim();
        if (FORBIDDEN_EXAMPLE_SECRETS.contains(trimmed.toLowerCase())) {
            throw new IllegalStateException("Error crítico de seguridad (C8): JWT_SECRET contiene una clave de ejemplo o por defecto prohibida.");
        }
        byte[] keyBytes = trimmed.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("Error crítico de seguridad (C8): JWT_SECRET debe tener al menos 32 bytes (256 bits). Longitud actual: " + keyBytes.length + " bytes.");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        if (claims == null) {
            return null;
        }
        return claimsResolver.apply(claims);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        return expiration != null && expiration.before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSignInKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            return null;
        }
    }

    private Key getSignInKey() {
        return this.signingKey;
    }
}