package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.storevo.backend.tenant.model.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThemeSectionDto {
    private String id;
    private String type;

    @Builder.Default
    private Boolean enabled = true;

    @Builder.Default
    private Map<String, Object> settings = new LinkedHashMap<>();

    // Lista hidratada en tiempo de ejecución para vitrinas de productos (no se guarda en el JSON)
    @JsonIgnore
    @Builder.Default
    private List<Product> resolvedProducts = new ArrayList<>();

    public String settingStr(String key, String defaultValue) {
        if (settings == null || !settings.containsKey(key) || settings.get(key) == null) {
            return defaultValue;
        }
        String val = String.valueOf(settings.get(key)).trim();
        return val.isEmpty() ? defaultValue : val;
    }

    public int settingInt(String key, int defaultValue) {
        if (settings == null || !settings.containsKey(key) || settings.get(key) == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(String.valueOf(settings.get(key)).trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public Long settingLong(String key) {
        if (settings == null || !settings.containsKey(key) || settings.get(key) == null) {
            return null;
        }
        try {
            String raw = String.valueOf(settings.get(key)).trim();
            return raw.isEmpty() ? null : Long.parseLong(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public boolean settingBool(String key, boolean defaultValue) {
        if (settings == null || !settings.containsKey(key) || settings.get(key) == null) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(settings.get(key)).trim());
    }
}