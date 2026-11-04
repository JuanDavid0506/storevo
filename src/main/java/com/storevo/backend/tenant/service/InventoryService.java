package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.exception.InsufficientStockException;
import com.storevo.backend.tenant.model.Category;
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

    /**
     * Verifica que el producto no tenga categoría o que su categoría y todos sus padres estén activos (Objetivo A2).
     */
    private boolean isCategoryBranchActive(Product product) {
        if (product == null) {
            return false;
        }
        Category current = product.getCategory();
        int depth = 0;
        while (current != null && depth < 10) {
            if (!Boolean.TRUE.equals(current.getIsActive())) {
                return false;
            }
            current = current.getParentCategory();
            depth++;
        }
        return true;
    }

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
                || Boolean.TRUE.equals(product.getIsDraft())
                || !isCategoryBranchActive(product)) {
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

        // Bloqueo pesimista (SELECT ... FOR UPDATE) sobre el producto padre
        Product product = productRepository.findByIdWithLock(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado."));

        if (!isCategoryBranchActive(product)) {
            throw new InsufficientStockException(product.getName());
        }

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (variantId == null) {
                throw new IllegalArgumentException("Este producto requiere seleccionar una variante válida.");
            }
            // Bloqueo pesimista (SELECT ... FOR UPDATE) sobre la variante específica
            ProductVariant variant = variantRepository.findByIdAndProductIdWithLock(variantId, productId)
                    .orElseThrow(() -> new IllegalArgumentException("La variante seleccionada no pertenece a este producto."));

            if (!Boolean.TRUE.equals(product.getIsActive())
                    || Boolean.TRUE.equals(product.getIsDeleted())
                    || Boolean.TRUE.equals(product.getIsDraft())
                    || !Boolean.TRUE.equals(variant.getIsActive())
                    || !hasValidEffectivePrice(product, variant)) {
                throw new InsufficientStockException(product.getName());
            }

            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                return;
            }

            int currentStock = variant.getStock() != null ? variant.getStock() : 0;
            if (currentStock < qty) {
                throw new InsufficientStockException(product.getName());
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
                    || Boolean.TRUE.equals(product.getIsDraft())
                    || !hasValidEffectivePrice(product, null)) {
                throw new InsufficientStockException(product.getName());
            }

            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                return;
            }

            int currentStock = product.getStock() != null ? product.getStock() : 0;
            if (currentStock < qty) {
                throw new InsufficientStockException(product.getName());
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

        // Bloqueo pesimista sobre el producto padre al restaurar unidades
        Product product = productRepository.findByIdWithLock(productId).orElse(null);
        if (product == null || Boolean.TRUE.equals(product.getIsMadeToOrder())) {
            return;
        }

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (variantId != null) {
                variantRepository.findByIdAndProductIdWithLock(variantId, productId).ifPresent(v -> {
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
    /**
     * Línea de stock a descontar: producto, variante (opcional), cantidad y una etiqueta legible para mensajes.
     */
    public record StockLine(Long productId, Long variantId, int quantity, String label) {
    }

    /**
     * Descuenta el stock de varias líneas de forma TODO O NADA y SIN lanzar excepciones.
     * - Si alguna línea no tiene stock suficiente, NO descuenta nada y devuelve las etiquetas que fallaron.
     * - Si todo está bien, descuenta todo, sincroniza el stock del producto padre y devuelve una lista vacía.
     * - No lanza excepciones por falta de stock, así que no marca la transacción externa como "rollback-only".
     * - Toma los bloqueos siempre en el mismo orden (producto, variante) para evitar deadlocks.
     *
     * @param enforceCatalogRules true = exige producto activo, categoría activa, variante activa y precio válido
     *                            (confirmación manual); false = solo valida el stock (pago ya cobrado por Wompi).
     */
    @Transactional
    public java.util.List<String> tryDeductAll(java.util.List<StockLine> lines, boolean enforceCatalogRules) {
        java.util.Set<String> failures = new java.util.LinkedHashSet<>();
        if (lines == null || lines.isEmpty()) {
            return new java.util.ArrayList<>(failures);
        }

        java.util.List<StockLine> ordered = new java.util.ArrayList<>(lines);
        ordered.sort(java.util.Comparator
                .comparing((StockLine l) -> l.productId() != null ? l.productId() : 0L)
                .thenComparing(l -> l.variantId() != null ? l.variantId() : 0L));

        java.util.Map<Long, Product> products = new java.util.LinkedHashMap<>();
        java.util.Map<Long, ProductVariant> variants = new java.util.LinkedHashMap<>();
        java.util.Map<Long, Long> variantParent = new java.util.HashMap<>();
        java.util.Map<String, Integer> needed = new java.util.LinkedHashMap<>();
        java.util.Map<String, String> labels = new java.util.HashMap<>();

        // ---- Fase 1: bloquear, validar y acumular cantidades necesarias ----
        for (StockLine line : ordered) {
            String label = (line.label() != null && !line.label().isBlank())
                    ? line.label()
                    : "Producto #" + line.productId();

            if (line.productId() == null || line.quantity() <= 0) {
                failures.add(label);
                continue;
            }

            Product product = products.get(line.productId());
            if (product == null) {
                product = productRepository.findByIdWithLock(line.productId()).orElse(null);
                if (product == null) {
                    failures.add(label);
                    continue;
                }
                products.put(product.getId(), product);
            }

            // Productos bajo pedido no manejan stock
            if (Boolean.TRUE.equals(product.getIsMadeToOrder())) {
                continue;
            }

            if (enforceCatalogRules
                    && (!Boolean.TRUE.equals(product.getIsActive())
                    || Boolean.TRUE.equals(product.getIsDeleted())
                    || Boolean.TRUE.equals(product.getIsDraft())
                    || !isCategoryBranchActive(product))) {
                failures.add(label);
                continue;
            }

            String key;
            if (Boolean.TRUE.equals(product.getHasVariants())) {
                if (line.variantId() == null) {
                    failures.add(label);
                    continue;
                }
                ProductVariant variant = variants.get(line.variantId());
                if (variant == null) {
                    variant = variantRepository.findByIdAndProductIdWithLock(line.variantId(), line.productId()).orElse(null);
                    if (variant == null) {
                        failures.add(label);
                        continue;
                    }
                    variants.put(variant.getId(), variant);
                    variantParent.put(variant.getId(), product.getId());
                }
                if (enforceCatalogRules
                        && (!Boolean.TRUE.equals(variant.getIsActive()) || !hasValidEffectivePrice(product, variant))) {
                    failures.add(label);
                    continue;
                }
                key = "V:" + variant.getId();
            } else {
                if (line.variantId() != null) {
                    failures.add(label);
                    continue;
                }
                if (enforceCatalogRules && !hasValidEffectivePrice(product, null)) {
                    failures.add(label);
                    continue;
                }
                key = "P:" + product.getId();
            }
            needed.merge(key, line.quantity(), Integer::sum);
            labels.putIfAbsent(key, label);
        }

        // ---- Verificar que alcance el stock para la suma de cantidades ----
        for (java.util.Map.Entry<String, Integer> entry : needed.entrySet()) {
            long id = Long.parseLong(entry.getKey().substring(2));
            int available = 0;
            if (entry.getKey().startsWith("V:")) {
                ProductVariant v = variants.get(id);
                available = (v != null && v.getStock() != null) ? v.getStock() : 0;
            } else {
                Product p = products.get(id);
                available = (p != null && p.getStock() != null) ? p.getStock() : 0;
            }
            if (available < entry.getValue()) {
                failures.add(labels.get(entry.getKey()));
            }
        }

        if (!failures.isEmpty()) {
            return new java.util.ArrayList<>(failures);
        }

        // ---- Fase 2: descontar (todo o nada) ----
        java.util.Set<Long> parentsToSync = new java.util.LinkedHashSet<>();
        for (java.util.Map.Entry<String, Integer> entry : needed.entrySet()) {
            long id = Long.parseLong(entry.getKey().substring(2));
            if (entry.getKey().startsWith("V:")) {
                ProductVariant v = variants.get(id);
                v.setStock(v.getStock() - entry.getValue());
                variantRepository.save(v);
                parentsToSync.add(variantParent.get(id));
            } else {
                Product p = products.get(id);
                p.setStock(p.getStock() - entry.getValue());
                productRepository.save(p);
            }
        }
        for (Long parentId : parentsToSync) {
            Product parent = products.get(parentId);
            if (parent != null) {
                syncParentProductStock(parent);
            }
        }
        return new java.util.ArrayList<>(failures);
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