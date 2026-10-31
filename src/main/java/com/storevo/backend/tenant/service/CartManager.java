package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.CartItem;
import com.storevo.backend.tenant.model.Product;
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
     * Resuelve el precio unitario efectivo de un producto sin variantes desde la BD.
     * Devuelve null si el precio base o el descuento es inválido (<= 0, nulo, NaN o infinito).
     */
    public Double resolveValidProductPrice(Product product) {
        if (product == null || product.getPrice() == null) {
            return null;
        }
        double basePrice = product.getPrice();
        if (Double.isNaN(basePrice) || Double.isInfinite(basePrice) || basePrice <= 0.0) {
            return null;
        }
        Double discountPrice = product.getDiscountPrice();
        if (discountPrice != null) {
            if (Double.isNaN(discountPrice) || Double.isInfinite(discountPrice) || discountPrice < 0.0) {
                return null;
            }
            if (discountPrice > 0.0 && discountPrice < basePrice) {
                return discountPrice;
            }
        }
        return basePrice;
    }

    /**
     * Resuelve el precio unitario efectivo de una variante verificando que pertenezca al producto.
     * Devuelve null si la variante no pertenece al producto o su precio es <= 0 / nulo.
     */
    public Double resolveValidVariantPrice(Product product, ProductVariant variant) {
        if (product == null || variant == null || variant.getProduct() == null) {
            return null;
        }
        if (product.getId() == null || !product.getId().equals(variant.getProduct().getId())) {
            return null;
        }
        Double variantPrice = variant.getPrice();
        if (variantPrice == null || Double.isNaN(variantPrice) || Double.isInfinite(variantPrice) || variantPrice <= 0.0) {
            return null;
        }
        return variantPrice;
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

            double finalPrice = 0.0;
            if (p != null) {
                if (Boolean.TRUE.equals(p.getHasVariants())) {
                    Double validVarPrice = variantBelongsToProduct ? resolveValidVariantPrice(p, v) : null;
                    finalPrice = validVarPrice != null ? validVarPrice : 0.0;
                } else if (v == null) {
                    Double validProdPrice = resolveValidProductPrice(p);
                    finalPrice = validProdPrice != null ? validProdPrice : 0.0;
                }
            }

            String variantText = null;
            if (variantBelongsToProduct && v.getOptionValues() != null && !v.getOptionValues().isEmpty()) {
                variantText = v.getOptionValues().stream()
                        .map(ov -> ov.getValueName())
                        .collect(Collectors.joining(" / "));
            }

            String imageUrl = (p != null && p.getMainImageThumbnailUrl() != null)
                    ? p.getMainImageThumbnailUrl()
                    : (p != null ? p.getMainImageUrl() : null);

            if (variantBelongsToProduct && v.getId() != null && p.getImages() != null) {
                String variantImg = p.getImages().stream()
                        .filter(img -> v.getId().equals(img.getVariantId()))
                        .map(img -> img.getThumbnailUrl() != null ? img.getThumbnailUrl() : img.getSecureUrl())
                        .findFirst()
                        .orElse(null);
                if (variantImg != null && !variantImg.isBlank()) {
                    imageUrl = variantImg;
                }
            }

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
            Double validVariantPrice = resolveValidVariantPrice(product, variant);
            if (validVariantPrice == null) {
                throw new IllegalArgumentException("La variante seleccionada no tiene un precio válido.");
            }
        } else {
            if (newItem.getVariantId() != null) {
                throw new IllegalArgumentException("La variante seleccionada no pertenece a este producto.");
            }
            Double validProductPrice = resolveValidProductPrice(product);
            if (validProductPrice == null) {
                throw new IllegalArgumentException("Este producto no tiene un precio válido.");
            }
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