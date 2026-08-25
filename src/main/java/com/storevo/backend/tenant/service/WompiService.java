package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.admin.model.Feature;
import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.admin.service.TenantPlanService;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.dto.WompiCheckoutData;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
@RequiredArgsConstructor
public class WompiService {

    private final TenantPlanService tenantPlanService;
    private final StoreIntegrationRepository integrationRepository;

    // Prueba la llave PÚBLICA contra el endpoint público de Wompi (no necesita la
    // llave privada, así que sirve para validar al instante que se copió bien la
    // llave pública y que corresponde al ambiente elegido, antes de que un cliente
    // real intente pagar. No valida la llave privada ni el secreto de eventos —
    // esos solo se pueden confirmar completando una transacción real.
    public String testPublicKeyConnection(String publicKey, String environment) {
        if (publicKey == null || publicKey.isBlank()) {
            throw new RuntimeException("Pega primero tu llave pública antes de probar la conexión.");
        }

        String baseUrl = "PRODUCTION".equals(environment)
                ? "https://production.wompi.co/v1/merchants/"
                : "https://sandbox.wompi.co/v1/merchants/";

        try {
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(baseUrl + publicKey.trim(), JsonNode.class);

            if (response.getBody() != null && response.getBody().has("data")) {
                JsonNode data = response.getBody().get("data");
                String merchantName = data.has("name") ? data.get("name").asText() : "Comercio verificado";
                return merchantName;
            }
            throw new RuntimeException("Wompi respondió pero no devolvió los datos esperados.");
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Wompi rechazó la llave pública (¿la copiaste completa? ¿es del ambiente correcto?).");
        } catch (Exception e) {
            throw new RuntimeException("No se pudo conectar con Wompi: " + e.getMessage());
        }
    }

    public WompiCheckoutData prepareCheckout(Store store, Order order) {

        // 1. EL PORTERO: Validar si la tienda pagó por esta funcionalidad
        tenantPlanService.validateFeatureOrThrow(store, Feature.ONLINE_PAYMENTS);

        // 2. LA BÓVEDA: Extraer credenciales dinámicas de la tienda
        StoreIntegration wompiConfig = integrationRepository
                .findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI)
                .orElseThrow(() -> new RuntimeException("La integración de pagos con Wompi no está configurada o está inactiva para esta tienda."));

        // 3. DATOS DE LA TRANSACCIÓN
        String publicKey = wompiConfig.getApiKey();
        String integritySecret = wompiConfig.getApiSecret(); // Secreto de integridad
        String environment = wompiConfig.getEnvironment();
        String currency = "COP";

        // Referencia única
        String reference = "STOREVO-" + order.getId() + "-" + System.currentTimeMillis();

        // Convertimos el Double total exacto de tu entidad Order a centavos
        long amountInCents = (long) (order.getTotal() * 100);

        // 4. GENERAR FIRMA SHA-256
        String signature = generateSignature(reference, amountInCents, currency, integritySecret);

        return WompiCheckoutData.builder()
                .publicKey(publicKey)
                .reference(reference)
                .signature(signature)
                .amountInCents(amountInCents)
                .currency(currency)
                .environment(environment)
                .build();
    }

    private String generateSignature(String reference, long amountInCents, String currency, String secret) {
        try {
            // Wompi exige concatenar: Referencia + Monto en Centavos + Moneda + Secreto de Integridad
            String rawString = reference + amountInCents + currency + secret;

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawString.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generando firma de Wompi", e);
        }
    }
}