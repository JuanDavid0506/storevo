package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.SmartRecommendationResponse;
import com.storevo.backend.tenant.dto.SmartRecommendationResponse.RecommendationDetails;
import com.storevo.backend.tenant.model.Product;
import com.storevo.backend.tenant.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SmartRecommendationService {

    private final ProductRepository productRepository;

    public Optional<SmartRecommendationResponse> getRecommendationsForCategory(Long categoryId) {
        // 1. Obtener historial de productos usando la subcategoría final
        List<Product> categoryProducts = productRepository.findByCategoryId(categoryId);
        int productCount = categoryProducts.size();

        // 2. REGLA PURISTA: Si hay menos de 3 productos, no inventamos nada.
        if (productCount < 3) {
            return Optional.empty();
        }

        // 3. Si hay historial válido, calculamos la estadística
        return Optional.of(buildFromHistory(productCount, categoryProducts));
    }

    private SmartRecommendationResponse buildFromHistory(int count, List<Product> products) {
        // Extraer la moda de las opciones (Top 2)
        Map<String, Long> optionFrequencies = products.stream()
                .filter(p -> p.getOptions() != null)
                .flatMap(p -> p.getOptions().stream())
                .map(opt -> opt.getName().trim())
                .filter(name -> !name.isEmpty())
                .collect(Collectors.groupingBy(name -> name, Collectors.counting()));

        List<String> topOptions = getTopKeys(optionFrequencies, 2);

        // Extraer la moda de las especificaciones (Top 4)
        Map<String, Long> specFrequencies = products.stream()
                .filter(p -> p.getAttributes() != null)
                .flatMap(p -> p.getAttributes().keySet().stream())
                .map(String::trim)
                .filter(key -> !key.isEmpty())
                .collect(Collectors.groupingBy(key -> key, Collectors.counting()));

        List<String> topSpecs = getTopKeys(specFrequencies, 4);

        return new SmartRecommendationResponse(count, new RecommendationDetails(topOptions, topSpecs));
    }

    // Método utilitario para obtener los elementos más repetidos
    private List<String> getTopKeys(Map<String, Long> frequencies, int limit) {
        return frequencies.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}