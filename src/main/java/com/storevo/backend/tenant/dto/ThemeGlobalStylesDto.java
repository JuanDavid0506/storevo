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


    // =========================================================
    // CONFIGURACIÓN GLOBAL DEL BUSCADOR DE PRODUCTOS
    // =========================================================

    @Builder.Default
    private Boolean searchEnabled = true;

    /**
     * Modalidad del buscador:
     * traditional | instant | predictive | fullscreen
     */
    @Builder.Default
    private String searchMode = "predictive";

    /**
     * Presentación del buscador en el Navbar:
     * auto | inline_bar | expandable_icon | modal_trigger | hidden
     */
    @Builder.Default
    private String searchNavbarVariant = "auto";

    /**
     * Comportamiento en dispositivos móviles:
     * fullscreen | same
     */
    @Builder.Default
    private String searchMobileMode = "fullscreen";

    /**
     * Estilo visual del campo de búsqueda:
     * sync | pill | rounded | square | underline
     */
    @Builder.Default
    private String searchInputStyle = "sync";

    /**
     * Tamaño del campo de búsqueda:
     * compact | normal | large
     */
    @Builder.Default
    private String searchInputSize = "normal";

    /**
     * Tipo de botón de acción en el buscador:
     * icon | text | icon_text | none
     */
    @Builder.Default
    private String searchButtonMode = "icon";

    /**
     * Animación de apertura del panel de búsqueda:
     * slide_up | fade | scale
     */
    @Builder.Default
    private String searchAnim = "slide_up";

    @Builder.Default
    private String searchPlaceholder = "Buscar productos...";

    @Builder.Default
    private String searchButtonLabel = "Buscar";

    @Builder.Default
    private String searchEmptyMessage = "No encontramos productos para tu búsqueda";

    @Builder.Default
    private Integer searchMinChars = 2;

    @Builder.Default
    private Integer searchDebounceMs = 250;

    @Builder.Default
    private Integer searchMaxSuggestions = 6;

    @Builder.Default
    private Boolean searchShowProductImg = true;

    @Builder.Default
    private Boolean searchShowProductPrice = true;

    @Builder.Default
    private Boolean searchShowProductDiscount = true;

    @Builder.Default
    private Boolean searchShowProductCategory = true;

    @Builder.Default
    private Boolean searchShowProductBrand = false;

    @Builder.Default
    private Boolean searchSuggestCategories = true;

    @Builder.Default
    private Boolean searchSuggestBrands = true;

    @Builder.Default
    private Boolean searchShowRecent = true;

    @Builder.Default
    private String searchPopularTerms = "";

    /**
     * Selector de categorías en el buscador:
     * none | select_left | pills_top
     */
    @Builder.Default
    private String searchCategoryScope = "none";

    @Builder.Default
    private Boolean searchAdvancedEnabled = false;

    @Builder.Default
    private Boolean searchMatchVariants = true;

    @Builder.Default
    private Boolean searchMatchSpecs = true;

    @Builder.Default
    private Boolean searchAdvCategory = true;

    @Builder.Default
    private Boolean searchAdvBrand = true;

    @Builder.Default
    private Boolean searchAdvPrice = true;

    @Builder.Default
    private Boolean searchAdvAvailability = true;

    @Builder.Default
    private Boolean searchAdvVariants = true;

    @Builder.Default
    private Boolean searchAdvSpecs = false;


    // =========================================================
    // CONFIGURACIÓN GLOBAL DE TARJETAS DE PRODUCTOS
    // =========================================================

    @Builder.Default
    private String cardPreset = "commercial";

    @Builder.Default
    private String cardImageAspect = "square";

    @Builder.Default
    private String cardImageFit = "cover";

    @Builder.Default
    private String cardImagePadding = "flush";

    @Builder.Default
    private String cardRadius = "sync";

    @Builder.Default
    private String cardShadow = "sm";

    @Builder.Default
    private String cardContentAlign = "left";

    @Builder.Default
    private String cardMetaMode = "category";

    @Builder.Default
    private String cardDiscountBadge = "percent";

    @Builder.Default
    private Boolean cardShowStatusBadges = true;

    @Builder.Default
    private Boolean cardShowOldPrice = true;

    @Builder.Default
    private String cardPriceSize = "normal";

    @Builder.Default
    private String cardActionMode = "always";

    @Builder.Default
    private String cardWishlistMode = "always";

    @Builder.Default
    private String cardButtonStyle = "solid";

    @Builder.Default
    private String cardImageHover = "carousel";

    @Builder.Default
    private String cardHoverLift = "lift";


    // =========================================================
    // CONFIGURACIÓN GLOBAL DE LA PÁGINA DE DETALLE DEL PRODUCTO
    // =========================================================

    @Builder.Default
    private String detailPreset = "conversion";

    @Builder.Default
    private String detailInfoStyle = "clean";

    @Builder.Default
    private String detailStickyMode = "sticky_info";

    @Builder.Default
    private String detailGalleryPosition = "left";

    @Builder.Default
    private String detailLayoutRatio = "50_50";

    @Builder.Default
    private String detailGalleryLayout = "bottom";

    @Builder.Default
    private Boolean detailGalleryArrows = true;

    @Builder.Default
    private String detailImageAspect = "square";

    @Builder.Default
    private String detailImageFit = "cover";

    @Builder.Default
    private Boolean detailImageZoom = true;

    @Builder.Default
    private String detailBuyLayout = "standard";

    @Builder.Default
    private String detailVariantStyle = "rounded";

    @Builder.Default
    private Boolean detailShowBreadcrumbs = true;

    @Builder.Default
    private Boolean detailShowMeta = true;

    @Builder.Default
    private Boolean detailShowSku = true;

    @Builder.Default
    private Boolean detailShowSavingsBadge = true;

    @Builder.Default
    private Boolean detailShowStock = true;

    @Builder.Default
    private Boolean detailShowTrustStrip = true;

    @Builder.Default
    private Boolean detailShowShare = true;

    @Builder.Default
    private Boolean detailShowSpecs = true;

    @Builder.Default
    private String detailSpecsOpen = "collapsed";

    @Builder.Default
    private Boolean detailShowPolicies = true;

    @Builder.Default
    private Boolean detailShowRelated = true;

    @Builder.Default
    private String detailRelatedCols = "4";

}
