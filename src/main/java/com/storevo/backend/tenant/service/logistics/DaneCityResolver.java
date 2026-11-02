package com.storevo.backend.tenant.service.logistics;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.Map;

@Component
public class DaneCityResolver {

    private static final Map<String, String> CITY_CODES = new HashMap<>();

    static {
        CITY_CODES.put("bogota", "11001000");
        CITY_CODES.put("medellin", "05001000");
        CITY_CODES.put("cali", "76001000");
        CITY_CODES.put("barranquilla", "08001000");
        CITY_CODES.put("cartagena", "13001000");
        CITY_CODES.put("cucuta", "54001000");
        CITY_CODES.put("bucaramanga", "68001000");
        CITY_CODES.put("pereira", "66001000");
        CITY_CODES.put("santa marta", "47001000");
        CITY_CODES.put("ibague", "73001000");
        CITY_CODES.put("manizales", "17001000");
        CITY_CODES.put("villavicencio", "50001000");
        CITY_CODES.put("pasto", "52001000");
        CITY_CODES.put("monteria", "23001000");
        CITY_CODES.put("neiva", "41001000");
        CITY_CODES.put("armenia", "63001000");
        CITY_CODES.put("popayan", "19001000");
        CITY_CODES.put("sincelejo", "70001000");
        CITY_CODES.put("valledupar", "20001000");
        CITY_CODES.put("tunja", "15001000");
        CITY_CODES.put("riohacha", "44001000");
        CITY_CODES.put("quibdo", "27001000");
        CITY_CODES.put("florencia", "18001000");
        CITY_CODES.put("yopal", "85001000");
        CITY_CODES.put("arauca", "81001000");
        CITY_CODES.put("mocoa", "86001000");
        CITY_CODES.put("san andres", "88001000");
        CITY_CODES.put("leticia", "91001000");
        CITY_CODES.put("soledad", "08758000");
        CITY_CODES.put("bello", "05088000");
        CITY_CODES.put("itagui", "05360000");
        CITY_CODES.put("envigado", "05266000");
        CITY_CODES.put("sabaneta", "05631000");
        CITY_CODES.put("soacha", "25754000");
        CITY_CODES.put("chia", "25175000");
        CITY_CODES.put("dosquebradas", "66170000");
        CITY_CODES.put("floridablanca", "68276000");
        CITY_CODES.put("palmira", "76520000");
        CITY_CODES.put("turbaco", "13836000");
    }

    public String resolve(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            throw new RuntimeException("No se puede generar la guía: falta la ciudad de destino en el pedido.");
        }
        String normalized = normalize(cityName);
        String code = CITY_CODES.get(normalized);
        if (code == null) {
            throw new RuntimeException("No se pudo determinar el código DANE para la ciudad '" + cityName
                    + "'. Verifica que el nombre esté bien escrito, o agrega esa ciudad al catálogo de DaneCityResolver.");
        }
        return code;
    }

    private String normalize(String text) {
        return normalizeStatic(text);
    }

    public static String normalizeStatic(String text) {
        String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", ""); // quita tildes
        return withoutAccents
                .toLowerCase()
                .replaceAll("d\\.?c\\.?", "") // "D.C." al final de Bogotá
                .replaceAll("[^a-z ]", "")
                .trim()
                .replaceAll("\\s+", " ");
    }
}