package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThemeGlobalStylesDto {

    @Builder.Default
    private String primaryColor = "#6366f1";

    @Builder.Default
    private String secondaryColor = "#0f172a";

    @Builder.Default
    private String backgroundColor = "#f8fafc";

    @Builder.Default
    private String textColor = "#0f172a";

    @Builder.Default
    private String headingFont = "Inter";

    @Builder.Default
    private String bodyFont = "Inter";

    @Builder.Default
    private String headingTransform = "none";

    @Builder.Default
    private String fontScale = "standard";

    @Builder.Default
    private String borderRadius = "1rem";

    @Builder.Default
    private String buttonRadius = "classic";

    @Builder.Default
    private String cardStyle = "elevated";

    // --- Opciones de Navbar (Básicas + Avanzadas Fase 4) ---
    @Builder.Default
    private String navbarLayout = "classic";

    @Builder.Default
    private String navbarStyle = "light";

    @Builder.Default
    private String navbarLinkFormat = "normal";

    @Builder.Default
    private String navbarLinkHover = "color";

    @Builder.Default
    private Boolean navbarSticky = true;

    /** Estilo de submenú de categorías: mega | cascade | drawer | none */
    @Builder.Default
    private String navbarDropdownStyle = "mega";

    /** Animación de apertura de desplegables: fade | slide_up | scale */
    @Builder.Default
    private String navbarDropdownAnim = "slide_up";

    /** Modo de apertura del submenú en PC: hover | click */
    @Builder.Default
    private String navbarTrigger = "hover";

    /** Velocidad de transición: fast (150ms) | normal (250ms) | slow (400ms) */
    @Builder.Default
    private String navbarSpeed = "normal";

    /** Si es true, reduce la altura del navbar al hacer scroll hacia abajo */
    @Builder.Default
    private Boolean navbarCompactOnScroll = false;
}