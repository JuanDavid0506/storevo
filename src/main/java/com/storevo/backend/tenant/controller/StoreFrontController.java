package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.repository.StoreRepository;
import com.storevo.backend.admin.service.StoreSettingsService;
import com.storevo.backend.config.tenant.TenantContext; // Ajusta el paquete si tu TenantContext está en otra ruta
import com.storevo.backend.tenant.service.CategoryService;
import com.storevo.backend.tenant.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/s/{slug}")
@RequiredArgsConstructor
public class StoreFrontController {

    private final StoreRepository storeRepository;
    private final StoreSettingsService storeSettingsService;
    private final ProductService productService;
    private final CategoryService categoryService;


    @ModelAttribute
    public void loadStoreData(Model model, HttpServletRequest request) {
        // 1. Obtenemos la tienda ya cargada por el filtro (sin consultar base de datos)
        Store store = (Store) request.getAttribute("currentStore");

        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        // 2. Ahora sí, cambiamos al esquema del inquilino (tenant_prueba)
        TenantContext.setCurrentTenant(store.getSchemaName());

        // 3. Ya en el esquema correcto, cargamos la data propia de la tienda
        model.addAttribute("store", store);
        model.addAttribute("settings", storeSettingsService.getSettingsByStore(store));
        model.addAttribute("categories", categoryService.getAllCategories());
        model.addAttribute("slug", store.getSlug());
    }

    @GetMapping
    public String home(Model model) {
        model.addAttribute("products", productService.getAllProducts());
        model.addAttribute("pageTitle", "Inicio");
        return "storefront/home";
    }

    @GetMapping("/catalog")
    public String catalog(Model model) {
        model.addAttribute("products", productService.getAllProducts());
        model.addAttribute("pageTitle", "Catálogo");
        return "storefront/catalog";
    }

    @GetMapping("/p/{id}")
    public String productDetail(@PathVariable Long id, Model model) {
        model.addAttribute("product", productService.getProductById(id));
        return "storefront/detail";
    }
}