package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.ProductDto;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@Controller
@RequestMapping("/dashboard/{slug}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final StoreSettingsService storeSettingsService;

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

    @GetMapping
    public String listProducts(Model model) {
        model.addAttribute("products", productService.getAllProducts());
        model.addAttribute("pageTitle", "Productos");
        return "dashboard/products/index";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        ProductDto dto = new ProductDto();
        dto.setIsActive(true);

        model.addAttribute("product", dto);
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Nuevo Producto");
        return "dashboard/products/form";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable Long id, Model model) {
        Product product = productService.getProductById(id);

        // Desempaquetamos el mapa JSON en dos listas para el formulario
        List<String> keys = new ArrayList<>();
        List<String> values = new ArrayList<>();
        if (product.getAttributes() != null) {
            product.getAttributes().forEach((k, v) -> {
                keys.add(k);
                values.add(v);
            });
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
                .mainImageUrl(product.getImages() != null && !product.getImages().isEmpty() ? product.getImages().get(0) : "")
                .attrKeys(keys)
                .attrValues(values)
                .build();

        model.addAttribute("product", dto);
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Editar Producto");
        return "dashboard/products/form";
    }

    @PostMapping
    public String saveProduct(@PathVariable String slug, @ModelAttribute ProductDto productDto) {
        productService.saveProduct(productDto);
        return "redirect:/dashboard/" + slug + "/products?success=true";
    }

    @PostMapping("/{id}/toggle")
    public String toggleStatus(@PathVariable String slug, @PathVariable Long id) {
        productService.toggleStatus(id);
        return "redirect:/dashboard/" + slug + "/products";
    }

    @PostMapping("/{id}/delete")
    public String deleteProduct(@PathVariable String slug, @PathVariable Long id) {
        productService.deleteProduct(id);
        return "redirect:/dashboard/" + slug + "/products?deleted=true";
    }
}