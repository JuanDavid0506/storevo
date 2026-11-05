package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.model.StoreReview;
import com.storevo.backend.tenant.repository.StoreReviewRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/dashboard/{slug}/reviews")
@RequiredArgsConstructor
public class DashboardReviewController {

    private final StoreReviewRepository storeReviewRepository;

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
    public String listReviews(Model model) {
        List<StoreReview> reviews = storeReviewRepository.findAllByOrderByCreatedAtDesc();
        long totalCount = reviews.size();
        long visibleCount = storeReviewRepository.countByIsVisible(true);
        long hiddenCount = storeReviewRepository.countByIsVisible(false);
        Double avgRatingRaw = storeReviewRepository.findAverageRating();
        double averageRating = avgRatingRaw != null ? Math.round(avgRatingRaw * 10.0) / 10.0 : 0.0;

        model.addAttribute("reviews", reviews);
        model.addAttribute("totalReviewsCount", totalCount);
        model.addAttribute("visibleReviewsCount", visibleCount);
        model.addAttribute("hiddenReviewsCount", hiddenCount);
        model.addAttribute("averageRating", averageRating);
        model.addAttribute("pageTitle", "Reseñas de Clientes");
        return "dashboard/reviews/index";
    }

    @PostMapping("/{id}/toggle-visibility")
    public String toggleVisibility(
            @PathVariable String slug,
            @PathVariable Long id,
            RedirectAttributes redirectAttributes) {

        StoreReview review = storeReviewRepository.findById(id).orElse(null);
        if (review == null) {
            redirectAttributes.addFlashAttribute("errorMessage", "No se encontró la reseña solicitada.");
            return "redirect:/dashboard/" + slug + "/reviews";
        }

        boolean nextState = !Boolean.TRUE.equals(review.getIsVisible());
        review.setIsVisible(nextState);
        storeReviewRepository.save(review);

        redirectAttributes.addFlashAttribute(
                "successMessage",
                nextState
                        ? "La reseña del Pedido #" + review.getOrderId() + " ahora es visible en la tienda pública."
                        : "La reseña del Pedido #" + review.getOrderId() + " fue ocultada de la tienda pública."
        );
        return "redirect:/dashboard/" + slug + "/reviews";
    }

    @PostMapping("/{id}/delete")
    public String deleteReview(
            @PathVariable String slug,
            @PathVariable Long id,
            RedirectAttributes redirectAttributes) {

        if (!storeReviewRepository.existsById(id)) {
            redirectAttributes.addFlashAttribute("errorMessage", "No se encontró la reseña solicitada.");
            return "redirect:/dashboard/" + slug + "/reviews";
        }
        storeReviewRepository.deleteById(id);
        redirectAttributes.addFlashAttribute("successMessage", "Reseña eliminada permanentemente.");
        return "redirect:/dashboard/" + slug + "/reviews";
    }
}