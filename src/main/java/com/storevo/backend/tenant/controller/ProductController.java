package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CategoryTreeDto;
import com.storevo.backend.tenant.dto.ProductDto;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductImage;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import lombok.Setter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/dashboard/{slug}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final StoreSettingsService storeSettingsService;
    private final ObjectMapper objectMapper;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("slug", slug);

        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        ProductDto dto = new ProductDto();
        dto.setIsActive(true);
        dto.setHasVariants(false);

        model.addAttribute("product", dto);
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Nuevo Producto");
        return "dashboard/products/form";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable Long id, Model model) {
        Product product = productService.getProductById(id);

        List<String> keys = new ArrayList<>();
        List<String> values = new ArrayList<>();
        if (product.getAttributes() != null) {
            product.getAttributes().forEach((k, v) -> {
                keys.add(k);
                values.add(v);
            });
        }

        List<String> existingImages = new ArrayList<>();
        List<String> imageOrder = new ArrayList<>();
        String mainImageRef = "";

        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                existingImages.add(img.getFilePath());
                imageOrder.add(img.getFilePath());
                if (img.getIsPrimary()) {
                    mainImageRef = img.getFilePath();
                }
            }
        }

        Boolean hasVariants = product.getHasVariants() != null ? product.getHasVariants() : false;
        List<ProductDto.OptionDto> optionDtos = new ArrayList<>();
        List<ProductDto.VariantDto> variantDtos = new ArrayList<>();

        if (hasVariants) {
            if (product.getOptions() != null) {
                optionDtos = product.getOptions().stream().map(opt -> {
                    ProductDto.OptionDto optDto = new ProductDto.OptionDto();
                    optDto.setName(opt.getName());
                    if (opt.getValues() != null) {
                        optDto.setValues(opt.getValues().stream()
                                .map(val -> val.getValueName())
                                .collect(Collectors.toList()));
                    } else {
                        optDto.setValues(new ArrayList<>());
                    }
                    return optDto;
                }).collect(Collectors.toList());
            }

            if (product.getVariantsList() != null) {
                variantDtos = product.getVariantsList().stream().map(var -> {
                    ProductDto.VariantDto varDto = new ProductDto.VariantDto();
                    varDto.setSku(var.getSku());
                    varDto.setPrice(var.getPrice());
                    varDto.setStock(var.getStock());
                    varDto.setBarcode(var.getBarcode());
                    varDto.setWeight(var.getWeight());

                    Map<String, String> combo = new HashMap<>();
                    if (var.getOptionValues() != null) {
                        var.getOptionValues().forEach(val ->
                                combo.put(val.getOption().getName(), val.getValueName())
                        );
                    }
                    varDto.setCombination(combo);

                    if (var.getImages() != null && !var.getImages().isEmpty()) {
                        // Unimos todas las rutas de las imágenes separadas por coma
                        String joinedImages = var.getImages().stream()
                                .map(ProductImage::getFilePath)
                                .collect(Collectors.joining(","));

                        varDto.setImageRef(joinedImages);
                    }
                    return varDto;
                }).collect(Collectors.toList());
            }
        }

        ProductDto dto = ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .stock(product.getStock())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .brand(product.getBrand())
                .sku(product.getSku())
                .weight(product.getWeight())
                .isActive(product.getIsActive())
                .existingImages(existingImages)
                .imageOrder(imageOrder)
                .mainImageRef(mainImageRef)
                .attrKeys(keys)
                .attrValues(values)
                .hasVariants(hasVariants)
                .options(optionDtos)
                .variants(variantDtos)
                .build();

        model.addAttribute("product", dto);
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Editar Producto");
        return "dashboard/products/form";
    }

    @PostMapping
    public String saveProduct(@PathVariable String slug,
                              @ModelAttribute ProductDto productDto,
                              @RequestParam(required = false) String action) {

        if (productDto.getStock() == null) productDto.setStock(0);
        if (productDto.getPrice() == null) productDto.setPrice(0.0);
        if (productDto.getWeight() == null) productDto.setWeight(0.0);

        productService.saveProduct(productDto);

        if ("save_and_new".equals(action)) {
            return "redirect:/dashboard/" + slug + "/products/new?success=true&continue=true";
        }

        return "redirect:/dashboard/" + slug + "/products?success=true";
    }

    @PostMapping("/{id}/toggle")
    public String toggleStatus(@PathVariable String slug, @PathVariable Long id) {
        boolean isNowActive = productService.toggleStatus(id);
        if (isNowActive) {
            return "redirect:/dashboard/" + slug + "/products?activated=true";
        } else {
            return "redirect:/dashboard/" + slug + "/products?deactivated=true";
        }
    }

    @PostMapping("/{id}/delete")
    public String deleteProduct(@PathVariable String slug, @PathVariable Long id) {
        productService.deleteProduct(id);
        return "redirect:/dashboard/" + slug + "/products?deleted=true";
    }

    @PostMapping("/{id}/restore")
    public String restoreProduct(@PathVariable String slug, @PathVariable Long id) {
        productService.restoreProduct(id);
        return "redirect:/dashboard/" + slug + "/products?restored=true";
    }

    @PostMapping("/{id}/hard-delete")
    public String hardDeleteProduct(@PathVariable String slug, @PathVariable Long id) {
        productService.hardDeleteProduct(id);
        return "redirect:/dashboard/" + slug + "/products?hard_deleted=true";
    }

    @GetMapping
    public String listProducts(
            @PathVariable String slug,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String quick,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);

        Boolean isActiveFilter = null;
        Boolean isDeletedFilter = false;

        if ("active".equals(status)) isActiveFilter = true;
        else if ("inactive".equals(status)) isActiveFilter = false;
        else if ("deleted".equals(status)) {
            isActiveFilter = null;
            isDeletedFilter = true;
        }

        if ("active".equals(quick)) {
            isActiveFilter = true;
            isDeletedFilter = false;
        }

        Page<Product> productsPage = productService.searchProducts(q, categoryId, isActiveFilter, isDeletedFilter, quick, sort, pageable);

        model.addAttribute("products", productsPage);
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("categoryTreeJson", getCategoryTreeJson());
        model.addAttribute("pageTitle", "Productos");

        return "dashboard/products/index";
    }

    private String getCategoryTreeJson() {
        try {
            List<CategoryTreeDto> tree = categoryService.getCategoryTree();
            return objectMapper.writeValueAsString(tree);
        } catch (Exception e) {
            return "[]";
        }
    }

    @PostMapping("/{id}/quick-stock")
    @ResponseBody
    public ResponseEntity<?> updateQuickStock(
            @PathVariable String slug,
            @PathVariable("id") Long productId,
            @RequestBody java.util.Map<String, Integer> payload) {

        try {
            Integer newStock = payload.get("stock");
            if (newStock == null || newStock < 0) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Stock inválido"));
            }

            productService.updateQuickStock(productId, newStock);

            return ResponseEntity.ok(java.util.Map.of("success", true, "newStock", newStock));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Error al actualizar el stock"));
        }
    }

    // ==========================================
    // FRENTE 4: API ACCIONES MASIVAS
    // ==========================================
    @PostMapping("/api/mass-action")
    @ResponseBody
    public ResponseEntity<?> executeMassAction(@PathVariable String slug, @RequestBody MassActionRequest payload) {
        try {
            productService.executeMassAction(payload.getIds(), payload.getAction());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // FRENTE 5: API ESTADÍSTICAS ASÍNCRONAS
    // ==========================================
    @PostMapping("/api/stats")
    @ResponseBody
    public ResponseEntity<?> getProductsStats(@PathVariable String slug, @RequestBody List<Long> productIds) {
        try {
            Map<Long, Map<String, Object>> stats = productService.getBulkStatistics(productIds);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // DTO Interno para peticiones
    @Getter
    @Setter
    public static class MassActionRequest {
        private String action;
        private List<Long> ids;
    }
}