package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.TemplateRecommendationResponse;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

                // Ficha técnica sugerida: las llaves de atributos (attrKeys) más repetidas
                // entre los productos ya existentes de esta categoría (Top 4).
                List<Product> categoryProducts = productRepository.findByCategoryId(categoryId);
                Map<String, Long> specFrequencies = categoryProducts.stream()
                        .filter(p -> p.getAttributes() != null)
                        .flatMap(p -> p.getAttributes().keySet().stream())
                        .map(String::trim)
                        .filter(key -> !key.isEmpty())
                        .collect(Collectors.groupingBy(key -> key, Collectors.counting()));

                List<String> topSpecs = specFrequencies.entrySet().stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(4)
                        .map(Map.Entry::getKey)
                        .collect(Collectors.toList());

                TemplateRecommendationResponse.Recommendation rec = TemplateRecommendationResponse.Recommendation.builder()
                        .title("Configuración recomendada")
                        .subtitle("Basada en " + productCount + " productos de esta categoría")
                        .confidence(confidence)
                        .confidenceLabel(confidenceText)
                        .options(suggestedOptions)
                        .specifications(topSpecs)
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