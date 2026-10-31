package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductVariant;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
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
            ProductVariant variant = variantRepository.findById(variantId)
                    .orElseThrow(() -> new RuntimeException("Variante no encontrada."));
            Product product = variant.getProduct();
            // Bajo pedido: nada que descontar, el número de stock no representa nada.
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) return;
            int currentStock = variant.getStock() != null ? variant.getStock() : 0;
            variant.setStock(Math.max(0, currentStock - qty));
            variantRepository.save(variant);
            syncParentProductStock(product);
        } else {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado."));
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) return;
            int currentStock = product.getStock() != null ? product.getStock() : 0;
            product.setStock(Math.max(0, currentStock - qty));
            productRepository.save(product);
        }
    }

    @Transactional
    public void restoreStock(Long productId, Long variantId, int qty) {
        if (variantId != null) {
            variantRepository.findById(variantId).ifPresent(v -> {
                Product product = v.getProduct();
                if (Boolean.TRUE.equals(product.getIsMadeToOrder())) return;
                int currentStock = v.getStock() != null ? v.getStock() : 0;
                v.setStock(currentStock + qty);
                variantRepository.save(v);
                syncParentProductStock(product);
            });
        } else {
            productRepository.findById(productId).ifPresent(p -> {
                if (Boolean.TRUE.equals(p.getIsMadeToOrder())) return;
                int currentStock = p.getStock() != null ? p.getStock() : 0;
                p.setStock(currentStock + qty);
                productRepository.save(p);
            });
        }
    }

    private void syncParentProductStock(Product product) {
        if (product == null || product.getId() == null || Boolean.TRUE.equals(product.getIsMadeToOrder())) {
            return;
        }
        int totalActiveStock = variantRepository.findByProductIdAndIsActiveTrue(product.getId())
                .stream()
                .mapToInt(v -> v.getStock() != null ? Math.max(0, v.getStock()) : 0)
                .sum();
        product.setStock(totalActiveStock);
        productRepository.save(product);
    }
}