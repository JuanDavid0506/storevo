package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ThemeConfigDto;
import com.storevo.backend.tenant.dto.ThemeGlobalStylesDto;
import com.storevo.backend.tenant.dto.ThemeSectionDto;
import com.storevo.backend.tenant.model.Product;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreThemeService {

    private final ObjectMapper objectMapper;
    private final ProductService productService;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    @Lazy
    private StoreThemeService self;

    private static final Set<String> ALLOWED_FONTS = Set.of(
            "Inter", "Plus Jakarta Sans", "Montserrat", "Playfair Display", "Lora", "DM Sans"
    );

    private static final Set<String> ALLOWED_RADII = Set.of(
            "0px", "0.375rem", "0.75rem", "1rem", "1.5rem"
    );

    /**
     * Obtiene la configuración del tema (Publicado o Borrador) y resuelve los productos de cada sección.
     */
    public ThemeConfigDto getHydratedThemeForStorefront(Store store, boolean previewDraft) {
        ThemeConfigDto config = getRawThemeConfig(store, previewDraft);
        hydrateThemeSections(store, config);
        return config;
    }

    /**
     * Lee el JSON de la BD de administración sin contaminar el contexto del tenant.
     */
    public ThemeConfigDto getRawThemeConfig(Store store, boolean useDraft) {
        if (store == null) {
            return buildDefaultTheme("Mi Tienda", "#6366f1", "#0f172a", null);
        }

        String tenantSchema = store.getSchemaName();
        try {
            TenantContext.clear();
            StoreSettings settings = self.findSettingsInAdminDb(store.getId());

            String primary = (settings != null && settings.getPrimaryColor() != null && !settings.getPrimaryColor().isBlank())
                    ? settings.getPrimaryColor() : "#6366f1";
            String secondary = (settings != null && settings.getSecondaryColor() != null && !settings.getSecondaryColor().isBlank())
                    ? settings.getSecondaryColor() : "#0f172a";
            String bannerUrl = settings != null ? settings.getBannerUrl() : null;

            String json = null;
            if (settings != null) {
                if (useDraft && settings.getDraftThemeJson() != null && !settings.getDraftThemeJson().isBlank()) {
                    json = settings.getDraftThemeJson();
                } else if (settings.getPublishedThemeJson() != null && !settings.getPublishedThemeJson().isBlank()) {
                    json = settings.getPublishedThemeJson();
                }
            }

            if (json != null && !json.isBlank()) {
                try {
                    ThemeConfigDto parsed = objectMapper.readValue(json, ThemeConfigDto.class);
                    if (parsed.getGlobalStyles() == null) {
                        parsed.setGlobalStyles(ThemeGlobalStylesDto.builder()
                                .primaryColor(primary)
                                .secondaryColor(secondary)
                                .build());
                    } else if (!useDraft) {
                        // Sincronizar con StoreSettings en la vista publicada por si el comerciante cambió colores en Configuración -> Mi Tienda
                        parsed.getGlobalStyles().setPrimaryColor(primary);
                        parsed.getGlobalStyles().setSecondaryColor(secondary);
                    }
                    if (parsed.getSections() == null) {
                        parsed.setSections(new ArrayList<>());
                    }
                    sanitizeThemeConfig(store.getSlug(), parsed);
                    return parsed;
                } catch (Exception e) {
                    System.out.println("Error leyendo JSON de plantilla, usando tema por defecto: " + e.getMessage());
                }
            }

            return buildDefaultTheme(store.getName(), primary, secondary, bannerUrl);
        } finally {
            if (tenantSchema != null) {
                TenantContext.setCurrentTenant(tenantSchema);
            }
        }
    }

    /**
     * Hidrata las secciones dinámicas (como vitrinas de productos) en el esquema del tenant.
     */
    public void hydrateThemeSections(Store store, ThemeConfigDto theme) {
        if (theme == null || theme.getSections() == null) return;
        if (store != null && store.getSchemaName() != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        List<Product> allProducts = productService.getPublicCatalog(null);

        for (ThemeSectionDto section : theme.getSections()) {
            if (!Boolean.TRUE.equals(section.getEnabled())) continue;

            if ("product_grid".equalsIgnoreCase(section.getType())) {
                String source = section.settingStr("source", "NEWEST");
                Long categoryId = section.settingLong("categoryId");
                int limit = Math.max(1, Math.min(section.settingInt("limit", 8), 24));

                List<Product> candidates;
                if ("CATEGORY".equalsIgnoreCase(source) && categoryId != null) {
                    candidates = productService.getPublicCatalog(categoryId);
                } else if ("OFFERS".equalsIgnoreCase(source)) {
                    candidates = allProducts.stream()
                            .filter(p -> p.getDiscountPrice() != null && p.getDiscountPrice() > 0)
                            .collect(Collectors.toList());
                } else {
                    candidates = allProducts;
                }

                section.setResolvedProducts(candidates.stream().limit(limit).collect(Collectors.toList()));
            }
        }
    }

    /**
     * Guarda el borrador del tema en la BD administrativa SIN sobrescribir los colores publicados de la tienda.
     */
    public void saveDraftTheme(Store store, ThemeConfigDto themeConfig) {
        String tenantSchema = store.getSchemaName();
        try {
            sanitizeThemeConfig(store.getSlug(), themeConfig);
            String json = objectMapper.writeValueAsString(themeConfig);
            TenantContext.clear();
            self.updateThemeColumnsInAdminDb(store.getId(), json, null, null, null);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo guardar el borrador de la plantilla: " + e.getMessage(), e);
        } finally {
            TenantContext.setCurrentTenant(tenantSchema);
        }
    }

    /**
     * Publica el tema en la tienda pública y sincroniza los colores primarios y secundarios en StoreSettings.
     */
    public void publishTheme(Store store, ThemeConfigDto themeConfig) {
        String tenantSchema = store.getSchemaName();
        try {
            sanitizeThemeConfig(store.getSlug(), themeConfig);
            String json = objectMapper.writeValueAsString(themeConfig);
            TenantContext.clear();
            self.updateThemeColumnsInAdminDb(
                    store.getId(),
                    json,
                    json,
                    themeConfig.getGlobalStyles() != null ? themeConfig.getGlobalStyles().getPrimaryColor() : null,
                    themeConfig.getGlobalStyles() != null ? themeConfig.getGlobalStyles().getSecondaryColor() : null
            );
        } catch (Exception e) {
            throw new RuntimeException("No se pudo publicar la plantilla: " + e.getMessage(), e);
        } finally {
            TenantContext.setCurrentTenant(tenantSchema);
        }
    }

    /**
     * Descarta los cambios no publicados del borrador y restaura la última versión publicada de la tienda.
     */
    public ThemeConfigDto discardDraftToPublished(Store store) {
        ThemeConfigDto publishedTheme = getRawThemeConfig(store, false);
        saveDraftTheme(store, publishedTheme);
        return publishedTheme;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public StoreSettings findSettingsInAdminDb(Long storeId) {
        List<StoreSettings> list = entityManager.createQuery(
                        "SELECT s FROM StoreSettings s WHERE s.store.id = :storeId", StoreSettings.class)
                .setParameter("storeId", storeId)
                .getResultList();
        return list.isEmpty() ? null : list.get(0);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateThemeColumnsInAdminDb(Long storeId, String draftJson, String publishedJson, String primaryColor, String secondaryColor) {
        StoreSettings settings = findSettingsInAdminDb(storeId);
        if (settings == null) return;

        if (draftJson != null) {
            settings.setDraftThemeJson(draftJson);
        }
        if (publishedJson != null) {
            settings.setPublishedThemeJson(publishedJson);
        }
        if (primaryColor != null && primaryColor.matches("^#[0-9a-fA-F]{6}$")) {
            settings.setPrimaryColor(primaryColor);
        }
        if (secondaryColor != null && secondaryColor.matches("^#[0-9a-fA-F]{6}$")) {
            settings.setSecondaryColor(secondaryColor);
        }
        entityManager.merge(settings);
    }

    public ThemeConfigDto buildDefaultTheme(String storeName, String primaryColor, String secondaryColor, String bannerUrl) {
        String safeStoreName = (storeName != null && !storeName.isBlank()) ? storeName : "Nuestra Tienda";
        String safePrimary = sanitizeHexColor(primaryColor, "#6366f1");
        String safeSecondary = sanitizeHexColor(secondaryColor, "#0f172a");

        ThemeGlobalStylesDto globalStyles = ThemeGlobalStylesDto.builder()
                .primaryColor(safePrimary)
                .secondaryColor(safeSecondary)
                .backgroundColor("#f8fafc")
                .textColor("#0f172a")
                .headingFont("Inter")
                .bodyFont("Inter")
                .borderRadius("1rem")
                .build();

        List<ThemeSectionDto> sections = new ArrayList<>();

        Map<String, Object> announcementSettings = new LinkedHashMap<>();
        announcementSettings.put("text", "🚚 ¡Envíos seguros a todo el país! Compra fácil en línea o por WhatsApp.");
        announcementSettings.put("bgColor", safeSecondary);
        announcementSettings.put("textColor", "#ffffff");
        announcementSettings.put("linkUrl", "/catalog");
        sections.add(ThemeSectionDto.builder()
                .id("sec_announcement_default")
                .type("announcement_bar")
                .enabled(false)
                .settings(announcementSettings)
                .build());

        Map<String, Object> heroSettings = new LinkedHashMap<>();
        heroSettings.put("badgeText", "");
        heroSettings.put("title", "Bienvenido a " + safeStoreName);
        heroSettings.put("subtitle", "Explora nuestro catálogo y descubre los mejores productos diseñados para ti.");
        heroSettings.put("buttonText", "Ver Catálogo");
        heroSettings.put("buttonUrl", "/catalog");
        heroSettings.put("secondaryButtonText", "");
        heroSettings.put("secondaryButtonUrl", "");
        heroSettings.put("imageUrl", bannerUrl != null ? bannerUrl : "");
        heroSettings.put("overlayOpacity", 50);
        heroSettings.put("bgColor", safePrimary);
        heroSettings.put("textColor", "#ffffff");
        heroSettings.put("alignment", "center");
        sections.add(ThemeSectionDto.builder()
                .id("sec_hero_default")
                .type("hero_banner")
                .enabled(true)
                .settings(heroSettings)
                .build());

        Map<String, Object> gridSettings = new LinkedHashMap<>();
        gridSettings.put("title", "Novedades");
        gridSettings.put("subtitle", "");
        gridSettings.put("source", "NEWEST");
        gridSettings.put("categoryId", "");
        gridSettings.put("limit", 12);
        gridSettings.put("showViewAll", true);
        sections.add(ThemeSectionDto.builder()
                .id("sec_products_default")
                .type("product_grid")
                .enabled(true)
                .settings(gridSettings)
                .build());

        Map<String, Object> trustSettings = new LinkedHashMap<>();
        trustSettings.put("item1Title", "Compra 100% Segura");
        trustSettings.put("item1Text", "Tus datos y pedidos están protegidos en todo momento.");
        trustSettings.put("item2Title", "Envíos a Todo el País");
        trustSettings.put("item2Text", "Despachamos tu pedido rápido con transportadoras aliadas.");
        trustSettings.put("item3Title", "Atención Personalizada");
        trustSettings.put("item3Text", "Resolvemos tus dudas directamente por WhatsApp.");
        sections.add(ThemeSectionDto.builder()
                .id("sec_trust_default")
                .type("trust_badges")
                .enabled(false)
                .settings(trustSettings)
                .build());

        return ThemeConfigDto.builder()
                .globalStyles(globalStyles)
                .sections(sections)
                .build();
    }

    private void sanitizeThemeConfig(String slug, ThemeConfigDto config) {
        if (config == null) return;

        ThemeGlobalStylesDto gs = config.getGlobalStyles();
        if (gs == null) {
            gs = new ThemeGlobalStylesDto();
            config.setGlobalStyles(gs);
        }
        gs.setPrimaryColor(sanitizeHexColor(gs.getPrimaryColor(), "#6366f1"));
        gs.setSecondaryColor(sanitizeHexColor(gs.getSecondaryColor(), "#0f172a"));
        gs.setBackgroundColor(sanitizeHexColor(gs.getBackgroundColor(), "#f8fafc"));
        gs.setTextColor(sanitizeHexColor(gs.getTextColor(), "#0f172a"));

        if (gs.getHeadingFont() == null || !ALLOWED_FONTS.contains(gs.getHeadingFont().trim())) {
            gs.setHeadingFont("Inter");
        }
        if (gs.getBodyFont() == null || !ALLOWED_FONTS.contains(gs.getBodyFont().trim())) {
            gs.setBodyFont("Inter");
        }
        if (gs.getBorderRadius() == null || !ALLOWED_RADII.contains(gs.getBorderRadius().trim())) {
            gs.setBorderRadius("1rem");
        }

        if (config.getSections() == null) return;
        for (ThemeSectionDto sec : config.getSections()) {
            if (sec.getId() == null || sec.getId().isBlank()) {
                sec.setId("sec_" + UUID.randomUUID().toString().substring(0, 8));
            }
            if (sec.getSettings() != null) {
                sec.getSettings().replaceAll((k, v) -> {
                    if (v instanceof String str) {
                        String trimmed = str.trim();
                        String lowerKey = k.toLowerCase();
                        if (lowerKey.endsWith("color")) {
                            return sanitizeHexColor(trimmed, "#0f172a");
                        }
                        if (lowerKey.endsWith("url")) {
                            return normalizeSectionUrl(slug, trimmed, lowerKey.contains("image"));
                        }
                        return trimmed;
                    }
                    return v;
                });
            }
        }
    }

    private String sanitizeHexColor(String raw, String fallback) {
        if (raw == null) return fallback;
        String clean = raw.trim();
        if (clean.matches("^#[0-9a-fA-F]{6}$")) {
            return clean;
        }
        return fallback;
    }

    private String normalizeSectionUrl(String slug, String rawUrl, boolean isImageUrl) {
        if (rawUrl == null || rawUrl.isBlank()) return "";
        String trimmed = rawUrl.trim();
        String lower = trimmed.toLowerCase();

        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
            return "";
        }

        if (isImageUrl) {
            return trimmed;
        }

        if (lower.startsWith("www.") || lower.startsWith("wa.me/") || lower.startsWith("instagram.com/") || lower.startsWith("facebook.com/") || lower.startsWith("tiktok.com/")) {
            return "https://" + trimmed;
        }

        if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("#")) {
            return trimmed;
        }

        if (slug != null && !slug.isBlank()) {
            String prefix1 = "/s/" + slug;
            String prefix2 = "s/" + slug;
            if (trimmed.startsWith(prefix1)) {
                trimmed = trimmed.substring(prefix1.length());
            } else if (trimmed.startsWith(prefix2)) {
                trimmed = trimmed.substring(prefix2.length());
            }
        }

        if (trimmed.isEmpty()) {
            return "/";
        }

        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }
}