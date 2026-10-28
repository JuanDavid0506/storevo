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

    // Pestañas hidratadas en tiempo de ejecución para product_grid (no se guarda en el JSON)
    @JsonIgnore
    @Builder.Default
    private List<Map<String, Object>> resolvedTabs = new ArrayList<>();

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

    public java.time.LocalDateTime parseScheduleDateTime(String key) {
        String raw = settingStr(key, "");
        if (raw.isEmpty()) return null;
        try {
            String normalized = raw.length() == 16 ? raw + ":00" : raw;
            return java.time.LocalDateTime.parse(normalized, java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean hasSchedule() {
        if ("catalog_results".equalsIgnoreCase(type) || "product_main".equalsIgnoreCase(type)) {
            return false;
        }
        return parseScheduleDateTime("scheduleStart") != null || parseScheduleDateTime("scheduleEnd") != null;
    }

    @JsonIgnore
    public String getScheduleState() {
        if ("catalog_results".equalsIgnoreCase(type) || "product_main".equalsIgnoreCase(type)) {
            return "NONE";
        }
        java.time.LocalDateTime start = parseScheduleDateTime("scheduleStart");
        java.time.LocalDateTime end = parseScheduleDateTime("scheduleEnd");
        if (start == null && end == null) {
            return "NONE";
        }
        if (start != null && end != null && end.isBefore(start)) {
            end = null;
        }
        java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("America/Bogota"));
        if (start != null && now.isBefore(start)) {
            return "UPCOMING";
        }
        if (end != null && !now.isBefore(end)) {
            return "EXPIRED";
        }
        return "ACTIVE";
    }

    @JsonIgnore
    public boolean isScheduleActiveNow() {
        String state = getScheduleState();
        return !"UPCOMING".equals(state) && !"EXPIRED".equals(state);
    }

    @JsonIgnore
    public String getScheduleBadgeLabel() {
        String state = getScheduleState();
        if ("NONE".equals(state)) return "";
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        java.time.LocalDateTime start = parseScheduleDateTime("scheduleStart");
        java.time.LocalDateTime end = parseScheduleDateTime("scheduleEnd");
        if ("UPCOMING".equals(state) && start != null) {
            return "Programada · Inicia " + start.format(fmt) + " (Oculta en tienda)";
        }
        if ("EXPIRED".equals(state) && end != null) {
            return "Finalizada · Terminó " + end.format(fmt) + " (Oculta en tienda)";
        }
        if (end != null) {
            return "Programada · Activa hasta " + end.format(fmt);
        }
        if (start != null) {
            return "Programada · Activa desde " + start.format(fmt);
        }
        return "Programación activa";
    }

    public String bgImageStyle() {
        if (settings == null || !"image".equals(settingStr("layoutBgMode", "none"))) {
            return null;
        }
        String rawUrl = settingStr("layoutBgImageUrl", "");
        if (rawUrl.isEmpty() || rawUrl.length() > 500) {
            return null;
        }
        String lower = rawUrl.toLowerCase(Locale.ROOT);
        boolean validProtocol = lower.startsWith("https://") || lower.startsWith("http://")
                || (rawUrl.startsWith("/") && !rawUrl.startsWith("//"));
        if (!validProtocol || rawUrl.contains("'") || rawUrl.contains("\"") || rawUrl.contains("(") || rawUrl.contains(")")) {
            return null;
        }
        int overlay = Math.max(0, Math.min(90, settingInt("layoutBgOverlay", 40)));
        String fit = "contain".equals(settingStr("layoutBgImageFit", "cover")) ? "contain" : "cover";
        int x = Math.max(0, Math.min(100, settingInt("layoutBgImagePosX", 50)));
        int y = Math.max(0, Math.min(100, settingInt("layoutBgImagePosY", 50)));

        StringBuilder css = new StringBuilder();
        if (overlay > 0) {
            String alpha = String.format(Locale.US, "%.2f", overlay / 100.0);
            css.append("background-image:linear-gradient(rgba(15,23,42,").append(alpha)
                    .append("),rgba(15,23,42,").append(alpha).append(")),url('").append(rawUrl).append("');");
        } else {
            css.append("background-image:url('").append(rawUrl).append("');");
        }
        css.append("background-size:").append(fit).append(";")
                .append("background-position:").append(x).append("% ").append(y).append("%;")
                .append("background-repeat:no-repeat;");
        return css.toString();
    }

    @JsonIgnore
    public boolean isCountdownExpired() {
        java.time.LocalDateTime endDt = parseScheduleDateTime("endDate");
        if (endDt == null) {
            return false;
        }
        java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("America/Bogota"));
        return !now.isBefore(endDt);
    }

    @JsonIgnore
    public boolean isWhatsappOpenNow() {
        try {
            java.time.ZonedDateTime now = java.time.ZonedDateTime.now(java.time.ZoneId.of("America/Bogota"));
            java.time.DayOfWeek dow = now.getDayOfWeek();
            String daysMode = settingStr("scheduleDays", "MON_SAT").toUpperCase(Locale.ROOT);
            boolean dayMatches = switch (daysMode) {
                case "MON_FRI" -> dow != java.time.DayOfWeek.SATURDAY && dow != java.time.DayOfWeek.SUNDAY;
                case "ALL_DAYS" -> true;
                default -> dow != java.time.DayOfWeek.SUNDAY;
            };
            if (!dayMatches) return false;
            String openStr = settingStr("openTime", "08:00");
            String closeStr = settingStr("closeTime", "18:00");
            java.time.LocalTime openTime = java.time.LocalTime.parse(openStr);
            java.time.LocalTime closeTime = java.time.LocalTime.parse(closeStr);
            java.time.LocalTime currentTime = now.toLocalTime();
            if (closeTime.isAfter(openTime)) {
                return !currentTime.isBefore(openTime) && !currentTime.isAfter(closeTime);
            }
            return !currentTime.isBefore(openTime) || !currentTime.isAfter(closeTime);
        } catch (Exception e) {
            return true;
        }
    }
}