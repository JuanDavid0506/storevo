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

    private static final String TOKEN_TYPE_CLAIM = "typ";
    private static final String STORE_CUSTOMER_TOKEN_TYPE = "STORE_CUSTOMER";
    private static final long CUSTOMER_DEFAULT_EXPIRATION_MS = 24L * 60 * 60 * 1000L; // 24 horas
    private static final long CUSTOMER_REMEMBER_ME_EXPIRATION_MS = 30L * 24 * 60 * 60 * 1000L; // 30 días

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Genera un JWT exclusivo para un comprador autenticado en una tienda específica (/s/{slug}).
     * Incluye claims obligatorios de aislamiento multi-tenant (typ, tenant, slug, cid).
     */
    public String generateCustomerToken(Long customerId, String tenantSchema, String storeSlug, boolean rememberMe) {
        if (customerId == null || tenantSchema == null || tenantSchema.isBlank() || storeSlug == null || storeSlug.isBlank()) {
            throw new IllegalArgumentException("Datos insuficientes para generar token de comprador.");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_TYPE_CLAIM, STORE_CUSTOMER_TOKEN_TYPE);
        claims.put("tenant", tenantSchema.trim());
        claims.put("slug", storeSlug.trim());
        claims.put("cid", customerId);

        long ttl = rememberMe ? CUSTOMER_REMEMBER_ME_EXPIRATION_MS : CUSTOMER_DEFAULT_EXPIRATION_MS;
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .setClaims(claims)
                .setSubject("cust:" + customerId)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ttl))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Valida criptográficamente el token del comprador y verifica que pertenezca
     * exactamente al esquema y slug de la tienda actual. Devuelve el ID del Customer o null si no es válido.
     */
    public Long extractValidatedCustomerId(String token, String expectedTenantSchema, String expectedSlug) {
        if (token == null || token.isBlank() || expectedTenantSchema == null || expectedSlug == null) {
            return null;
        }
        final Claims claims = extractAllClaims(token);
        if (claims == null || isTokenExpired(token)) {
            return null;
        }
        Object typ = claims.get(TOKEN_TYPE_CLAIM);
        if (!STORE_CUSTOMER_TOKEN_TYPE.equals(typ)) {
            return null;
        }
        String tokenTenant = claims.get("tenant", String.class);
        String tokenSlug = claims.get("slug", String.class);
        if (!expectedTenantSchema.trim().equals(tokenTenant) || !expectedSlug.trim().equalsIgnoreCase(tokenSlug)) {
            return null;
        }
        Object rawCid = claims.get("cid");
        if (rawCid instanceof Number num) {
            return num.longValue();
        }
        if (rawCid instanceof String str) {
            try {
                return Long.parseLong(str.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    public static String buildCustomerCookieName(String slug) {
        String safeSlug = (slug != null) ? slug.trim().toLowerCase().replaceAll("[^a-z0-9_-]", "_") : "default";
        return "storevo_cust_" + safeSlug;
    }

    public String extractUsername(String token) {
        final Claims claims = extractAllClaims(token);
        if (claims == null) {
            return null;
        }
        // Defensa adicional: un token de comprador jamás debe autenticar en el filtro de comerciantes
        if (STORE_CUSTOMER_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE_CLAIM))) {
            return null;
        }
        return claims.getSubject();
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