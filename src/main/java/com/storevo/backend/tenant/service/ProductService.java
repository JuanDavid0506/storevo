package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.ProductDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.repository.CategoryRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    public List<Product> getAllProducts() {
        return productRepository.findAllByOrderByIdDesc();
    }

    public List<Product> getPublicCatalog(Long categoryId) {
        if (categoryId == null) {
            return productRepository.findAllByIsActiveTrueOrderByIdDesc();
        }
        List<Long> categoryIds = categoryService.getCategoryAndDescendantIds(categoryId);
        return productRepository.findActiveProductsByCategoryIds(categoryIds);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    @Transactional
    public void saveProduct(ProductDto dto) {
        Product product;
        if (dto.getId() != null) {
            product = getProductById(dto.getId());
        } else {
            product = new Product();
        }

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setDiscountPrice(dto.getDiscountPrice());
        product.setStock(dto.getStock());
        product.setBrand(dto.getBrand());
        product.setSku(dto.getSku());
        product.setWeight(dto.getWeight());
        product.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : false);

        if (dto.getMainImageUrl() != null && !dto.getMainImageUrl().isBlank()) {
            product.setImages(List.of(dto.getMainImageUrl()));
        }

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Categoría inválida"));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        // NUEVO: Empaquetar las listas en un Map JSON
        Map<String, String> attributes = new HashMap<>();
        if (dto.getAttrKeys() != null && dto.getAttrValues() != null) {
            for (int i = 0; i < dto.getAttrKeys().size(); i++) {
                String k = dto.getAttrKeys().get(i);
                String v = dto.getAttrValues().get(i);
                if (k != null && !k.trim().isEmpty() && v != null && !v.trim().isEmpty()) {
                    attributes.put(k.trim(), v.trim());
                }
            }
        }
        product.setAttributes(attributes.isEmpty() ? null : attributes);

        productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Transactional
    public void toggleStatus(Long id) {
        Product product = getProductById(id);
        product.setIsActive(!product.getIsActive());
        productRepository.save(product);
    }

    public Page<Product> searchProducts(String q, Long categoryId, Boolean isActive, String sortStr, Pageable pageable) {

        // 1. Convertimos el String del frontend a un objeto Sort de Spring
        Sort sort;
        switch (sortStr) {
            case "price_asc":
                sort = Sort.by("price").ascending();
                break;
            case "price_desc":
                sort = Sort.by("price").descending();
                break;
            case "stock_asc":
                sort = Sort.by("stock").ascending();
                break;
            case "newest":
            default:
                sort = Sort.by("id").descending(); // Asumiendo que el ID mayor es el más reciente (o usa "createdAt")
                break;
        }

        // 2. Inyectamos el Sort dentro del Pageable que venía del controlador
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        // 3. Si hay categoría seleccionada, resolvemos su id + el de todas sus
        // subcategorías (los 3 niveles), para que filtrar por una categoría
        // padre (ej. "Hombres") también traiga los productos de sus hijas.
        List<Long> categoryIds = (categoryId != null) ? categoryService.getCategoryAndDescendantIds(categoryId) : null;

        // 4. Ejecutamos la búsqueda en el repositorio
        return productRepository.searchProducts(q, categoryIds, isActive, sortedPageable);
    }

}