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
            if (variant == null) return false;
            // Bajo pedido: el stock no significa nada, siempre se considera
            // disponible — el comerciante confirma la disponibilidad por WhatsApp.
            if (Boolean.TRUE.equals(variant.getProduct().getIsMadeToOrder())) return variant.getIsActive();
            return variant.getIsActive() && variant.getStock() >= requestedQty;
        } else {
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) return false;
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) return product.getIsActive();
            return product.getIsActive() && product.getStock() >= requestedQty;
        }
    }

    @Transactional
    public void deductStock(Long productId, Long variantId, int qty) {
        if (!isAvailable(productId, variantId, qty)) {
            throw new RuntimeException("Inventario insuficiente.");
        }

        if (variantId != null) {
            ProductVariant variant = variantRepository.findById(variantId).get();
            // Bajo pedido: nada que descontar, el número de stock no representa nada.
            if (Boolean.TRUE.equals(variant.getProduct().getIsMadeToOrder())) return;
            variant.setStock(variant.getStock() - qty);
            variantRepository.save(variant);
        } else {
            Product product = productRepository.findById(productId).get();
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) return;
            product.setStock(product.getStock() - qty);
            productRepository.save(product);
        }
    }

    @Transactional
    public void restoreStock(Long productId, Long variantId, int qty) {
        if (variantId != null) {
            variantRepository.findById(variantId).ifPresent(v -> {
                if (Boolean.TRUE.equals(v.getProduct().getIsMadeToOrder())) return;
                v.setStock(v.getStock() + qty);
                variantRepository.save(v);
            });
        } else {
            productRepository.findById(productId).ifPresent(p -> {
                if (Boolean.TRUE.equals(p.getIsMadeToOrder())) return;
                p.setStock(p.getStock() + qty);
                productRepository.save(p);
            });
        }
    }
}