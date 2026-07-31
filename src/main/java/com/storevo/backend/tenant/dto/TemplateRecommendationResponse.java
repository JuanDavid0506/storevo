package com.storevo.backend.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TemplateRecommendationResponse {

    private Recommendation recommendation; // Será null si no hay sugerencias

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Recommendation {
        private String title;
        private String subtitle;
        private Integer confidence;
        private String confidenceLabel;
        private List<OptionSuggestion> options;
        private List<String> attributes;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OptionSuggestion {
        private String name;
        private List<String> values;
    }
}