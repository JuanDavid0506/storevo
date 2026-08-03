package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmartRecommendationResponse {

    private int basedOnProductCount;
    private RecommendationDetails recommendation;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationDetails {
        private List<String> options;
        private List<String> specifications;
    }
}