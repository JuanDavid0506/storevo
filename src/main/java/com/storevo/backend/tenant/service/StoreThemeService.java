package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ThemeConfigDto;
import com.storevo.backend.tenant.dto.ThemeCustomPageDto;
import com.storevo.backend.tenant.dto.ThemeGlobalStylesDto;
import com.storevo.backend.tenant.dto.ThemeSectionDto;
import com.storevo.backend.tenant.model.Brand;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductOption;
import com.storevo.backend.tenant.model.ProductOptionValue;
import com.storevo.backend.tenant.model.ProductVariant;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
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
    private static final Set<String> ALLOWED_CARD_STYLES = Set.of("elevated", "clean", "boutique", "poster", "bento", "outlined", "soft");
    private static final Set<String> ALLOWED_CARD_PRESETS = Set.of("commercial", "boutique", "poster", "bento", "compact", "gallery");
    private static final Set<String> ALLOWED_CARD_IMG_ASPECTS = Set.of("square", "portrait", "tall", "landscape");
    private static final Set<String> ALLOWED_IMG_FITS = Set.of("cover", "contain");
    private static final Set<String> ALLOWED_CARD_IMG_PADDINGS = Set.of("flush", "inset");
    private static final Set<String> ALLOWED_CARD_RADII = Set.of("sync", "0px", "0.5rem", "1rem", "1.5rem");
    private static final Set<String> ALLOWED_CARD_SHADOWS = Set.of("none", "sm", "md", "lg");
    private static final Set<String> ALLOWED_CARD_ALIGNS = Set.of("left", "center");
    private static final Set<String> ALLOWED_CARD_META_MODES = Set.of("category", "brand", "both", "none");
    private static final Set<String> ALLOWED_CARD_DISCOUNT_BADGES = Set.of("percent", "label", "hidden");
    private static final Set<String> ALLOWED_CARD_PRICE_SIZES = Set.of("compact", "normal", "large");
    private static final Set<String> ALLOWED_CARD_VISIBILITY_MODES = Set.of("always", "hover", "hidden");
    private static final Set<String> ALLOWED_CARD_BTN_STYLES = Set.of("solid", "outline", "dark", "split");
    private static final Set<String> ALLOWED_CARD_IMG_HOVERS = Set.of("carousel", "second_image", "zoom", "none");
    private static final Set<String> ALLOWED_CARD_HOVER_LIFTS = Set.of("lift", "glow", "scale", "border", "none");
    private static final Set<String> ALLOWED_DETAIL_PRESETS = Set.of(
            "conversion", "fashion_lookbook", "tech_specs", "luxury_boutique", "express_sale", "urban_drop"
    );
    private static final Set<String> ALLOWED_DETAIL_INFO_STYLES = Set.of("clean", "card", "buybox", "outlined");
    private static final Set<String> ALLOWED_DETAIL_STICKY_MODES = Set.of("sticky_info", "sticky_gallery", "none");
    private static final Set<String> ALLOWED_DETAIL_GALLERY_POS = Set.of("left", "right");
    private static final Set<String> ALLOWED_DETAIL_LAYOUT_RATIOS = Set.of("50_50", "60_40", "45_55");
    private static final Set<String> ALLOWED_DETAIL_GALLERY_LAYOUTS = Set.of("bottom", "left", "grid", "stack", "carousel");
    private static final Set<String> ALLOWED_DETAIL_IMG_ASPECTS = Set.of("square", "portrait", "tall", "landscape");
    private static final Set<String> ALLOWED_DETAIL_BUY_LAYOUTS = Set.of("standard", "stacked", "side_by_side");
    private static final Set<String> ALLOWED_DETAIL_VARIANT_STYLES = Set.of("rounded", "pills", "square", "underline");
    private static final Set<String> ALLOWED_DETAIL_SPECS_OPEN = Set.of("collapsed", "expanded");
    private static final Set<String> ALLOWED_DETAIL_RELATED_COLS = Set.of("3", "4");
    private static final Set<String> ALLOWED_NAV_LAYOUTS = Set.of(
            "classic", "centered", "marketplace", "minimal",
            "editorial", "compact", "double_bar", "hero_overlay",
            "retail_left", "department_strip"
    );
    private static final Set<String> ALLOWED_NAV_STYLES = Set.of("light", "glass", "secondary", "primary", "page");
    private static final Set<String> ALLOWED_NAV_LINK_FORMATS = Set.of("normal", "uppercase", "bold");
    private static final Set<String> ALLOWED_NAV_LINK_HOVERS = Set.of(
            "color", "underline", "pill",
            "underline_center", "underline_slide", "slide_bg", "opacity"
    );
    private static final Set<String> ALLOWED_NAV_DROPDOWN_STYLES = Set.of(
            "mega", "flyout", "accordion", "split", "cascade", "strip", "drawer", "none",
            "dual_drawer", "full_columns"
    );
    private static final Set<String> ALLOWED_NAV_DROPDOWN_ANIMS = Set.of(
            "fade", "slide_up", "slide_down", "scale", "reveal", "stagger"
    );
    private static final Set<String> ALLOWED_NAV_TRIGGERS = Set.of("hover", "click");
    private static final Set<String> ALLOWED_NAV_SPEEDS = Set.of("fast", "normal", "slow");
    private static final Set<String> ALLOWED_NAV_BRAND_MODES = Set.of("logo", "logo_text", "text");
    private static final Set<String> ALLOWED_NAV_LOGO_SIZES = Set.of("sm", "md", "lg", "xl");
    private static final Set<String> ALLOWED_HEADING_TRANSFORMS = Set.of("none", "uppercase");
    private static final Set<String> ALLOWED_FONT_SCALES = Set.of("compact", "standard", "large");
    private static final Set<String> ALLOWED_SEARCH_MODES = Set.of(
            "traditional", "instant", "predictive", "fullscreen"
    );
    private static final Set<String> ALLOWED_SEARCH_NAV_VARIANTS = Set.of(
            "auto", "inline_bar", "expandable_icon", "modal_trigger", "hidden"
    );
    private static final Set<String> ALLOWED_SEARCH_MOBILE_MODES = Set.of("fullscreen", "same");
    private static final Set<String> ALLOWED_SEARCH_INPUT_STYLES = Set.of(
            "sync", "pill", "rounded", "square", "underline"
    );
    private static final Set<String> ALLOWED_SEARCH_INPUT_SIZES = Set.of("compact", "normal", "large");
    private static final Set<String> ALLOWED_SEARCH_BUTTON_MODES = Set.of("icon", "text", "icon_text", "none");
    private static final Set<String> ALLOWED_SEARCH_ANIMS = Set.of("slide_up", "fade", "scale");
    private static final Set<String> ALLOWED_SEARCH_CATEGORY_SCOPES = Set.of("none", "select_left", "pills_top");
    private static final Set<String> RESERVED_PAGE_SLUGS = Set.of(
            "home", "catalog", "product", "product-preview", "cart", "checkout", "wishlist", "order", "p", "page"
    );
    private static final Set<String> ALLOWED_LAYOUT_SPACING = Set.of("none", "sm", "lg");
    private static final Set<String> ALLOWED_LAYOUT_WIDTH = Set.of("full");
    private static final Set<String> ALLOWED_LAYOUT_BG_MODES = Set.of("none", "solid");
    private static final Set<String> ALLOWED_LAYOUT_TONES = Set.of("light", "dark");
    private static final Set<String> ALLOWED_VIDEO_ASPECTS = Set.of("16:9", "9:16");
    private static final Set<String> ALLOWED_STAT_STYLES = Set.of("cards", "minimal", "secondary");
    private static final Set<String> ALLOWED_STAT_ICONS = Set.of(
            "none", "shield", "truck", "chat", "star", "clock", "gift", "refresh", "card"
    );
    private static final Set<String> ALLOWED_GALLERY_COLS = Set.of("2", "3", "4");
    private static final Set<String> ALLOWED_GALLERY_ASPECTS = Set.of("square", "portrait", "landscape");
    private static final Set<String> ALLOWED_BRAND_DISPLAY_MODES = Set.of("grid", "carousel");
    private static final Set<String> ALLOWED_BRAND_LOGO_SIZES = Set.of("sm", "md", "lg");
    private static final Set<String> ALLOWED_PRODUCT_GRID_SOURCES = Set.of(
            "NEWEST", "OFFERS", "CATEGORY", "BRAND", "MANUAL", "FEATURED"
    );
    private static final Set<String> ALLOWED_PAGINATION_MODES = Set.of(
            "numbered", "compact", "load_more", "infinite", "arrows", "counter_more"
    );
    private static final Set<String> ALLOWED_PAGINATION_SHAPES = Set.of(
            "sync", "square", "rounded", "pill"
    );
    private static final Set<String> ALLOWED_PAGINATION_SIZES = Set.of("sm", "md", "lg");
    private static final Set<String> ALLOWED_PAGINATION_ALIGNS = Set.of("left", "center", "right", "between");
    private static final Set<String> ALLOWED_PAGINATION_BORDERS = Set.of("0px", "1px", "2px");
    private static final java.util.regex.Pattern YOUTUBE_ID_PATTERN = java.util.regex.Pattern.compile(
            "(?:youtube(?:-nocookie)?\\.com/(?:watch\\?(?:.*&)?v=|embed/|shorts/|live/)|youtu\\.be/)([a-zA-Z0-9_-]{11})"
    );
    private static final Set<String> RESERVED_ANCHOR_IDS = Set.of(
            "storenavbar", "storevomaincontent", "storevo-page-scripts",
            "storevo-catalog-products-bridge", "storevo-navbar-advanced-bridge",
            "navwishlistcounter", "navcartcounter", "mobile-menu", "mobile-menu-backdrop",
            "whatsapp-modal", "wa-modal-product-name", "wa-modal-variant-info",
            "wa-customer-name", "wa-customer-phone", "wa-customer-city",
            "wa-customer-address", "wa-customer-notes", "catalog-search-input",
            "catalog-sort-select", "catalog-products-grid", "catalog-empty-state",
            "catalog-filter-bridge", "sv-catalog-workspace", "sv-catalog-sidebar-facets",
            "sv-catalog-topbar-panel", "sv-catalog-topbar-facets", "sv-catalog-active-chips",
            "sv-catalog-results-count", "sv-filter-drawer-backdrop", "sv-filter-drawer-facets",
            "main-product-image", "sv-detail-img-counter", "dynamic-price", "dynamic-old-price",
            "dynamic-discount-badge", "dynamic-stock", "dynamic-sku",
            "variant-selectors-container", "selected-variant-id", "quantity-input",
            "btn-add-to-cart", "btn-buy-whatsapp", "sv-detail-related-grid",
            "adm-sidebar-tooltip", "dashboard-sidebar", "admin-theme-toggle",
            "admin-theme-label", "sidebar-collapse-btn", "topbar-sidebar-toggle",
            "home", "catalog", "product", "product-preview", "cart", "checkout", "wishlist", "order", "top"
    );
    public ThemeConfigDto getHydratedThemeForStorefront(Store store, boolean previewDraft) {
        ThemeConfigDto config = getRawThemeConfig(store, previewDraft);
        hydrateThemeSections(store, config);
        return config;
    }

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

    public Set<Long> getCustomCategoryIds(Store store) {
        Set<Long> result = new HashSet<>();
        if (store == null) return result;
        ThemeConfigDto config = getRawThemeConfig(store, true);
        if (config != null && config.getPages() != null) {
            for (Map.Entry<String, List<ThemeSectionDto>> entry : config.getPages().entrySet()) {
                String key = entry.getKey();
                List<ThemeSectionDto> secs = entry.getValue();
                if (key != null && key.startsWith("category:") && secs != null && !secs.isEmpty()) {
                    try {
                        Long catId = Long.parseLong(key.substring(9).trim());
                        result.add(catId);
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return result;
    }

    public void hydrateThemeSections(Store store, ThemeConfigDto theme) {
        hydrateThemeSectionsForPage(store, theme, null, null);
    }

    public void hydrateThemeSectionsForPage(Store store, ThemeConfigDto theme, String activePageKey, List<Product> preloadedProducts) {
        if (theme == null) return;
        if (store != null && store.getSchemaName() != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        int globalPageSize = (theme.getGlobalStyles() != null && theme.getGlobalStyles().getPaginationPageSize() != null)
                ? Math.max(4, Math.min(theme.getGlobalStyles().getPaginationPageSize(), 48))
                : 12;

        Map<String, org.springframework.data.domain.Page<Product>> pageCache = new HashMap<>();
        Set<ThemeSectionDto> visited = Collections.newSetFromMap(new IdentityHashMap<>());

        if (activePageKey != null && !activePageKey.isBlank()) {
            List<ThemeSectionDto> targetSections = theme.getPageSections(activePageKey);
            if (targetSections != null) {
                for (ThemeSectionDto sec : targetSections) {
                    if (visited.add(sec)) {
                        hydrateSingleSection(sec, preloadedProducts, pageCache, globalPageSize);
                    }
                }
            }
            return;
        }

        if (theme.getPages() != null) {
            for (List<ThemeSectionDto> pageSections : theme.getPages().values()) {
                if (pageSections != null) {
                    for (ThemeSectionDto sec : pageSections) {
                        if (visited.add(sec)) {
                            hydrateSingleSection(sec, preloadedProducts, pageCache, globalPageSize);
                        }
                    }
                }
            }
        }
        if (theme.getCustomPages() != null) {
            for (ThemeCustomPageDto cp : theme.getCustomPages()) {
                if (cp != null && cp.getSections() != null) {
                    for (ThemeSectionDto sec : cp.getSections()) {
                        if (visited.add(sec)) {
                            hydrateSingleSection(sec, preloadedProducts, pageCache, globalPageSize);
                        }
                    }
                }
            }
        }
        if (theme.getSections() != null) {
            for (ThemeSectionDto sec : theme.getSections()) {
                if (visited.add(sec)) {
                    hydrateSingleSection(sec, preloadedProducts, pageCache, globalPageSize);
                }
            }
        }
    }

    private void hydrateSingleSection(
            ThemeSectionDto section,
            List<Product> preloadedProducts,
            Map<String, org.springframework.data.domain.Page<Product>> pageCache,
            int globalPageSize) {
        if (section == null || !Boolean.TRUE.equals(section.getEnabled())) return;
        if ("brand_carousel".equalsIgnoreCase(section.getType())
                && "AUTO".equalsIgnoreCase(section.settingStr("source", "MANUAL"))) {
            List<String> visible = new ArrayList<>();
            Map<String, String> logos = new LinkedHashMap<>();
            try {
                List<Brand> activeBrands = entityManager.createQuery(
                                "SELECT b FROM Brand b WHERE b.isActive = true ORDER BY b.name ASC", Brand.class)
                        .setMaxResults(24)
                        .getResultList();
                for (Brand b : activeBrands) {
                    if (b.getName() == null || b.getName().isBlank()) continue;
                    visible.add(b.getName().trim());
                    if (b.getLogoUrl() != null && !b.getLogoUrl().isBlank()) {
                        logos.put(b.getName().trim(), b.getLogoUrl());
                    }
                }
            } catch (Exception ignored) {}
            section.setResolvedBrands(visible);
            section.setResolvedBrandLogos(logos);
            return;
        }
        if ("spotlight_product".equalsIgnoreCase(section.getType())) {
            String rawProdId = section.settingStr("productId", "");
            Long targetId = section.settingLong("productId");
            List<Product> matched = new ArrayList<>();
            try {
                if (targetId != null && targetId > 0) {
                    Product found = productService.getProductById(targetId);
                    if (found != null && Boolean.TRUE.equals(found.getIsActive()) && !Boolean.TRUE.equals(found.getIsDeleted()) && !Boolean.TRUE.equals(found.getIsDraft())) {
                        matched.add(found);
                    }
                } else if ("__offer__".equalsIgnoreCase(rawProdId)) {
                    matched.addAll(productService.getOfferPublicProducts(1));
                }
                if (matched.isEmpty()) {
                    matched.addAll(productService.getNewestPublicProducts(1));
                }
            } catch (Exception ignored) {
                matched.addAll(productService.getNewestPublicProducts(1));
            }
            section.setResolvedProducts(matched);
            return;
        }
        if ("product_grid".equalsIgnoreCase(section.getType())) {
            String rawSource = section.settingStr("source", "NEWEST").toUpperCase(Locale.ROOT);
            String source = ALLOWED_PRODUCT_GRID_SOURCES.contains(rawSource) ? rawSource : "NEWEST";
            Long categoryId = section.settingLong("categoryId");
            // Respetar siempre el límite propio configurado en la vitrina (ej. 4, 8, 12 productos)
            int pageSize = Math.max(1, Math.min(section.settingInt("limit", 8), 24));

            if ("NEWEST".equals(source) && categoryId != null) {
                source = "CATEGORY";
            }

            org.springframework.data.domain.Page<Product> resolvedPage;
            switch (source) {
                case "CATEGORY": {
                    String cacheKey = "CATEGORY:" + (categoryId != null ? categoryId : "ALL") + ":" + pageSize;
                    resolvedPage = pageCache.computeIfAbsent(cacheKey,
                            k -> productService.searchPublicCatalogPage(categoryId, null, null, null, false, false, false, null, null, "default", 0, pageSize, null));
                    break;
                }
                case "OFFERS": {
                    String cacheKey = "OFFERS:" + pageSize;
                    resolvedPage = pageCache.computeIfAbsent(cacheKey,
                            k -> productService.searchPublicCatalogPage(null, null, null, null, true, false, false, null, null, "default", 0, pageSize, null));
                    break;
                }
                case "BRAND": {
                    Long brandId = section.settingLong("brandId");
                    String brandName = section.settingStr("brandName", "");
                    String cacheKey = "BRAND:" + (brandId != null ? brandId : "") + ":" + brandName.toLowerCase(Locale.ROOT) + ":" + pageSize;
                    resolvedPage = pageCache.computeIfAbsent(cacheKey,
                            k -> productService.searchPublicCatalogPage(null, brandId, brandName, null, false, false, false, null, null, "default", 0, pageSize, null));
                    break;
                }
                case "FEATURED": {
                    String cacheKey = "FEATURED:" + pageSize;
                    resolvedPage = pageCache.computeIfAbsent(cacheKey,
                            k -> productService.searchPublicCatalogPage(null, null, null, null, false, true, false, null, null, "default", 0, pageSize, null));
                    break;
                }
                case "MANUAL": {
                    List<Long> manualIds = section.settingLongList("productIds");
                    String cacheKey = "MANUAL:" + manualIds.toString() + ":" + pageSize;
                    resolvedPage = pageCache.computeIfAbsent(cacheKey,
                            k -> productService.getManualPublicProductsPage(manualIds, null, "default", 0, pageSize));
                    break;
                }
                case "NEWEST":
                default: {
                    String cacheKey = "NEWEST:" + pageSize;
                    resolvedPage = pageCache.computeIfAbsent(cacheKey,
                            k -> productService.searchPublicCatalogPage(null, null, null, null, false, false, false, null, null, "default", 0, pageSize, null));
                    break;
                }
            }

            List<Product> content = resolvedPage.getContent();
            section.setResolvedProducts(content);
            section.setResolvedTotalProducts(resolvedPage.getTotalElements());
            section.setResolvedPageSize(pageSize);
            section.setResolvedCurrentPage(1);
            section.setResolvedTotalPages(Math.max(1, resolvedPage.getTotalPages()));
            section.setResolvedHasNext(resolvedPage.hasNext());
            section.setResolvedNextCursor(!content.isEmpty() ? content.get(content.size() - 1).getId() : null);
        }
    }

    @Transactional(readOnly = true)
    public String buildCatalogFilterDataJson(Store store, ThemeConfigDto theme, List<Product> products) {
        try {
            if (store != null && store.getSchemaName() != null) {
                TenantContext.setCurrentTenant(store.getSchemaName());
            }

            Map<String, Object> root = new LinkedHashMap<>();
            Map<String, Map<String, Object>> productsMap = new LinkedHashMap<>();
            long fingerprint = 1125899906842597L;

            // Una sola consulta para todos los productos (antes era un find por producto)
            Map<Long, Product> managedById = new LinkedHashMap<>();
            if (products != null && !products.isEmpty()) {
                try {
                    List<Long> ids = products.stream()
                            .filter(x -> x != null && x.getId() != null)
                            .map(Product::getId)
                            .collect(Collectors.toList());
                    if (!ids.isEmpty()) {
                        entityManager.createQuery("SELECT p FROM Product p WHERE p.id IN :ids", Product.class)
                                .setParameter("ids", ids)
                                .getResultList()
                                .forEach(m -> managedById.put(m.getId(), m));
                    }
                } catch (Exception ignored) {}
            }

            if (products != null) {
                for (Product p : products) {
                    if (p == null || p.getId() == null) continue;
                    Product managed = p;
                    try {
                        Product found = managedById.get(p.getId());
                        if (found != null) {
                            managed = found;
                            if (found.getImages() != null) {
                                p.setImages(new ArrayList<>(found.getImages()));
                            }
                        }
                    } catch (Exception ignored) {}

                    Map<String, Object> pMeta = new LinkedHashMap<>();
                    String name = managed.getName() != null ? managed.getName().trim() : "";
                    String brand = managed.getBrand() != null ? managed.getBrand().trim() : "";
                    String sku = managed.getSku() != null ? managed.getSku().trim() : "";
                    boolean isMadeToOrder = Boolean.TRUE.equals(managed.getIsMadeToOrder());
                    int stockVal = managed.getStock() != null ? managed.getStock() : 0;
                    boolean inStock = isMadeToOrder || stockVal > 0;
                    double origPrice = managed.getPrice() != null ? managed.getPrice() : 0.0;
                    double discPrice = managed.getDiscountPrice() != null ? managed.getDiscountPrice() : 0.0;
                    boolean hasDiscount = discPrice > 0 && origPrice > discPrice;
                    double effectivePrice = hasDiscount ? discPrice : origPrice;
                    long discountPercent = (hasDiscount && origPrice > 0)
                            ? Math.round(((origPrice - discPrice) * 100.0) / origPrice)
                            : 0L;
                    boolean hasVariants = Boolean.TRUE.equals(managed.getHasVariants());

                    String imageUrl = "/img/placeholder.jpg";
                    try {
                        if (managed.getMainImageThumbnailUrl() != null && !managed.getMainImageThumbnailUrl().isBlank()) {
                            imageUrl = managed.getMainImageThumbnailUrl();
                        } else if (managed.getMainImageUrl() != null && !managed.getMainImageUrl().isBlank()) {
                            imageUrl = managed.getMainImageUrl();
                        }
                    } catch (Exception ignored) {}

                    pMeta.put("id", managed.getId());
                    pMeta.put("name", name);
                    pMeta.put("brand", brand);
                    pMeta.put("sku", sku);
                    pMeta.put("price", effectivePrice);
                    pMeta.put("effectivePrice", effectivePrice);
                    pMeta.put("originalPrice", origPrice);
                    pMeta.put("discountPrice", discPrice);
                    pMeta.put("discountPercent", discountPercent);
                    pMeta.put("inStock", inStock);
                    pMeta.put("stock", stockVal);
                    pMeta.put("hasDiscount", hasDiscount);
                    pMeta.put("hasOffer", hasDiscount);
                    pMeta.put("madeToOrder", isMadeToOrder);
                    pMeta.put("isMadeToOrder", isMadeToOrder);
                    pMeta.put("hasVariants", hasVariants);
                    pMeta.put("imageUrl", imageUrl);

                    String catIdStr = "";
                    String catNameStr = "";
                    try {
                        if (managed.getCategory() != null) {
                            catIdStr = String.valueOf(managed.getCategory().getId());
                            catNameStr = managed.getCategory().getName() != null ? managed.getCategory().getName() : "";
                            pMeta.put("categoryId", catIdStr);
                            pMeta.put("categoryName", catNameStr);
                        }
                    } catch (Exception ignored) {}

                    Map<String, List<String>> attrs = new LinkedHashMap<>();
                    if (!brand.isEmpty()) {
                        attrs.put("Marca", List.of(brand));
                    }
                    try {
                        if (managed.getAttributes() != null) {
                            for (Map.Entry<String, String> entry : managed.getAttributes().entrySet()) {
                                String rawKey = entry.getKey();
                                String rawVal = entry.getValue();
                                if (rawKey == null || rawVal == null || rawKey.isBlank() || rawVal.isBlank()) continue;
                                String normKey = normalizeLabel(rawKey);
                                String cleanVal = rawVal.trim();
                                attrs.computeIfAbsent(normKey, k -> new ArrayList<>());
                                if (!attrs.get(normKey).contains(cleanVal)) {
                                    attrs.get(normKey).add(cleanVal);
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                    pMeta.put("attributes", attrs);

                    Map<String, List<String>> options = new LinkedHashMap<>();
                    try {
                        if (hasVariants && managed.getVariantsList() != null && !managed.getVariantsList().isEmpty()) {
                            for (ProductVariant v : managed.getVariantsList()) {
                                if (v == null || !Boolean.TRUE.equals(v.getIsActive())) continue;
                                boolean variantAvailable = isMadeToOrder || (v.getStock() != null && v.getStock() > 0);
                                if (!variantAvailable || v.getOptionValues() == null) continue;

                                for (ProductOptionValue ov : v.getOptionValues()) {
                                    if (ov == null || ov.getValueName() == null || ov.getValueName().isBlank()) continue;
                                    String optName = (ov.getOption() != null && ov.getOption().getName() != null)
                                            ? normalizeLabel(ov.getOption().getName()) : "Opción";
                                    String valName = ov.getValueName().trim();
                                    options.computeIfAbsent(optName, k -> new ArrayList<>());
                                    if (!options.get(optName).contains(valName)) {
                                        options.get(optName).add(valName);
                                    }
                                }
                            }
                        } else if (hasVariants && inStock && managed.getOptions() != null) {
                            for (ProductOption opt : managed.getOptions()) {
                                if (opt == null || opt.getName() == null || opt.getValues() == null) continue;
                                String optName = normalizeLabel(opt.getName());
                                for (ProductOptionValue ov : opt.getValues()) {
                                    if (ov != null && ov.getValueName() != null && !ov.getValueName().isBlank()) {
                                        String valName = ov.getValueName().trim();
                                        options.computeIfAbsent(optName, k -> new ArrayList<>());
                                        if (!options.get(optName).contains(valName)) {
                                            options.get(optName).add(valName);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                    pMeta.put("options", options);

                    String sig = managed.getId() + "|" + name + "|" + brand + "|" + sku + "|"
                            + effectivePrice + "|" + origPrice + "|" + stockVal + "|" + inStock + "|"
                            + isMadeToOrder + "|" + catIdStr + "|" + imageUrl + "|"
                            + options.toString() + "|" + attrs.toString();
                    for (int i = 0; i < sig.length(); i++) {
                        fingerprint = (fingerprint * 31L) + sig.charAt(i);
                    }

                    productsMap.put(String.valueOf(managed.getId()), pMeta);
                }
            }

            Map<String, Map<String, Object>> sectionsMap = new LinkedHashMap<>();
            if (theme != null && theme.getPages() != null) {
                for (List<ThemeSectionDto> pageList : theme.getPages().values()) {
                    if (pageList == null) continue;
                    for (ThemeSectionDto sec : pageList) {
                        if (sec != null && sec.getId() != null && sec.getSettings() != null) {
                            sectionsMap.put(sec.getId(), sec.getSettings());
                        }
                    }
                }
            }
            if (theme != null && theme.getCustomPages() != null) {
                for (ThemeCustomPageDto cp : theme.getCustomPages()) {
                    if (cp == null || cp.getSections() == null) continue;
                    for (ThemeSectionDto sec : cp.getSections()) {
                        if (sec != null && sec.getId() != null && sec.getSettings() != null) {
                            sectionsMap.put(sec.getId(), sec.getSettings());
                        }
                    }
                }
            }

            root.put("catalogHash", Long.toHexString(fingerprint));
            root.put("products", productsMap);
            root.put("sections", sectionsMap);
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            return "{\"catalogHash\":\"0\",\"products\":{},\"sections\":{}}";
        }
    }

    private String normalizeLabel(String raw) {
        if (raw == null) return "";
        String clean = raw.trim();
        if (clean.isEmpty()) return "";
        return clean.substring(0, 1).toUpperCase() + clean.substring(1).toLowerCase();
    }

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

        List<ThemeSectionDto> homeSections = new ArrayList<>();

        Map<String, Object> announcementSettings = new LinkedHashMap<>();
        announcementSettings.put("text", "¡Envíos seguros a todo el país! Compra fácil en línea o por WhatsApp.");
        announcementSettings.put("bgColor", safeSecondary);
        announcementSettings.put("textColor", "#ffffff");
        announcementSettings.put("linkUrl", "/catalog");
        homeSections.add(ThemeSectionDto.builder()
                .id("sec_announcement_default")
                .type("announcement_bar")
                .enabled(false)
                .locked(false)
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
        homeSections.add(ThemeSectionDto.builder()
                .id("sec_hero_default")
                .type("hero_banner")
                .enabled(true)
                .locked(false)
                .settings(heroSettings)
                .build());

        Map<String, Object> gridSettings = new LinkedHashMap<>();
        gridSettings.put("title", "Novedades");
        gridSettings.put("subtitle", "");
        gridSettings.put("source", "NEWEST");
        gridSettings.put("categoryId", "");
        gridSettings.put("limit", 12);
        gridSettings.put("columnsDesktop", "4");
        gridSettings.put("showViewAll", true);
        gridSettings.put("showFilters", false);
        homeSections.add(ThemeSectionDto.builder()
                .id("sec_products_default")
                .type("product_grid")
                .enabled(true)
                .locked(false)
                .settings(gridSettings)
                .build());

        Map<String, Object> trustSettings = new LinkedHashMap<>();
        trustSettings.put("item1Title", "Compra 100% Segura");
        trustSettings.put("item1Text", "Tus datos y pedidos están protegidos en todo momento.");
        trustSettings.put("item2Title", "Envíos a Todo el País");
        trustSettings.put("item2Text", "Despachamos tu pedido rápido con transportadoras aliadas.");
        trustSettings.put("item3Title", "Atención Personalizada");
        trustSettings.put("item3Text", "Resolvemos tus dudas directamente por WhatsApp.");
        homeSections.add(ThemeSectionDto.builder()
                .id("sec_trust_default")
                .type("trust_badges")
                .enabled(false)
                .locked(false)
                .settings(trustSettings)
                .build());

        Map<String, List<ThemeSectionDto>> pages = new LinkedHashMap<>();
        pages.put("home", homeSections);
        pages.put("catalog", buildDefaultCatalogSections());
        pages.put("product", buildDefaultProductSections());

        return ThemeConfigDto.builder()
                .globalStyles(globalStyles)
                .sections(homeSections)
                .pages(pages)
                .customPages(new ArrayList<>())
                .build();
    }

    public List<ThemeSectionDto> buildDefaultCatalogSections() {
        List<ThemeSectionDto> list = new ArrayList<>();
        list.add(buildCatalogAnchorSection());
        return list;
    }

    public ThemeSectionDto buildCatalogAnchorSection() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("showHeader", true);
        settings.put("headerBadge", "Colección");
        settings.put("headerTitle", "Todo el Catálogo");
        settings.put("headerSubtitle", "Explora todos nuestros productos disponibles.");
        settings.put("showCategoryPills", true);
        settings.put("showSearchAndSort", true);
        settings.put("filterLayout", "sidebar");
        settings.put("showFilterPrice", true);
        settings.put("showFilterAvailability", true);
        settings.put("showFilterCategory", true);
        settings.put("showFilterVariants", true);
        settings.put("showFilterAttributes", true);
        settings.put("columnsDesktop", "4");
        settings.put("showDiscountPercent", true);
        return ThemeSectionDto.builder()
                .id("sec_catalog_results")
                .type("catalog_results")
                .enabled(true)
                .locked(true)
                .settings(settings)
                .build();
    }

    public List<ThemeSectionDto> buildDefaultProductSections() {
        List<ThemeSectionDto> list = new ArrayList<>();
        list.add(buildProductAnchorSection());
        return list;
    }

    public ThemeSectionDto buildProductAnchorSection() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("galleryLayout", "bottom");
        settings.put("showBreadcrumbs", true);
        settings.put("showSku", true);
        settings.put("showStockCounter", true);
        settings.put("showSpecs", true);
        settings.put("showPolicies", true);
        settings.put("showRelatedProducts", true);
        settings.put("relatedTitle", "También te puede interesar");
        settings.put("relatedSubtitle", "Otros productos de nuestro catálogo");
        return ThemeSectionDto.builder()
                .id("sec_product_main")
                .type("product_main")
                .enabled(true)
                .locked(true)
                .settings(settings)
                .build();
    }

    private void sanitizeThemeConfig(ThemeConfigDto config) {
        if (config == null) return;

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
        if (gs.getNavbarDropdownStyle() == null || !ALLOWED_NAV_DROPDOWN_STYLES.contains(gs.getNavbarDropdownStyle())) {
            gs.setNavbarDropdownStyle("mega");
        }
        if (gs.getNavbarDropdownAnim() == null || !ALLOWED_NAV_DROPDOWN_ANIMS.contains(gs.getNavbarDropdownAnim())) {
            gs.setNavbarDropdownAnim("slide_up");
        }
        if (gs.getNavbarTrigger() == null || !ALLOWED_NAV_TRIGGERS.contains(gs.getNavbarTrigger())) {
            gs.setNavbarTrigger("hover");
        }
        if (gs.getNavbarSpeed() == null || !ALLOWED_NAV_SPEEDS.contains(gs.getNavbarSpeed())) {
            gs.setNavbarSpeed("normal");
        }
        if (gs.getNavbarSticky() == null) {
            gs.setNavbarSticky(true);
        }
        if (gs.getNavbarCompactOnScroll() == null) {
            gs.setNavbarCompactOnScroll(false);
        }
        if (gs.getNavbarShowHome() == null) {
            gs.setNavbarShowHome(true);
        }
        if (gs.getNavbarShowCatalog() == null) {
            gs.setNavbarShowCatalog(true);
        }

        if (gs.getNavbarBrandMode() == null || !ALLOWED_NAV_BRAND_MODES.contains(gs.getNavbarBrandMode())) {
            gs.setNavbarBrandMode("logo");
        }
        if (gs.getNavbarLogoSize() == null || !ALLOWED_NAV_LOGO_SIZES.contains(gs.getNavbarLogoSize())) {
            gs.setNavbarLogoSize("md");
        }
        gs.setNavbarLogoUrl(cleanLogoUrl(gs.getNavbarLogoUrl()));
        gs.setNavbarLogoDarkUrl(cleanLogoUrl(gs.getNavbarLogoDarkUrl()));

        if (gs.getSearchEnabled() == null) {
            gs.setSearchEnabled(true);
        }
        if (gs.getSearchMode() == null || !ALLOWED_SEARCH_MODES.contains(gs.getSearchMode())) {
            gs.setSearchMode("predictive");
        }
        if (gs.getSearchNavbarVariant() == null || !ALLOWED_SEARCH_NAV_VARIANTS.contains(gs.getSearchNavbarVariant())) {
            gs.setSearchNavbarVariant("auto");
        }
        if (gs.getSearchMobileMode() == null || !ALLOWED_SEARCH_MOBILE_MODES.contains(gs.getSearchMobileMode())) {
            gs.setSearchMobileMode("fullscreen");
        }
        if (gs.getSearchInputStyle() == null || !ALLOWED_SEARCH_INPUT_STYLES.contains(gs.getSearchInputStyle())) {
            gs.setSearchInputStyle("sync");
        }
        if (gs.getSearchInputSize() == null || !ALLOWED_SEARCH_INPUT_SIZES.contains(gs.getSearchInputSize())) {
            gs.setSearchInputSize("normal");
        }
        if (gs.getSearchButtonMode() == null || !ALLOWED_SEARCH_BUTTON_MODES.contains(gs.getSearchButtonMode())) {
            gs.setSearchButtonMode("icon");
        }
        if (gs.getSearchAnim() == null || !ALLOWED_SEARCH_ANIMS.contains(gs.getSearchAnim())) {
            gs.setSearchAnim("slide_up");
        }
        if (gs.getSearchCategoryScope() == null || !ALLOWED_SEARCH_CATEGORY_SCOPES.contains(gs.getSearchCategoryScope())) {
            gs.setSearchCategoryScope("none");
        }
        if (gs.getSearchPlaceholder() == null || gs.getSearchPlaceholder().isBlank()) {
            gs.setSearchPlaceholder("Buscar productos...");
        } else {
            String ph = gs.getSearchPlaceholder().trim();
            gs.setSearchPlaceholder(ph.length() > 120 ? ph.substring(0, 120) : ph);
        }
        if (gs.getSearchButtonLabel() == null || gs.getSearchButtonLabel().isBlank()) {
            gs.setSearchButtonLabel("Buscar");
        } else {
            String bl = gs.getSearchButtonLabel().trim();
            gs.setSearchButtonLabel(bl.length() > 40 ? bl.substring(0, 40) : bl);
        }
        if (gs.getSearchEmptyMessage() == null || gs.getSearchEmptyMessage().isBlank()) {
            gs.setSearchEmptyMessage("No encontramos productos para tu búsqueda");
        } else {
            String em = gs.getSearchEmptyMessage().trim();
            gs.setSearchEmptyMessage(em.length() > 160 ? em.substring(0, 160) : em);
        }
        if (gs.getSearchPopularTerms() == null) {
            gs.setSearchPopularTerms("");
        } else {
            String pt = gs.getSearchPopularTerms().trim();
            gs.setSearchPopularTerms(pt.length() > 240 ? pt.substring(0, 240) : pt);
        }
        if (gs.getSearchMinChars() == null || gs.getSearchMinChars() < 1 || gs.getSearchMinChars() > 5) {
            gs.setSearchMinChars(2);
        }
        if (gs.getSearchDebounceMs() == null || gs.getSearchDebounceMs() < 0 || gs.getSearchDebounceMs() > 1000) {
            gs.setSearchDebounceMs(250);
        }
        if (gs.getSearchMaxSuggestions() == null || gs.getSearchMaxSuggestions() < 2 || gs.getSearchMaxSuggestions() > 12) {
            gs.setSearchMaxSuggestions(6);
        }
        if (gs.getSearchShowProductImg() == null) gs.setSearchShowProductImg(true);
        if (gs.getSearchShowProductPrice() == null) gs.setSearchShowProductPrice(true);
        if (gs.getSearchShowProductDiscount() == null) gs.setSearchShowProductDiscount(true);
        if (gs.getSearchShowProductCategory() == null) gs.setSearchShowProductCategory(true);
        if (gs.getSearchShowProductBrand() == null) gs.setSearchShowProductBrand(false);
        if (gs.getSearchSuggestCategories() == null) gs.setSearchSuggestCategories(true);
        if (gs.getSearchSuggestBrands() == null) gs.setSearchSuggestBrands(true);
        if (gs.getSearchShowRecent() == null) gs.setSearchShowRecent(true);
        if (gs.getSearchAdvancedEnabled() == null) gs.setSearchAdvancedEnabled(false);
        if (gs.getSearchMatchVariants() == null) gs.setSearchMatchVariants(true);
        if (gs.getSearchMatchSpecs() == null) gs.setSearchMatchSpecs(true);
        if (gs.getSearchAdvCategory() == null) gs.setSearchAdvCategory(true);
        if (gs.getSearchAdvBrand() == null) gs.setSearchAdvBrand(true);
        if (gs.getSearchAdvPrice() == null) gs.setSearchAdvPrice(true);
        if (gs.getSearchAdvAvailability() == null) gs.setSearchAdvAvailability(true);
        if (gs.getSearchAdvVariants() == null) gs.setSearchAdvVariants(true);
        if (gs.getSearchAdvSpecs() == null) gs.setSearchAdvSpecs(false);

        // Sanitización de estilos globales de Tarjetas de Productos
        if (gs.getCardPreset() == null || !ALLOWED_CARD_PRESETS.contains(gs.getCardPreset())) {
            gs.setCardPreset("commercial");
        }
        if (gs.getCardImageAspect() == null || !ALLOWED_CARD_IMG_ASPECTS.contains(gs.getCardImageAspect())) {
            gs.setCardImageAspect("square");
        }
        if (gs.getCardImageFit() == null || !ALLOWED_IMG_FITS.contains(gs.getCardImageFit())) {
            gs.setCardImageFit("cover");
        }
        if (gs.getCardImagePadding() == null || !ALLOWED_CARD_IMG_PADDINGS.contains(gs.getCardImagePadding())) {
            gs.setCardImagePadding("flush");
        }
        if (gs.getCardRadius() == null || !ALLOWED_CARD_RADII.contains(gs.getCardRadius())) {
            gs.setCardRadius("sync");
        }
        if (gs.getCardShadow() == null || !ALLOWED_CARD_SHADOWS.contains(gs.getCardShadow())) {
            gs.setCardShadow("sm");
        }
        if (gs.getCardContentAlign() == null || !ALLOWED_CARD_ALIGNS.contains(gs.getCardContentAlign())) {
            gs.setCardContentAlign("left");
        }
        if (gs.getCardMetaMode() == null || !ALLOWED_CARD_META_MODES.contains(gs.getCardMetaMode())) {
            gs.setCardMetaMode("category");
        }
        if (gs.getCardDiscountBadge() == null || !ALLOWED_CARD_DISCOUNT_BADGES.contains(gs.getCardDiscountBadge())) {
            gs.setCardDiscountBadge("percent");
        }
        if (gs.getCardShowStatusBadges() == null) {
            gs.setCardShowStatusBadges(true);
        }
        if (gs.getCardShowOldPrice() == null) {
            gs.setCardShowOldPrice(true);
        }
        if (gs.getCardPriceSize() == null || !ALLOWED_CARD_PRICE_SIZES.contains(gs.getCardPriceSize())) {
            gs.setCardPriceSize("normal");
        }
        if (gs.getCardActionMode() == null || !ALLOWED_CARD_VISIBILITY_MODES.contains(gs.getCardActionMode())) {
            gs.setCardActionMode("always");
        }
        if (gs.getCardWishlistMode() == null || !ALLOWED_CARD_VISIBILITY_MODES.contains(gs.getCardWishlistMode())) {
            gs.setCardWishlistMode("always");
        }
        if (gs.getCardButtonStyle() == null || !ALLOWED_CARD_BTN_STYLES.contains(gs.getCardButtonStyle())) {
            gs.setCardButtonStyle("solid");
        }
        if (gs.getCardImageHover() == null || !ALLOWED_CARD_IMG_HOVERS.contains(gs.getCardImageHover())) {
            gs.setCardImageHover("carousel");
        }
        if (gs.getCardHoverLift() == null || !ALLOWED_CARD_HOVER_LIFTS.contains(gs.getCardHoverLift())) {
            gs.setCardHoverLift("lift");
        }

        // Sanitización de estilos globales de Página de Detalle del Producto
        if (gs.getDetailPreset() == null || !ALLOWED_DETAIL_PRESETS.contains(gs.getDetailPreset())) {
            gs.setDetailPreset("conversion");
        }
        if (gs.getDetailInfoStyle() == null || !ALLOWED_DETAIL_INFO_STYLES.contains(gs.getDetailInfoStyle())) {
            gs.setDetailInfoStyle("clean");
        }
        if (gs.getDetailStickyMode() == null || !ALLOWED_DETAIL_STICKY_MODES.contains(gs.getDetailStickyMode())) {
            gs.setDetailStickyMode("sticky_info");
        }
        if (gs.getDetailGalleryPosition() == null || !ALLOWED_DETAIL_GALLERY_POS.contains(gs.getDetailGalleryPosition())) {
            gs.setDetailGalleryPosition("left");
        }
        if (gs.getDetailLayoutRatio() == null || !ALLOWED_DETAIL_LAYOUT_RATIOS.contains(gs.getDetailLayoutRatio())) {
            gs.setDetailLayoutRatio("50_50");
        }
        if (gs.getDetailGalleryLayout() == null || !ALLOWED_DETAIL_GALLERY_LAYOUTS.contains(gs.getDetailGalleryLayout())) {
            gs.setDetailGalleryLayout("bottom");
        }
        if (gs.getDetailGalleryArrows() == null) {
            gs.setDetailGalleryArrows(true);
        }
        if (gs.getDetailImageAspect() == null || !ALLOWED_DETAIL_IMG_ASPECTS.contains(gs.getDetailImageAspect())) {
            gs.setDetailImageAspect("square");
        }
        if (gs.getDetailImageFit() == null || !ALLOWED_IMG_FITS.contains(gs.getDetailImageFit())) {
            gs.setDetailImageFit("cover");
        }
        if (gs.getDetailImageZoom() == null) {
            gs.setDetailImageZoom(true);
        }
        if (gs.getDetailBuyLayout() == null || !ALLOWED_DETAIL_BUY_LAYOUTS.contains(gs.getDetailBuyLayout())) {
            gs.setDetailBuyLayout("standard");
        }
        if (gs.getDetailVariantStyle() == null || !ALLOWED_DETAIL_VARIANT_STYLES.contains(gs.getDetailVariantStyle())) {
            gs.setDetailVariantStyle("rounded");
        }
        if (gs.getDetailShowBreadcrumbs() == null) {
            gs.setDetailShowBreadcrumbs(true);
        }
        if (gs.getDetailShowMeta() == null) {
            gs.setDetailShowMeta(true);
        }
        if (gs.getDetailShowSku() == null) {
            gs.setDetailShowSku(true);
        }
        if (gs.getDetailShowSavingsBadge() == null) {
            gs.setDetailShowSavingsBadge(true);
        }
        if (gs.getDetailShowStock() == null) {
            gs.setDetailShowStock(true);
        }
        if (gs.getDetailShowTrustStrip() == null) {
            gs.setDetailShowTrustStrip(true);
        }
        if (gs.getDetailShowShare() == null) {
            gs.setDetailShowShare(true);
        }
        if (gs.getDetailShowSpecs() == null) {
            gs.setDetailShowSpecs(true);
        }
        if (gs.getDetailSpecsOpen() == null || !ALLOWED_DETAIL_SPECS_OPEN.contains(gs.getDetailSpecsOpen())) {
            gs.setDetailSpecsOpen("collapsed");
        }
        if (gs.getDetailShowPolicies() == null) {
            gs.setDetailShowPolicies(true);
        }
        if (gs.getDetailShowRelated() == null) {
            gs.setDetailShowRelated(true);
        }
        if (gs.getDetailRelatedCols() == null || !ALLOWED_DETAIL_RELATED_COLS.contains(gs.getDetailRelatedCols())) {
            gs.setDetailRelatedCols("4");
        }

        // Sanitización de estilos globales de Paginación y Carga de Productos
        if (gs.getPaginationMode() == null || !ALLOWED_PAGINATION_MODES.contains(gs.getPaginationMode())) {
            gs.setPaginationMode("numbered");
        }
        if (gs.getPaginationPageSize() == null || gs.getPaginationPageSize() < 4 || gs.getPaginationPageSize() > 48) {
            gs.setPaginationPageSize(12);
        }
        if (gs.getPaginationButtonShape() == null || !ALLOWED_PAGINATION_SHAPES.contains(gs.getPaginationButtonShape())) {
            gs.setPaginationButtonShape("rounded");
        }
        if (gs.getPaginationButtonSize() == null || !ALLOWED_PAGINATION_SIZES.contains(gs.getPaginationButtonSize())) {
            gs.setPaginationButtonSize("md");
        }
        if (gs.getPaginationAlign() == null || !ALLOWED_PAGINATION_ALIGNS.contains(gs.getPaginationAlign())) {
            gs.setPaginationAlign("center");
        }
        if (gs.getPaginationSpacing() == null || !ALLOWED_PAGINATION_SIZES.contains(gs.getPaginationSpacing())) {
            gs.setPaginationSpacing("md");
        }
        if (gs.getPaginationBorderWidth() == null || !ALLOWED_PAGINATION_BORDERS.contains(gs.getPaginationBorderWidth())) {
            gs.setPaginationBorderWidth("1px");
        }
        if (gs.getPaginationColorMode() == null || (!"brand".equals(gs.getPaginationColorMode()) && !"custom".equals(gs.getPaginationColorMode()))) {
            gs.setPaginationColorMode("brand");
        }
        if (!isValidHex(gs.getPaginationBgColor())) {
            gs.setPaginationBgColor("#ffffff");
        }
        if (!isValidHex(gs.getPaginationTextColor())) {
            gs.setPaginationTextColor(isValidHex(gs.getSecondaryColor()) ? gs.getSecondaryColor() : "#0f172a");
        }
        if (!isValidHex(gs.getPaginationBorderColor())) {
            gs.setPaginationBorderColor("#e2e8f0");
        }
        if (!isValidHex(gs.getPaginationActiveBgColor())) {
            gs.setPaginationActiveBgColor(isValidHex(gs.getPrimaryColor()) ? gs.getPrimaryColor() : "#6366f1");
        }
        if (!isValidHex(gs.getPaginationActiveTextColor())) {
            gs.setPaginationActiveTextColor("#ffffff");
        }
        if (gs.getPaginationShowCounter() == null) {
            gs.setPaginationShowCounter(true);
        }
        if (gs.getPaginationShowPrevNext() == null) {
            gs.setPaginationShowPrevNext(true);
        }

        if (config.getPages() == null) {
            config.setPages(new LinkedHashMap<>());
        }
        Map<String, List<ThemeSectionDto>> pages = config.getPages();

        if ((!pages.containsKey("home") || pages.get("home") == null || pages.get("home").isEmpty())
                && config.getSections() != null && !config.getSections().isEmpty()) {
            pages.put("home", new ArrayList<>(config.getSections()));
        } else if (!pages.containsKey("home") || pages.get("home") == null) {
            pages.put("home", new ArrayList<>());
        }

        List<ThemeSectionDto> catalogSections = pages.computeIfAbsent("catalog", k -> buildDefaultCatalogSections());
        boolean hasCatalogAnchor = catalogSections.stream().anyMatch(s -> s != null && "catalog_results".equalsIgnoreCase(s.getType()));
        if (!hasCatalogAnchor) {
            catalogSections.add(0, buildCatalogAnchorSection());
        }

        List<ThemeSectionDto> productSections = pages.computeIfAbsent("product", k -> buildDefaultProductSections());
        boolean hasProductAnchor = productSections.stream().anyMatch(s -> s != null && "product_main".equalsIgnoreCase(s.getType()));
        if (!hasProductAnchor) {
            productSections.add(0, buildProductAnchorSection());
        }

        // Sanitizar páginas de categorías personalizadas (category:{id})
        Iterator<Map.Entry<String, List<ThemeSectionDto>>> pageIt = pages.entrySet().iterator();
        while (pageIt.hasNext()) {
            Map.Entry<String, List<ThemeSectionDto>> entry = pageIt.next();
            String key = entry.getKey();
            List<ThemeSectionDto> list = entry.getValue();

            if (key != null && key.startsWith("category:")) {
                if (list == null || list.isEmpty()) {
                    // Si está vacía, se elimina la clave para que herede limpiamente de 'catalog'
                    pageIt.remove();
                    continue;
                }
                list.removeIf(s -> s == null || "product_main".equalsIgnoreCase(s.getType()));
                boolean hasCatAnchor = list.stream().anyMatch(s -> "catalog_results".equalsIgnoreCase(s.getType()));
                if (!hasCatAnchor) {
                    ThemeSectionDto anchor = buildCatalogAnchorSection();
                    anchor.setId("sec_catalog_results_" + key.substring(9));
                    list.add(anchor);
                }
            }

            if (list != null) {
                list.removeIf(Objects::isNull);
                for (ThemeSectionDto sec : list) {
                    sanitizeSingleSection(sec);
                }
                deduplicateSectionAnchors(list);
            }
        }

        config.setSections(pages.get("home"));

        // Sanitizar páginas personalizadas (page:{slug})
        if (config.getCustomPages() == null) {
            config.setCustomPages(new ArrayList<>());
        } else {
            List<ThemeCustomPageDto> cleanCustomPages = new ArrayList<>();
            Set<String> usedSlugs = new HashSet<>();

            for (ThemeCustomPageDto cp : config.getCustomPages()) {
                if (cp == null) continue;
                String title = cp.getTitle() != null ? cp.getTitle().trim() : "";
                if (title.isEmpty()) continue;

                String rawSlug = (cp.getSlug() != null && !cp.getSlug().isBlank()) ? cp.getSlug() : title;
                String slug = sanitizeSlug(rawSlug);
                if (slug.isEmpty() || RESERVED_PAGE_SLUGS.contains(slug)) {
                    slug = "pagina-" + (cleanCustomPages.size() + 1);
                }
                String uniqueSlug = slug;
                int counter = 2;
                while (usedSlugs.contains(uniqueSlug)) {
                    uniqueSlug = slug + "-" + counter++;
                }
                usedSlugs.add(uniqueSlug);

                cp.setTitle(title);
                cp.setSlug(uniqueSlug);
                if (cp.getShowInNavbar() == null) {
                    cp.setShowInNavbar(true);
                }
                if (cp.getSections() == null) {
                    cp.setSections(new ArrayList<>());
                }
                cp.getSections().removeIf(s -> s == null
                        || "catalog_results".equalsIgnoreCase(s.getType())
                        || "product_main".equalsIgnoreCase(s.getType()));

                for (ThemeSectionDto sec : cp.getSections()) {
                    sanitizeSingleSection(sec);
                }
                deduplicateSectionAnchors(cp.getSections());
                cleanCustomPages.add(cp);
            }
            config.setCustomPages(cleanCustomPages);
        }
    }

    private String sanitizeSlug(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        String slug = normalized.replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return slug.length() > 50 ? slug.substring(0, 50).replaceAll("-+$", "") : slug;
    }
    private static String cleanLogoUrl(String raw) {
        if (raw == null) return "";
        String url = raw.trim();
        if (url.isEmpty() || url.length() > 500) return "";
        String lower = url.toLowerCase();
        boolean ok = lower.startsWith("https://") || lower.startsWith("http://")
                || (url.startsWith("/") && !url.startsWith("//"));
        return ok ? url : "";
    }

    private void sanitizeSingleSection(ThemeSectionDto sec) {
        if (sec == null) return;
        if (sec.getId() == null || sec.getId().isBlank()) {
            sec.setId("sec_" + UUID.randomUUID().toString().substring(0, 8));
        }
        if ("catalog_results".equalsIgnoreCase(sec.getType()) || "product_main".equalsIgnoreCase(sec.getType())) {
            sec.setLocked(true);
            sec.setEnabled(true);
        } else if (sec.getLocked() == null) {
            sec.setLocked(false);
        }
        if (sec.getEnabled() == null) {
            sec.setEnabled(true);
        }

        if (sec.getSettings() != null) {
            sec.getSettings().replaceAll((k, v) -> {
                if (v instanceof String str) {
                    String trimmed = str.trim();
                    String lowerKey = k.toLowerCase();
                    String lowerVal = trimmed.toLowerCase();
                    if (lowerKey.endsWith("url") && (lowerVal.startsWith("javascript:") || lowerVal.startsWith("data:") || lowerVal.startsWith("vbscript:"))) {
                        return "";
                    }
                    if (lowerKey.endsWith("color") && !trimmed.isEmpty() && !isValidHex(trimmed)) {
                        return "#0f172a";
                    }
                    return trimmed;
                }
                return v;
            });
            sanitizeAllowedSetting(sec.getSettings(), "layoutSpaceTop", ALLOWED_LAYOUT_SPACING);
            sanitizeAllowedSetting(sec.getSettings(), "layoutSpaceBottom", ALLOWED_LAYOUT_SPACING);
            sanitizeAllowedSetting(sec.getSettings(), "layoutWidth", ALLOWED_LAYOUT_WIDTH);
            sanitizeAllowedSetting(sec.getSettings(), "layoutBgMode", ALLOWED_LAYOUT_BG_MODES);
            sanitizeAllowedSetting(sec.getSettings(), "layoutTone", ALLOWED_LAYOUT_TONES);
            if (!"solid".equals(sec.getSettings().get("layoutBgMode"))
                    || !(sec.getSettings().get("layoutBgColor") instanceof String bgHex)
                    || !isValidHex(bgHex)) {
                sec.getSettings().remove("layoutBgMode");
                sec.getSettings().remove("layoutBgColor");
                sec.getSettings().remove("layoutTone");
            }
            sanitizeSectionAnchor(sec);
            sanitizeImageFraming(sec.getSettings());
            sanitizePhase2SectionSettings(sec);
        }
    }

    private static final java.util.regex.Pattern IMAGE_FRAME_KEY =
            java.util.regex.Pattern.compile("^.*[iI]mage(Fit|PosX|PosY|Zoom)$");

    /** Valida el encuadre de las fotos: ajuste (cover/contain), enfoque 0-100 y zoom 100-250. */
    private void sanitizeImageFraming(Map<String, Object> s) {
        if (s == null) return;
        for (String key : new ArrayList<>(s.keySet())) {
            java.util.regex.Matcher m = IMAGE_FRAME_KEY.matcher(key);
            if (!m.matches()) continue;
            Object v = s.get(key);
            String kind = m.group(1);
            if ("Fit".equals(kind)) {
                if (!"cover".equals(v) && !"contain".equals(v)) s.remove(key);
                continue;
            }
            double n;
            try {
                n = Double.parseDouble(String.valueOf(v).trim());
            } catch (Exception e) {
                s.remove(key);
                continue;
            }
            double min = "Zoom".equals(kind) ? 100 : 0;
            double max = "Zoom".equals(kind) ? 250 : 100;
            s.put(key, (int) Math.round(Math.max(min, Math.min(max, n))));
        }
    }

    private void sanitizePhase2SectionSettings(ThemeSectionDto sec) {
        if (sec == null || sec.getSettings() == null || sec.getType() == null) return;
        Map<String, Object> s = sec.getSettings();
        String type = sec.getType();

        if ("featured_video".equalsIgnoreCase(type)) {
            if (!ALLOWED_VIDEO_ASPECTS.contains(sec.settingStr("aspectRatio", ""))) {
                s.put("aspectRatio", "16:9");
            }
            String rawVideoUrl = sec.settingStr("videoUrl", "");
            String extractedId = extractYoutubeVideoId(rawVideoUrl);
            if (extractedId.isEmpty()) {
                extractedId = extractYoutubeVideoId(sec.settingStr("videoId", ""));
            }
            if (!extractedId.isEmpty()) {
                s.put("videoId", extractedId);
            } else {
                s.remove("videoId");
                if (!rawVideoUrl.isEmpty() && !rawVideoUrl.startsWith("https://") && !rawVideoUrl.startsWith("http://")) {
                    s.put("videoUrl", "");
                }
            }
        } else if ("stats_counter".equalsIgnoreCase(type)) {
            if (!ALLOWED_STAT_STYLES.contains(sec.settingStr("statStyle", ""))) {
                s.put("statStyle", "cards");
            }
            for (int i = 1; i <= 4; i++) {
                String iconKey = "item" + i + "Icon";
                if (s.containsKey(iconKey) && !ALLOWED_STAT_ICONS.contains(sec.settingStr(iconKey, ""))) {
                    s.put(iconKey, "star");
                }
            }
        } else if ("gallery_lookbook".equalsIgnoreCase(type)) {
            if (!ALLOWED_GALLERY_COLS.contains(sec.settingStr("columns", ""))) {
                s.put("columns", "3");
            }
            if (!ALLOWED_GALLERY_ASPECTS.contains(sec.settingStr("imageAspect", ""))) {
                s.put("imageAspect", "portrait");
            }
        } else if ("brand_carousel".equalsIgnoreCase(type)) {
            if (!ALLOWED_BRAND_DISPLAY_MODES.contains(sec.settingStr("displayMode", ""))) {
                s.put("displayMode", "grid");
            }
            s.put("source", "AUTO".equalsIgnoreCase(sec.settingStr("source", "MANUAL")) ? "AUTO" : "MANUAL");
            if (!ALLOWED_BRAND_LOGO_SIZES.contains(sec.settingStr("logoSize", ""))) {
                s.put("logoSize", "md");
            }
            s.put("grayscale", sec.settingBool("grayscale", false));
        } else if ("social_showcase".equalsIgnoreCase(type)) {
            s.put("instagramUrl", normalizeSocialProfileUrl(sec.settingStr("instagramUrl", ""), "instagram"));
            s.put("tiktokUrl", normalizeSocialProfileUrl(sec.settingStr("tiktokUrl", ""), "tiktok"));
            s.put("facebookUrl", normalizeSocialProfileUrl(sec.settingStr("facebookUrl", ""), "facebook"));
            s.put("showWhatsapp", sec.settingBool("showWhatsapp", true));
        } else if ("product_grid".equalsIgnoreCase(type)) {
            String rawSource = sec.settingStr("source", "NEWEST").toUpperCase(Locale.ROOT);
            if (!ALLOWED_PRODUCT_GRID_SOURCES.contains(rawSource)) {
                rawSource = "NEWEST";
            }
            s.put("source", rawSource);

            String cols = sec.settingStr("columnsDesktop", "4");
            s.put("columnsDesktop", "3".equals(cols) ? "3" : "4");

            List<Long> cleanIds = sec.settingLongList("productIds");
            if (cleanIds.size() > 24) {
                cleanIds = new ArrayList<>(cleanIds.subList(0, 24));
            }
            String csvIds = cleanIds.stream().map(String::valueOf).collect(Collectors.joining(","));
            s.put("productIds", csvIds);
        }
    }

    private String normalizeSocialProfileUrl(String raw, String platform) {
        if (raw == null || raw.isBlank()) return "";
        String clean = raw.trim();
        String lower = clean.toLowerCase();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
            return "";
        }
        if (lower.startsWith("https://") || lower.startsWith("http://")) {
            return clean;
        }
        String handle = clean.replaceFirst("^@+", "").replaceAll("[^a-zA-Z0-9._/-]", "");
        if (handle.isEmpty()) return "";
        return switch (platform) {
            case "instagram" -> "https://www.instagram.com/" + handle;
            case "tiktok" -> "https://www.tiktok.com/@" + handle;
            case "facebook" -> "https://www.facebook.com/" + handle;
            default -> "";
        };
    }

    private String extractYoutubeVideoId(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) return "";
        String clean = rawUrl.trim();
        if (clean.matches("^[a-zA-Z0-9_-]{11}$")) {
            return clean;
        }
        java.util.regex.Matcher m = YOUTUBE_ID_PATTERN.matcher(clean);
        if (m.find()) {
            String candidate = m.group(1);
            if (candidate != null && candidate.matches("^[a-zA-Z0-9_-]{11}$")) {
                return candidate;
            }
        }
        return "";
    }

    private void sanitizeSectionAnchor(ThemeSectionDto sec) {
        if (sec == null || sec.getSettings() == null || !sec.getSettings().containsKey("layoutAnchor")) return;
        if ("catalog_results".equalsIgnoreCase(sec.getType()) || "product_main".equalsIgnoreCase(sec.getType())) {
            sec.getSettings().remove("layoutAnchor");
            return;
        }
        Object raw = sec.getSettings().get("layoutAnchor");
        if (!(raw instanceof String str)) {
            sec.getSettings().remove("layoutAnchor");
            return;
        }
        String clean = str.trim();
        if (!isValidAnchorSlug(clean)) {
            sec.getSettings().remove("layoutAnchor");
        }
    }

    private boolean isValidAnchorSlug(String slug) {
        if (slug == null || slug.isEmpty() || slug.length() > 40) return false;
        if (slug.endsWith("-") || RESERVED_ANCHOR_IDS.contains(slug)) return false;
        return slug.matches("^[a-z][a-z0-9-]{0,39}$");
    }

    private void deduplicateSectionAnchors(List<ThemeSectionDto> sections) {
        if (sections == null || sections.isEmpty()) return;
        Set<String> seen = new HashSet<>();
        for (ThemeSectionDto sec : sections) {
            if (sec == null || sec.getSettings() == null) continue;
            Object raw = sec.getSettings().get("layoutAnchor");
            if (raw instanceof String anchor && !anchor.isBlank()) {
                if (!seen.add(anchor)) {
                    sec.getSettings().remove("layoutAnchor");
                }
            }
        }
    }

    private void sanitizeAllowedSetting(Map<String, Object> settings, String key, Set<String> allowedValues) {
        if (settings == null || !settings.containsKey(key)) return;
        Object raw = settings.get(key);
        if (!(raw instanceof String str) || !allowedValues.contains(str.trim())) {
            settings.remove(key);
        }
    }

    private boolean isValidHex(String color) {
        return color != null && color.matches("^#[0-9a-fA-F]{6}$");
    }
}