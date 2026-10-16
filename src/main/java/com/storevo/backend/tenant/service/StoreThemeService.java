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


    private static final Set<String> ALLOWED_RADII = Set.of(
            "0px", "0.375rem", "0.75rem", "1rem", "1.5rem", "2rem"
    );
    private static final Set<String> ALLOWED_BUTTON_RADII = Set.of("classic", "sync", "square", "pill");
    private static final Set<String> ALLOWED_CARD_STYLES = Set.of("elevated", "clean", "outlined");
    private static final Set<String> ALLOWED_NAV_LAYOUTS = Set.of("classic", "centered", "marketplace", "minimal");
    private static final Set<String> ALLOWED_NAV_STYLES = Set.of("light", "glass", "secondary", "primary", "page");
    private static final Set<String> ALLOWED_NAV_LINK_FORMATS = Set.of("normal", "uppercase", "bold");
    private static final Set<String> ALLOWED_NAV_LINK_HOVERS = Set.of("color", "underline", "pill");
    private static final Set<String> ALLOWED_HEADING_TRANSFORMS = Set.of("none", "uppercase");
    private static final Set<String> ALLOWED_FONT_SCALES = Set.of("compact", "standard", "large");
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

            String primary = (settings != null && isValidHex(settings.getPrimaryColor()))
                    ? settings.getPrimaryColor() : "#6366f1";
            String secondary = (settings != null && isValidHex(settings.getSecondaryColor()))
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
                    }
                    if (parsed.getSections() == null) {
                        parsed.setSections(new ArrayList<>());
                    }
                    sanitizeThemeConfig(parsed);
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
                if (("CATEGORY".equalsIgnoreCase(source) || categoryId != null) && categoryId != null && !"OFFERS".equalsIgnoreCase(source)) {
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
     * Guarda ÚNICAMENTE el borrador del tema sin alterar los colores publicados en StoreSettings.
     */
    public void saveDraftTheme(Store store, ThemeConfigDto themeConfig) {
        String tenantSchema = store.getSchemaName();
        try {
            sanitizeThemeConfig(themeConfig);
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
     * Publica el tema en la tienda pública y sincroniza los colores primarios/secundarios con StoreSettings.
     */
    public void publishTheme(Store store, ThemeConfigDto themeConfig) {
        String tenantSchema = store.getSchemaName();
        try {
            sanitizeThemeConfig(themeConfig);
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
     * Descarta los cambios no publicados en borrador y restaura la última versión publicada.
     */
    public ThemeConfigDto discardDraft(Store store) {
        ThemeConfigDto published = getRawThemeConfig(store, false);
        saveDraftTheme(store, published);
        return published;
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
        if (isValidHex(primaryColor)) {
            settings.setPrimaryColor(primaryColor);
        }
        if (isValidHex(secondaryColor)) {
            settings.setSecondaryColor(secondaryColor);
        }
        entityManager.merge(settings);
    }

    public ThemeConfigDto buildDefaultTheme(String storeName, String primaryColor, String secondaryColor, String bannerUrl) {
        String safeStoreName = (storeName != null && !storeName.isBlank()) ? storeName : "Nuestra Tienda";
        String safePrimary = isValidHex(primaryColor) ? primaryColor : "#6366f1";
        String safeSecondary = isValidHex(secondaryColor) ? secondaryColor : "#0f172a";

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

    private void sanitizeThemeConfig(ThemeConfigDto config) {
        if (config == null) return;

        // 1. Sanitizar GlobalStyles contra inyección CSS
        ThemeGlobalStylesDto gs = config.getGlobalStyles();
        if (gs == null) {
            gs = new ThemeGlobalStylesDto();
            config.setGlobalStyles(gs);
        }
        if (!isValidHex(gs.getPrimaryColor())) gs.setPrimaryColor("#6366f1");
        if (!isValidHex(gs.getSecondaryColor())) gs.setSecondaryColor("#0f172a");
        if (!isValidHex(gs.getBackgroundColor())) gs.setBackgroundColor("#f8fafc");
        if (!isValidHex(gs.getTextColor())) gs.setTextColor("#0f172a");
        if (!ThemeFonts.isHeadingFont(gs.getHeadingFont())) {
            gs.setHeadingFont(ThemeFonts.DEFAULT_FONT);
        }
        if (!ThemeFonts.isBodyFont(gs.getBodyFont())) {
            gs.setBodyFont(ThemeFonts.DEFAULT_FONT);
        }
        if (gs.getHeadingTransform() == null || !ALLOWED_HEADING_TRANSFORMS.contains(gs.getHeadingTransform())) {
            gs.setHeadingTransform("none");
        }
        if (gs.getFontScale() == null || !ALLOWED_FONT_SCALES.contains(gs.getFontScale())) {
            gs.setFontScale("standard");
        }
        if (gs.getButtonRadius() == null || !ALLOWED_BUTTON_RADII.contains(gs.getButtonRadius())) {
            gs.setButtonRadius("classic");
        }
        if (gs.getCardStyle() == null || !ALLOWED_CARD_STYLES.contains(gs.getCardStyle())) {
            gs.setCardStyle("elevated");
        }
        if (gs.getBorderRadius() == null || !ALLOWED_RADII.contains(gs.getBorderRadius())) {
            gs.setBorderRadius("1rem");
        }
        if (gs.getNavbarLayout() == null || !ALLOWED_NAV_LAYOUTS.contains(gs.getNavbarLayout())) {
            gs.setNavbarLayout("classic");
        }
        if (gs.getNavbarStyle() == null || !ALLOWED_NAV_STYLES.contains(gs.getNavbarStyle())) {
            gs.setNavbarStyle("light");
        }
        if (gs.getNavbarLinkFormat() == null || !ALLOWED_NAV_LINK_FORMATS.contains(gs.getNavbarLinkFormat())) {
            gs.setNavbarLinkFormat("normal");
        }
        if (gs.getNavbarLinkHover() == null || !ALLOWED_NAV_LINK_HOVERS.contains(gs.getNavbarLinkHover())) {
            gs.setNavbarLinkHover("color");
        }

        // 2. Sanitizar Secciones
        if (config.getSections() == null) return;
        for (ThemeSectionDto sec : config.getSections()) {
            if (sec.getId() == null || sec.getId().isBlank()) {
                sec.setId("sec_" + UUID.randomUUID().toString().substring(0, 8));
            }
            if (sec.getSettings() != null) {
                sec.getSettings().replaceAll((k, v) -> {
                    if (v instanceof String str) {
                        String trimmed = str.trim();
                        if (k.toLowerCase().endsWith("url") && trimmed.toLowerCase().startsWith("javascript:")) {
                            return "";
                        }
                        if (k.toLowerCase().endsWith("color") && !trimmed.isEmpty() && !isValidHex(trimmed)) {
                            return "#0f172a";
                        }
                        return trimmed;
                    }
                    return v;
                });
            }
        }
    }

    private boolean isValidHex(String color) {
        return color != null && color.matches("^#[0-9a-fA-F]{6}$");
    }
}