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

    // =========================================================
    // COLORES GLOBALES
    // =========================================================

    @Builder.Default
    private String primaryColor = "#6366f1";

    @Builder.Default
    private String secondaryColor = "#0f172a";

    @Builder.Default
    private String backgroundColor = "#f8fafc";

    @Builder.Default
    private String textColor = "#0f172a";


    // =========================================================
    // TIPOGRAFÍA
    // =========================================================

    @Builder.Default
    private String headingFont = "Inter";

    @Builder.Default
    private String bodyFont = "Inter";

    @Builder.Default
    private String headingTransform = "none";

    @Builder.Default
    private String fontScale = "standard";


    // =========================================================
    // ESTILOS DE COMPONENTES
    // =========================================================

    @Builder.Default
    private String borderRadius = "1rem";

    @Builder.Default
    private String buttonRadius = "classic";

    @Builder.Default
    private String cardStyle = "elevated";


    // =========================================================
    // NAVEGACIÓN GLOBAL (NAVBAR)
    // =========================================================

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

    /**
     * Estilo del submenú de categorías:
     * mega | cascade | drawer | none
     */
    @Builder.Default
    private String navbarDropdownStyle = "mega";

    /**
     * Animación de apertura de desplegables:
     * fade | slide_up | scale
     */
    @Builder.Default
    private String navbarDropdownAnim = "slide_up";

    /**
     * Modo de apertura del submenú en PC:
     * hover | click
     */
    @Builder.Default
    private String navbarTrigger = "hover";

    /**
     * Velocidad de transición:
     * fast (150ms) | normal (250ms) | slow (400ms)
     */
    @Builder.Default
    private String navbarSpeed = "normal";

    /**
     * Reduce la altura del navbar al desplazarse hacia abajo.
     */
    @Builder.Default
    private Boolean navbarCompactOnScroll = false;


    // =========================================================
    // CONFIGURACIÓN GLOBAL DEL SISTEMA DE FILTROS
    // =========================================================

    /**
     * Interruptor maestro para habilitar o deshabilitar
     * el sistema de filtros en las páginas de la tienda.
     */
    @Builder.Default
    private Boolean filterEnabled = true;

    /**
     * Diseño visual global de los filtros:
     *
     * drawer  = panel lateral deslizable.
     * topbar  = barra horizontal con menús desplegables.
     * sidebar = columna lateral en escritorio y panel móvil.
     * inline  = panel expandible sobre los productos.
     */
    @Builder.Default
    private String filterLayout = "drawer";


    // =========================================================
    // CONTROLES GENERALES
    // =========================================================

    /**
     * Permite mostrar u ocultar la búsqueda de productos.
     */
    @Builder.Default
    private Boolean filterShowSearch = true;

    /**
     * Permite mostrar u ocultar el selector de ordenamiento.
     */
    @Builder.Default
    private Boolean filterShowSort = true;

    /**
     * Permite mostrar u ocultar el contador de resultados.
     */
    @Builder.Default
    private Boolean filterShowCount = true;


    // =========================================================
    // FILTROS POR CATEGORÍA
    // =========================================================

    /**
     * Permite filtrar por categorías y subcategorías.
     */
    @Builder.Default
    private Boolean filterShowCategory = true;


    // =========================================================
    // FILTROS POR PRECIO Y OFERTAS
    // =========================================================

    /**
     * Permite filtrar productos por rango de precios.
     */
    @Builder.Default
    private Boolean filterShowPrice = true;

    /**
     * Permite mostrar únicamente productos en oferta.
     */
    @Builder.Default
    private Boolean filterShowOffers = true;


    // =========================================================
    // FILTROS DE DISPONIBILIDAD
    // =========================================================

    /**
     * Permite filtrar productos según su disponibilidad,
     * existencias y modalidad de fabricación bajo pedido.
     */
    @Builder.Default
    private Boolean filterShowAvailability = true;


    // =========================================================
    // FILTROS POR MARCA
    // =========================================================

    /**
     * Permite filtrar productos por marca.
     */
    @Builder.Default
    private Boolean filterShowBrand = true;


    // =========================================================
    // FILTROS POR VARIANTES
    // =========================================================

    /**
     * Permite filtrar según las variantes configuradas
     * para los productos, por ejemplo talla, color o presentación.
     */
    @Builder.Default
    private Boolean filterShowVariants = true;


    // =========================================================
    // FILTROS POR ATRIBUTOS Y FICHA TÉCNICA
    // =========================================================

    /**
     * Permite filtrar por atributos personalizados,
     * como material, género u otras características técnicas.
     *
     * Se encuentra desactivado por defecto para evitar
     * mostrar filtros innecesarios en tiendas que no los utilizan.
     */
    @Builder.Default
    private Boolean filterShowSpecs = false;

}

