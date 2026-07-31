package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.TemplateRecommendationResponse;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateRecommendationService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public TemplateRecommendationResponse getSmartRecommendation(Long categoryId) {
        if (categoryId == null) return new TemplateRecommendationResponse(null);

        Long productCount = productRepository.countProductsWithVariantsByCategory(categoryId);

        if (productCount != null && productCount >= 3) {
            List<String> topOptions = productRepository.findMostUsedOptionsByCategory(categoryId, PageRequest.of(0, 2));

            if (!topOptions.isEmpty()) {
                List<TemplateRecommendationResponse.OptionSuggestion> suggestedOptions = new ArrayList<>();

                for (String optName : topOptions) {
                    // CAMBIO: Ahora trae hasta 10 valores sugeridos
                    List<String> topValues = productRepository.findMostUsedOptionValuesByCategory(categoryId, optName, PageRequest.of(0, 10));
                    suggestedOptions.add(TemplateRecommendationResponse.OptionSuggestion.builder()
                            .name(optName)
                            .values(topValues)
                            .build());
                }

                int confidence = productCount >= 10 ? 98 : (productCount >= 5 ? 85 : 70);
                String confidenceText = productCount >= 10 ? "Alta confianza" : "Confianza media";

                TemplateRecommendationResponse.Recommendation rec = TemplateRecommendationResponse.Recommendation.builder()
                        .title("Configuración recomendada")
                        .subtitle("Basada en " + productCount + " productos de esta categoría")
                        .confidence(confidence)
                        .confidenceLabel(confidenceText)
                        .options(suggestedOptions)
                        .attributes(new ArrayList<>())
                        .build();

                return new TemplateRecommendationResponse(rec);
            }
        }
        return new TemplateRecommendationResponse(null);
    }

    // NUEVO MÉTODO: Para las sugerencias asíncronas mientras escribe
    @Transactional(readOnly = true)
    public List<String> getDynamicSuggestions(Long categoryId, String optionName) {
        if (categoryId == null || optionName == null || optionName.trim().isEmpty()) {
            return new ArrayList<>();
        }
        // Devuelve el Top 10 histórico y reciente de esa palabra específica
        return productRepository.findMostUsedOptionValuesByCategory(categoryId, optionName.trim(), PageRequest.of(0, 10));
    }
}