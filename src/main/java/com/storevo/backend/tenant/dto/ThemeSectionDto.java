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

    @JsonIgnore
    public int getLayoutBgOverlayClamped() {
        return Math.max(0, Math.min(90, settingInt("layoutBgOverlay", 40)));
    }

    public String resolveViewAllHref(String slug) {
        String safeSlug = slug != null ? slug : "";
        String src = settingStr("source", "NEWEST").toUpperCase(Locale.ROOT);
        Long catId = settingLong("categoryId");
        String brandName = settingStr("brandName", "");
        return buildCatalogHrefForSource(safeSlug, src, catId, brandName);
    }

    public String resolveTabHref(String slug, Map<String, Object> tab) {
        String safeSlug = slug != null ? slug : "";
        if (tab == null) return "/s/" + safeSlug + "/catalog";
        String src = tab.get("source") != null ? String.valueOf(tab.get("source")).toUpperCase(Locale.ROOT) : "NEWEST";
        Long catId = null;
        if (tab.get("categoryId") instanceof Number num) {
            catId = num.longValue();
        } else if (tab.get("categoryId") != null) {
            try {
                catId = Long.parseLong(String.valueOf(tab.get("categoryId")).trim());
            } catch (NumberFormatException ignored) {}
        }
        String brandName = tab.get("brandName") != null ? String.valueOf(tab.get("brandName")).trim() : "";
        return buildCatalogHrefForSource(safeSlug, src, catId, brandName);
    }

    private String buildCatalogHrefForSource(String slug, String src, Long catId, String brandName) {
        String base = "/s/" + slug + "/catalog";
        if ("CATEGORY".equals(src) && catId != null) {
            return base + "?category=" + catId;
        }
        if ("BRAND".equals(src) && brandName != null && !brandName.isEmpty()) {
            return base + "?q=" + java.net.URLEncoder.encode(brandName, java.nio.charset.StandardCharsets.UTF_8);
        }
        if ("OFFERS".equals(src)) {
            return base + "?offers=true";
        }
        if ("FEATURED".equals(src)) {
            return base + "?featured=true";
        }
        return base;
    }

    public String effectiveMobileImageUrl(String baseKey) {
        if (baseKey == null || baseKey.isBlank()) return "";
        String directMob = settingStr(baseKey + "MobileUrl", "");
        if (!directMob.isEmpty()) return directMob;
        if ("image".equals(baseKey)) {
            String legacy = settingStr("mobileImageUrl", "");
            if (!legacy.isEmpty()) return legacy;
        } else if (baseKey.endsWith("Image")) {
            String prefix = baseKey.substring(0, baseKey.length() - 5);
            String legacy = settingStr(prefix + "MobileImageUrl", "");
            if (!legacy.isEmpty()) return legacy;
        }
        return settingStr(baseKey + "Url", "");
    }

    public String mobileFrameStyle(String baseKey) {
        if (baseKey == null || baseKey.isBlank()) return "";
        String mobPrefix = baseKey + "Mobile";
        boolean hasDirectMobFrame = settings != null && (
                settings.containsKey(mobPrefix + "Fit") ||
                        settings.containsKey(mobPrefix + "PosX") ||
                        settings.containsKey(mobPrefix + "PosY") ||
                        settings.containsKey(mobPrefix + "Zoom")
        );
        if (hasDirectMobFrame) {
            return frameStyle(mobPrefix);
        }
        if ("image".equals(baseKey)) {
            boolean hasLegacyHeroMob = settings != null && (
                    settings.containsKey("mobileImageFit") ||
                            settings.containsKey("mobileImagePosX") ||
                            settings.containsKey("mobileImagePosY") ||
                            settings.containsKey("mobileImageZoom")
            );
            if (hasLegacyHeroMob) return frameStyle("mobileImage");
        } else if (baseKey.endsWith("Image")) {
            String prefix = baseKey.substring(0, baseKey.length() - 5) + "MobileImage";
            boolean hasLegacySlideMob = settings != null && (
                    settings.containsKey(prefix + "Fit") ||
                            settings.containsKey(prefix + "PosX") ||
                            settings.containsKey(prefix + "PosY") ||
                            settings.containsKey(prefix + "Zoom")
            );
            if (hasLegacySlideMob) return frameStyle(prefix);
        }
        String pcUrl = settingStr(baseKey + "Url", "");
        String mobUrl = effectiveMobileImageUrl(baseKey);
        if (!mobUrl.isEmpty() && !mobUrl.equals(pcUrl)) {
            return "object-fit:cover;object-position:50% 50%;";
        }
        return frameStyle(baseKey);
    }

    public List<Map<String, Object>> getHeroSlides(String storeName, boolean isDraftPreview) {
        String safeStore = (storeName != null && !storeName.isBlank()) ? storeName : "Tienda";
        int count = Math.max(1, Math.min(5, settingInt("slideCount", 1)));
        List<Map<String, Object>> list = new ArrayList<>();

        String s1PcImg = settingStr("imageUrl", "");
        String s1MobImg = effectiveMobileImageUrl("image");
        Map<String, Object> s1 = new LinkedHashMap<>();
        s1.put("idx", 1);
        s1.put("img", !s1PcImg.isEmpty() ? s1PcImg : s1MobImg);
        s1.put("mobImg", !s1MobImg.isEmpty() ? s1MobImg : s1PcImg);
        s1.put("imgFrame", frameStyle("image"));
        s1.put("mobFrame", mobileFrameStyle("image"));
        s1.put("badge", settingStr("badgeText", ""));
        s1.put("title", settingStr("title", "Bienvenido a " + safeStore));
        s1.put("subtitle", settingStr("subtitle", "Explora nuestro catálogo y descubre los mejores productos diseñados para ti."));
        s1.put("btnText", settingStr("buttonText", "Ver Catálogo"));
        s1.put("btnUrl", settingStr("buttonUrl", "/catalog").trim());
        s1.put("secText", settingStr("secondaryButtonText", ""));
        s1.put("secUrl", settingStr("secondaryButtonUrl", "/catalog").trim());
        list.add(s1);

        String[] fallbackTitles = {
                "", "",
                "Slide 2 — Promoción Destacada",
                "Slide 3 — Nueva Colección",
                "Slide 4 — Especial de Temporada",
                "Slide 5 — Lanzamiento Exclusivo"
        };

        for (int i = 2; i <= count; i++) {
            String p = "slide" + i;
            String baseKey = p + "Image";
            String img = settingStr(baseKey + "Url", "");
            String mobImg = effectiveMobileImageUrl(baseKey);
            String title = settingStr(p + "Title", "");
            String sub = settingStr(p + "Subtitle", "");
            boolean hasContent = !title.isEmpty() || !img.isEmpty() || !mobImg.isEmpty() || !sub.isEmpty();
            if (!hasContent && !isDraftPreview) continue;

            Map<String, Object> sl = new LinkedHashMap<>();
            sl.put("idx", i);
            sl.put("img", !img.isEmpty() ? img : mobImg);
            sl.put("mobImg", !mobImg.isEmpty() ? mobImg : img);
            sl.put("imgFrame", frameStyle(baseKey));
            sl.put("mobFrame", mobileFrameStyle(baseKey));
            sl.put("badge", settingStr(p + "BadgeText", ""));
            sl.put("title", !title.isEmpty() ? title : fallbackTitles[i]);
            sl.put("subtitle", sub);
            sl.put("btnText", settingStr(p + "ButtonText", "Ver Catálogo"));
            sl.put("btnUrl", settingStr(p + "ButtonUrl", "/catalog").trim());
            sl.put("secText", settingStr(p + "SecondaryButtonText", ""));
            sl.put("secUrl", settingStr(p + "SecondaryButtonUrl", "/catalog").trim());
            list.add(sl);
        }
        return list;
    }

    @JsonIgnore
    public List<Map<String, Object>> getMultiBannerCards() {
        int count = Math.max(2, Math.min(4, settingInt("cardCount", 2)));
        String[] defBadges = { "Destacado", "Ofertas", "Exclusivo", "Recomendado" };
        String[] defTitles = { "Nueva Temporada", "Descuentos Especiales", "Edición Limitada", "Favoritos del Mes" };
        String[] defSubs = {
                "Conoce los últimos ingresos",
                "Referencias seleccionadas a precios únicos",
                "Diseños pensados para destacar",
                "Los más pedidos por nuestros clientes"
        };
        String[] defBtns = { "Explorar", "Ver ofertas", "Descubrir", "Ver colección" };
        String[] defBgs = { "#1e293b", "#4f46e5", "#0f766e", "#be123c" };

        List<Map<String, Object>> cards = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            String p = "card" + i;
            String baseKey = p + "Image";
            String pcImg = settingStr(baseKey + "Url", "");
            String mobImg = effectiveMobileImageUrl(baseKey);
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("idx", i);
            c.put("badge", settingStr(p + "Badge", defBadges[i - 1]));
            c.put("title", settingStr(p + "Title", defTitles[i - 1]));
            c.put("sub", settingStr(p + "Subtitle", defSubs[i - 1]));
            c.put("btn", settingStr(p + "ButtonText", defBtns[i - 1]));
            c.put("url", settingStr(p + "ButtonUrl", "/catalog").trim());
            c.put("img", !pcImg.isEmpty() ? pcImg : mobImg);
            c.put("mobImg", !mobImg.isEmpty() ? mobImg : pcImg);
            c.put("bg", settingStr(p + "BgColor", defBgs[i - 1]));
            c.put("frame", frameStyle(baseKey));
            c.put("mobFrame", mobileFrameStyle(baseKey));
            cards.add(c);
        }
        return cards;
    }

    @JsonIgnore
    public List<Map<String, Object>> getTrustBadgeItems() {
        String[] defIcons = { "shield", "truck", "chat", "star", "refresh", "card" };
        String[] defTitles = {
                "Compra 100% Segura",
                "Envíos a Todo el País",
                "Atención Personalizada",
                "", "", ""
        };
        String[] defTexts = {
                "Tus datos y pedidos están protegidos en todo momento.",
                "Despachamos tu pedido rápido con transportadoras aliadas.",
                "Resolvemos tus dudas directamente por WhatsApp.",
                "", "", ""
        };
        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            String title = settingStr("item" + i + "Title", defTitles[i - 1]);
            if (title.isEmpty()) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("icon", settingStr("item" + i + "Icon", defIcons[i - 1]));
            item.put("title", title);
            item.put("text", settingStr("item" + i + "Text", defTexts[i - 1]));
            list.add(item);
        }
        return list;
    }

    @JsonIgnore
    public List<Map<String, Object>> getManualTestimonialItems() {
        List<Map<String, Object>> list = new ArrayList<>();
        if (settings == null || !(settings.get("manualItems") instanceof Collection<?> col)) {
            return list;
        }
        for (Object obj : col) {
            if (!(obj instanceof Map<?, ?> raw)) continue;
            String author = raw.get("authorName") != null ? String.valueOf(raw.get("authorName")).trim() : "";
            String meta = raw.get("authorMeta") != null ? String.valueOf(raw.get("authorMeta")).trim() : "";
            String text = raw.get("text") != null ? String.valueOf(raw.get("text")).trim() : "";
            String source = raw.get("sourceType") != null ? String.valueOf(raw.get("sourceType")).trim() : "direct";
            boolean auth = raw.get("authorized") != null && Boolean.parseBoolean(String.valueOf(raw.get("authorized")).trim());
            String img = (auth && raw.get("imageUrl") != null) ? String.valueOf(raw.get("imageUrl")).trim() : "";
            if (author.isEmpty() && text.isEmpty() && img.isEmpty()) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("authorName", author.isEmpty() ? "Cliente" : author);
            item.put("authorMeta", meta);
            item.put("text", text);
            item.put("sourceType", source);
            item.put("authorized", auth);
            item.put("imageUrl", img);
            list.add(item);
        }
        return list;
    }

    @JsonIgnore
    public List<Map<String, String>> getFaqItems() {
        List<Map<String, String>> list = new ArrayList<>();
        if (settings != null && settings.get("items") instanceof Collection<?> col && !col.isEmpty()) {
            for (Object obj : col) {
                if (!(obj instanceof Map<?, ?> raw)) continue;
                String q = raw.get("q") != null ? String.valueOf(raw.get("q")).trim() : "";
                String a = raw.get("a") != null ? String.valueOf(raw.get("a")).trim() : "";
                if (!q.isEmpty() && !a.isEmpty()) {
                    Map<String, String> pair = new LinkedHashMap<>();
                    pair.put("q", q);
                    pair.put("a", a);
                    list.add(pair);
                }
            }
            if (!list.isEmpty()) return list;
        }
        String[] defQ = {
                "¿Cuáles son los métodos de pago disponibles?",
                "¿Cuánto tarda en llegar mi pedido?",
                "¿Tienen cambios o garantías?",
                "", ""
        };
        String[] defA = {
                "Puedes realizar tu pedido con pago seguro en línea o coordinar directamente con nosotros por WhatsApp.",
                "Despachamos a todo el país. El tiempo estimado de entrega es de 2 a 5 días hábiles según tu ciudad.",
                "Sí, todos nuestros productos cuentan con garantía y soporte directo.",
                "", ""
        };
        for (int i = 1; i <= 5; i++) {
            String q = (settings != null && settings.containsKey("q" + i)) ? settingStr("q" + i, "") : defQ[i - 1];
            String a = (settings != null && settings.containsKey("a" + i)) ? settingStr("a" + i, "") : defA[i - 1];
            if (!q.isEmpty() && !a.isEmpty()) {
                Map<String, String> pair = new LinkedHashMap<>();
                pair.put("q", q);
                pair.put("a", a);
                list.add(pair);
            }
        }
        return list;
    }

    public List<String> getBulletLines(String key) {
        String raw = settingStr(key, "");
        if (raw.isEmpty()) return Collections.emptyList();
        List<String> lines = new ArrayList<>();
        for (String line : raw.split("\\r?\\n")) {
            String clean = line.trim();
            if (!clean.isEmpty()) {
                lines.add(clean);
            }
        }
        return lines;
    }
}