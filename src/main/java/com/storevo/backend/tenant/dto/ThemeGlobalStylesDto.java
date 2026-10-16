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
    private String borderRadius = "1rem";

    // ---- Bordes y formas ----
    /** classic (como hoy) | sync (igual que las tarjetas) | square | pill */
    @Builder.Default
    private String buttonRadius = "classic";

    /** elevated | clean | outlined */
    @Builder.Default
    private String cardStyle = "elevated";

    // ---- Tipografía y jerarquía ----
    /** none | uppercase */
    @Builder.Default
    private String headingTransform = "none";

    /** compact (95%) | standard (100%) | large (106%) */
    @Builder.Default
    private String fontScale = "standard";

    // ---- Navegación y Cabecera ----
    /** classic | centered | marketplace | minimal */
    @Builder.Default
    private String navbarLayout = "classic";

    /** light | glass | secondary | primary | page */
    @Builder.Default
    private String navbarStyle = "light";

    /** normal | uppercase | bold */
    @Builder.Default
    private String navbarLinkFormat = "normal";

    /** color | underline | pill */
    @Builder.Default
    private String navbarLinkHover = "color";

    @Builder.Default
    private boolean navbarSticky = true;
}