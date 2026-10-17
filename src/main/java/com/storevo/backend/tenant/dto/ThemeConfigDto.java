package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThemeConfigDto {

    @Builder.Default
    private ThemeGlobalStylesDto globalStyles = new ThemeGlobalStylesDto();

    /** Lista clásica de portada mantenida por retrocompatibilidad con temas v1 */
    @Builder.Default
    private List<ThemeSectionDto> sections = new ArrayList<>();

    /** Mapa de secciones por página (home, catalog, product y category:{id}) */
    @Builder.Default
    private Map<String, List<ThemeSectionDto>> pages = new LinkedHashMap<>();

    /** Lista de páginas personalizadas creadas por el comerciante */
    @Builder.Default
    private List<ThemeCustomPageDto> customPages = new ArrayList<>();

    public List<ThemeSectionDto> getPageSections(String pageKey) {
        if (pageKey == null || pageKey.isBlank()) {
            return sections != null ? sections : new ArrayList<>();
        }
        String cleanKey = pageKey.trim();

        // 1. Páginas personalizadas (page:{slug})
        if (cleanKey.startsWith("page:")) {
            String targetSlug = cleanKey.substring(5).trim();
            ThemeCustomPageDto cp = findCustomPage(targetSlug);
            if (cp != null && cp.getSections() != null) {
                return cp.getSections();
            }
            return new ArrayList<>();
        }

        // 2. Coincidencia directa en el mapa de páginas (incluye category:{id} si ya fue personalizada)
        if (pages != null && pages.containsKey(cleanKey)) {
            List<ThemeSectionDto> specific = pages.get(cleanKey);
            if (specific != null && !specific.isEmpty()) {
                return specific;
            }
        }

        // 3. Fallback automático: si es una categoría sin diseño propio aún, hereda el diseño de 'catalog'
        if (cleanKey.startsWith("category:") && pages != null && pages.get("catalog") != null) {
            return pages.get("catalog");
        }

        // 4. Fallback para portada
        if ("home".equalsIgnoreCase(cleanKey) && sections != null) {
            return sections;
        }
        return new ArrayList<>();
    }

    public ThemeCustomPageDto findCustomPage(String pageSlug) {
        if (pageSlug == null || pageSlug.isBlank() || customPages == null) {
            return null;
        }
        String clean = pageSlug.trim().toLowerCase();
        for (ThemeCustomPageDto cp : customPages) {
            if (cp != null && cp.getSlug() != null && cp.getSlug().trim().equalsIgnoreCase(clean)) {
                return cp;
            }
        }
        return null;
    }

    @JsonIgnore
    public List<ThemeCustomPageDto> getNavbarCustomPages() {
        if (customPages == null || customPages.isEmpty()) {
            return new ArrayList<>();
        }
        return customPages.stream()
                .filter(cp -> cp != null
                        && cp.getSlug() != null && !cp.getSlug().isBlank()
                        && cp.getTitle() != null && !cp.getTitle().isBlank()
                        && Boolean.TRUE.equals(cp.getShowInNavbar()))
                .collect(Collectors.toList());
    }
}