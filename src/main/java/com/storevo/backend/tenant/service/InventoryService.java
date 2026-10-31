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

    private boolean hasValidEffectivePrice(Product product, ProductVariant variant) {
        if (product == null) return false;
        if (variant != null && variant.getPrice() != null
                && !Double.isNaN(variant.getPrice()) && !Double.isInfinite(variant.getPrice())
                && variant.getPrice() > 0.0) {
            return true;
        }
        Double disc = product.getDiscountPrice();
        Double base = product.getPrice();
        if (disc != null && !Double.isNaN(disc) && !Double.isInfinite(disc) && disc > 0.0
                && (base == null || base <= 0.0 || disc < base)) {
            return true;
        }
        return base != null && !Double.isNaN(base) && !Double.isInfinite(base) && base > 0.0;
    }

    public boolean isAvailable(Long productId, Long variantId, int requestedQty) {
        if (productId == null || requestedQty <= 0) {
            return false;
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null
                || !Boolean.TRUE.equals(product.getIsActive())
                || Boolean.TRUE.equals(product.getIsDeleted())
                || Boolean.TRUE.equals(product.getIsDraft())) {
            return false;
        }

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (variantId == null) {
                return false;
            }
            ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId).orElse(null);
            if (variant == null || !Boolean.TRUE.equals(variant.getIsActive())) {
                return false;
            }
            if (!hasValidEffectivePrice(product, variant)) {
                return false;
            }
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                return true;
            }
            int currentVariantStock = variant.getStock() != null ? variant.getStock() : 0;
            return currentVariantStock >= requestedQty;
        } else {
            if (variantId != null) {
                return false;
            }
            if (!hasValidEffectivePrice(product, null)) {
                return false;
            }
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                return true;
            }
            int currentProductStock = product.getStock() != null ? product.getStock() : 0;
            return currentProductStock >= requestedQty;
        }
    }

    @Transactional
    public void deductStock(Long productId, Long variantId, int qty) {
        if (productId == null || qty <= 0) {
            throw new IllegalArgumentException("Datos de descuento de inventario inválidos.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado."));

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (variantId == null) {
                throw new IllegalArgumentException("Este producto requiere seleccionar una variante válida.");
            }
            ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                    .orElseThrow(() -> new IllegalArgumentException("La variante seleccionada no pertenece a este producto."));

            if (!Boolean.TRUE.equals(product.getIsActive())
                    || Boolean.TRUE.equals(product.getIsDeleted())
                    || Boolean.TRUE.equals(product.getIsDraft())
                    || !Boolean.TRUE.equals(variant.getIsActive())) {
                throw new RuntimeException("El producto o la variante seleccionada no está disponible.");
            }

            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                return;
            }

            int currentStock = variant.getStock() != null ? variant.getStock() : 0;
            if (currentStock < qty) {
                throw new RuntimeException("Inventario insuficiente para la variante seleccionada.");
            }

            variant.setStock(currentStock - qty);
            variantRepository.save(variant);
            syncParentProductStock(product);
        } else {
            if (variantId != null) {
                throw new IllegalArgumentException("La variante indicada no pertenece a este producto.");
            }
            if (!Boolean.TRUE.equals(product.getIsActive())
                    || Boolean.TRUE.equals(product.getIsDeleted())
                    || Boolean.TRUE.equals(product.getIsDraft())) {
                throw new RuntimeException("El producto no está disponible.");
            }

            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                return;
            }

            int currentStock = product.getStock() != null ? product.getStock() : 0;
            if (currentStock < qty) {
                throw new RuntimeException("Inventario insuficiente.");
            }

            product.setStock(currentStock - qty);
            productRepository.save(product);
        }
    }

    @Transactional
    public void restoreStock(Long productId, Long variantId, int qty) {
        if (productId == null || qty <= 0) {
            return;
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || Boolean.TRUE.equals(product.getIsMadeToOrder())) {
            return;
        }

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            // Si el producto usa variantes, solo restauramos a la variante si aún existe y pertenece al producto.
            // Si la variante fue eliminada o variantId es nulo, NO sumamos stock huérfano al padre
            // y mantenemos el stock del padre igual a la suma real de sus variantes activas.
            if (variantId != null) {
                variantRepository.findByIdAndProductId(variantId, productId).ifPresent(v -> {
                    int currentStock = v.getStock() != null ? Math.max(0, v.getStock()) : 0;
                    v.setStock(currentStock + qty);
                    variantRepository.save(v);
                });
            }
            syncParentProductStock(product);
        } else {
            if (variantId != null) {
                return;
            }
            int currentStock = product.getStock() != null ? Math.max(0, product.getStock()) : 0;
            product.setStock(currentStock + qty);
            productRepository.save(product);
        }
    }

    public void syncParentProductStock(Product product) {
        if (product == null || product.getId() == null) {
            return;
        }
        if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
            product.setStock(0);
            productRepository.save(product);
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