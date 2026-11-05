package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.DiscountType;
import com.storevo.backend.tenant.service.CouponService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Controller
@RequestMapping("/dashboard/{slug}/coupons")
@RequiredArgsConstructor
public class DashboardCouponController {

    private final CouponService couponService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }
        model.addAttribute("store", store);
        model.addAttribute("slug", slug);
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping
    public String listCoupons(Model model) {
        model.addAttribute("coupons", couponService.getAllCoupons());
        model.addAttribute("discountTypes", DiscountType.values());
        model.addAttribute("pageTitle", "Cupones de Descuento");
        return "dashboard/coupons/index";
    }

    @PostMapping
    public String createCoupon(
            @PathVariable String slug,
            @RequestParam String code,
            @RequestParam DiscountType discountType,
            @RequestParam Double discountValue,
            @RequestParam(required = false) Double minPurchaseAmount,
            @RequestParam(required = false) Integer maxUses,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiresDate,
            RedirectAttributes redirectAttributes) {

        try {
            LocalDateTime expiresAt = expiresDate != null ? expiresDate.atTime(LocalTime.MAX) : null;
            couponService.createCoupon(code, discountType, discountValue, minPurchaseAmount, maxUses, expiresAt);
            redirectAttributes.addFlashAttribute("successMessage", "Cupón creado exitosamente.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "No se pudo crear el cupón.");
        }
        return "redirect:/dashboard/" + slug + "/coupons";
    }

    @PostMapping("/{id}/toggle")
    public String toggleCoupon(
            @PathVariable String slug,
            @PathVariable Long id,
            RedirectAttributes redirectAttributes) {
        try {
            couponService.toggleCouponStatus(id);
            redirectAttributes.addFlashAttribute("successMessage", "Estado del cupón actualizado.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/dashboard/" + slug + "/coupons";
    }

    @PostMapping("/{id}/delete")
    public String deleteCoupon(
            @PathVariable String slug,
            @PathVariable Long id,
            RedirectAttributes redirectAttributes) {
        try {
            couponService.deleteCoupon(id);
            redirectAttributes.addFlashAttribute("successMessage", "Cupón eliminado correctamente.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/dashboard/" + slug + "/coupons";
    }
}