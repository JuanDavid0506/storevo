package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.ProductDto;
import com.storevo.backend.tenant.model.Category;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.repository.CategoryRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAllByOrderByIdDesc();
    }

    public List<Product> getPublicCatalog(Long categoryId) {
        if (categoryId == null) {
            return productRepository.findAllByIsActiveTrueOrderByIdDesc();
        }
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null) {
            return productRepository.findAllByIsActiveTrueOrderByIdDesc();
        }
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(category.getId());
        if (category.getSubCategories() != null) {
            for (Category sub : category.getSubCategories()) {
                categoryIds.add(sub.getId());
            }
        }
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
}