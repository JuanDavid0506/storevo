package com.storevo.backend.config.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    // Inyectamos la clave secreta desde el application.yml
    @Value("${security.jwt.secret:StorevoSuperSecretKey2026_CambiarEnProduccion}")
    private String secretKey;

    // Tiempo de expiración del token (Ejemplo: 24 horas)
    private static final long EXPIRATION_TIME = 86400000;

    public String generateToken(UserDetails userDetails) {
        Algorithm algorithm = Algorithm.HMAC256(secretKey);
        return JWT.create()
                .withSubject(userDetails.getUsername()) // Guardamos el email como identificador principal
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .sign(algorithm);
    }

    public String extractUsername(String token) {
        try {
            DecodedJWT decodedJWT = verifyToken(token);
            return decodedJWT.getSubject();
        } catch (JWTVerificationException exception) {
            return null; // Si el token es inválido o expiró
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return (username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        DecodedJWT decodedJWT = verifyToken(token);
        return decodedJWT.getExpiresAt().before(new Date());
    }

    private DecodedJWT verifyToken(String token) {
        Algorithm algorithm = Algorithm.HMAC256(secretKey);
        return JWT.require(algorithm)
                .build()
                .verify(token);
    }
}