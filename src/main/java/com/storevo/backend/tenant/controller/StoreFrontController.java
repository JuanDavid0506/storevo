package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreSettings;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.dto.ThemeConfigDto;
import com.storevo.backend.tenant.dto.ThemeCustomPageDto;
import com.storevo.backend.tenant.dto.ThemeSectionDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductImage;
import com.storevo.backend.tenant.repository.StoreReviewRepository;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.CustomerService;
import com.storevo.backend.tenant.service.OrderService;
import com.storevo.backend.tenant.service.ProductService;
import com.storevo.backend.tenant.service.StoreThemeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/s/{slug}")
@RequiredArgsConstructor
public class StoreFrontController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final StoreThemeService storeThemeService;
    private final OrderService orderService;
    private final com.storevo.backend.tenant.service.CartManager cartManager;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final StoreReviewRepository storeReviewRepository;
    private final StoreIntegrationRepository integrationRepository;
    private final com.storevo.backend.config.security.RateLimitService rateLimitService;

    private int resolveGlobalPageSize(ThemeConfigDto theme, Integer requestedSize) {
        if (requestedSize != null && requestedSize >= 4 && requestedSize <= 48) {
            return requestedSize;
        }
        if (theme != null && theme.getGlobalStyles() != null && theme.getGlobalStyles().getPaginationPageSize() != null) {
            return Math.max(4, Math.min(theme.getGlobalStyles().getPaginationPageSize(), 48));
        }
        return 12;
    }

    private void hydratePageContext(HttpServletRequest request, Model model, List<Product> pageProducts) {
        Store store = (Store) request.getAttribute("currentStore");
        String defaultStoreName = (store != null && store.getName() != null && !store.getName().isBlank())
                ? store.getName() : "Mi Tienda";

        Object rawSettings = model.getAttribute("settings");
        if (rawSettings instanceof StoreSettingsDto settingsDto) {
            if (settingsDto.getStoreName() == null || settingsDto.getStoreName().isBlank()) {
                settingsDto.setStoreName(defaultStoreName);
            }
        } else if (rawSettings instanceof StoreSettings settingsEntity) {
            if (settingsEntity.getStoreName() == null || settingsEntity.getStoreName().isBlank()) {
                settingsEntity.setStoreName(defaultStoreName);
            }
        } else {
            StoreSettings settings = null;
            if (store != null && store.getId() != null) {
                String currentSchema = store.getSchemaName();
                try {
                    TenantContext.clear();
                    settings = storeThemeService.findSettingsInAdminDb(store.getId());
                } catch (Exception ignored) {
                } finally {
                    if (currentSchema != null) {
                        TenantContext.setCurrentTenant(currentSchema);
                    }
                }
            }
            if (settings == null) {
                settings = new StoreSettings();
            }
            if (settings.getStoreName() == null || settings.getStoreName().isBlank()) {
                settings.setStoreName(defaultStoreName);
            }
            model.addAttribute("settings", settings);
        }

        ThemeConfigDto theme = (ThemeConfigDto) model.getAttribute("theme");
        if (theme == null && store != null) {
            boolean isDraft = "draft".equalsIgnoreCase(request.getParameter("preview"));
            theme = storeThemeService.getRawThemeConfig(store, isDraft);
            model.addAttribute("theme", theme);
        }

        String activePageKey = (String) model.getAttribute("editorPageKey");
        if (theme != null && store != null) {
            storeThemeService.hydrateThemeSectionsForPage(store, theme, activePageKey, pageProducts);
        }

        LinkedHashMap<Long, Product> filterProductsMap = new LinkedHashMap<>();
        if (pageProducts != null) {
            for (Product p : pageProducts) {
                if (p != null && p.getId() != null) filterProductsMap.put(p.getId(), p);
            }
        }
        if (theme != null) {
            List<ThemeSectionDto> secs = activePageKey != null
                    ? theme.getPageSections(activePageKey)
                    : theme.getSections();
            if (secs != null) {
                for (ThemeSectionDto sec : secs) {
                    if (sec != null && sec.getResolvedProducts() != null) {
                        for (Product rp : sec.getResolvedProducts()) {
                            if (rp != null && rp.getId() != null) filterProductsMap.putIfAbsent(rp.getId(), rp);
                        }
                    }
                    if (sec != null && sec.getResolvedTabs() != null) {
                        for (Map<String, Object> tabMap : sec.getResolvedTabs()) {
                            if (tabMap != null && tabMap.get("products") instanceof Collection<?> tabProds) {
                                for (Object itemObj : tabProds) {
                                    if (itemObj instanceof Product tp && tp.getId() != null) {
                                        filterProductsMap.putIfAbsent(tp.getId(), tp);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        List<Product> boundedForFilters = new ArrayList<>(filterProductsMap.values());
        model.addAttribute("allCatalogProducts", boundedForFilters);
        model.addAttribute("catalogFilterDataJson",
                storeThemeService.buildCatalogFilterDataJson(store, theme, boundedForFilters));

        try {
            model.addAttribute("storeReviews", storeReviewRepository.findTop6ByIsVisibleTrueOrderByCreatedAtDesc());
        } catch (Exception e) {
            model.addAttribute("storeReviews", Collections.emptyList());
        }

        try {
            model.addAttribute("categoryProductCounts", categoryService.getProductCountsByCategory());
            model.addAttribute("allActiveCategories", categoryService.getAllCategories());
        } catch (Exception e) {
            model.addAttribute("categoryProductCounts", Collections.emptyMap());
        }

        boolean wompiEnabled = false;
        if (store != null && store.getId() != null) {
            String currentSchema = store.getSchemaName();
            try {
                TenantContext.clear();
                wompiEnabled = integrationRepository
                        .findByStoreAndIntegrationTypeAndIsActiveTrue(store, IntegrationType.WOMPI)
                        .isPresent();
            } catch (Exception ignored) {
            } finally {
                if (currentSchema != null) {
                    TenantContext.setCurrentTenant(currentSchema);
                }
            }
        }
        Object resolvedSettings = model.getAttribute("settings");
        String waNumber = null;
        if (resolvedSettings instanceof StoreSettingsDto sDto) {
            waNumber = sDto.getWhatsapp();
        } else if (resolvedSettings instanceof StoreSettings sEnt) {
            waNumber = sEnt.getWhatsapp();
        }
        model.addAttribute("storeWompiEnabled", wompiEnabled);
        model.addAttribute("storeWhatsappEnabled", waNumber != null && !waNumber.isBlank());
    }

    @GetMapping
    public String home(
            @RequestParam(required = false) String preview,
            HttpServletRequest request,
            Model model) {

        ThemeConfigDto theme = (ThemeConfigDto) model.getAttribute("theme");
        int pageSize = resolveGlobalPageSize(theme, null);
        List<Product> initialProducts = productService.getNewestPublicProducts(Math.max(pageSize, 12));

        model.addAttribute("editorPageKey", "home");
        model.addAttribute("pageTitle", "Inicio");
        hydratePageContext(request, model, initialProducts);
        model.addAttribute("products", initialProducts);
        return "storefront/home";
    }

    @GetMapping("/catalog")
    public String catalog(
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "default") String sort,
            @RequestParam(required = false) Boolean offers,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Long cursor,
            HttpServletRequest request,
            Model model) {

        String activePageKey = "catalog";
        if (category != null) {
            try {
                Category currentCat = categoryService.getCategoryById(category);
                model.addAttribute("currentCategory", currentCat);
                model.addAttribute("pageTitle", currentCat.getName());
                activePageKey = "category:" + currentCat.getId();
            } catch (Exception e) {
                model.addAttribute("pageTitle", "Catálogo");
            }
        } else {
            model.addAttribute("pageTitle", "Catálogo");
        }
        model.addAttribute("editorPageKey", activePageKey);
        model.addAttribute("currentCategoryId", category);

        ThemeConfigDto theme = (ThemeConfigDto) model.getAttribute("theme");
        int effectiveSize = resolveGlobalPageSize(theme, size);
        int zeroBasedPage = Math.max(0, page - 1);

        Page<Product> productPage = productService.searchPublicCatalogPage(
                category, brandId, brand, q, offers, featured, inStock, minPrice, maxPrice,
                sort, zeroBasedPage, effectiveSize, cursor
        );

        List<Product> pageProducts = productPage.getContent();
        Long nextCursor = !pageProducts.isEmpty() ? pageProducts.get(pageProducts.size() - 1).getId() : null;

        hydratePageContext(request, model, pageProducts);

        model.addAttribute("products", pageProducts);
        model.addAttribute("catalogPage", productPage);
        model.addAttribute("catalogCurrentPage", Math.max(1, page));
        model.addAttribute("catalogPageSize", effectiveSize);
        model.addAttribute("catalogTotalItems", productPage.getTotalElements());
        model.addAttribute("catalogTotalPages", Math.max(1, productPage.getTotalPages()));
        model.addAttribute("catalogHasNext", productPage.hasNext());
        model.addAttribute("catalogHasPrev", page > 1);
        model.addAttribute("catalogNextCursor", nextCursor);

        return "storefront/catalog";
    }

    @GetMapping("/api/catalog-page")
    @ResponseBody
    public ResponseEntity< Map<String, Object> > getCatalogPageJson(
            @PathVariable String slug,
            @RequestParam(required = false) String sectionId,
            @RequestParam(required = false) String pageKey,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String productIds,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "default") String sort,
            @RequestParam(required = false) Boolean offers,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Long cursor,
            @RequestParam(required = false) String preview,
            HttpServletRequest request,
            Model model) {

        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tienda no encontrada"));
        }
        TenantContext.setCurrentTenant(store.getSchemaName());

        ThemeConfigDto theme = (ThemeConfigDto) model.getAttribute("theme");
        if (theme == null) {
            boolean isDraft = "draft".equalsIgnoreCase(preview);
            theme = storeThemeService.getRawThemeConfig(store, isDraft);
        }

        int effectiveSize = resolveGlobalPageSize(theme, size);
        int zeroBasedPage = Math.max(0, page - 1);

        String resolvedSource = source != null ? source.trim().toUpperCase(Locale.ROOT) : "";
        Long resolvedCat = category;
        Long resolvedBrandId = brandId;
        String resolvedBrandName = brand;
        List<Long> manualIds = new ArrayList<>();

        // Si viene sectionId, resolver configuración de la sección desde el tema
        if (sectionId != null && !sectionId.isBlank() && theme != null) {
            ThemeSectionDto foundSec = findSectionInTheme(theme, sectionId, pageKey);
            if (foundSec != null) {
                if (resolvedSource.isEmpty()) {
                    resolvedSource = foundSec.settingStr("source", "NEWEST").toUpperCase(Locale.ROOT);
                }
                if (resolvedCat == null) {
                    resolvedCat = foundSec.settingLong("categoryId");
                }
                if (resolvedBrandId == null) {
                    resolvedBrandId = foundSec.settingLong("brandId");
                }
                if (resolvedBrandName == null || resolvedBrandName.isBlank()) {
                    resolvedBrandName = foundSec.settingStr("brandName", "");
                }
                manualIds = foundSec.settingLongList("productIds");
                if ("default".equalsIgnoreCase(sort)) {
                    sort = foundSec.settingStr("defaultSort", "default");
                }
            }
        } else if (productIds != null && !productIds.isBlank()) {
            for (String part : productIds.split(",")) {
                try {
                    long id = Long.parseLong(part.trim());
                    if (id > 0 && !manualIds.contains(id)) manualIds.add(id);
                } catch (NumberFormatException ignored) {}
            }
        }

        Boolean effOffers = offers;
        Boolean effFeatured = featured;
        if ("OFFERS".equals(resolvedSource)) {
            effOffers = true;
        } else if ("FEATURED".equals(resolvedSource)) {
            effFeatured = true;
        }

        Page<Product> resultPage;
        if ("MANUAL".equals(resolvedSource)) {
            resultPage = productService.getManualPublicProductsPage(manualIds, q, sort, zeroBasedPage, effectiveSize);
        } else if ("BEST_SELLERS".equals(resolvedSource)) {
            resultPage = productService.getBestSellingPublicProductsPage(q, sort, zeroBasedPage, effectiveSize);
        } else if ("RECOMMENDED".equals(resolvedSource)) {
            resultPage = productService.getRecommendedPublicProductsPage(q, sort, zeroBasedPage, effectiveSize);
        } else {
            resultPage = productService.searchPublicCatalogPage(
                    resolvedCat, resolvedBrandId, resolvedBrandName, q,
                    effOffers, effFeatured, inStock, minPrice, maxPrice,
                    sort, zeroBasedPage, effectiveSize, cursor
            );
        }

        @SuppressWarnings("unchecked")
        Set<Long> wishlistIds = ( model.getAttribute("wishlistProductIds") instanceof Collection<?> col )
                ? col.stream().filter(Objects::nonNull).map(o -> ((Number) o).longValue()).collect(Collectors.toSet())
                : Collections.emptySet();

        List< Map<String, Object> > serializedItems = new ArrayList<>();
        for (Product p : resultPage.getContent()) {
            serializedItems.add(serializeProductCardData(p, wishlistIds));
        }

        List<Product> content = resultPage.getContent();
        Long nextCursor = !content.isEmpty() ? content.get(content.size() - 1).getId() : null;
        int totalPages = Math.max(1, resultPage.getTotalPages());
        boolean hasMore = (cursor != null && cursor > 0)
                ? (content.size() >= effectiveSize && resultPage.getTotalElements() > content.size())
                : (page < totalPages);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", serializedItems);
        response.put("page", Math.max(1, page));
        response.put("size", effectiveSize);
        response.put("totalElements", resultPage.getTotalElements());
        response.put("totalPages", totalPages);
        response.put("hasNext", hasMore);
        response.put("hasPrevious", page > 1);
        response.put("nextCursor", nextCursor);
        return ResponseEntity.ok(response);
    }

    private ThemeSectionDto findSectionInTheme(ThemeConfigDto theme, String sectionId, String pageKey) {
        if (theme == null || sectionId == null) return null;
        if (pageKey != null && !pageKey.isBlank()) {
            for (ThemeSectionDto s : theme.getPageSections(pageKey)) {
                if (s != null && sectionId.equals(s.getId())) return s;
            }
        }
        if (theme.getPages() != null) {
            for (List<ThemeSectionDto> list : theme.getPages().values()) {
                if (list == null) continue;
                for (ThemeSectionDto s : list) {
                    if (s != null && sectionId.equals(s.getId())) return s;
                }
            }
        }
        if (theme.getCustomPages() != null) {
            for (ThemeCustomPageDto cp : theme.getCustomPages()) {
                if (cp == null || cp.getSections() == null) continue;
                for (ThemeSectionDto s : cp.getSections()) {
                    if (s != null && sectionId.equals(s.getId())) return s;
                }
            }
        }
        return null;
    }

    private Map<String, Object> serializeProductCardData(Product p, Set<Long> wishlistIds) {
        Map<String, Object> item = new LinkedHashMap<>();
        double origPrice = p.getPrice() != null ? p.getPrice() : 0.0;
        double discPrice = p.getDiscountPrice() != null ? p.getDiscountPrice() : 0.0;
        boolean hasDiscount = discPrice > 0 && origPrice > discPrice;
        double effectivePrice = hasDiscount ? discPrice : origPrice;
        long discountPct = (hasDiscount && origPrice > 0)
                ? Math.round(((origPrice - discPrice) * 100.0) / origPrice)
                : 0L;
        boolean isMadeToOrder = Boolean.TRUE.equals(p.getIsMadeToOrder());
        int stockVal = p.getStock() != null ? p.getStock() : 0;
        boolean outOfStock = !isMadeToOrder && stockVal <= 0;

        List<String> galleryUrls = new ArrayList<>();
        if (p.getImages() != null) {
            for (ProductImage img : p.getImages()) {
                if (img != null && img.getSecureUrl() != null && !img.getSecureUrl().isBlank()) {
                    if (!galleryUrls.contains(img.getSecureUrl())) {
                        galleryUrls.add(img.getSecureUrl());
                    }
                }
                if (galleryUrls.size() >= 4) break;
            }
        }
        String mainImg = p.getMainImageUrl() != null ? p.getMainImageUrl() : "/img/placeholder.jpg";
        if (galleryUrls.isEmpty()) {
            galleryUrls.add(mainImg);
        }

        item.put("id", p.getId());
        item.put("name", p.getName() != null ? p.getName() : "");
        item.put("brand", p.getBrand() != null ? p.getBrand() : "");
        item.put("categoryId", p.getCategory() != null ? p.getCategory().getId() : null);
        item.put("categoryName", p.getCategory() != null && p.getCategory().getName() != null ? p.getCategory().getName() : "Catálogo");
        item.put("price", origPrice);
        item.put("discountPrice", discPrice);
        item.put("effectivePrice", effectivePrice);
        item.put("hasDiscount", hasDiscount);
        item.put("discountPercent", discountPct);
        item.put("stock", stockVal);
        item.put("isMadeToOrder", isMadeToOrder);
        item.put("outOfStock", outOfStock);
        item.put("hasVariants", Boolean.TRUE.equals(p.getHasVariants()));
        item.put("mainImageUrl", mainImg);
        item.put("images", galleryUrls);
        item.put("inWishlist", wishlistIds != null && wishlistIds.contains(p.getId()));
        return item;
    }

    @GetMapping("/page/{pageSlug}")
    public String customPage(
            @PathVariable String slug,
            @PathVariable String pageSlug,
            @RequestParam(required = false) String preview,
            HttpServletRequest request,
            Model model) {

        ThemeConfigDto theme = (ThemeConfigDto) model.getAttribute("theme");
        ThemeCustomPageDto customPage = theme != null ? theme.findCustomPage(pageSlug) : null;
        if (customPage == null) {
            boolean isDraft = "draft".equalsIgnoreCase(preview);
            return "redirect:/s/" + slug + (isDraft ? "?preview=draft" : "");
        }

        int pageSize = resolveGlobalPageSize(theme, null);
        List<Product> initialProducts = productService.getNewestPublicProducts(pageSize);

        model.addAttribute("customPage", customPage);
        model.addAttribute("pageSlug", customPage.getSlug());
        model.addAttribute("editorPageKey", "page:" + customPage.getSlug());
        model.addAttribute("pageTitle", customPage.getTitle());
        hydratePageContext(request, model, initialProducts);
        model.addAttribute("products", initialProducts);
        return "storefront/custom-page";
    }

    @GetMapping("/p/{id}")
    public String productDetail(
            @PathVariable String slug,
            @PathVariable Long id,
            HttpServletRequest request,
            Model model) {

        Product product = productService.getProductById(id);
        if (!productService.isProductPubliclyVisible(product)) {
            boolean isDraft = "draft".equalsIgnoreCase(request.getParameter("preview"));
            return "redirect:/s/" + slug + "/catalog" + (isDraft ? "?preview=draft" : "");
        }

        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        List<Product> relatedCandidates = productService.getPublicCatalogLimited(categoryId, 8);
        model.addAttribute("editorPageKey", "product");
        hydratePageContext(request, model, relatedCandidates);
        populateProductDetailModel(product, relatedCandidates, model);

        String baseUrl = buildRequestBaseUrl(request);
        String canonicalUrl = baseUrl + "/s/" + slug + "/p/" + product.getId();
        model.addAttribute("canonicalUrl", canonicalUrl);
        model.addAttribute("productJsonLd", buildProductJsonLd(product, canonicalUrl));

        return "storefront/detail";
    }

    @GetMapping("/product-preview")
    public String productPreview(
            @PathVariable String slug,
            HttpServletRequest request,
            Model model) {

        List<Product> activeProducts = productService.getNewestPublicProducts(1);
        if (!activeProducts.isEmpty()) {
            return productDetail(slug, activeProducts.get(0).getId(), request, model);
        }

        model.addAttribute("editorPageKey", "product");
        hydratePageContext(request, model, Collections.emptyList());

        Map<String, String> demoSpecs = new LinkedHashMap<>();
        demoSpecs.put("Calidad", "Premium Garantizada");
        demoSpecs.put("Disponibilidad", "Envío inmediato a todo el país");
        demoSpecs.put("Garantía", "Compra protegida");

        Product sample = Product.builder()
                .id(0L)
                .name("Producto de Ejemplo (Vista Previa)")
                .brand("Colección Destacada")
                .sku("DEMO-001")
                .price(129900.0)
                .discountPrice(99900.0)
                .stock(12)
                .hasVariants(false)
                .isMadeToOrder(false)
                .isActive(true)
                .isDeleted(false)
                .description("Esta es una vista previa para que personalices el diseño de tu Ficha de Producto. Cuando agregues productos reales a tu inventario, se mostrarán aquí automáticamente.")
                .attributes(demoSpecs)
                .images(new ArrayList<>())
                .build();

        model.addAttribute("product", sample);
        model.addAttribute("variantsData", Collections.emptyList());
        model.addAttribute("relatedProducts", Collections.emptyList());
        model.addAttribute("products", Collections.emptyList());
        model.addAttribute("pageTitle", sample.getName());
        return "storefront/detail";
    }

    private void populateProductDetailModel(Product product, List<Product> sameCatCandidates, Model model) {
        model.addAttribute("product", product);

        List< Map<String, Object> > variantsJson = new ArrayList<>();
        if (product.getHasVariants() != null && product.getHasVariants()) {
            for (com.storevo.backend.tenant.model.ProductVariant v : product.getVariantsList()) {
                if (v.getIsActive() != null && v.getIsActive()) {
                    Double effectiveVarPrice = cartManager.resolveEffectivePrice(product, v);
                    Double originalVarPrice = cartManager.resolveOriginalPrice(product, v);
                    double effVal = effectiveVarPrice != null ? effectiveVarPrice : (v.getPrice() != null ? v.getPrice() : 0.0);
                    double origVal = originalVarPrice != null ? originalVarPrice : effVal;
                    boolean hasDisc = origVal > effVal && effVal > 0.0;
                    long discPct = hasDisc ? Math.round(((origVal - effVal) * 100.0) / origVal) : 0L;

                    Map<String, Object> vMap = new HashMap<>();
                    vMap.put("id", v.getId());
                    vMap.put("price", effVal);
                    vMap.put("originalPrice", origVal);
                    vMap.put("hasDiscount", hasDisc);
                    vMap.put("discountPercent", discPct);
                    vMap.put("stock", v.getStock());
                    vMap.put("sku", v.getSku());

                    String imageRef = (v.getImages() != null && !v.getImages().isEmpty())
                            ? v.getImages().get(0).getSecureUrl() : null;
                    vMap.put("imageRef", imageRef);

                    String sig = v.getOptionValues().stream()
                            .map(ov -> ov.getOption().getName() + ":" + ov.getValueName())
                            .sorted()
                            .collect(Collectors.joining("|"));
                    vMap.put("signature", sig);
                    variantsJson.add(vMap);
                }
            }
        }
        model.addAttribute("variantsData", variantsJson);

        List<Product> relatedProducts = new ArrayList<>();
        if (sameCatCandidates != null) {
            for (Product p : sameCatCandidates) {
                if (!p.getId().equals(product.getId())) {
                    relatedProducts.add(p);
                }
                if (relatedProducts.size() == 4) break;
            }
        }

        model.addAttribute("relatedProducts", relatedProducts);
        model.addAttribute("products", sameCatCandidates != null ? sameCatCandidates : Collections.emptyList());
        model.addAttribute("editorPageKey", "product");
        model.addAttribute("pageTitle", product.getName());
    }

    private String buildRequestBaseUrl(HttpServletRequest request) {
        String scheme = request.getHeader("X-Forwarded-Proto") != null
                ? request.getHeader("X-Forwarded-Proto")
                : request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String portSuffix = (serverPort == 80 || serverPort == 443) ? "" : ":" + serverPort;
        return scheme + "://" + serverName + portSuffix;
    }

    private String buildProductJsonLd(Product product, String canonicalUrl) {
        try {
            double origPrice = product.getPrice() != null ? product.getPrice() : 0.0;
            double discPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : 0.0;
            double effectivePrice = (discPrice > 0.0 && (origPrice <= 0.0 || discPrice < origPrice)) ? discPrice : origPrice;

            String availability;
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                availability = "https://schema.org/PreOrder";
            } else if (product.getStock() != null && product.getStock() > 0) {
                availability = "https://schema.org/InStock";
            } else {
                availability = "https://schema.org/OutOfStock";
            }

            Map<String, Object> root = new LinkedHashMap<>();
            root.put("@context", "https://schema.org");
            root.put("@type", "Product");
            root.put("name", product.getName() != null ? product.getName() : "");
            if (product.getDescription() != null && !product.getDescription().isBlank()) {
                root.put("description", product.getDescription().trim());
            }
            if (product.getMainImageUrl() != null && !product.getMainImageUrl().isBlank()) {
                root.put("image", List.of(product.getMainImageUrl()));
            }
            if (product.getSku() != null && !product.getSku().isBlank()) {
                root.put("sku", product.getSku());
            }
            if (product.getBrand() != null && !product.getBrand().isBlank()) {
                Map<String, Object> brandNode = new LinkedHashMap<>();
                brandNode.put("@type", "Brand");
                brandNode.put("name", product.getBrand());
                root.put("brand", brandNode);
            }

            Map<String, Object> offers = new LinkedHashMap<>();
            offers.put("@type", "Offer");
            offers.put("url", canonicalUrl);
            offers.put("priceCurrency", "COP");
            offers.put("price", Math.round(effectivePrice));
            offers.put("availability", availability);
            root.put("offers", offers);

            return objectMapper.writeValueAsString(root).replace("</", "<\\/");
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping(value = "/sitemap.xml", produces = org.springframework.http.MediaType.APPLICATION_XML_VALUE)
    @ResponseBody
    public String storeSitemap(@PathVariable String slug, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }
        String baseUrl = buildRequestBaseUrl(request);
        String storeRoot = baseUrl + "/s/" + slug;

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        appendSitemapUrl(xml, storeRoot, null, "daily", "1.0");
        appendSitemapUrl(xml, storeRoot + "/catalog", null, "daily", "0.9");

        if (store != null) {
            try {
                ThemeConfigDto publishedTheme = storeThemeService.getRawThemeConfig(store, false);
                if (publishedTheme != null && publishedTheme.getCustomPages() != null) {
                    for (ThemeCustomPageDto cp : publishedTheme.getCustomPages()) {
                        if (cp != null && cp.getSlug() != null && !cp.getSlug().isBlank()) {
                            appendSitemapUrl(xml, storeRoot + "/page/" + cp.getSlug(), null, "weekly", "0.7");
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        List<Product> publicProducts = productService.getPublicCatalog(null);
        java.time.format.DateTimeFormatter dateFmt = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
        for (Product p : publicProducts) {
            if (p == null || p.getId() == null) continue;
            String lastMod = null;
            if (p.getUpdatedAt() != null) {
                lastMod = p.getUpdatedAt().toLocalDate().format(dateFmt);
            } else if (p.getCreatedAt() != null) {
                lastMod = p.getCreatedAt().toLocalDate().format(dateFmt);
            }
            appendSitemapUrl(xml, storeRoot + "/p/" + p.getId(), lastMod, "weekly", "0.8");
        }

        xml.append("</urlset>");
        return xml.toString();
    }

    private void appendSitemapUrl(StringBuilder xml, String loc, String lastMod, String changeFreq, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append( org.springframework.web.util.HtmlUtils.htmlEscape(loc) ).append("</loc>\n");
        if (lastMod != null && !lastMod.isBlank()) {
            xml.append("    <lastmod>").append(lastMod).append("</lastmod>\n");
        }
        if (changeFreq != null) {
            xml.append("    <changefreq>").append(changeFreq).append("</changefreq>\n");
        }
        if (priority != null) {
            xml.append("    <priority>").append(priority).append("</priority>\n");
        }
        xml.append("  </url>\n");
    }

    // =========================================================================
    // PÁGINA PÚBLICA "SEGUIR MI PEDIDO" (/s/{slug}/track)
    // =========================================================================

    @GetMapping("/track")
    public String showTrackOrderPage(
            @PathVariable String slug,
            HttpServletRequest request,
            Model model) {
        model.addAttribute("pageTitle", "Seguir mi pedido");
        hydratePageContext(request, model, Collections.emptyList());
        return "components/storefront/track-order";
    }

    @PostMapping("/track")
    public String processTrackOrder(
            @PathVariable String slug,
            @RequestParam String orderNumber,
            @RequestParam String phone,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {

        if (!rateLimitService.tryConsumeByIp(request, "track_order_" + slug, 10, java.time.Duration.ofMinutes(1))) {
            redirectAttributes.addFlashAttribute("trackError", com.storevo.backend.config.security.RateLimitService.RATE_LIMIT_MESSAGE);
            return "redirect:/s/" + slug + "/track";
        }

        Store store = (Store) request.getAttribute("currentStore");
        if (store != null) {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }

        String genericError = "No encontramos ningún pedido que coincida con ese número y teléfono. Verifica los datos e intenta nuevamente.";

        if (orderNumber == null || orderNumber.isBlank() || phone == null || phone.isBlank()) {
            redirectAttributes.addFlashAttribute("trackError", genericError);
            return "redirect:/s/" + slug + "/track";
        }

        String cleanedOrderNum = orderNumber.trim().replaceAll("[^0-9]", "");
        if (cleanedOrderNum.isEmpty() || cleanedOrderNum.length() > 18) {
            redirectAttributes.addFlashAttribute("trackError", genericError);
            return "redirect:/s/" + slug + "/track";
        }

        String inputPhoneKey = CustomerService.normalizePhoneKey(phone);
        if (inputPhoneKey.isEmpty()) {
            redirectAttributes.addFlashAttribute("trackError", genericError);
            return "redirect:/s/" + slug + "/track";
        }

        try {
            Long parsedId = Long.parseLong(cleanedOrderNum);
            Order order = orderService.getOrderById(parsedId);
            String orderPhoneKey = CustomerService.normalizePhoneKey(order.getCustomerPhone());

            if (orderPhoneKey.isEmpty() || !inputPhoneKey.equals(orderPhoneKey)) {
                redirectAttributes.addFlashAttribute("trackError", genericError);
                return "redirect:/s/" + slug + "/track";
            }

            if (order.getChannel() == OrderChannel.WHATSAPP) {
                return "redirect:/s/" + slug + "/order/" + order.getPublicToken() + "/whatsapp?tracked=true";
            }
            return "redirect:/s/" + slug + "/order/" + order.getPublicToken() + "/wompi-result";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("trackError", genericError);
            return "redirect:/s/" + slug + "/track";
        }
    }
}