package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.CartItem;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.model.ProductImage;
import com.storevo.backend.tenant.model.ProductVariant;
import com.storevo.backend.tenant.repository.CartItemRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartManager {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    /**
     * Calcula el precio unitario efectivo verificando la relación producto-variante:
     * 1. Si el producto usa variantes y la variante tiene precio > 0, usa el precio de la variante.
     * 2. Si el precio de la variante es <= 0 o null (o el producto no usa variantes),
     *    usa el discountPrice del producto padre (si es > 0 y menor al precio base) o el price base.
     * 3. Devuelve null si la relación producto-variante es inválida o si el precio resultante es <= 0.
     */
    public Double resolveEffectivePrice(Product product, ProductVariant variant) {
        if (product == null) {
            return null;
        }

        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (variant == null || variant.getProduct() == null || product.getId() == null
                    || !product.getId().equals(variant.getProduct().getId())) {
                return null;
            }
            Double varPrice = variant.getPrice();
            if (varPrice != null && !Double.isNaN(varPrice) && !Double.isInfinite(varPrice) && varPrice > 0.0) {
                return varPrice;
            }
        } else if (variant != null) {
            return null;
        }

        Double basePrice = product.getPrice();
        Double discountPrice = product.getDiscountPrice();

        if (discountPrice != null && !Double.isNaN(discountPrice) && !Double.isInfinite(discountPrice) && discountPrice > 0.0) {
            if (basePrice == null || basePrice <= 0.0 || discountPrice < basePrice) {
                return discountPrice;
            }
        }

        if (basePrice != null && !Double.isNaN(basePrice) && !Double.isInfinite(basePrice) && basePrice > 0.0) {
            return basePrice;
        }

        return null;
    }

    /**
     * Construye el texto legible de las opciones de la variante (ej. "Rojo / M").
     */
    public String buildVariantText(ProductVariant variant) {
        if (variant == null || variant.getOptionValues() == null || variant.getOptionValues().isEmpty()) {
            return null;
        }
        String text = variant.getOptionValues().stream()
                .filter(ov -> ov != null && ov.getValueName() != null && !ov.getValueName().isBlank())
                .map(ov -> ov.getValueName().trim())
                .collect(Collectors.joining(" / "));
        return text.isEmpty() ? null : text;
    }

    /**
     * Obtiene primero la miniatura/imagen asociada a la variante; si no tiene, usa la imagen principal del producto.
     */
    public String resolveItemImageUrl(Product product, ProductVariant variant) {
        if (product == null) {
            return null;
        }
        if (variant != null && variant.getId() != null) {
            if (variant.getImages() != null && !variant.getImages().isEmpty()) {
                ProductImage vImg = variant.getImages().get(0);
                if (vImg != null) {
                    String url = vImg.getThumbnailUrl() != null ? vImg.getThumbnailUrl() : vImg.getSecureUrl();
                    if (url != null && !url.isBlank()) {
                        return url;
                    }
                }
            }
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                String matchedUrl = product.getImages().stream()
                        .filter(img -> img != null && variant.getId().equals(img.getVariantId()))
                        .map(img -> img.getThumbnailUrl() != null ? img.getThumbnailUrl() : img.getSecureUrl())
                        .filter(url -> url != null && !url.isBlank())
                        .findFirst()
                        .orElse(null);
                if (matchedUrl != null) {
                    return matchedUrl;
                }
            }
        }
        return product.getMainImageThumbnailUrl() != null
                ? product.getMainImageThumbnailUrl()
                : product.getMainImageUrl();
    }

    @Transactional(readOnly = true)
    public List<CartItemDto> getCart(String sessionId) {
        if (sessionId == null) return List.of();
        List<CartItem> dbItems = cartItemRepository.findBySessionId(sessionId);

        return dbItems.stream().map(item -> {
            Product p = item.getProduct();
            ProductVariant v = item.getVariant();

            boolean variantBelongsToProduct = (v != null && v.getProduct() != null
                    && p != null && p.getId() != null
                    && p.getId().equals(v.getProduct().getId()));

            ProductVariant validVariant = variantBelongsToProduct ? v : null;
            Double resolvedPrice = resolveEffectivePrice(p, validVariant);
            double finalPrice = resolvedPrice != null ? resolvedPrice : 0.0;

            String variantText = validVariant != null ? buildVariantText(validVariant) : null;
            String imageUrl = resolveItemImageUrl(p, validVariant);

            return CartItemDto.builder()
                    .productId(p != null ? p.getId() : null)
                    .variantId(v != null ? v.getId() : null)
                    .variantText(variantText)
                    .name(p != null ? p.getName() : "Producto no disponible")
                    .price(finalPrice)
                    .quantity(item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1)
                    .imageUrl(imageUrl)
                    .isMadeToOrder(p != null && Boolean.TRUE.equals(p.getIsMadeToOrder()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getItemQuantity(String sessionId, Long productId, Long variantId) {
        if (sessionId == null) return 0;
        return cartItemRepository.findBySessionIdAndProductIdAndVariantId(sessionId, productId, variantId)
                .map(CartItem::getQuantity)
                .orElse(0);
    }

    @Transactional
    public void addItem(String sessionId, CartItemDto newItem) {
        if (sessionId == null || newItem == null || newItem.getProductId() == null) {
            throw new IllegalArgumentException("Datos de producto inválidos.");
        }
        if (newItem.getQuantity() == null || newItem.getQuantity() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        Product product = productRepository.findById(newItem.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado."));

        if (Boolean.TRUE.equals(product.getIsDeleted())
                || !Boolean.TRUE.equals(product.getIsActive())
                || Boolean.TRUE.equals(product.getIsDraft())) {
            throw new IllegalArgumentException("Este producto no está disponible.");
        }

        ProductVariant variant = null;
        if (Boolean.TRUE.equals(product.getHasVariants())) {
            if (newItem.getVariantId() == null) {
                throw new IllegalArgumentException("Debe seleccionar las opciones del producto.");
            }
            variant = variantRepository.findByIdAndProductId(newItem.getVariantId(), product.getId())
                    .orElseThrow(() -> new IllegalArgumentException("La variante seleccionada no pertenece a este producto."));
            if (!Boolean.TRUE.equals(variant.getIsActive())) {
                throw new IllegalArgumentException("Esta combinación no está disponible.");
            }
        } else if (newItem.getVariantId() != null) {
            throw new IllegalArgumentException("La variante seleccionada no pertenece a este producto.");
        }

        Double effectivePrice = resolveEffectivePrice(product, variant);
        if (effectivePrice == null || effectivePrice <= 0.0) {
            throw new IllegalArgumentException("Este producto o variante no tiene un precio válido.");
        }

        Long verifiedVariantId = variant != null ? variant.getId() : null;
        Optional<CartItem> existingOpt = cartItemRepository.findBySessionIdAndProductIdAndVariantId(
                sessionId, product.getId(), verifiedVariantId);

        if (existingOpt.isPresent()) {
            CartItem existing = existingOpt.get();
            existing.setQuantity(existing.getQuantity() + newItem.getQuantity());
            cartItemRepository.save(existing);
        } else {
            CartItem newItemEntity = CartItem.builder()
                    .sessionId(sessionId)
                    .product(product)
                    .variant(variant)
                    .quantity(newItem.getQuantity())
                    .build();

            cartItemRepository.save(newItemEntity);
        }
    }

    @Transactional
    public void removeItem(String sessionId, Long productId, Long variantId) {
        if (sessionId == null) return;
        cartItemRepository.deleteBySessionIdAndProductIdAndVariantId(sessionId, productId, variantId);
    }

    @Transactional(readOnly = true)
    public Double getTotal(String sessionId) {
        return getCart(sessionId).stream()
                .filter(item -> item.getPrice() != null && item.getPrice() > 0 && item.getQuantity() != null && item.getQuantity() > 0)
                .mapToDouble(CartItemDto::getSubtotal)
                .sum();
    }

    @Transactional(readOnly = true)
    public int getCartCount(String sessionId) {
        return getCart(sessionId).stream()
                .mapToInt(CartItemDto::getQuantity)
                .sum();
    }

    @Transactional
    public void clearCart(String sessionId) {
        if (sessionId == null) return;
        cartItemRepository.deleteBySessionId(sessionId);
    }
}