package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThemeCustomPageDto {

    /** Identificador en la URL: /s/{slug}/page/{pageSlug} */
    private String slug;

    /** Nombre visible en la pestaña y en el menú Navbar */
    private String title;

    /** Si es true, aparece automáticamente como enlace en el menú principal de la tienda */
    @Builder.Default
    private Boolean showInNavbar = true;

    /** Lista de secciones de esta página personalizada */
    @Builder.Default
    private List<ThemeSectionDto> sections = new ArrayList<>();
}