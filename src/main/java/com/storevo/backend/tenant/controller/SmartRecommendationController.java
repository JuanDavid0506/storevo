package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.dto.SmartRecommendationResponse;
import com.storevo.backend.tenant.service.SmartRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class SmartRecommendationController {

    private final SmartRecommendationService recommendationService;

    @GetMapping("/category/{categoryId}")
    @ResponseBody
    public ResponseEntity<SmartRecommendationResponse> getCategoryRecommendation(@PathVariable Long categoryId) {
        return recommendationService.getRecommendationsForCategory(categoryId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build()); // 204 si la IA no tiene historial
    }
}