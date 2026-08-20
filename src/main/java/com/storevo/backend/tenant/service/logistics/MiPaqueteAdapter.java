package com.storevo.backend.tenant.service.logistics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.storevo.backend.admin.model.Feature;
import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.admin.service.TenantPlanService;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.Shipment;
import com.storevo.backend.tenant.dto.ShipmentLabelResponse;
import com.storevo.backend.tenant.dto.ShipmentQuoteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MiPaqueteAdapter implements CarrierAdapter {

    private final TenantPlanService tenantPlanService;
    private final StoreIntegrationRepository integrationRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public boolean supports(String carrierCode) {
        return "MI_PAQUETE".equalsIgnoreCase(carrierCode);
    }

    @Override
    public List<ShipmentQuoteResponse> quoteShipment(Store store, String originCode, String destCode, double weight, String dimensions) {
        tenantPlanService.validateFeatureOrThrow(store, Feature.SHIPPING_INTEGRATION);
        StoreIntegration config = getIntegrationConfig(store);

        int[] dims = parseDimensions(dimensions);

        try {
            ObjectNode payload = mapper.createObjectNode();
            payload.put("originLocationCode", originCode);
            payload.put("destinyLocationCode", destCode);
            payload.put("height", dims[0]);
            payload.put("width", dims[1]);
            payload.put("length", dims[2]);
            payload.put("weight", (int) Math.ceil(weight));
            payload.put("quantity", 1);
            payload.put("declaredValue", 50000); // Valor declarado por defecto

            HttpHeaders headers = buildHeaders(config.getApiKey());
            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(payload), headers);

            String url = getApiUrl(config.getEnvironment()) + "/quoteShipping";
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.POST, entity, JsonNode.class);

            List<ShipmentQuoteResponse> quotes = new ArrayList<>();
            if (response.getBody() != null && response.getBody().isArray()) {
                for (JsonNode node : response.getBody()) {
                    int minutes = node.path("shippingTime").asInt();
                    int days = Math.max(1, minutes / 1440);

                    quotes.add(ShipmentQuoteResponse.builder()
                            .carrierName(node.path("deliveryCompanyName").asText())
                            .carrierCode(node.path("deliveryCompanyId").asText())
                            .price(node.path("shippingCost").asDouble())
                            .estimatedDays(days + (days == 1 ? " día hábil" : " días hábiles"))
                            .build());
                }
            }
            return quotes;
        } catch (Exception e) {
            System.out.println("Error cotizando en Mi Paquete: " + e.getMessage());
            return new ArrayList<>(); // Fallback a envío manual
        }
    }

    @Override
    public ShipmentLabelResponse createLabel(Store store, Order order, String carrierCode, double weight, String dimensions) {
        tenantPlanService.validateFeatureOrThrow(store, Feature.SHIPPING_INTEGRATION);
        StoreIntegration config = getIntegrationConfig(store);

        int[] dims = parseDimensions(dimensions);

        try {
            ObjectNode payload = mapper.createObjectNode();

            // 1. Sender (Remitente)
            ObjectNode sender = mapper.createObjectNode();
            sender.put("name", store.getName());
            sender.put("surname", "Tienda");
            sender.put("cellPhone", "3000000000"); // Dato por defecto a actualizar luego
            sender.put("prefix", "+57");
            sender.put("email", "ventas@storevo.com");
            sender.put("pickupAddress", "Dirección de bodega por defecto");
            sender.put("nit", "900000000");
            sender.put("nitType", "NIT");
            payload.set("sender", sender);

            // 2. Receiver (Destinatario)
            ObjectNode receiver = mapper.createObjectNode();
            String[] names = order.getCustomerName().split(" ", 2);
            receiver.put("name", names[0]);
            receiver.put("surname", names.length > 1 ? names[1] : ".");
            receiver.put("email", "cliente@correo.com");
            receiver.put("prefix", "+57");
            receiver.put("cellPhone", order.getCustomerPhone());
            receiver.put("destinationAddress", order.getAddress() + ", " + order.getCity());
            receiver.put("nit", "0");
            receiver.put("nitType", "CC");
            payload.set("receiver", receiver);

            // 3. Product Info
            ObjectNode productInfo = mapper.createObjectNode();
            productInfo.put("quantity", 1);
            productInfo.put("height", dims[0]);
            productInfo.put("width", dims[1]);
            productInfo.put("large", dims[2]);
            productInfo.put("weight", (int) Math.ceil(weight));
            productInfo.put("forbiddenProduct", true);
            productInfo.put("productReference", "ORDEN-" + order.getId());
            productInfo.put("declaredValue", (int) Math.round(order.getTotal()));
            payload.set("productInformation", productInfo);

            // 4. Locate (DANE codes por defecto Bogotá para compilar, a actualizar a futuro)
            ObjectNode locate = mapper.createObjectNode();
            locate.put("originDaneCode", "11001000");
            locate.put("destinyDaneCode", "11001000");
            payload.set("locate", locate);

            // 5. Datos Generales
            payload.put("channel", store.getName());
            payload.put("deliveryCompany", carrierCode);
            payload.put("criteria", "price");
            payload.put("description", "Venta online");
            payload.put("comments", order.getNotes() != null ? order.getNotes() : "");
            payload.put("paymentType", 101); // Pago con saldo
            payload.put("valueCollection", 0);
            payload.put("requestPickup", false);

            ObjectNode adminData = mapper.createObjectNode();
            adminData.put("saleValue", 0);
            payload.set("adminTransactionData", adminData);

            // EJECUCIÓN
            HttpHeaders headers = buildHeaders(config.getApiKey());
            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(payload), headers);
            String url = getApiUrl(config.getEnvironment()) + "/createSending";

            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.POST, entity, JsonNode.class);
            JsonNode body = response.getBody();

            if (body == null || !body.has("mpCode")) {
                throw new RuntimeException("Respuesta inválida de Mi Paquete");
            }

            // Según la documentación, devuelve un mpCode. La guía real llega luego por webhook.
            String mpCode = body.get("mpCode").asText();

            return ShipmentLabelResponse.builder()
                    .trackingNumber("PENDIENTE-" + mpCode) // Se actualizará cuando llegue el webhook
                    .externalShipmentId(mpCode)
                    .labelPdfUrl("Procesando...")
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Error al generar la guía con Mi Paquete: " + e.getMessage());
        }
    }

    @Override
    public String getTrackingStatus(Shipment shipment) {
        return "EN RUTA";
    }

    // --- METODOS AUXILIARES ---

    private int[] parseDimensions(String dimensions) {
        int[] dims = {10, 10, 10}; // Alto, ancho, largo por defecto
        if (dimensions != null && dimensions.contains("x")) {
            try {
                String[] parts = dimensions.toLowerCase().split("x");
                dims[0] = Integer.parseInt(parts[0].trim());
                dims[1] = Integer.parseInt(parts[1].trim());
                dims[2] = Integer.parseInt(parts[2].trim());
            } catch (Exception e) {
                // Ignorar y usar defaults si el formato está roto
            }
        }
        return dims;
    }

    private StoreIntegration getIntegrationConfig(Store store) {
        return integrationRepository.findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.MI_PAQUETE)
                .orElseThrow(() -> new RuntimeException("Integración de Mi Paquete no configurada."));
    }

    private HttpHeaders buildHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", apiKey);
        headers.set("session-tracker", UUID.randomUUID().toString());
        return headers;
    }

    private String getApiUrl(String environment) {
        return "PRODUCTION".equals(environment)
                ? "https://api-v2.mpr.mipaquete.com"
                : "https://api-v2.dev.mpr.mipaquete.com";
    }
}