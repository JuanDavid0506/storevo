package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.storevo.backend.tenant.model.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

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

    /** Indica si es una sección principal obligatoria de la página (no se puede eliminar ni duplicar) */
    @Builder.Default
    private Boolean locked = false;

    @Builder.Default
    private Map<String, Object> settings = new LinkedHashMap<>();

    // Lista hidratada en tiempo de ejecución para vitrinas de productos (no se guarda en el JSON)
    @JsonIgnore
    @Builder.Default
    private List<Product> resolvedProducts = new ArrayList<>();

    @JsonIgnore
    @Builder.Default
    private Long resolvedTotalProducts = 0L;

    @JsonIgnore
    @Builder.Default
    private Integer resolvedPageSize = 12;

    @JsonIgnore
    @Builder.Default
    private Integer resolvedCurrentPage = 1;

    @JsonIgnore
    @Builder.Default
    private Integer resolvedTotalPages = 1;

    @JsonIgnore
    @Builder.Default
    private Boolean resolvedHasNext = false;

    @JsonIgnore
    private Long resolvedNextCursor;

    // Nombres de marcas resueltos en tiempo de ejecución (carrusel de marcas automático)
    @JsonIgnore
    @Builder.Default
    private List<String> resolvedBrands = new ArrayList<>();

    @JsonIgnore
    @Builder.Default
    private Map<String, String> resolvedBrandLogos = new LinkedHashMap<>();

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

    public String frameStyle(String base) {
        if (settings == null || base == null || base.isBlank()) return null;
        String fit = "contain".equals(settingStr(base + "Fit", "cover")) ? "contain" : "cover";
        int x = Math.max(0, Math.min(100, settingInt(base + "PosX", 50)));
        int y = Math.max(0, Math.min(100, settingInt(base + "PosY", 50)));
        int zoom = Math.max(100, Math.min(250, settingInt(base + "Zoom", 100)));
        if ("cover".equals(fit) && x == 50 && y == 50 && zoom == 100) return null;
        StringBuilder css = new StringBuilder();
        css.append("object-fit:").append(fit)
                .append(";object-position:").append(x).append("% ").append(y).append("%");
        if (zoom != 100) {
            css.append(";scale:").append(zoom / 100.0)
                    .append(";transform-origin:").append(x).append("% ").append(y).append("%");
        }
        return css.toString();
    }
    public List<Long> settingLongList(String key) {
        if (settings == null || !settings.containsKey(key) || settings.get(key) == null) {
            return new ArrayList<>();
        }
        Object raw = settings.get(key);
        List<Long> result = new ArrayList<>();
        if (raw instanceof Collection<?> col) {
            for (Object item : col) {
                if (item == null) continue;
                try {
                    long val = Long.parseLong(String.valueOf(item).trim());
                    if (val > 0 && !result.contains(val)) {
                        result.add(val);
                    }
                } catch (NumberFormatException ignored) {}
            }
        } else {
            String str = String.valueOf(raw).trim();
            if (!str.isEmpty()) {
                for (String part : str.split(",")) {
                    try {
                        long val = Long.parseLong(part.trim());
                        if (val > 0 && !result.contains(val)) {
                            result.add(val);
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return result;
    }
}