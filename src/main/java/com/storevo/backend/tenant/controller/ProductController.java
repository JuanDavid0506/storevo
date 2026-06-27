package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.dto.ProductDto;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/dashboard/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService; // Lo necesitamos para el formulario

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
        model.addAttribute("categories", categoryService.getAllCategories()); // Enviamos categorías al HTML
        model.addAttribute("pageTitle", "Nuevo Producto");
        return "dashboard/products/form";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable Long id, Model model) {
        Product product = productService.getProductById(id);

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
                .build();

        model.addAttribute("product", dto);
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("pageTitle", "Editar Producto");
        return "dashboard/products/form";
    }

    @PostMapping
    public String saveProduct(@ModelAttribute ProductDto productDto) {
        productService.saveProduct(productDto);
        return "redirect:/dashboard/products?success=true";
    }

    @PostMapping("/{id}/toggle")
    public String toggleStatus(@PathVariable Long id) {
        productService.toggleStatus(id);
        return "redirect:/dashboard/products";
    }

    @PostMapping("/{id}/delete")
    public String deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return "redirect:/dashboard/products?deleted=true";
    }
}