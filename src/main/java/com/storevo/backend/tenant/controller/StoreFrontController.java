package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.service.CartManager;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.ProductService;
import com.storevo.backend.tenant.service.WishlistManager;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/s/{slug}")
@RequiredArgsConstructor
public class StoreFrontController {

    private final StoreRepository storeRepository;
    private final StoreSettingsService storeSettingsService;
    private final ProductService productService;
    private final CategoryService categoryService;
    private final CartManager cartManager;
    private final WishlistManager wishlistManager;

    @ModelAttribute
    public void loadStoreData(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) throw new RuntimeException("CRÍTICO: El TenantFilter no cargó la tienda para el slug: " + slug);

        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);

        TenantContext.setCurrentTenant(store.getSchemaName());

        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("navCategories", categoryService.getNavCategories());
        model.addAttribute("cartCount", cartManager.getCartCount(slug));
        model.addAttribute("wishlistCount", wishlistManager.getWishlistCount(slug));

        // Wishlist sigue soportando solo ProductId por compatibilidad (tal cual lo pediste)
        model.addAttribute("wishlistProductIds", wishlistManager.getWishlist(slug));
    }

    @GetMapping
    public String home(Model model) {
        model.addAttribute("products", productService.getPublicCatalog(null));
        model.addAttribute("pageTitle", "Inicio");
        return "storefront/home";
    }

    @GetMapping("/catalog")
    public String catalog(@RequestParam(required = false) Long category, Model model) {
        model.addAttribute("products", productService.getPublicCatalog(category));
        if (category != null) {
            try {
                Category currentCat = categoryService.getCategoryById(category);
                model.addAttribute("currentCategory", currentCat);
                model.addAttribute("pageTitle", currentCat.getName());
            } catch (Exception e) {
                model.addAttribute("pageTitle", "Catálogo");
            }
        } else {
            model.addAttribute("pageTitle", "Catálogo");
        }
        return "storefront/catalog";
    }

    @GetMapping("/p/{id}")
    public String productDetail(@PathVariable String slug, @PathVariable Long id, Model model) {
        Product product = productService.getProductById(id);
        if (product.getIsDeleted()) {
            return "redirect:/s/" + slug + "/catalog";
        }
        model.addAttribute("product", product);

        // --- MAGIA FASE 2.5: EMPAQUETADO LIGERO DE VARIANTES PARA JS ---
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
                            ? v.getImages().get(0).getFilePath() : null;
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
        // ----------------------------------------------------------------

        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        List<Product> allActive = productService.getPublicCatalog(categoryId);

        List<Product> relatedProducts = new ArrayList<>();
        for (Product p : allActive) {
            if (!p.getId().equals(product.getId())) {
                relatedProducts.add(p);
            }
            if (relatedProducts.size() == 4) break;
        }

        model.addAttribute("relatedProducts", relatedProducts);
        model.addAttribute("pageTitle", product.getName());
        return "storefront/detail";
    }
}