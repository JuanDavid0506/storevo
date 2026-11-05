package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.model.Coupon;
import com.storevo.backend.tenant.model.DiscountType;
import com.storevo.backend.tenant.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    public record CouponEvaluation(
            String code,
            DiscountType discountType,
            Double discountValue,
            double discountAmount
    ) {}

    @Transactional(readOnly = true)
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public CouponEvaluation validateAndCalculateDiscount(String rawCode, double subtotal) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new IllegalArgumentException("Ingresa un código de cupón.");
        }
        if (subtotal <= 0.0) {
            throw new IllegalArgumentException("El subtotal del pedido debe ser mayor a cero para aplicar un cupón.");
        }

        String normalizedCode = normalizeCode(rawCode);
        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException("El cupón '" + normalizedCode + "' no existe."));

        return evaluateCouponRules(coupon, subtotal);
    }

    @Transactional
    public CouponEvaluation consumeCouponForOrder(String rawCode, double subtotal) {
        if (rawCode == null || rawCode.isBlank()) {
            return null;
        }
        String normalizedCode = normalizeCode(rawCode);
        Coupon coupon = couponRepository.findByCodeWithLock(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException("El cupón '" + normalizedCode + "' no es válido."));

        CouponEvaluation evaluation = evaluateCouponRules(coupon, subtotal);

        int currentUsed = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
        coupon.setUsedCount(currentUsed + 1);
        couponRepository.save(coupon);

        return evaluation;
    }

    /**
     * Reintegra 1 uso al cupón cuando el pedido asociado se cancela o expira sin completarse.
     */
    @Transactional
    public void releaseCouponUsage(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            return;
        }
        String normalizedCode = normalizeCode(rawCode);
        couponRepository.findByCodeWithLock(normalizedCode).ifPresent(coupon -> {
            int currentUsed = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
            if (currentUsed > 0) {
                coupon.setUsedCount(currentUsed - 1);
                couponRepository.save(coupon);
            }
        });
    }

    private CouponEvaluation evaluateCouponRules(Coupon coupon, double subtotal) {
        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            throw new IllegalArgumentException("El cupón '" + coupon.getCode() + "' no se encuentra activo.");
        }
        if (coupon.isExpired()) {
            throw new IllegalArgumentException("El cupón '" + coupon.getCode() + "' ha expirado.");
        }
        if (coupon.isUsageLimitReached()) {
            throw new IllegalArgumentException("El cupón '" + coupon.getCode() + "' ya alcanzó su límite máximo de usos.");
        }
        if (coupon.getMinPurchaseAmount() != null && coupon.getMinPurchaseAmount() > 0.0
                && subtotal < coupon.getMinPurchaseAmount()) {
            long minCop = Math.round(coupon.getMinPurchaseAmount());
            throw new IllegalArgumentException("Este cupón requiere una compra mínima de $ "
                    + String.format("%,d", minCop).replace(",", ".") + ".");
        }

        double rawVal = coupon.getDiscountValue() != null ? coupon.getDiscountValue() : 0.0;
        if (rawVal <= 0.0) {
            throw new IllegalArgumentException("El cupón no tiene un valor de descuento válido.");
        }

        double discountAmount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            double safePct = Math.min(100.0, rawVal);
            discountAmount = (double) Math.round(subtotal * (safePct / 100.0));
        } else {
            discountAmount = Math.min(subtotal, (double) Math.round(rawVal));
        }

        discountAmount = Math.max(0.0, Math.min(subtotal, discountAmount));
        return new CouponEvaluation(coupon.getCode(), coupon.getDiscountType(), coupon.getDiscountValue(), discountAmount);
    }

    @Transactional
    public Coupon createCoupon(
            String rawCode,
            DiscountType discountType,
            Double discountValue,
            Double minPurchaseAmount,
            Integer maxUses,
            LocalDateTime expiresAt) {

        String cleanCode = normalizeCode(rawCode);
        if (cleanCode.length() < 3 || cleanCode.length() > 50 || !cleanCode.matches("^[A-Z0-9_-]+$")) {
            throw new IllegalArgumentException("El código del cupón debe tener entre 3 y 50 caracteres (letras, números, guiones).");
        }
        if (couponRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
            throw new IllegalArgumentException("Ya existe un cupón con el código '" + cleanCode + "'.");
        }
        if (discountType == null) {
            throw new IllegalArgumentException("Selecciona el tipo de descuento.");
        }
        if (discountValue == null || Double.isNaN(discountValue) || Double.isInfinite(discountValue) || discountValue <= 0.0) {
            throw new IllegalArgumentException("El valor del descuento debe ser mayor a cero.");
        }
        if (discountType == DiscountType.PERCENTAGE && discountValue > 100.0) {
            throw new IllegalArgumentException("El porcentaje de descuento no puede superar el 100%.");
        }
        if (minPurchaseAmount != null && minPurchaseAmount < 0.0) {
            throw new IllegalArgumentException("El monto mínimo de compra no puede ser negativo.");
        }
        if (maxUses != null && maxUses <= 0) {
            throw new IllegalArgumentException("El límite de usos debe ser mayor a cero (o dejarse vacío para usos ilimitados).");
        }

        Coupon coupon = Coupon.builder()
                .code(cleanCode)
                .discountType(discountType)
                .discountValue(discountValue)
                .minPurchaseAmount(minPurchaseAmount != null && minPurchaseAmount > 0 ? minPurchaseAmount : null)
                .maxUses(maxUses)
                .usedCount(0)
                .expiresAt(expiresAt)
                .isActive(true)
                .build();

        return couponRepository.save(coupon);
    }

    @Transactional
    public void toggleCouponStatus(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cupón no encontrado."));
        coupon.setIsActive(!Boolean.TRUE.equals(coupon.getIsActive()));
        couponRepository.save(coupon);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new IllegalArgumentException("Cupón no encontrado.");
        }
        couponRepository.deleteById(id);
    }

    public static String normalizeCode(String rawCode) {
        if (rawCode == null) return "";
        return rawCode.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
    }
}