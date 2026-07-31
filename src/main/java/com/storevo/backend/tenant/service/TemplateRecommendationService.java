package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.TemplateRecommendationResponse;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateRecommendationService {

    private final ProductRepository productRepository;

    public TemplateRecommendationResponse getSmartRecommendation(Long categoryId) {
        if (categoryId == null) {
            return new TemplateRecommendationResponse(null);
        }

        // ==========================================
        // FASE 1: APRENDIZAJE POR HISTORIAL (Nivel 3)
        // ==========================================
        Long productCount = productRepository.countProductsWithVariantsByCategory(categoryId);

        // Umbral de confianza: Solo aprende si hay al menos 3 productos configurados
        if (productCount != null && productCount >= 3) {
            // Trae las 2 opciones más usadas de esta categoría específica
            List<String> topOptions = productRepository.findMostUsedOptionsByCategory(categoryId, PageRequest.of(0, 2));

            if (!topOptions.isEmpty()) {
                List<TemplateRecommendationResponse.OptionSuggestion> suggestedOptions = new ArrayList<>();

                for (String optName : topOptions) {
                    // Trae los 4 valores más repetidos para esta opción específica
                    List<String> topValues = productRepository.findMostUsedOptionValuesByCategory(categoryId, optName, PageRequest.of(0, 4));
                    suggestedOptions.add(TemplateRecommendationResponse.OptionSuggestion.builder()
                            .name(optName)
                            .values(topValues)
                            .build());
                }

                // Cálculo de confianza visual
                int confidence = productCount >= 10 ? 98 : (productCount >= 5 ? 85 : 70);
                String confidenceText = productCount >= 10 ? "Alta confianza" : "Confianza media";

                TemplateRecommendationResponse.Recommendation rec = TemplateRecommendationResponse.Recommendation.builder()
                        .title("Configuración recomendada")
                        .subtitle("Basada en " + productCount + " productos de esta categoría")
                        .confidence(confidence)
                        .confidenceLabel(confidenceText)
                        .options(suggestedOptions)
                        .attributes(new ArrayList<>()) // Aquí podrías hacer la misma query para especificaciones
                        .build();

                return new TemplateRecommendationResponse(rec);
            }
        }

        // ==========================================
        // FASE 2: REGLAS ESTÁTICAS DE RESPALDO (Nivel 2)
        // ==========================================
        // (Nota: Aquí puedes inyectar un CategoryRepository si deseas leer el nombre de la categoría
        // y hacer un switch manual. Por simplicidad, pasamos a Fase 3).

        // ==========================================
        // FASE 3: FALLBACK GENERAL (Nivel 1)
        // ==========================================
        return new TemplateRecommendationResponse(null);
    }
}