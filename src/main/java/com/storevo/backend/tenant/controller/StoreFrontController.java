package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.tenant.dto.ThemeConfigDto;
import com.storevo.backend.tenant.dto.ThemeCustomPageDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.repository.StoreReviewRepository;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.ProductService;
import com.storevo.backend.tenant.service.StoreThemeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/s/{slug}")
@RequiredArgsConstructor
public class StoreFrontController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final StoreThemeService storeThemeService;
    private final StoreReviewRepository storeReviewRepository;

    private void hydratePageContext(HttpServletRequest request, Model model, List<Product> pageProducts) {
        Store store = (Store) request.getAttribute("currentStore");
        ThemeConfigDto theme = (ThemeConfigDto) model.getAttribute("theme");
        if (theme != null && store != null) {
            storeThemeService.hydrateThemeSections(store, theme);
        }
        List<Product> allForFilters = (pageProducts != null && !pageProducts.isEmpty())
                ? pageProducts : productService.getPublicCatalog(null);
        model.addAttribute("allCatalogProducts", allForFilters);
        model.addAttribute("catalogFilterDataJson",
                storeThemeService.buildCatalogFilterDataJson(store, theme, allForFilters));

        try {
            model.addAttribute("storeReviews", storeReviewRepository.findTop6ByIsVisibleTrueOrderByCreatedAtDesc());
        } catch (Exception e) {
            model.addAttribute("storeReviews", Collections.emptyList());
        }
    }

    @GetMapping
    public String home(
            @RequestParam(required = false) String preview,
            HttpServletRequest request,
            Model model) {

        List<Product> allProducts = productService.getPublicCatalog(null);
        hydratePageContext(request, model, allProducts);
        model.addAttribute("products", allProducts);
        model.addAttribute("editorPageKey", "home");
        model.addAttribute("pageTitle", "Inicio");
        return "storefront/home";
    }

    @GetMapping("/catalog")
    public String catalog(
            @RequestParam(required = false) Long category,
            HttpServletRequest request,
            Model model) {

        List<Product> catalogProducts = productService.getPublicCatalog(category);
        List<Product> allProducts = (category == null) ? catalogProducts : productService.getPublicCatalog(null);
        hydratePageContext(request, model, allProducts);
        model.addAttribute("products", catalogProducts);
        model.addAttribute("currentCategoryId", category);

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
        return "storefront/catalog";
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

        List<Product> allProducts = productService.getPublicCatalog(null);
        hydratePageContext(request, model, allProducts);
        model.addAttribute("products", allProducts);
        model.addAttribute("customPage", customPage);
        model.addAttribute("pageSlug", customPage.getSlug());
        model.addAttribute("editorPageKey", "page:" + customPage.getSlug());
        model.addAttribute("pageTitle", customPage.getTitle());
        return "storefront/custom-page";
    }

    @GetMapping("/p/{id}")
    public String productDetail(
            @PathVariable String slug,
            @PathVariable Long id,
            HttpServletRequest request,
            Model model) {

        Product product = productService.getProductById(id);
        if (Boolean.TRUE.equals(product.getIsDeleted())) {
            boolean isDraft = "draft".equalsIgnoreCase(request.getParameter("preview"));
            return "redirect:/s/" + slug + "/catalog" + (isDraft ? "?preview=draft" : "");
        }

        List<Product> allProducts = productService.getPublicCatalog(null);
        hydratePageContext(request, model, allProducts);
        populateProductDetailModel(product, allProducts, model);
        return "storefront/detail";
    }

    @GetMapping("/product-preview")
    public String productPreview(
            @PathVariable String slug,
            HttpServletRequest request,
            Model model) {

        List<Product> activeProducts = productService.getPublicCatalog(null);
        if (!activeProducts.isEmpty()) {
            return productDetail(slug, activeProducts.get(0).getId(), request, model);
        }

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
        model.addAttribute("editorPageKey", "product");
        model.addAttribute("pageTitle", sample.getName());
        return "storefront/detail";
    }

    private void populateProductDetailModel(Product product, List<Product> allProducts, Model model) {
        model.addAttribute("product", product);

        List<Map<String, Object>> variantsJson = new ArrayList<>();
        if (product.getHasVariants() != null && product.getHasVariants()) {
            for (com.storevo.backend.tenant.model.ProductVariant v : product.getVariantsList()) {
                if (v.getIsActive() != null && v.getIsActive()) {
                    Map<String, Object> vMap = new HashMap<>();
                    vMap.put("id", v.getId());
                    vMap.put("price", v.getPrice());
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

        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        List<Product> sameCat = categoryId != null ? productService.getPublicCatalog(categoryId) : allProducts;
        List<Product> relatedProducts = new ArrayList<>();
        for (Product p : sameCat) {
            if (!p.getId().equals(product.getId())) {
                relatedProducts.add(p);
            }
            if (relatedProducts.size() == 4) break;
        }

        model.addAttribute("relatedProducts", relatedProducts);
        model.addAttribute("products", allProducts);
        model.addAttribute("editorPageKey", "product");
        model.addAttribute("pageTitle", product.getName());
    }
}