package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductVariant;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.ProductVariantRepository; // (Deberás crearlo vacío como un JpaRepository normal)
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    // Asume que creaste la interfaz ProductVariantRepository
    private final ProductVariantRepository variantRepository;

    public boolean isAvailable(Long productId, Long variantId, int requestedQty) {
        if (variantId != null) {
            ProductVariant variant = variantRepository.findById(variantId).orElse(null);
            return variant != null && variant.getIsActive() && variant.getStock() >= requestedQty;
        } else {
            Product product = productRepository.findById(productId).orElse(null);
            return product != null && product.getIsActive() && product.getStock() >= requestedQty;
        }
    }

    @Transactional
    public void deductStock(Long productId, Long variantId, int qty) {
        if (!isAvailable(productId, variantId, qty)) {
            throw new RuntimeException("Inventario insuficiente.");
        }

        if (variantId != null) {
            ProductVariant variant = variantRepository.findById(variantId).get();
            variant.setStock(variant.getStock() - qty);
            variantRepository.save(variant);
        } else {
            Product product = productRepository.findById(productId).get();
            product.setStock(product.getStock() - qty);
            productRepository.save(product);
        }
    }

    @Transactional
    public void restoreStock(Long productId, Long variantId, int qty) {
        if (variantId != null) {
            variantRepository.findById(variantId).ifPresent(v -> {
                v.setStock(v.getStock() + qty);
                variantRepository.save(v);
            });
        } else {
            productRepository.findById(productId).ifPresent(p -> {
                p.setStock(p.getStock() + qty);
                productRepository.save(p);
            });
        }
    }
}