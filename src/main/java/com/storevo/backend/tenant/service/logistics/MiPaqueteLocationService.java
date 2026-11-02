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

@Component
@Slf4j
public class MiPaqueteLocationService {

    private static final String ENV_PRODUCTION = "PRODUCTION";
    private static final String ENV_SANDBOX = "SANDBOX";

    private final RestTemplate restTemplate = new RestTemplate();

    // Caché aislada por ambiente (PRODUCTION vs SANDBOX/DEV) para evitar contaminación entre tiendas
    private final Map<String, Map<String, String>> cacheByEnvironment = new ConcurrentHashMap<>();

    private String normalizeEnvironment(String environment) {
        return ENV_PRODUCTION.equalsIgnoreCase(environment != null ? environment.trim() : "")
                ? ENV_PRODUCTION
                : ENV_SANDBOX;
    }

    public synchronized void ensureLoaded(String apiKey, String environment) {
        if (apiKey == null || apiKey.isBlank()) {
            return;
        }
        String envKey = normalizeEnvironment(environment);
        Map<String, String> envCache = cacheByEnvironment.computeIfAbsent(envKey, k -> new ConcurrentHashMap<>());
        if (!envCache.isEmpty()) {
            return;
        }

        try {
            String baseUrl = ENV_PRODUCTION.equals(envKey)
                    ? "https://api-v2.mpr.mipaquete.com"
                    : "https://api-v2.dev.mpr.mipaquete.com";

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", apiKey.trim());
            headers.set("session-tracker", UUID.randomUUID().toString());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    baseUrl + "/getLocations", HttpMethod.GET, entity, JsonNode.class);

            if (response.getBody() != null && response.getBody().isArray()) {
                Map<String, String> loaded = new ConcurrentHashMap<>();
                for (JsonNode node : response.getBody()) {
                    String name = node.path("locationName").asText(null);
                    String code = node.path("locationCode").asText(null);
                    if (name != null && code != null && !name.isBlank() && !code.isBlank()) {
                        loaded.put(DaneCityResolver.normalizeStatic(name), code);
                    }
                }
                if (!loaded.isEmpty()) {
                    envCache.putAll(loaded);
                    log.info("MiPaqueteLocationService [{}]: catálogo de ciudades cargado ({} ciudades).", envKey, envCache.size());
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo cargar el catálogo de ciudades de Mi Paquete [{}], se usará el catálogo estático de respaldo: {}", envKey, e.getMessage());
        }
    }

    public String resolve(String cityName, String environment) {
        if (cityName == null || cityName.isBlank()) {
            return null;
        }
        String normalizedCity = DaneCityResolver.normalizeStatic(cityName);
        String envKey = normalizeEnvironment(environment);
        Map<String, String> envCache = cacheByEnvironment.get(envKey);
        return (envCache != null) ? envCache.get(normalizedCity) : null;
    }

    public String resolve(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            return null;
        }
        String normalizedCity = DaneCityResolver.normalizeStatic(cityName);
        Map<String, String> prodCache = cacheByEnvironment.get(ENV_PRODUCTION);
        if (prodCache != null && prodCache.containsKey(normalizedCity)) {
            return prodCache.get(normalizedCity);
        }
        Map<String, String> sandboxCache = cacheByEnvironment.get(ENV_SANDBOX);
        return (sandboxCache != null) ? sandboxCache.get(normalizedCity) : null;
    }
}