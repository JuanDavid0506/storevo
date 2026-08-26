package com.storevo.backend.tenant.service.logistics;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

// Trae el catálogo completo de ciudades con código DANE directamente desde
// GET /getLocations de Mi Paquete (documentado por ellos mismos) y lo guarda en
// memoria. Es el mismo catálogo para todo el país sin importar la tienda, así que
// basta con cargarlo una sola vez por arranque de la aplicación, con la llave de
// cualquier tienda que ya tenga Mi Paquete activo.
//
// Si la carga falla (todavía ninguna tienda configuró su API key, problema de red,
// etc.), MiPaqueteAdapter cae de vuelta al catálogo estático de DaneCityResolver
// — nunca se rompe la generación de guías solo porque este catálogo en vivo no
// haya podido cargarse todavía.
@Component
@Slf4j
public class MiPaqueteLocationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, String> cache = new ConcurrentHashMap<>();
    private volatile boolean loadAttempted = false;

    // Intenta cargar el catálogo completo si todavía no se ha cargado (o si el
    // intento anterior falló). Es seguro llamarlo en cada guía: después del primer
    // éxito, no vuelve a golpear la API.
    public synchronized void ensureLoaded(String apiKey, String environment) {
        if (!cache.isEmpty()) return;

        try {
            String baseUrl = "PRODUCTION".equals(environment)
                    ? "https://api-v2.mpr.mipaquete.com"
                    : "https://api-v2.dev.mpr.mipaquete.com";

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", apiKey);
            headers.set("session-tracker", UUID.randomUUID().toString());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    baseUrl + "/getLocations", HttpMethod.GET, entity, JsonNode.class);

            if (response.getBody() != null && response.getBody().isArray()) {
                for (JsonNode node : response.getBody()) {
                    String name = node.path("locationName").asText(null);
                    String code = node.path("locationCode").asText(null);
                    if (name != null && code != null && !name.isBlank() && !code.isBlank()) {
                        cache.put(DaneCityResolver.normalizeStatic(name), code);
                    }
                }
                log.info("MiPaqueteLocationService: catálogo de ciudades cargado ({} ciudades).", cache.size());
            }
        } catch (Exception e) {
            log.warn("No se pudo cargar el catálogo de ciudades de Mi Paquete, se usará el catálogo estático de respaldo: {}", e.getMessage());
        } finally {
            loadAttempted = true;
        }
    }

    // Devuelve el código DANE si el catálogo en vivo ya se cargó y contiene esa
    // ciudad; null si no (el llamador debe caer al catálogo estático en ese caso).
    public String resolve(String cityName) {
        if (cityName == null || cityName.isBlank()) return null;
        return cache.get(DaneCityResolver.normalizeStatic(cityName));
    }
}