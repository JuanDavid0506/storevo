window.Storevo = window.Storevo || {};

Storevo.ThemeEditor = {
    slug: '',
    storeName: 'Nuestra Tienda',
    previewUrl: '',
    activePage: 'home',
    theme: { globalStyles: {}, sections: [], pages: {}, customPages: [] },
    categories: [],
    catalogProducts: [],
    activeSectionId: null,
    autoSaveTimer: null,
    hasUnpublishedChanges: false,

    catalogDefinitions: {
        announcement_bar: {
            layoutSupport: { bg: false, spacing: false, width: false, anchor: true },
            label: 'Barra de Anuncio Superior',
            description: 'Cintillo superior animado (Marquesina continua, carrusel vertical, giro 3D, máquina de escribir y más).',
            defaultSettings: {
                text: '¡Envío gratis en compras superiores a $150.000!',
                text2: '',
                text3: '',
                headerPosition: 'below_menu',
                animationMode: 'fade',
                speed: 'normal',
                barFormat: 'normal',
                linkUrl: '/catalog',
                linkText: 'Ver más',
                linkStyle: 'underline',
                showArrows: false,
                dismissible: false,
                bgColor: '#0f172a',
                textColor: '#ffffff'
            }
        },
        hero_banner: {
            layoutSupport: { bg: false, spacing: false, width: false, anchor: true },
            label: 'Banner Principal (Hero)',
            description: 'Portada de gran impacto con hasta 5 slides en carrusel, imagen móvil, control de altura y 3 diseños.',
            defaultSettings: {
                heroLayout: 'classic',
                heroHeight: 'default',
                slideCount: '1',
                autoplay: true,
                autoplaySpeed: 'normal',
                badgeText: 'Nueva Colección',
                title: 'Descubre lo mejor de nuestra tienda',
                subtitle: 'Calidad garantizada con envíos a toda Colombia.',
                buttonText: 'Ver Catálogo',
                buttonUrl: '/catalog',
                secondaryButtonText: '',
                secondaryButtonUrl: '/catalog',
                imageUrl: '',
                mobileImageUrl: '',
                overlayOpacity: 50,
                bgColor: '#6366f1',
                textColor: '#ffffff',
                alignment: 'center'
            }
        },
        product_grid: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Vitrina de Productos',
            description: 'Muestra tus novedades, productos en oferta o una categoría específica.',
            defaultSettings: {
                title: 'Productos Destacados',
                subtitle: 'Seleccionados especialmente para ti',
                source: 'NEWEST',
                categoryId: '',
                limit: 8,
                showViewAll: true
            }
        },
        spotlight_product: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Producto Estrella / Destacado',
            description: 'Destaca un producto específico en gran formato con foto grande, precio y compra rápida.',
            defaultSettings: {
                productId: '',
                badgeText: 'Producto Estrella',
                customTitle: '',
                customSubtitle: '',
                imageSide: 'left'
            }
        },
        featured_categories: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Categorías Destacadas',
            description: 'Tarjetas interactivas con foto automática, ícono o píldoras hacia tus categorías.',
            defaultSettings: {
                title: 'Explora por Categoría',
                subtitle: 'Encuentra rápidamente lo que estás buscando',
                cardLayout: 'visual',
                columns: '4'
            }
        },
        countdown_promo: {
            layoutSupport: { bg: false, spacing: true, width: true, anchor: true },
            label: 'Oferta con Contador Regresivo',
            description: 'Banner de urgencia con reloj en vivo (Días, Horas, Minutos y Segundos) para ofertas.',
            defaultSettings: {
                badgeText: 'Oferta por Tiempo Limitado',
                title: '¡Aprovecha nuestros descuentos especiales!',
                subtitle: 'Unidades limitadas disponibles antes de que termine la promoción.',
                endDate: '',
                buttonText: 'Ver Ofertas Ahora',
                buttonUrl: '/catalog',
                bgColor: '#0f172a',
                textColor: '#ffffff'
            }
        },
        multi_banners: {
            layoutSupport: { bg: false, spacing: true, width: true, anchor: true },
            label: 'Mosaico Doble de Banners',
            description: '2 tarjetas visuales lado a lado para destacar colecciones o rebajas.',
            defaultSettings: {
                card1Badge: 'Nuevo',
                card1Title: 'Colección Principal',
                card1Subtitle: 'Conoce nuestros últimos lanzamientos',
                card1ButtonText: 'Explorar',
                card1ButtonUrl: '/catalog',
                card1ImageUrl: '',
                card1BgColor: '#1e293b',
                card2Badge: 'Ofertas',
                card2Title: 'Descuentos Especiales',
                card2Subtitle: 'Referencias seleccionadas a precios únicos',
                card2ButtonText: 'Ver ofertas',
                card2ButtonUrl: '/catalog',
                card2ImageUrl: '',
                card2BgColor: '#4f46e5'
            }
        },
        promo_banner: {
            layoutSupport: { bg: false, spacing: true, width: true, anchor: true },
            label: 'Banner Dividido (Imagen + Texto)',
            description: 'Bloque mitad texto y mitad foto para destacar una promoción o colección.',
            defaultSettings: {
                badgeText: 'Oferta Especial',
                title: 'Temporada de Descuentos',
                subtitle: 'Aprovecha precios especiales por tiempo limitado.',
                buttonText: 'Comprar ahora',
                buttonUrl: '/catalog',
                imageUrl: '',
                bgColor: '#0f172a',
                textColor: '#ffffff'
            }
        },
        testimonials: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Reseñas Verificadas de Clientes',
            description: 'Muestra automáticamente las calificaciones reales dejadas por compradores en sus pedidos.',
            defaultSettings: {
                title: 'Opiniones de Compradores Reales',
                subtitle: 'Calificaciones verificadas de clientes que compraron en nuestra tienda'
            }
        },
        how_to_buy: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Cómo Comprar en 3 Pasos + Pagos',
            description: 'Explica en 3 pasos sencillos cómo pedir en tu tienda y muestra los medios de pago.',
            defaultSettings: {
                title: '¿Cómo comprar en nuestra tienda?',
                subtitle: 'Realiza tu pedido fácil, rápido y 100% seguro',
                step1Title: 'Elige tus productos',
                step1Text: 'Explora el catálogo, selecciona tus opciones favoritas y agrégalas a tu bolsa.',
                step2Title: 'Completa tus datos',
                step2Text: 'Ingresa tu nombre, teléfono y dirección de entrega en tu ciudad.',
                step3Title: 'Paga o confirma por WhatsApp',
                step3Text: 'Realiza tu pago en línea seguro o coordina tu pedido directamente con nosotros.',
                showPaymentBadges: true
            }
        },
        trust_badges: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Franja de Confianza y Beneficios',
            description: '3 bloques con íconos personalizables para transmitir seguridad, envíos y atención.',
            defaultSettings: {
                badgeStyle: 'cards',
                item1Icon: 'shield',
                item1Title: 'Compra 100% Segura',
                item1Text: 'Tus datos y pedidos están protegidos en todo momento.',
                item2Icon: 'truck',
                item2Title: 'Envíos a Todo el País',
                item2Text: 'Despachamos tu pedido rápido con transportadoras aliadas.',
                item3Icon: 'chat',
                item3Title: 'Atención Personalizada',
                item3Text: 'Resolvemos tus dudas directamente por WhatsApp.'
            }
        },
        faq_accordion: {
            layoutSupport: { bg: true, spacing: true, width: false, anchor: true },
            label: 'Preguntas Frecuentes (Acordeón)',
            description: 'Desplegable interactivo con hasta 5 preguntas sobre envíos, pagos y garantías.',
            defaultSettings: {
                title: 'Preguntas Frecuentes',
                subtitle: 'Resolvemos tus dudas antes de comprar',
                q1: '¿Cuáles son los métodos de pago disponibles?',
                a1: 'Puedes realizar tu pedido con pago seguro en línea o coordinar directamente con nosotros por WhatsApp.',
                q2: '¿Cuánto tarda en llegar mi pedido?',
                a2: 'Despachamos a todo el país. El tiempo estimado de entrega es de 2 a 5 días hábiles según tu ciudad.',
                q3: '¿Tienen cambios o garantías?',
                a3: 'Sí, todos nuestros productos cuentan con garantía y soporte directo.',
                q4: '',
                a4: '',
                q5: '',
                a5: ''
            }
        },
        whatsapp_cta: {
            layoutSupport: { bg: true, spacing: true, width: false, anchor: true },
            label: 'Banner de Asesoría por WhatsApp',
            description: 'Invita a tus clientes a escribirte por WhatsApp con un solo clic.',
            defaultSettings: {
                title: '¿Tienes dudas con tu talla o pedido?',
                subtitle: 'Escríbenos por WhatsApp y te asesoramos en minutos para elegir el producto ideal.',
                buttonText: 'Hablar con un asesor en WhatsApp'
            }
        },
        rich_text: {
            layoutSupport: { bg: true, spacing: true, width: false, anchor: true },
            label: 'Texto Libre / Sobre Nosotros',
            description: 'Sección limpia para contar la historia de tu marca o información clave.',
            defaultSettings: {
                title: 'Sobre Nuestra Marca',
                content: 'Somos una tienda comprometida con ofrecerte la mejor calidad y atención personalizada en cada pedido.'
            }
        },
        featured_video: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Video Destacado (YouTube)',
            description: 'Muestra un video de tus productos o marca en formato horizontal (16:9) o vertical (Shorts 9:16).',
            defaultSettings: {
                badgeText: 'Conoce Más',
                title: 'Mira nuestros productos en acción',
                subtitle: 'Calidad, detalles y acabados reales antes de hacer tu pedido.',
                videoUrl: '',
                videoId: '',
                aspectRatio: '16:9',
                coverImageUrl: '',
                buttonText: '',
                buttonUrl: '/catalog'
            }
        },
        stats_counter: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Estadísticas y Cifras Destacadas',
            description: 'Presenta entre 2 y 4 indicadores clave de respaldo (clientes, envíos, experiencia o cobertura).',
            defaultSettings: {
                title: 'Nuestra Trayectoria en Cifras',
                subtitle: 'Resultados que respaldan cada pedido en nuestra tienda',
                statStyle: 'cards',
                item1Icon: 'star',
                item1Value: '+1.500',
                item1Label: 'Clientes satisfechos',
                item2Icon: 'truck',
                item2Value: '100%',
                item2Label: 'Envíos seguros en el país',
                item3Icon: 'clock',
                item3Value: '24h - 72h',
                item3Label: 'Despacho ágil y garantizado',
                item4Icon: 'shield',
                item4Value: '',
                item4Label: ''
            }
        },
        gallery_lookbook: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Galería / Lookbook Visual',
            description: 'Colección de fotos en cuadrícula con enlaces opcionales a colecciones, categorías o productos.',
            defaultSettings: {
                title: 'Inspiración y Estilo',
                subtitle: 'Explora nuestra galería visual y conoce cada detalle de la colección',
                columns: '3',
                imageAspect: 'portrait',
                item1ImageUrl: '',
                item1Caption: '',
                item1LinkUrl: '',
                item2ImageUrl: '',
                item2Caption: '',
                item2LinkUrl: '',
                item3ImageUrl: '',
                item3Caption: '',
                item3LinkUrl: '',
                item4ImageUrl: '',
                item4Caption: '',
                item4LinkUrl: '',
                item5ImageUrl: '',
                item5Caption: '',
                item5LinkUrl: '',
                item6ImageUrl: '',
                item6Caption: '',
                item6LinkUrl: ''
            }
        },
        brand_carousel: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Carrusel / Vitrina de Marcas',
            description: 'Muestra los logotipos o nombres de las marcas que comercializa tu tienda en cuadrícula o carrusel.',
            defaultSettings: {
                title: 'Marcas que Comercializamos',
                source: 'MANUAL',
                subtitle: 'Productos originales con respaldo y garantía',
                displayMode: 'grid',
                logoSize: 'md',
                grayscale: false,
                item1Name: '',
                item1ImageUrl: '',
                item1LinkUrl: '',
                item2Name: '',
                item2ImageUrl: '',
                item2LinkUrl: '',
                item3Name: '',
                item3ImageUrl: '',
                item3LinkUrl: '',
                item4Name: '',
                item4ImageUrl: '',
                item4LinkUrl: '',
                item5Name: '',
                item5ImageUrl: '',
                item5LinkUrl: '',
                item6Name: '',
                item6ImageUrl: '',
                item6LinkUrl: ''
            }
        },
        social_showcase: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Síguenos en Redes Sociales',
            description: 'Conecta tus perfiles de Instagram, TikTok, Facebook y WhatsApp con una galería opcional de publicaciones.',
            defaultSettings: {
                handleText: '',
                title: 'Síguenos en Redes Sociales',
                subtitle: 'Conoce nuestros últimos lanzamientos, contenido exclusivo y promociones.',
                instagramUrl: '',
                tiktokUrl: '',
                facebookUrl: '',
                showWhatsapp: true,
                post1ImageUrl: '',
                post1Caption: '',
                post1LinkUrl: '',
                post2ImageUrl: '',
                post2Caption: '',
                post2LinkUrl: '',
                post3ImageUrl: '',
                post3Caption: '',
                post3LinkUrl: '',
                post4ImageUrl: '',
                post4Caption: '',
                post4LinkUrl: ''
            }
        },
        visit_us: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Visítanos (Tienda Física)',
            description: 'Presenta la dirección, ciudad, horarios de atención, foto y cómo llegar a tu punto físico.',
            defaultSettings: {
                badgeText: 'Punto Físico',
                title: 'Visítanos en Nuestra Tienda',
                subtitle: 'Conoce nuestros productos personalmente y recibe asesoría directa.',
                city: '',
                address: '',
                reference: '',
                hoursText: 'Lunes a Sábado: 9:00 am – 7:00 pm',
                phone: '',
                imageUrl: '',
                imageSide: 'right',
                mapUrl: '',
                mapButtonText: 'Cómo llegar en Google Maps',
                showWhatsappBtn: true
            }
        },
        payment_methods: {
            layoutSupport: { bg: true, spacing: true, width: true, anchor: true },
            label: 'Medios de Pago Aceptados',
            description: 'Muestra automáticamente los medios de pago realmente habilitados en tu tienda (Wompi y/o WhatsApp).',
            defaultSettings: {
                title: 'Medios de Pago Aceptados',
                subtitle: 'Compra con total tranquilidad a través de nuestros canales habilitados',
                paymentStyle: 'cards',
                showSecurityNote: true
            }
        },
        catalog_results: {
            layoutSupport: { bg: false, spacing: false, width: false, anchor: false },
            label: 'Catálogo de Productos',
            description: 'Grilla principal del catálogo con buscador, ordenamiento y píldoras de categorías.',
            anchorOnly: true,
            defaultSettings: {
                showHeader: true,
                headerBadge: 'Colección',
                headerTitle: 'Todo el Catálogo',
                headerSubtitle: 'Explora todos nuestros productos disponibles.',
                showCategoryPills: true,
                showSearchAndSort: true,
                columnsDesktop: '4',
                showDiscountPercent: true
            }
        },
        product_main: {
            layoutSupport: { bg: false, spacing: false, width: false, anchor: false },
            label: 'Ficha Principal del Producto',
            description: 'Galería de fotos, selector de variantes, botones de compra y especificaciones.',
            anchorOnly: true,
            defaultSettings: {
                galleryLayout: 'bottom',
                showBreadcrumbs: true,
                showSku: true,
                showStockCounter: true,
                showSpecs: true,
                showPolicies: true,
                showRelatedProducts: true,
                relatedTitle: 'También te puede interesar',
                relatedSubtitle: 'Otros productos de nuestro catálogo'
            }
        }
    },
    getLayoutSupport: function(type) {
        const def = this.catalogDefinitions[type];
        const declared = (def && def.layoutSupport) || {};
        const isLockedAnchor = type === 'catalog_results' || type === 'product_main';
        const isProductMain = type === 'product_main';
        return {
            bg: !isProductMain,
            spacing: !isProductMain,
            width: declared.width === true,
            anchor: !isLockedAnchor && declared.anchor !== false,
            visibility: !isLockedAnchor,
            schedule: !isLockedAnchor
        };
    },

    extractYoutubeId: function(rawUrl) {
        const clean = String(rawUrl || '').trim();
        if (!clean) return '';
        if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
        const m = clean.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return (m && m[1]) ? m[1] : '';
    },

    computeLayoutTone: function(hexColor) {
        const clean = String(hexColor || '').trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(clean)) return 'light';
        const r = parseInt(clean.substring(1, 3), 16) / 255;
        const g = parseInt(clean.substring(3, 5), 16) / 255;
        const b = parseInt(clean.substring(5, 7), 16) / 255;
        const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        const luminance = (0.2126 * toLinear(r)) + (0.7152 * toLinear(g)) + (0.0722 * toLinear(b));
        return luminance < 0.179 ? 'dark' : 'light';
    },

    RESERVED_ANCHOR_IDS: [
        'storenavbar', 'storevomaincontent', 'storevo-page-scripts',
        'storevo-catalog-products-bridge', 'storevo-navbar-advanced-bridge',
        'navwishlistcounter', 'navcartcounter', 'mobile-menu', 'mobile-menu-backdrop',
        'whatsapp-modal', 'wa-modal-product-name', 'wa-modal-variant-info',
        'wa-customer-name', 'wa-customer-phone', 'wa-customer-city',
        'wa-customer-address', 'wa-customer-notes', 'catalog-search-input',
        'catalog-sort-select', 'catalog-products-grid', 'catalog-empty-state',
        'catalog-filter-bridge', 'sv-catalog-workspace', 'sv-catalog-sidebar-facets',
        'sv-catalog-topbar-panel', 'sv-catalog-topbar-facets', 'sv-catalog-active-chips',
        'sv-catalog-results-count', 'sv-filter-drawer-backdrop', 'sv-filter-drawer-facets',
        'main-product-image', 'sv-detail-img-counter', 'dynamic-price', 'dynamic-old-price',
        'dynamic-discount-badge', 'dynamic-stock', 'dynamic-sku',
        'variant-selectors-container', 'selected-variant-id', 'quantity-input',
        'btn-add-to-cart', 'btn-buy-whatsapp', 'sv-detail-related-grid',
        'adm-sidebar-tooltip', 'dashboard-sidebar', 'admin-theme-toggle',
        'admin-theme-label', 'sidebar-collapse-btn', 'topbar-sidebar-toggle',
        'home', 'catalog', 'product', 'product-preview', 'cart', 'checkout', 'wishlist', 'order', 'top'
    ],

    normalizeAnchorSlug: function(raw) {
        return String(raw || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-+/, '')
            .substring(0, 40);
    },

    validateLayoutAnchor: function(slugVal, currentSectionId) {
        const clean = String(slugVal || '').trim();
        if (!clean) {
            return { valid: true, message: '' };
        }
        if (!/^[a-z]/.test(clean)) {
            return { valid: false, message: 'El ID de ancla debe comenzar con una letra (a-z).' };
        }
        if (clean.endsWith('-')) {
            return { valid: false, message: 'El ID de ancla no puede terminar en guion (-).' };
        }
        if (!/^[a-z][a-z0-9-]{0,39}$/.test(clean)) {
            return { valid: false, message: 'Usa solo letras minúsculas, números y guiones (máx. 40 caracteres).' };
        }
        if (this.RESERVED_ANCHOR_IDS.includes(clean)) {
            return { valid: false, message: 'Este ID está reservado por el sistema. Elige otro nombre.' };
        }
        const activeSections = this.getActivePageSections(false) || [];
        const duplicate = activeSections.some(s =>
            s && s.id !== currentSectionId && s.settings && String(s.settings.layoutAnchor || '').trim() === clean
        );
        if (duplicate) {
            return { valid: false, message: 'Este ID de ancla ya está en uso en otra sección de esta página.' };
        }
        return { valid: true, message: '' };
    },

    ensurePagesStructure: function() {
        if (!this.theme.globalStyles) this.theme.globalStyles = {};
        if (!Array.isArray(this.theme.sections)) this.theme.sections = [];
        if (!this.theme.pages || typeof this.theme.pages !== 'object') {
            this.theme.pages = {};
        }
        if (!Array.isArray(this.theme.customPages)) {
            this.theme.customPages = [];
        }
        if (!Array.isArray(this.theme.pages.home)) {
            this.theme.pages.home = this.theme.sections.slice();
        }
        if (!Array.isArray(this.theme.pages.catalog) || this.theme.pages.catalog.length === 0) {
            this.theme.pages.catalog = [{
                id: 'sec_catalog_results',
                type: 'catalog_results',
                enabled: true,
                locked: true,
                settings: JSON.parse(JSON.stringify(this.catalogDefinitions.catalog_results.defaultSettings))
            }];
        }
        if (!Array.isArray(this.theme.pages.product) || this.theme.pages.product.length === 0) {
            this.theme.pages.product = [{
                id: 'sec_product_main',
                type: 'product_main',
                enabled: true,
                locked: true,
                settings: JSON.parse(JSON.stringify(this.catalogDefinitions.product_main.defaultSettings))
            }];
        }
        // Migrar ajustes visuales previos de product_main / catalog_results hacia globalStyles si aún no están definidos
        const gs = this.theme.globalStyles;
        const prodSec = this.theme.pages.product.find(s => s && s.type === 'product_main');
        if (prodSec && prodSec.settings) {
            if (gs.detailGalleryLayout === undefined && prodSec.settings.galleryLayout) gs.detailGalleryLayout = prodSec.settings.galleryLayout;
            if (gs.detailShowBreadcrumbs === undefined && prodSec.settings.showBreadcrumbs !== undefined) gs.detailShowBreadcrumbs = Boolean(prodSec.settings.showBreadcrumbs);
            if (gs.detailShowSku === undefined && prodSec.settings.showSku !== undefined) gs.detailShowSku = Boolean(prodSec.settings.showSku);
            if (gs.detailShowStock === undefined && prodSec.settings.showStockCounter !== undefined) gs.detailShowStock = Boolean(prodSec.settings.showStockCounter);
            if (gs.detailShowSpecs === undefined && prodSec.settings.showSpecs !== undefined) gs.detailShowSpecs = Boolean(prodSec.settings.showSpecs);
            if (gs.detailShowPolicies === undefined && prodSec.settings.showPolicies !== undefined) gs.detailShowPolicies = Boolean(prodSec.settings.showPolicies);
            if (gs.detailShowRelated === undefined && prodSec.settings.showRelatedProducts !== undefined) gs.detailShowRelated = Boolean(prodSec.settings.showRelatedProducts);
        }
        const catSec = this.theme.pages.catalog.find(s => s && s.type === 'catalog_results');
        if (catSec && catSec.settings && gs.cardDiscountBadge === undefined && catSec.settings.showDiscountPercent === false) {
            gs.cardDiscountBadge = 'label';
        }
        this.theme.sections = this.theme.pages.home;
    },

    findCategoryObj: function(catId) {
        const target = String(catId || '').trim();
        if (!target || !Array.isArray(this.categories)) return null;
        return this.categories.find(c => c && String(c.id) === target) || null;
    },

    isCategoryCustomized: function(catId) {
        this.ensurePagesStructure();
        const key = 'category:' + String(catId || '').trim();
        return Boolean(Array.isArray(this.theme.pages[key]) && this.theme.pages[key].length > 0);
    },

    buildDefaultSectionsForCategory: function(catId) {
        this.ensurePagesStructure();
        const cat = this.findCategoryObj(catId);
        const baseCatalog = Array.isArray(this.theme.pages.catalog) && this.theme.pages.catalog.length > 0
            ? JSON.parse(JSON.stringify(this.theme.pages.catalog))
            : [{
                id: 'sec_catalog_results_' + catId,
                type: 'catalog_results',
                enabled: true,
                locked: true,
                settings: JSON.parse(JSON.stringify(this.catalogDefinitions.catalog_results.defaultSettings))
            }];

        return baseCatalog.map((sec, idx) => {
            const copy = JSON.parse(JSON.stringify(sec));
            if (copy.type === 'catalog_results') {
                copy.id = 'sec_catalog_results_' + catId;
                copy.locked = true;
                copy.enabled = true;
                copy.settings = copy.settings || {};
                if (cat) {
                    const displayTitle = cat.rawName || cat.name || 'Todo el Catálogo';
                    if (!copy.settings.headerTitle || copy.settings.headerTitle === 'Todo el Catálogo') {
                        copy.settings.headerTitle = displayTitle;
                    }
                    if (cat.description && (!copy.settings.headerSubtitle || copy.settings.headerSubtitle === 'Explora todos nuestros productos disponibles.')) {
                        copy.settings.headerSubtitle = cat.description;
                    }
                }
            } else {
                copy.id = `${copy.id || 'sec'}_cat_${catId}_${idx}`;
            }
            return copy;
        });
    },

    findCustomPageObj: function(slug) {
        this.ensurePagesStructure();
        const clean = String(slug || '').trim().toLowerCase();
        return this.theme.customPages.find(cp => cp && String(cp.slug || '').trim().toLowerCase() === clean) || null;
    },

    getActivePageSections: function(materializeCategory = false) {
        this.ensurePagesStructure();
        if (this.activePage && this.activePage.startsWith('page:')) {
            const pageSlug = this.activePage.substring(5);
            const cp = this.findCustomPageObj(pageSlug);
            if (cp) {
                if (!Array.isArray(cp.sections)) cp.sections = [];
                return cp.sections;
            }
        }
        if (this.activePage && this.activePage.startsWith('category:')) {
            const catId = this.activePage.substring(9);
            const key = 'category:' + catId;
            if (Array.isArray(this.theme.pages[key]) && this.theme.pages[key].length > 0) {
                return this.theme.pages[key];
            }
            const generated = this.buildDefaultSectionsForCategory(catId);
            if (materializeCategory) {
                this.theme.pages[key] = generated;
                this.renderPageSelector();
                this.syncPageContextBars();
                return this.theme.pages[key];
            }
            return generated;
        }
        if (!Array.isArray(this.theme.pages[this.activePage])) {
            this.theme.pages[this.activePage] = [];
        }
        return this.theme.pages[this.activePage];
    },

    setActivePageSections: function(newList) {
        this.ensurePagesStructure();
        if (this.activePage && this.activePage.startsWith('page:')) {
            const pageSlug = this.activePage.substring(5);
            const cp = this.findCustomPageObj(pageSlug);
            if (cp) {
                cp.sections = newList;
                return;
            }
        }
        this.theme.pages[this.activePage] = newList;
        if (this.activePage === 'home') {
            this.theme.sections = newList;
        }
        if (this.activePage && this.activePage.startsWith('category:')) {
            this.renderPageSelector();
            this.syncPageContextBars();
        }
    },

    getPreviewUrlForPage: function(pageKey) {
        if (pageKey && pageKey.startsWith('page:')) {
            const pageSlug = pageKey.substring(5);
            return `/s/${this.slug}/page/${encodeURIComponent(pageSlug)}?preview=draft`;
        }
        if (pageKey && pageKey.startsWith('category:')) {
            const catId = pageKey.substring(9);
            return `/s/${this.slug}/catalog?category=${encodeURIComponent(catId)}&preview=draft`;
        }
        if (pageKey === 'catalog') {
            return `/s/${this.slug}/catalog?preview=draft`;
        }
        if (pageKey === 'product') {
            return `/s/${this.slug}/product-preview?preview=draft`;
        }
        return `/s/${this.slug}?preview=draft`;
    },

    renderPageSelector: function() {
        this.ensurePagesStructure();
        const sel = document.getElementById('editor-page-select');
        if (!sel) return;
        sel.innerHTML = '';

        // 1. Páginas principales de la tienda
        const mainGroup = document.createElement('optgroup');
        mainGroup.label = 'Páginas Principales';
        [
            { value: 'home', label: 'Página de Inicio (Portada)' },
            { value: 'catalog', label: 'Página de Catálogo General' },
            { value: 'product', label: 'Ficha de Producto (Detalle)' }
        ].forEach(item => {
            const o = document.createElement('option');
            o.value = item.value;
            o.textContent = item.label;
            mainGroup.appendChild(o);
        });
        sel.appendChild(mainGroup);

        // 2. Páginas de Categorías existentes (priorizando las enlazadas al Navbar)
        if (Array.isArray(this.categories) && this.categories.length > 0) {
            const navCats = this.categories.filter(c => c && c.showInNav !== false);
            const otherCats = this.categories.filter(c => c && c.showInNav === false);

            if (navCats.length > 0) {
                const navCatGroup = document.createElement('optgroup');
                navCatGroup.label = 'Categorías en tu Menú (Navbar)';
                navCats.forEach(c => {
                    const o = document.createElement('option');
                    o.value = 'category:' + c.id;
                    const customTag = this.isCategoryCustomized(c.id) ? ' · Personalizada' : '';
                    o.textContent = c.name + customTag;
                    navCatGroup.appendChild(o);
                });
                sel.appendChild(navCatGroup);
            }

            if (otherCats.length > 0) {
                const otherCatGroup = document.createElement('optgroup');
                otherCatGroup.label = 'Otras Categorías de la Tienda';
                otherCats.forEach(c => {
                    const o = document.createElement('option');
                    o.value = 'category:' + c.id;
                    const customTag = this.isCategoryCustomized(c.id) ? ' · Personalizada' : '';
                    o.textContent = c.name + customTag;
                    otherCatGroup.appendChild(o);
                });
                sel.appendChild(otherCatGroup);
            }
        }

        // 3. Páginas Personalizadas creadas por el comerciante
        if (this.theme.customPages && this.theme.customPages.length > 0) {
            const customGroup = document.createElement('optgroup');
            customGroup.label = 'Páginas Personalizadas';
            this.theme.customPages.forEach(cp => {
                if (!cp || !cp.slug) return;
                const o = document.createElement('option');
                o.value = 'page:' + cp.slug;
                o.textContent = (cp.title || cp.slug) + (cp.showInNavbar !== false ? ' (En menú)' : '');
                customGroup.appendChild(o);
            });
            sel.appendChild(customGroup);
        }

        sel.value = this.activePage;
    },

    syncPageContextBars: function() {
        this.syncCustomPageSettingsBar();
        this.syncCategoryPageSettingsBar();
    },

    syncCategoryPageSettingsBar: function() {
        const bar = document.getElementById('category-page-settings-bar');
        if (!bar) return;

        if (!this.activePage || !this.activePage.startsWith('category:')) {
            bar.classList.add('hidden');
            return;
        }

        const catId = this.activePage.substring(9);
        const cat = this.findCategoryObj(catId);
        if (!cat) {
            bar.classList.add('hidden');
            return;
        }

        bar.classList.remove('hidden');
        const isCustom = this.isCategoryCustomized(catId);

        const titleEl = document.getElementById('category-page-title-label');
        const hintEl = document.getElementById('category-page-status-hint');
        const badgeEl = document.getElementById('category-page-status-badge');
        const urlEl = document.getElementById('category-page-url-preview');
        const resetBtn = document.getElementById('category-page-reset-btn');

        if (titleEl) {
            titleEl.textContent = `Categoría: ${cat.rawName || cat.name}`;
        }
        if (hintEl) {
            hintEl.textContent = cat.showInNav !== false
                ? 'Enlazada al menú Navbar • Se conserva automáticamente'
                : 'Categoría activa de tu catálogo';
        }
        if (badgeEl) {
            if (isCustom) {
                badgeEl.textContent = 'Diseño propio';
                badgeEl.className = 'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-storevo-500/15 text-storevo-300 border border-storevo-500/30 flex-shrink-0';
            } else {
                badgeEl.textContent = 'Diseño general';
                badgeEl.className = 'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0';
            }
        }
        if (urlEl) {
            urlEl.textContent = `/catalog?category=${cat.id}`;
        }
        if (resetBtn) {
            resetBtn.classList.toggle('hidden', !isCustom);
        }
    },

    resetActiveCategoryPage: function() {
        if (!this.activePage || !this.activePage.startsWith('category:')) return;
        const catId = this.activePage.substring(9);
        const cat = this.findCategoryObj(catId);
        const key = 'category:' + catId;
        if (!this.isCategoryCustomized(catId)) return;

        const doReset = () => {
            delete this.theme.pages[key];
            this.closeInspector();
            this.renderPageSelector();
            this.syncPageContextBars();
            this.renderSectionsList();
            this.markUnpublishedChanges(true);
            this.saveDraft(false, true);
            if (Storevo.UI && Storevo.UI.Toast) {
                Storevo.UI.Toast.show(
                    `La categoría "${cat ? (cat.rawName || cat.name) : catId}" volvió al diseño general de catálogo`,
                    'success'
                );
            }
        };

        if (confirm(`¿Restablecer la categoría "${cat ? (cat.rawName || cat.name) : catId}" para que use nuevamente el diseño general del catálogo?`)) {
            doReset();
        }
    },

    syncCustomPageSettingsBar: function() {
        const bar = document.getElementById('custom-page-settings-bar');
        if (!bar) return;

        if (!this.activePage || !this.activePage.startsWith('page:')) {
            bar.classList.add('hidden');
            return;
        }

        const pageSlug = this.activePage.substring(5);
        const cp = this.findCustomPageObj(pageSlug);
        if (!cp) {
            bar.classList.add('hidden');
            return;
        }

        bar.classList.remove('hidden');
        const titleInput = document.getElementById('custom-page-title-input');
        const navChk = document.getElementById('custom-page-navbar-chk');
        const slugPreview = document.getElementById('custom-page-slug-preview');

        if (titleInput) {
            titleInput.value = cp.title || '';
            titleInput.oninput = () => {
                cp.title = titleInput.value;
                this.renderPageSelector();
                const badge = document.getElementById('editor-active-page-badge');
                if (badge) badge.textContent = cp.title || 'Página';
                // Actualizar el título de la página en el Navbar del iframe en tiempo real (0ms)
                this.pushLiveCustomPageToIframe(cp);
                this.scheduleAutoSave(true);
            };
        }
        if (navChk) {
            navChk.checked = cp.showInNavbar !== false;
            navChk.onchange = () => {
                cp.showInNavbar = navChk.checked;
                this.renderPageSelector();
                this.pushLiveCustomPageToIframe(cp);
                this.scheduleAutoSave(true);
            };
        }
        if (slugPreview) {
            slugPreview.textContent = `/page/${cp.slug}`;
        }
    },
    pushLiveCustomPageToIframe: function(cp) {
        const iframe = document.getElementById('storefront-preview-iframe');
        if (!iframe || !iframe.contentWindow || !cp) return;
        try {
            iframe.contentWindow.postMessage({
                type: 'storevo:live-custom-page',
                page: {
                    slug: cp.slug,
                    title: cp.title,
                    showInNavbar: cp.showInNavbar !== false
                }
            }, window.location.origin);
        } catch (e) {}
    },

    slugifyPageTitle: function(raw) {
        return String(raw || '')
            .trim()
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 45);
    },

    findExistingPageMatch: function(rawTitle, rawSlug) {
        this.ensurePagesStructure();
        const candidateSlug = this.slugifyPageTitle(rawSlug || rawTitle);
        const cleanTitle = String(rawTitle || '').trim().toLowerCase();
        if (!candidateSlug && !cleanTitle) return null;

        // 1. Verificar si coincide con una página principal
        if (candidateSlug === 'inicio' || candidateSlug === 'home' || candidateSlug === 'portada') {
            return {
                pageKey: 'home',
                message: 'La página de Inicio ya existe en tu tienda. Puedes editarla directamente sin crear otra.'
            };
        }
        if (candidateSlug === 'catalogo' || candidateSlug === 'catalog') {
            return {
                pageKey: 'catalog',
                message: 'La página de Catálogo General ya existe. Selecciónala para personalizarla.'
            };
        }

        // 2. Verificar si coincide con una Categoría existente del comerciante
        if (Array.isArray(this.categories)) {
            const matchedCat = this.categories.find(c => {
                if (!c) return false;
                const rawName = String(c.rawName || c.name || '').trim().toLowerCase();
                const fullName = String(c.name || '').trim().toLowerCase();
                const catSlug = this.slugifyPageTitle(rawName);
                return (cleanTitle && (rawName === cleanTitle || fullName === cleanTitle))
                    || (candidateSlug && catSlug === candidateSlug);
            });
            if (matchedCat) {
                return {
                    pageKey: 'category:' + matchedCat.id,
                    message: `Ya tienes la categoría «${matchedCat.rawName || matchedCat.name}» en tu tienda. No necesitas crear otra página para personalizar su diseño.`
                };
            }
        }

        // 3. Verificar si coincide con una Página Personalizada ya creada
        if (Array.isArray(this.theme.customPages)) {
            const matchedCp = this.theme.customPages.find(cp => {
                if (!cp) return false;
                const cpSlug = String(cp.slug || '').trim().toLowerCase();
                const cpTitle = String(cp.title || '').trim().toLowerCase();
                return (candidateSlug && cpSlug === candidateSlug)
                    || (cleanTitle && cpTitle === cleanTitle);
            });
            if (matchedCp) {
                return {
                    pageKey: 'page:' + matchedCp.slug,
                    message: `Ya existe la página personalizada «${matchedCp.title}» (/page/${matchedCp.slug}). Puedes abrirla y editarla directamente.`
                };
            }
        }

        return null;
    },

    checkNewPageCollision: function() {
        const titleInput = document.getElementById('new-custom-page-title');
        const slugInput = document.getElementById('new-custom-page-slug');
        const box = document.getElementById('new-custom-page-collision-box');
        const textEl = document.getElementById('new-custom-page-collision-text');
        const btn = document.getElementById('btn-edit-existing-page');
        if (!box || !textEl || !btn) return null;

        const match = this.findExistingPageMatch(
            titleInput ? titleInput.value : '',
            slugInput ? slugInput.value : ''
        );

        if (!match) {
            box.classList.add('hidden');
            return null;
        }

        textEl.textContent = match.message;
        btn.onclick = () => {
            this.closeCreatePageModal();
            this.switchPage(match.pageKey, true);
        };
        box.classList.remove('hidden');
        return match;
    },

    openCreatePageModal: function() {
        const modal = document.getElementById('create-custom-page-modal');
        const titleInput = document.getElementById('new-custom-page-title');
        const slugInput = document.getElementById('new-custom-page-slug');
        const navChk = document.getElementById('new-custom-page-navbar');
        const collisionBox = document.getElementById('new-custom-page-collision-box');
        if (titleInput) titleInput.value = '';
        if (slugInput) slugInput.value = '';
        if (navChk) navChk.checked = true;
        if (collisionBox) collisionBox.classList.add('hidden');
        if (modal) modal.classList.remove('hidden');
        if (titleInput) setTimeout(() => titleInput.focus(), 50);
    },

    closeCreatePageModal: function() {
        const modal = document.getElementById('create-custom-page-modal');
        if (modal) modal.classList.add('hidden');
    },

    updateNewPageSlugPreview: function(titleVal) {
        const slugInput = document.getElementById('new-custom-page-slug');
        if (slugInput) {
            slugInput.value = this.slugifyPageTitle(titleVal);
        }
        this.checkNewPageCollision();
    },

    buildStarterSectionsForCustomPage: function(templateType, pageTitle) {
        const uid = () => 'sec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5);
        if (templateType === 'promo') {
            return [
                {
                    id: uid(), type: 'countdown_promo', enabled: true, locked: false,
                    settings: JSON.parse(JSON.stringify(this.catalogDefinitions.countdown_promo.defaultSettings))
                },
                {
                    id: uid(), type: 'product_grid', enabled: true, locked: false,
                    settings: {
                        title: pageTitle || 'Ofertas Especiales',
                        subtitle: 'Filtra por talla, color, precio o disponibilidad',
                        source: 'NEWEST',
                        categoryId: '',
                        limit: 12,
                        showFilters: true,
                        showViewAll: false
                    }
                }
            ];
        }
        if (templateType === 'faq') {
            return [
                {
                    id: uid(), type: 'faq_accordion', enabled: true, locked: false,
                    settings: JSON.parse(JSON.stringify(this.catalogDefinitions.faq_accordion.defaultSettings))
                },
                {
                    id: uid(), type: 'how_to_buy', enabled: true, locked: false,
                    settings: JSON.parse(JSON.stringify(this.catalogDefinitions.how_to_buy.defaultSettings))
                },
                {
                    id: uid(), type: 'whatsapp_cta', enabled: true, locked: false,
                    settings: JSON.parse(JSON.stringify(this.catalogDefinitions.whatsapp_cta.defaultSettings))
                }
            ];
        }
        if (templateType === 'blank') {
            return [
                {
                    id: uid(), type: 'rich_text', enabled: true, locked: false,
                    settings: {
                        title: pageTitle || 'Nueva Página',
                        content: 'Personaliza este texto o agrega nuevas secciones desde el panel izquierdo.'
                    }
                }
            ];
        }
        // Por defecto: 'about'
        return [
            {
                id: uid(), type: 'rich_text', enabled: true, locked: false,
                settings: {
                    title: pageTitle || 'Sobre Nosotros',
                    content: `En ${this.storeName} seleccionamos cada producto cuidando la calidad, el diseño y la atención personalizada para entregarte la mejor experiencia.`
                }
            },
            {
                id: uid(), type: 'trust_badges', enabled: true, locked: false,
                settings: JSON.parse(JSON.stringify(this.catalogDefinitions.trust_badges.defaultSettings))
            },
            {
                id: uid(), type: 'whatsapp_cta', enabled: true, locked: false,
                settings: JSON.parse(JSON.stringify(this.catalogDefinitions.whatsapp_cta.defaultSettings))
            }
        ];
    },

    createCustomPage: function() {
        this.ensurePagesStructure();
        const titleInput = document.getElementById('new-custom-page-title');
        const slugInput = document.getElementById('new-custom-page-slug');
        const tplSelect = document.getElementById('new-custom-page-template');
        const navChk = document.getElementById('new-custom-page-navbar');

        const title = titleInput ? titleInput.value.trim() : '';
        if (!title) {
            if (Storevo.UI && Storevo.UI.Toast) {
                Storevo.UI.Toast.show('Escribe un nombre para la página', 'warning');
            }
            return;
        }

        let baseSlug = this.slugifyPageTitle(slugInput && slugInput.value ? slugInput.value : title);
        const reserved = ['home', 'catalog', 'product', 'product-preview', 'cart', 'checkout', 'wishlist', 'order', 'p', 'page'];
        if (!baseSlug || reserved.includes(baseSlug)) {
            baseSlug = 'pagina-' + (this.theme.customPages.length + 1);
        }

        // Si ya existe una página personalizada con el mismo slug, abrirla directamente en lugar de duplicarla
        const existingCustom = this.findCustomPageObj(baseSlug);
        if (existingCustom) {
            this.closeCreatePageModal();
            this.switchPage('page:' + existingCustom.slug, true);
            if (Storevo.UI && Storevo.UI.Toast) {
                Storevo.UI.Toast.show(`Abriendo la página existente "${existingCustom.title}"`, 'info');
            }
            return;
        }

        const tplType = tplSelect ? tplSelect.value : 'about';
        const newPage = {
            slug: baseSlug,
            title: title,
            showInNavbar: navChk ? Boolean(navChk.checked) : true,
            sections: this.buildStarterSectionsForCustomPage(tplType, title)
        };

        this.theme.customPages.push(newPage);
        this.closeCreatePageModal();
        this.activePage = 'page:' + baseSlug;
        this.previewUrl = this.getPreviewUrlForPage(this.activePage);
        this.renderPageSelector();
        this.syncPageContextBars();
        this.renderSectionsList();
        this.markUnpublishedChanges(true);
        this.saveDraft(false, true);

        if (Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show(`Página "${title}" creada`, 'success');
        }
    },

    deleteActiveCustomPage: function() {
        if (!this.activePage || !this.activePage.startsWith('page:')) return;
        const pageSlug = this.activePage.substring(5);
        const cp = this.findCustomPageObj(pageSlug);
        if (!cp) return;

        const doDelete = () => {
            this.theme.customPages = this.theme.customPages.filter(p => p && p.slug !== cp.slug);
            this.switchPage('home', false);
            this.renderPageSelector();
            this.markUnpublishedChanges(true);
            this.saveDraft(false, true);
            if (Storevo.UI && Storevo.UI.Toast) {
                Storevo.UI.Toast.show(`Página "${cp.title}" eliminada`, 'success');
            }
        };

        if (confirm(`¿Eliminar la página personalizada "${cp.title}"?`)) {
            doDelete();
        }
    },

    switchPage: function(pageKey, reloadIframe = true) {
        this.ensurePagesStructure();
        let target = 'home';
        if (pageKey === 'catalog' || pageKey === 'product' || pageKey === 'home') {
            target = pageKey;
        } else if (pageKey && pageKey.startsWith('page:')) {
            const slug = pageKey.substring(5);
            const cp = this.findCustomPageObj(slug);
            if (cp) {
                target = 'page:' + cp.slug;
            }
        } else if (pageKey && pageKey.startsWith('category:')) {
            const catId = pageKey.substring(9);
            if (this.findCategoryObj(catId)) {
                target = 'category:' + catId;
            } else {
                target = 'catalog';
            }
        }

        this.activePage = target;
        this.activeSectionId = null;
        this.previewUrl = this.getPreviewUrlForPage(target);

        this.renderPageSelector();
        this.syncPageContextBars();

        const badge = document.getElementById('editor-active-page-badge');
        if (badge) {
            if (target.startsWith('page:')) {
                const cp = this.findCustomPageObj(target.substring(5));
                badge.textContent = cp ? cp.title : 'Página';
            } else if (target.startsWith('category:')) {
                const cat = this.findCategoryObj(target.substring(9));
                badge.textContent = cat ? (cat.rawName || cat.name) : 'Categoría';
            } else {
                const labels = { home: 'Inicio', catalog: 'Catálogo', product: 'Producto' };
                badge.textContent = labels[target] || 'Inicio';
            }
        }

        const panelInspector = document.getElementById('panel-section-inspector');
        const panelList = document.getElementById('panel-sections-list');
        if (panelInspector && !panelInspector.classList.contains('hidden')) {
            panelInspector.classList.add('hidden');
            if (panelList) panelList.classList.remove('hidden');
        }

        this.renderSectionsList();
        if (reloadIframe) {
            // Si no hay un autoguardado pendiente y el iframe ya tiene Storevo.Router activo, navegar en modo SPA sin recargar el iframe
            const iframe = document.getElementById('storefront-preview-iframe');
            if (!this.autoSaveTimer && iframe && iframe.contentWindow && iframe.contentWindow.Storevo && iframe.contentWindow.Storevo.Router) {
                try {
                    iframe.contentWindow.Storevo.Router.navigate(this.previewUrl);
                    return;
                } catch (e) {}
            }
            this.reloadPreviewIframe();
        }
    },

    init: function() {
        const bridge = document.getElementById('theme-editor-bridge');
        if (!bridge) return;

        this.slug = bridge.getAttribute('data-slug') || '';
        this.storeName = bridge.getAttribute('data-store-name') || 'Nuestra Tienda';
        this.previewUrl = bridge.getAttribute('data-preview-url') || `/s/${this.slug}?preview=draft`;

        try {
            this.theme = JSON.parse(bridge.getAttribute('data-theme') || '{}');
        } catch (e) {
            this.theme = { globalStyles: {}, sections: [], pages: {}, customPages: [] };
        }

        try {
            this.categories = JSON.parse(bridge.getAttribute('data-categories') || '[]');
        } catch (e) {
            this.categories = [];
        }

        this.ensurePagesStructure();
        this.renderPageSelector();
        this.syncPageContextBars();
        this.renderSectionsList();
        this.initSortable();
        this.initGlobalStylesInputs();
        this.renderAddSectionModalCatalog();
        this.renderPresetsCatalog();
        this.initIframeBridgeListener();
    },

    syncProductsFromIframe: function() {
        const iframe = document.getElementById('storefront-preview-iframe');
        if (!iframe || !iframe.contentDocument) return;
        try {
            const nodes = iframe.contentDocument.querySelectorAll('#storevo-catalog-products-bridge span[data-id]');
            if (nodes && nodes.length > 0) {
                const list = [];
                nodes.forEach(n => {
                    list.push({
                        id: n.getAttribute('data-id'),
                        name: n.getAttribute('data-name') || 'Producto'
                    });
                });
                this.catalogProducts = list;
            }
        } catch (e) {}
    },

    initIframeBridgeListener: function() {
        const iframe = document.getElementById('storefront-preview-iframe');
        if (iframe) {
            iframe.addEventListener('load', () => this.syncProductsFromIframe());
        }

        window.addEventListener('message', (e) => {
            if (e.origin !== window.location.origin || !e.data) return;
            if (e.data.type === 'storevo:page-loaded' && e.data.pageKey) {
                const overlay = document.getElementById('preview-loading-overlay');
                if (overlay) overlay.classList.add('hidden');

                if (e.data.pageKey !== this.activePage) {
                    this.switchPage(e.data.pageKey, false);
                }
                if (e.data.url && e.data.url.startsWith(`/s/${this.slug}`)) {
                    this.previewUrl = e.data.url;
                }
                if (typeof this.syncProductsFromIframe === 'function') {
                    this.syncProductsFromIframe();
                }
                if (typeof this.pushLiveStylesToIframe === 'function') {
                    this.pushLiveStylesToIframe();
                }
                if (this.activeSectionId) {
                    this.highlightSectionInIframe(this.activeSectionId);
                }
            }
            if (e.data.type === 'storevo:select-section' && e.data.sectionId) {
                if (e.data.pageKey && e.data.pageKey !== this.activePage) {
                    this.switchPage(e.data.pageKey, false);
                }
                if (e.data.url && e.data.url.startsWith(`/s/${this.slug}`)) {
                    this.previewUrl = e.data.url;
                }
                this.syncProductsFromIframe();
                this.setMobilePane('editor');
                this.openInspector(e.data.sectionId, e.data.sectionType, e.data.sectionIndex);
            }
        });
    },

    pushLiveStylesToIframe: function() {
        const iframe = document.getElementById('storefront-preview-iframe');
        if (!iframe || !iframe.contentWindow) return;
        try {
            iframe.contentWindow.postMessage({
                type: 'storevo:live-styles',
                styles: this.theme.globalStyles
            }, window.location.origin);
        } catch (e) {}
    },

    setMobilePane: function(pane) {
        const workspace = document.getElementById('theme-editor-workspace');
        const btnEditor = document.getElementById('btn-pane-editor');
        const btnPreview = document.getElementById('btn-pane-preview');

        if (workspace) workspace.setAttribute('data-mobile-pane', pane);

        if (btnEditor && btnPreview) {
            const activeClass = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-slate-800 text-white shadow-sm';
            const inactiveClass = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
            btnEditor.className = pane === 'editor' ? activeClass : inactiveClass;
            btnPreview.className = pane === 'preview' ? activeClass : inactiveClass;
        }
    },

    markUnpublishedChanges: function(hasChanges) {
        this.hasUnpublishedChanges = hasChanges;
        const badge = document.getElementById('unpublished-badge');
        if (badge) {
            badge.classList.toggle('hidden', !hasChanges);
        }
    },

    switchTab: function(tab) {
        const tabs = ['sections', 'styles', 'presets'];
        const activeClass = 'flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all bg-slate-800 text-white shadow-sm flex items-center justify-center gap-1.5';
        const inactiveClass = 'flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center justify-center gap-1.5';

        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            if (btn) btn.className = (t === tab) ? activeClass : inactiveClass;
        });

        const panelList = document.getElementById('panel-sections-list');
        const panelInspector = document.getElementById('panel-section-inspector');
        const panelStyles = document.getElementById('panel-global-styles');
        const panelPresets = document.getElementById('panel-theme-presets');

        if (panelList) panelList.classList.add('hidden');
        if (panelInspector) panelInspector.classList.add('hidden');
        if (panelStyles) panelStyles.classList.add('hidden');
        if (panelPresets) panelPresets.classList.add('hidden');

        if (tab === 'sections') {
            if (this.activeSectionId) {
                if (panelInspector) panelInspector.classList.remove('hidden');
            } else {
                if (panelList) panelList.classList.remove('hidden');
            }
        } else if (tab === 'styles') {
            if (panelStyles) panelStyles.classList.remove('hidden');
        } else if (tab === 'presets') {
            if (panelPresets) panelPresets.classList.remove('hidden');
        }
    },

    _isDeviceTransitioning: false,
    _deviceTransitionTimer: null,

    waitForPreviewTransition: function(callback) {
        const frameContainer = document.getElementById('preview-frame-container');
        if (!frameContainer || !this._isDeviceTransitioning) {
            requestAnimationFrame(() => {
                if (typeof callback === 'function') callback();
            });
            return;
        }
        let settled = false;
        const done = () => {
            if (settled) return;
            settled = true;
            frameContainer.removeEventListener('transitionend', onEnd);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (typeof callback === 'function') callback();
                });
            });
        };
        const onEnd = (e) => {
            if (e && e.target === frameContainer && (e.propertyName === 'width' || e.propertyName === 'height')) {
                done();
            }
        };
        frameContainer.addEventListener('transitionend', onEnd);
        setTimeout(done, 360);
    },

    setDevice: function(device) {
        const wrapper = document.getElementById('preview-viewport-wrapper');
        const frameContainer = document.getElementById('preview-frame-container');
        const btnDesktop = document.getElementById('btn-device-desktop');
        const btnMobile = document.getElementById('btn-device-mobile');

        const prevDevice = wrapper ? (wrapper.getAttribute('data-device') || 'desktop') : 'desktop';
        const deviceChanged = prevDevice !== device;

        if (wrapper) wrapper.setAttribute('data-device', device);

        if (btnDesktop && btnMobile) {
            const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-800 text-white shadow-sm';
            const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-400 hover:text-white';
            btnDesktop.className = device === 'desktop' ? activeClass : inactiveClass;
            btnMobile.className = device === 'mobile' ? activeClass : inactiveClass;
        }

        if (!deviceChanged) {
            requestAnimationFrame(() => {
                document.dispatchEvent(new CustomEvent('storevo:device-transition-ended', { detail: { device } }));
            });
            return;
        }

        this._isDeviceTransitioning = true;
        clearTimeout(this._deviceTransitionTimer);

        let finished = false;
        const finishTransition = () => {
            if (finished) return;
            finished = true;
            this._isDeviceTransitioning = false;
            if (frameContainer) {
                frameContainer.removeEventListener('transitionend', onTransEnd);
            }
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    document.dispatchEvent(new CustomEvent('storevo:device-transition-ended', { detail: { device } }));
                });
            });
        };

        const onTransEnd = (e) => {
            if (e && e.target === frameContainer && (e.propertyName === 'width' || e.propertyName === 'height')) {
                finishTransition();
            }
        };

        if (frameContainer) {
            frameContainer.addEventListener('transitionend', onTransEnd);
        }
        this._deviceTransitionTimer = setTimeout(finishTransition, 360);
    },

    moveSectionByStep: function(sectionId, delta) {
        const list = this.getActivePageSections(true);
        const idx = list.findIndex(s => s && s.id === sectionId);
        if (idx === -1) return;
        const targetIdx = idx + delta;
        if (targetIdx < 0 || targetIdx >= list.length) return;
        const temp = list[idx];
        list[idx] = list[targetIdx];
        list[targetIdx] = temp;
        this.setActivePageSections(list);
        this.renderSectionsList();
        this.scheduleAutoSave(true);
    },

    applyDomOrderToSections: function(container) {
        if (!container) return;
        const currentList = this.getActivePageSections(true);
        const orderedIds = Array.from(container.querySelectorAll('[data-sec-id]'))
            .map(el => el.getAttribute('data-sec-id'));

        const reordered = [];
        orderedIds.forEach(id => {
            const found = currentList.find(s => s && s.id === id);
            if (found) reordered.push(found);
        });
        if (reordered.length === currentList.length) {
            this.setActivePageSections(reordered);
            this.renderSectionsList();
            this.scheduleAutoSave(true);
        }
    },

    initSortable: function() {
        const container = document.getElementById('sortable-sections-container');
        if (!container) return;

        if (this._sortableInstance && typeof this._sortableInstance.destroy === 'function') {
            try { this._sortableInstance.destroy(); } catch (e) {}
            this._sortableInstance = null;
        }

        if (typeof Sortable !== 'undefined') {
            this._sortableInstance = Sortable.create(container, {
                handle: '.drag-handle',
                animation: 180,
                forceFallback: true,
                fallbackOnBody: true,
                fallbackTolerance: 4,
                ghostClass: 'sortable-ghost',
                onEnd: () => {
                    this.applyDomOrderToSections(container);
                }
            });
            return;
        }

        // Respaldo nativo HTML5 Drag & Drop si el CDN de Sortable no cargó
        if (container.dataset.nativeDndBound === 'true') return;
        container.dataset.nativeDndBound = 'true';
        let draggedRow = null;

        container.addEventListener('dragstart', (e) => {
            const row = e.target.closest('[data-sec-id]');
            if (!row) return;
            draggedRow = row;
            row.classList.add('sortable-ghost');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', row.getAttribute('data-sec-id') || '');
            }
        });

        container.addEventListener('dragover', (e) => {
            if (!draggedRow) return;
            e.preventDefault();
            const targetRow = e.target.closest('[data-sec-id]');
            if (!targetRow || targetRow === draggedRow) return;
            const rect = targetRow.getBoundingClientRect();
            const isAfter = (e.clientY - rect.top) > (rect.height / 2);
            container.insertBefore(draggedRow, isAfter ? targetRow.nextSibling : targetRow);
        });

        container.addEventListener('dragend', () => {
            if (!draggedRow) return;
            draggedRow.classList.remove('sortable-ghost');
            draggedRow = null;
            this.applyDomOrderToSections(container);
        });
    },

    isSectionLocked: function(sec) {
        return Boolean(sec && (sec.locked === true || sec.type === 'catalog_results' || sec.type === 'product_main'));
    },

    renderSectionsList: function() {
        const container = document.getElementById('sortable-sections-container');
        if (!container) return;
        container.innerHTML = '';
        const currentList = this.getActivePageSections(false);

        if (currentList.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl">
                    <p class="text-xs text-slate-400">No hay secciones en esta página.</p>
                </div>
            `;
            return;
        }

        currentList.forEach(sec => {
            const def = this.catalogDefinitions[sec.type] || { label: sec.type };
            const isLocked = this.isSectionLocked(sec);
            const baseSubtitle = isLocked
                ? 'Sección principal de esta página (Clic para personalizar)'
                : ((sec.settings && (sec.settings.title || sec.settings.customTitle || sec.settings.badgeText || sec.settings.text || sec.settings.card1Title || sec.settings.headerTitle)) || def.label);
            const metaTags = [];
            if (!isLocked && sec.settings) {
                if (sec.settings.layoutVisibility === 'desktop_only') metaTags.push('Solo PC');
                else if (sec.settings.layoutVisibility === 'mobile_only') metaTags.push('Solo móvil');
                if (sec.settings.scheduleStart || sec.settings.scheduleEnd) metaTags.push('Programada');
            }
            const subtitle = metaTags.length > 0 ? `${metaTags.join(' · ')} — ${baseSubtitle}` : baseSubtitle;
            const isEnabled = isLocked ? true : (sec.enabled !== false);

            const secIdx = currentList.indexOf(sec);
            const row = document.createElement('div');
            row.setAttribute('data-sec-id', sec.id);
            row.setAttribute('draggable', 'true');
            row.className = `group flex items-center justify-between gap-2 p-3 rounded-xl border transition-all ${
                isLocked
                    ? 'bg-slate-950 border-storevo-500/40 hover:border-storevo-500'
                    : (isEnabled
                        ? 'bg-slate-950 border-slate-800 hover:border-storevo-500/50'
                        : 'bg-slate-950/50 border-slate-800/50 opacity-50')
            }`;

            const moveArrowsHtml = `
                <div class="flex flex-col gap-0.5 mr-0.5">
                    <button type="button" class="sec-move-up-btn p-0.5 text-slate-500 hover:text-white disabled:opacity-20 transition" ${secIdx === 0 ? 'disabled' : ''} title="Subir sección">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"></path></svg>
                    </button>
                    <button type="button" class="sec-move-down-btn p-0.5 text-slate-500 hover:text-white disabled:opacity-20 transition" ${secIdx === currentList.length - 1 ? 'disabled' : ''} title="Bajar sección">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                </div>
            `;

            const actionsHtml = isLocked
                ? `<div class="flex items-center gap-1 flex-shrink-0">
                    ${moveArrowsHtml}
                    <span class="px-2 py-0.5 rounded-md bg-storevo-500/15 text-storevo-300 border border-storevo-500/30 text-[10px] font-bold" title="Esta sección es obligatoria en esta vista, pero puedes moverla y personalizar sus opciones">Fija</span>
                   </div>`
                : `<div class="flex items-center gap-0.5 flex-shrink-0">
                    ${moveArrowsHtml}
                    <button type="button" class="sec-dup-btn p-1.5 text-slate-500 hover:text-storevo-400 rounded-lg hover:bg-slate-800 transition" title="Duplicar sección">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                    <button type="button" class="sec-toggle-btn p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition" title="${isEnabled ? 'Ocultar sección' : 'Mostrar sección'}">
                        ${isEnabled
                    ? '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>'
                    : '<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>'
                }
                    </button>
                    <button type="button" class="sec-delete-btn p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition" title="Eliminar sección">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>`;

            row.innerHTML = `
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <span class="drag-handle p-1.5 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing flex-shrink-0 select-none" title="Arrastrar para mover">
                        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                    </span>
                    <button type="button" class="sec-edit-trigger text-left min-w-0 flex-1">
                        <p class="text-xs font-bold text-white truncate">${this.escapeHtml(def.label)}</p>
                        <p class="text-[11px] text-slate-500 truncate mt-0.5">${this.escapeHtml(subtitle)}</p>
                    </button>
                </div>
                ${actionsHtml}
            `;

            row.querySelector('.sec-edit-trigger').addEventListener('click', () => this.openInspector(sec.id));
            const upBtn = row.querySelector('.sec-move-up-btn');
            const downBtn = row.querySelector('.sec-move-down-btn');
            if (upBtn) {
                upBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveSectionByStep(sec.id, -1);
                });
            }
            if (downBtn) {
                downBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveSectionByStep(sec.id, 1);
                });
            }
            if (!isLocked) {
                row.querySelector('.sec-dup-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.duplicateSection(sec.id);
                });
                row.querySelector('.sec-toggle-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const mutableList = this.getActivePageSections(true);
                    const targetSec = mutableList.find(item => item.id === sec.id);
                    if (targetSec) {
                        targetSec.enabled = !isEnabled;
                        this.renderSectionsList();
                        this.scheduleAutoSave();
                    }
                });
                row.querySelector('.sec-delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filtered = this.getActivePageSections(true).filter(item => item.id !== sec.id);
                    this.setActivePageSections(filtered);
                    this.renderSectionsList();
                    this.scheduleAutoSave();
                });
            }

            container.appendChild(row);
        });
    },

    duplicateSection: function(sectionId) {
        const list = this.getActivePageSections(true);
        const index = list.findIndex(s => s.id === sectionId);
        if (index === -1) return;

        const original = list[index];
        if (this.isSectionLocked(original)) return;

        const cloned = {
            id: 'sec_' + Date.now().toString(36),
            type: original.type,
            enabled: true,
            locked: false,
            settings: JSON.parse(JSON.stringify(original.settings || {}))
        };
        if (cloned.settings) {
            delete cloned.settings.layoutAnchor;
        }

        list.splice(index + 1, 0, cloned);
        this.renderSectionsList();
        this.openInspector(cloned.id);
        this.scheduleAutoSave();

        if (Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show('Sección duplicada', 'success');
        }
    },

    duplicateActiveSection: function() {
        if (this.activeSectionId) {
            this.duplicateSection(this.activeSectionId);
        }
    },

    getActivePageRelativeBasePath: function() {
        if (this.activePage && this.activePage.startsWith('page:')) {
            return '/page/' + this.activePage.substring(5);
        }
        if (this.activePage && this.activePage.startsWith('category:')) {
            return '/catalog?category=' + this.activePage.substring(9);
        }
        if (this.activePage === 'catalog') {
            return '/catalog';
        }
        return '';
    },

    normalizeInternalUrlForSelect: function(rawUrl) {
        if (rawUrl === undefined || rawUrl === null) return '';
        let clean = String(rawUrl).trim();
        if (!clean) return '';
        const prefix1 = `/s/${this.slug}`;
        const prefix2 = `s/${this.slug}`;
        if (clean.startsWith(prefix1)) {
            clean = clean.substring(prefix1.length) || '/';
        } else if (clean.startsWith(prefix2)) {
            clean = clean.substring(prefix2.length) || '/';
        }
        if (clean === 'catalog') return '/catalog';
        if (clean === 'wishlist') return '/wishlist';
        if (clean === 'cart') return '/cart';
        if (clean.startsWith('/#')) return clean.substring(1);
        return clean;
    },

    ensureCategoryMaterializedOnEdit: function(sectionId) {
        if (!this.activePage || !this.activePage.startsWith('category:')) return null;
        const mutableList = this.getActivePageSections(true);
        return mutableList.find(s => s.id === sectionId) || mutableList.find(s => s.type === 'catalog_results') || null;
    },

    openInspector: function(sectionId, sectionType, sectionIndex) {
        this.syncProductsFromIframe();
        let activeList = this.getActivePageSections(false);
        let sec = activeList.find(s => s.id === sectionId);

        // Si el doble clic viene del iframe sobre una sección heredada en una página de Categoría
        if (!sec && this.activePage && this.activePage.startsWith('category:')) {
            const catId = this.activePage.substring(9);
            if (sectionId === 'sec_catalog_results' || sectionType === 'catalog_results') {
                sec = activeList.find(s => s.type === 'catalog_results');
            }
            if (!sec) {
                sec = activeList.find(s =>
                    s.id === `${sectionId}_cat_${catId}_${sectionIndex}` ||
                    s.id.startsWith(`${sectionId}_cat_${catId}_`)
                );
            }
        }

        // Respaldo por índice y tipo dentro de la página activa actual
        if (!sec && typeof sectionIndex === 'number' && sectionIndex >= 0 && activeList[sectionIndex]) {
            const candidate = activeList[sectionIndex];
            if (!sectionType || candidate.type === sectionType) {
                sec = candidate;
            }
        }

        // Buscar en páginas personalizadas si aún no se encontró
        if (!sec && Array.isArray(this.theme.customPages)) {
            for (const cp of this.theme.customPages) {
                const found = (cp && Array.isArray(cp.sections) ? cp.sections : []).find(s => s.id === sectionId);
                if (found) {
                    this.activePage = 'page:' + cp.slug;
                    this.renderPageSelector();
                    this.syncPageContextBars();
                    this.renderSectionsList();
                    sec = found;
                    break;
                }
            }
        }

        // Buscar en el mapa de páginas del tema como último recurso
        if (!sec && this.theme.pages) {
            for (const [pageKey, list] of Object.entries(this.theme.pages)) {
                const found = (list || []).find(s => s.id === sectionId);
                if (found) {
                    this.activePage = pageKey;
                    this.renderPageSelector();
                    this.syncPageContextBars();
                    this.renderSectionsList();
                    sec = found;
                    break;
                }
            }
        }
        if (!sec) return;
        this.activeSectionId = sec.id;

        const syncConditionalFields = () => {
            const rootContainer = document.getElementById('inspector-fields-container');
            if (!rootContainer) return;
            const currentSettings = (sec && sec.settings) ? sec.settings : {};
            rootContainer.querySelectorAll('[data-field-key]').forEach(el => {
                if (typeof el._showIf === 'function') {
                    el.classList.toggle('hidden', !el._showIf(currentSettings));
                }
            });
        };

        const commitSectionChange = (key, value) => {
            if (this.activePage && this.activePage.startsWith('category:') && !this.isCategoryCustomized(this.activePage.substring(9))) {
                const materializedSec = this.ensureCategoryMaterializedOnEdit(this.activeSectionId);
                if (materializedSec) {
                    sec = materializedSec;
                    this.activeSectionId = sec.id;
                }
            }
            if (!sec.settings) sec.settings = {};
            if (value === undefined || value === null) {
                delete sec.settings[key];
            } else {
                sec.settings[key] = value;
            }
            syncConditionalFields();
            this.scheduleAutoSave();
        };

        const dupBtn = document.getElementById('inspector-duplicate-btn');
        if (dupBtn) {
            dupBtn.classList.toggle('hidden', this.isSectionLocked(sec));
        }

        const def = this.catalogDefinitions[sec.type] || { label: sec.type };
        const titleEl = document.getElementById('inspector-section-title');
        if (titleEl) titleEl.textContent = def.label;

        const container = document.getElementById('inspector-fields-container');
        if (!container) return;
        container.innerHTML = '';

        if (!sec.settings) sec.settings = {};

        const buildInteractiveImageWidget = (field, currentVal) => {
            sec._measuredContainers = sec._measuredContainers || {};
            if (!sec._measuredContainers[field.key]) {
                sec._measuredContainers[field.key] = { pc: null, mobile: null };
            }
            const measuredCache = sec._measuredContainers[field.key];

            const getFallbackSpec = () => {
                const s = sec.settings || {};
                if (field.key === 'layoutBgImageUrl') {
                    if (['announcement_bar', 'trust_badges', 'stats_counter', 'brand_carousel', 'payment_methods'].includes(sec.type)) {
                        return { pc: '16 / 4', mobile: '4 / 3', size: '1920×480 px', minW: 1200, mobileSize: '1080×810 px', mobileMinW: 720, defaultFit: 'cover', isVariableRatio: true, basePcW: 1920 };
                    }
                    if (['countdown_promo', 'whatsapp_cta', 'promo_banner', 'multi_banners', 'hero_banner'].includes(sec.type)) {
                        return { pc: '16 / 6', mobile: '4 / 5', size: '1920×720 px', minW: 1280, mobileSize: '1080×1350 px', mobileMinW: 720, defaultFit: 'cover', isVariableRatio: true, basePcW: 1920 };
                    }
                    return { pc: '16 / 7', mobile: '4 / 5', size: '1920×840 px', minW: 1280, mobileSize: '1080×1350 px', mobileMinW: 720, defaultFit: 'cover', isVariableRatio: true, basePcW: 1920 };
                }
                switch (sec.type) {
                    case 'hero_banner': {
                        if (s.heroLayout === 'split') {
                            return { pc: '4 / 3', mobile: '4 / 3', size: '1200×900 px', minW: 900, mobileSize: '1080×810 px', mobileMinW: 720, defaultFit: 'cover', isVariableRatio: false, basePcW: 1200 };
                        }
                        const hMode = s.heroHeight || 'default';
                        const pcHMap = { sm: 320, md: 460, lg: 560, xl: 680, default: (s.heroLayout === 'compact' ? 300 : 440) };
                        const mobHMap = { sm: 260, md: 360, lg: 440, xl: 520, default: (s.heroLayout === 'compact' ? 240 : 340) };
                        const pcH = pcHMap[hMode] || 440;
                        const mobH = mobHMap[hMode] || 340;
                        const recPcH = Math.round((1920 * pcH) / 1280);
                        const recMobH = Math.round((1080 * mobH) / 365);
                        return {
                            pc: `1280 / ${pcH}`,
                            mobile: `365 / ${mobH}`,
                            size: `1920×${recPcH} px`,
                            minW: 1280,
                            mobileSize: `1080×${recMobH} px`,
                            mobileMinW: 720,
                            defaultFit: 'cover',
                            isVariableRatio: true,
                            basePcW: 1920
                        };
                    }
                    case 'promo_banner':
                        return { pc: '8 / 5', mobile: '4 / 3', size: '1200×750 px', minW: 850, mobileSize: '1080×810 px', mobileMinW: 720, defaultFit: 'cover', isVariableRatio: true, basePcW: 1200 };
                    case 'multi_banners': {
                        const count = String(s.cardCount || '2');
                        const layout = String(s.bannerLayout || 'equal');
                        const idxMatch = field.key.match(/^card(\d+)ImageUrl$/);
                        const cardIdx = idxMatch ? parseInt(idxMatch[1], 10) : 1;
                        let pcRatio = '16 / 8';
                        let pcSize = '1200×600 px';
                        if (count === '2') {
                            if (layout === 'split_left') {
                                pcRatio = cardIdx === 1 ? '16 / 7' : '16 / 10';
                                pcSize = cardIdx === 1 ? '1200×525 px' : '1200×750 px';
                            } else if (layout === 'split_right') {
                                pcRatio = cardIdx === 1 ? '16 / 10' : '16 / 7';
                                pcSize = cardIdx === 1 ? '1200×750 px' : '1200×525 px';
                            }
                        } else if (count === '3') {
                            if (layout === 'mosaic_3' && cardIdx === 1) {
                                pcRatio = '4 / 3';
                                pcSize = '1200×900 px';
                            } else if (layout === 'cols_3') {
                                pcRatio = '3 / 2';
                                pcSize = '1200×800 px';
                            }
                        } else if (count === '4') {
                            if (layout === 'cols_4') {
                                pcRatio = '11 / 10';
                                pcSize = '1100×1000 px';
                            } else {
                                pcRatio = '16 / 7';
                                pcSize = '1200×525 px';
                            }
                        }
                        return { pc: pcRatio, mobile: '4 / 3', size: pcSize, minW: 800, mobileSize: '1080×810 px', mobileMinW: 700, defaultFit: 'cover', isVariableRatio: true, basePcW: 1200 };
                    }
                    case 'rich_text':
                    case 'visit_us':
                        return { pc: '4 / 3', mobile: '4 / 3', size: '1200×900 px', minW: 800, mobileSize: '1080×810 px', mobileMinW: 700, defaultFit: 'cover', isVariableRatio: false, basePcW: 1200 };
                    case 'featured_video':
                        return s.aspectRatio === '9:16'
                            ? { pc: '9 / 16', mobile: '9 / 16', size: '720×1280 px', minW: 700, mobileSize: '720×1280 px', mobileMinW: 600, defaultFit: 'cover', isVariableRatio: false, basePcW: 720 }
                            : { pc: '16 / 9', mobile: '16 / 9', size: '1280×720 px', minW: 1000, mobileSize: '1080×608 px', mobileMinW: 720, defaultFit: 'cover', isVariableRatio: false, basePcW: 1280 };
                    case 'gallery_lookbook': {
                        const a = s.imageAspect;
                        if (a === 'square') return { pc: '1 / 1', mobile: '1 / 1', size: '1080×1080 px', minW: 800, mobileSize: '1080×1080 px', mobileMinW: 700, defaultFit: 'cover', isVariableRatio: false, basePcW: 1080 };
                        if (a === 'landscape') return { pc: '4 / 3', mobile: '4 / 3', size: '1200×900 px', minW: 900, mobileSize: '1080×810 px', mobileMinW: 700, defaultFit: 'cover', isVariableRatio: false, basePcW: 1200 };
                        return { pc: '4 / 5', mobile: '4 / 5', size: '1080×1350 px', minW: 800, mobileSize: '1080×1350 px', mobileMinW: 700, defaultFit: 'cover', isVariableRatio: false, basePcW: 1080 };
                    }
                    case 'social_showcase':
                        return { pc: '1 / 1', mobile: '1 / 1', size: '1080×1080 px', minW: 800, mobileSize: '1080×1080 px', mobileMinW: 700, defaultFit: 'cover', isVariableRatio: false, basePcW: 1080 };
                    case 'brand_carousel':
                        return { pc: '5 / 2', mobile: '5 / 2', size: '400×160 px (PNG o WEBP transparente)', minW: 200, mobileSize: '400×160 px', mobileMinW: 200, defaultFit: 'contain', disableMobileSplit: true, isVariableRatio: false, basePcW: 400 };
                    default:
                        return { pc: '16 / 9', mobile: '4 / 3', size: '1200×675 px', minW: 800, mobileSize: '1080×810 px', mobileMinW: 700, defaultFit: 'cover', isVariableRatio: false, basePcW: 1200 };
                }
            };

            const measureLiveContainerInIframe = () => {
                if (this._isDeviceTransitioning) return;
                const iframe = document.getElementById('storefront-preview-iframe');
                const wrapper = document.getElementById('preview-viewport-wrapper');
                if (!iframe || !iframe.contentDocument || !wrapper) return;

                const currentPreviewDevice = wrapper.getAttribute('data-device') === 'mobile' ? 'mobile' : 'pc';
                const iDoc = iframe.contentDocument;
                const secEl = iDoc.querySelector(`.storevo-theme-section[data-section-id="${sec.id}"]`);
                if (!secEl) return;

                const s = sec.settings || {};
                let targetEl = null;
                let widthAdjust = 1;
                let minExpectedH = 0;

                if (field.key === 'layoutBgImageUrl') {
                    targetEl = secEl;
                } else if (sec.type === 'hero_banner') {
                    if (s.heroLayout === 'split') {
                        targetEl = secEl.querySelector('.sv-hero-split__media > div');
                    } else {
                        targetEl = secEl.querySelector('section.sv-hero-section') || secEl.querySelector('section') || secEl;
                        const hMode = s.heroHeight || 'default';
                        if (hMode === 'default' && s.heroLayout !== 'compact') {
                            minExpectedH = currentPreviewDevice === 'mobile' ? 340 : 440;
                        }
                    }
                } else if (sec.type === 'multi_banners') {
                    const m = field.key.match(/^card(\d+)ImageUrl$/);
                    const idx = m ? m[1] : '1';
                    targetEl = secEl.querySelector(`.sv-multi-banner-card[data-card-idx="${idx}"]`) || secEl.querySelector('.sv-multi-banner-card');
                } else if (sec.type === 'promo_banner') {
                    targetEl = secEl.querySelector('section > div > div.relative.bg-slate-800');
                    if (!targetEl) {
                        targetEl = secEl.querySelector('section > div');
                        if (targetEl && currentPreviewDevice === 'pc') {
                            widthAdjust = 0.5;
                            minExpectedH = 380;
                        } else if (targetEl && currentPreviewDevice === 'mobile') {
                            minExpectedH = 260;
                        }
                    }
                } else if (sec.type === 'rich_text' || sec.type === 'visit_us') {
                    targetEl = secEl.querySelector('.sv-rich-text-media > div');
                } else if (sec.type === 'featured_video') {
                    targetEl = secEl.querySelector('.sv-video-frame');
                } else if (sec.type === 'gallery_lookbook' || sec.type === 'social_showcase') {
                    targetEl = secEl.querySelector('.sv-lookbook-item');
                }

                if (!targetEl) return;
                const rect = targetEl.getBoundingClientRect();
                const effW = Math.round(rect.width * widthAdjust);
                const effH = Math.round(Math.max(rect.height, minExpectedH));
                if (effW < 40 || effH < 30) return;

                const fb = getFallbackSpec();
                const baseW = currentPreviewDevice === 'mobile' ? 1080 : (fb.basePcW || 1200);
                const recH = Math.max(140, Math.min(2400, Math.round((baseW * effH) / effW)));

                measuredCache[currentPreviewDevice] = {
                    ratio: `${effW} / ${effH}`,
                    size: `${baseW}×${recH} px`,
                    rawW: effW,
                    rawH: effH,
                    minW: currentPreviewDevice === 'mobile' ? (fb.mobileMinW || 700) : (fb.minW || 800)
                };
            };

            const getFrameSpec = () => {
                const fb = getFallbackSpec();
                if (!fb) return null;
                if (!fb.isVariableRatio) {
                    return fb;
                }
                const mPc = measuredCache.pc;
                const mMob = measuredCache.mobile;
                return {
                    pc: mPc ? mPc.ratio : fb.pc,
                    mobile: mMob ? mMob.ratio : fb.mobile,
                    size: mPc ? mPc.size : fb.size,
                    minW: mPc ? mPc.minW : fb.minW,
                    mobileSize: mMob ? mMob.size : fb.mobileSize,
                    mobileMinW: mMob ? mMob.minW : fb.mobileMinW,
                    defaultFit: fb.defaultFit,
                    disableMobileSplit: fb.disableMobileSplit,
                    isVariableRatio: fb.isVariableRatio,
                    measuredPc: Boolean(mPc),
                    measuredMobile: Boolean(mMob)
                };
            };

            const base = field.key.replace(/Url$/, '');
            const pcUrlKey = field.key;
            const mobBase = base + 'Mobile';
            const mobUrlKey = mobBase + 'Url';
            const legacyMobUrlKey = base === 'image'
                ? 'mobileImageUrl'
                : (base.endsWith('Image') ? base.replace(/Image$/, 'MobileImageUrl') : null);

            const clampNum = (v, d, lo, hi) => {
                const n = parseFloat(v);
                return isNaN(n) ? d : Math.min(hi, Math.max(lo, n));
            };

            const initialSpec = getFallbackSpec();
            const defFit = (initialSpec && initialSpec.defaultFit) ? initialSpec.defaultFit : 'cover';
            const st0 = sec.settings || {};

            let pcUrlVal = String(currentVal || '').trim();
            let mobUrlVal = String(st0[mobUrlKey] || (legacyMobUrlKey && st0[legacyMobUrlKey]) || '').trim();

            const pcFrame = {
                fit: st0[base + 'Fit'] === 'contain' ? 'contain' : (st0[base + 'Fit'] === 'cover' ? 'cover' : defFit),
                x: clampNum(st0[base + 'PosX'], 50, 0, 100),
                y: clampNum(st0[base + 'PosY'], 50, 0, 100),
                zoom: clampNum(st0[base + 'Zoom'], 100, 100, 250)
            };

            const hasSavedMobFrame = st0[mobBase + 'Fit'] !== undefined || st0[mobBase + 'PosX'] !== undefined
                || st0[mobBase + 'PosY'] !== undefined || st0[mobBase + 'Zoom'] !== undefined;

            const mobFrame = {
                fit: st0[mobBase + 'Fit'] === 'contain' ? 'contain' : (st0[mobBase + 'Fit'] === 'cover' ? 'cover' : pcFrame.fit),
                x: clampNum(st0[mobBase + 'PosX'], hasSavedMobFrame ? 50 : pcFrame.x, 0, 100),
                y: clampNum(st0[mobBase + 'PosY'], hasSavedMobFrame ? 50 : pcFrame.y, 0, 100),
                zoom: clampNum(st0[mobBase + 'Zoom'], hasSavedMobFrame ? 100 : pcFrame.zoom, 100, 250)
            };

            const previewWrap = document.getElementById('preview-viewport-wrapper');
            let viewMode = (previewWrap && previewWrap.getAttribute('data-device') === 'mobile') ? 'mobile' : 'pc';
            const getActiveFrame = () => viewMode === 'mobile' ? mobFrame : pcFrame;
            const getEffectiveUrl = () => {
                if (viewMode === 'mobile') {
                    return mobUrlVal || pcUrlVal;
                }
                return pcUrlVal || mobUrlVal;
            };

            const imgBox = document.createElement('div');
            imgBox.className = 'bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5';

            const smallBtnClass = (active) => 'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center gap-1.5 ' +
                (active ? 'bg-storevo-500 text-white border-storevo-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white');

            const viewRow = document.createElement('div');
            viewRow.className = 'flex items-center gap-1.5';
            const viewPcBtn = document.createElement('button');
            viewPcBtn.type = 'button';
            viewPcBtn.innerHTML = `${Storevo.EditorUI ? Storevo.EditorUI.icon('monitor', 'w-3.5 h-3.5') : ''}<span>Vista PC</span>`;
            const viewMobBtn = document.createElement('button');
            viewMobBtn.type = 'button';
            viewMobBtn.innerHTML = `${Storevo.EditorUI ? Storevo.EditorUI.icon('smartphone', 'w-3.5 h-3.5') : ''}<span>Vista celular</span>`;
            viewRow.appendChild(viewPcBtn);
            viewRow.appendChild(viewMobBtn);

            const modeStatusNote = document.createElement('p');
            modeStatusNote.className = 'hidden sv-ed-callout-info';

            const frame = document.createElement('div');
            frame.className = 'sv-ed-img-frame';
            const imgEl = document.createElement('img');
            imgEl.draggable = false;
            imgEl.alt = 'Vista previa';
            imgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;user-select:none;pointer-events:none;';
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow';
            removeBtn.style.zIndex = '2';
            removeBtn.textContent = 'Quitar imagen';
            frame.appendChild(imgEl);
            frame.appendChild(removeBtn);

            const controls = document.createElement('div');
            controls.className = 'hidden space-y-2';
            const dragHint = document.createElement('p');
            dragHint.className = 'text-[11px] text-slate-400';
            dragHint.textContent = 'Arrastra la foto con el mouse para elegir qué parte se ve.';
            const fitRow = document.createElement('div');
            fitRow.className = 'flex items-center gap-1.5 flex-wrap';
            const fitCoverBtn = document.createElement('button');
            fitCoverBtn.type = 'button';
            fitCoverBtn.textContent = 'Rellenar';
            const fitContainBtn = document.createElement('button');
            fitContainBtn.type = 'button';
            fitContainBtn.textContent = 'Ver completa';
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white transition ml-auto';
            resetBtn.textContent = 'Restablecer';
            fitRow.appendChild(fitCoverBtn);
            fitRow.appendChild(fitContainBtn);
            fitRow.appendChild(resetBtn);

            const containVariableNote = document.createElement('p');
            containVariableNote.className = 'hidden sv-ed-callout-warn';

            const zoomRow = document.createElement('div');
            zoomRow.className = 'flex items-center gap-2';
            const zoomLabel = document.createElement('span');
            zoomLabel.className = 'text-[11px] font-bold text-slate-400 whitespace-nowrap';
            const zoomRange = document.createElement('input');
            zoomRange.type = 'range';
            zoomRange.min = '100';
            zoomRange.max = '250';
            zoomRange.step = '5';
            zoomRange.style.cssText = 'flex:1;min-width:0;';
            zoomRow.appendChild(zoomLabel);
            zoomRow.appendChild(zoomRange);
            controls.appendChild(dragHint);
            controls.appendChild(fitRow);
            controls.appendChild(containVariableNote);
            controls.appendChild(zoomRow);

            const infoLine = document.createElement('p');
            infoLine.className = 'text-[11px] text-slate-500 leading-relaxed';

            const actionsRow = document.createElement('div');
            actionsRow.className = 'flex items-center gap-2';

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/jpeg,image/png,image/webp';
            fileInput.className = 'hidden';

            const uploadBtn = document.createElement('button');
            uploadBtn.type = 'button';
            uploadBtn.className = 'w-full py-2 px-3 bg-slate-800 hover:bg-storevo-500 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5';
            const uploadBtnLabel = document.createElement('span');
            uploadBtnLabel.textContent = 'Subir imagen desde mi equipo';
            uploadBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>';
            uploadBtn.appendChild(uploadBtnLabel);

            const urlInput = document.createElement('input');
            urlInput.type = 'text';
            urlInput.value = pcUrlVal;
            urlInput.placeholder = 'O pega una URL de imagen (https://...)';
            urlInput.className = 'w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-storevo-500 focus:outline-none';

            const applyFrame = () => {
                const st = getActiveFrame();
                const spec = getFrameSpec();
                imgEl.style.objectFit = spec ? st.fit : 'contain';
                imgEl.style.objectPosition = `${st.x}% ${st.y}%`;
                imgEl.style.transformOrigin = `${st.x}% ${st.y}%`;
                imgEl.style.scale = st.zoom === 100 ? '' : String(st.zoom / 100);
                fitCoverBtn.className = smallBtnClass(st.fit === 'cover');
                fitContainBtn.className = smallBtnClass(st.fit === 'contain');
                zoomLabel.textContent = `Zoom ${Math.round(st.zoom)}%`;
                zoomRange.value = String(Math.round(st.zoom));

                if (spec && spec.isVariableRatio && st.fit === 'contain') {
                    const targetSize = viewMode === 'mobile' ? (spec.mobileSize || spec.size) : spec.size;
                    containVariableNote.textContent = `Nota: Este bloque cambia de proporción según el ancho de pantalla y el contenido. «Ver completa» evita franjas en la proporción actual (${targetSize}), pero no siempre es posible evitar franjas en otros tamaños de pantalla sin recortar la imagen (modo «Rellenar»).`;
                    containVariableNote.classList.remove('hidden');
                } else {
                    containVariableNote.classList.add('hidden');
                }
            };

            const applyRatio = () => {
                const spec = getFrameSpec();
                if (!spec) {
                    frame.style.aspectRatio = '';
                    frame.style.height = '96px';
                    frame.style.width = '100%';
                    frame.style.margin = '0';
                    return;
                }
                const ratio = viewMode === 'mobile' ? spec.mobile : spec.pc;
                const parts = ratio.split('/').map(p => parseFloat(p));
                const r = (parts[0] && parts[1]) ? (parts[0] / parts[1]) : 1.5;
                frame.style.height = '';
                frame.style.aspectRatio = ratio;
                frame.style.width = r < 0.9 ? '58%' : '100%';
                frame.style.margin = r < 0.9 ? '0 auto' : '0';
                const allowMobTab = !spec.disableMobileSplit;
                viewRow.classList.toggle('hidden', !allowMobTab);
                viewRow.classList.toggle('flex', allowMobTab);
                viewPcBtn.className = smallBtnClass(viewMode === 'pc');
                viewMobBtn.className = smallBtnClass(viewMode === 'mobile');
            };

            const paintInfo = () => {
                const spec = getFrameSpec();
                infoLine.classList.remove('sv-ed-warn-text');
                if (!spec) {
                    infoLine.textContent = 'Recomendado: 400×160 px · JPG, PNG o WEBP · máx. 10 MB.';
                    return;
                }
                const isMob = viewMode === 'mobile';
                const targetSize = isMob ? (spec.mobileSize || spec.size) : spec.size;
                const targetMinW = isMob ? (spec.mobileMinW || 700) : spec.minW;
                const deviceLabel = isMob ? 'Recomendado en celular' : 'Recomendado en PC';
                let text = `${deviceLabel}: ${targetSize} · JPG, PNG o WEBP · máx. 10 MB.`;
                const effUrl = getEffectiveUrl();
                if (effUrl && imgEl.naturalWidth) {
                    text += ` Tu foto: ${imgEl.naturalWidth}×${imgEl.naturalHeight} px.`;
                    if (imgEl.naturalWidth < targetMinW) {
                        text += ' Es pequeña y puede verse borrosa.';
                        infoLine.classList.add('sv-ed-warn-text');
                    }
                }
                infoLine.textContent = text;
            };

            const refreshAll = () => {
                measureLiveContainerInIframe();
                const spec = getFrameSpec();
                const effUrl = getEffectiveUrl();
                const hasImgNow = Boolean(effUrl);
                if (effUrl) {
                    if (imgEl.getAttribute('src') !== effUrl) {
                        imgEl.src = effUrl;
                    }
                } else {
                    imgEl.removeAttribute('src');
                }

                frame.classList.toggle('hidden', !hasImgNow);
                controls.classList.toggle('hidden', !(hasImgNow && spec));

                if (viewMode === 'mobile') {
                    urlInput.value = mobUrlVal;
                    urlInput.placeholder = pcUrlVal
                        ? 'Opcional: pega otra URL exclusiva para celular...'
                        : 'Pega una URL de imagen para celular (https://...)';
                    uploadBtnLabel.textContent = mobUrlVal
                        ? 'Cambiar imagen exclusiva de celular'
                        : 'Subir otra imagen exclusiva para celular';
                    removeBtn.textContent = mobUrlVal ? 'Usar la de PC' : 'Quitar imagen';
                    if (pcUrlVal && !mobUrlVal) {
                        modeStatusNote.textContent = 'Usando la misma imagen de PC. Puedes ajustar su encuadre aquí para celular o subir otra imagen exclusiva para celular.';
                        modeStatusNote.classList.remove('hidden');
                    } else if (mobUrlVal) {
                        modeStatusNote.textContent = 'Mostrando imagen exclusiva para celular (la de PC se conserva intacta).';
                        modeStatusNote.classList.remove('hidden');
                    } else {
                        modeStatusNote.classList.add('hidden');
                    }
                } else {
                    urlInput.value = pcUrlVal;
                    urlInput.placeholder = 'O pega una URL de imagen (https://...)';
                    uploadBtnLabel.textContent = pcUrlVal
                        ? 'Cambiar imagen de PC'
                        : 'Subir imagen desde mi equipo';
                    removeBtn.textContent = 'Quitar imagen';
                    modeStatusNote.classList.add('hidden');
                }

                applyRatio();
                applyFrame();
                paintInfo();
            };

            const commitFrame = () => {
                const specNow = getFrameSpec();
                const dFit = (specNow && specNow.defaultFit) ? specNow.defaultFit : 'cover';
                if (viewMode === 'mobile') {
                    commitSectionChange(mobBase + 'Fit', mobFrame.fit);
                    commitSectionChange(mobBase + 'PosX', Math.round(mobFrame.x));
                    commitSectionChange(mobBase + 'PosY', Math.round(mobFrame.y));
                    commitSectionChange(mobBase + 'Zoom', Math.round(mobFrame.zoom));
                    return;
                }
                const isDefault = pcFrame.fit === dFit && Math.round(pcFrame.x) === 50
                    && Math.round(pcFrame.y) === 50 && Math.round(pcFrame.zoom) === 100;
                commitSectionChange(base + 'Fit', pcFrame.fit === 'contain' ? 'contain' : (dFit === 'contain' && pcFrame.fit === 'cover' ? 'cover' : null));
                commitSectionChange(base + 'PosX', isDefault ? null : Math.round(pcFrame.x));
                commitSectionChange(base + 'PosY', isDefault ? null : Math.round(pcFrame.y));
                commitSectionChange(base + 'Zoom', (isDefault || Math.round(pcFrame.zoom) === 100) ? null : Math.round(pcFrame.zoom));
            };

            const resetFrame = (commit) => {
                const specNow = getFrameSpec();
                const dFit = (specNow && specNow.defaultFit) ? specNow.defaultFit : 'cover';
                const target = getActiveFrame();
                target.fit = dFit;
                target.x = 50;
                target.y = 50;
                target.zoom = 100;
                applyFrame();
                if (commit) commitFrame();
            };

            imgEl.addEventListener('load', paintInfo);
            this.waitForPreviewTransition(() => refreshAll());

            const onDeviceTransitionEnded = (e) => {
                if (!document.body.contains(imgBox)) {
                    document.removeEventListener('storevo:device-transition-ended', onDeviceTransitionEnded);
                    return;
                }
                if (e && e.detail && e.detail.device) {
                    viewMode = e.detail.device === 'mobile' ? 'mobile' : 'pc';
                }
                refreshAll();
            };

            const onPreviewDomUpdated = () => {
                if (!document.body.contains(imgBox)) {
                    document.removeEventListener('storevo:preview-dom-updated', onPreviewDomUpdated);
                    return;
                }
                measuredCache.pc = null;
                measuredCache.mobile = null;
                this.waitForPreviewTransition(() => refreshAll());
            };

            document.addEventListener('storevo:device-transition-ended', onDeviceTransitionEnded);
            document.addEventListener('storevo:preview-dom-updated', onPreviewDomUpdated);

            let drag = null;
            frame.style.cursor = 'grab';
            frame.addEventListener('pointerenter', () => {
                if (!this._isDeviceTransitioning) refreshAll();
            });
            frame.addEventListener('pointerdown', (e) => {
                if (!getEffectiveUrl() || !getFrameSpec() || e.target === removeBtn) return;
                const st = getActiveFrame();
                drag = { sx: e.clientX, sy: e.clientY, x: st.x, y: st.y };
                try { frame.setPointerCapture(e.pointerId); } catch (err) {}
                frame.style.cursor = 'grabbing';
                e.preventDefault();
            });
            frame.addEventListener('pointermove', (e) => {
                if (!drag) return;
                const st = getActiveFrame();
                const rect = frame.getBoundingClientRect();
                const nw = imgEl.naturalWidth || rect.width;
                const nh = imgEl.naturalHeight || rect.height;
                const k = st.fit === 'contain'
                    ? Math.min(rect.width / nw, rect.height / nh)
                    : Math.max(rect.width / nw, rect.height / nh);
                const z = st.zoom / 100;
                const rawOvX = nw * k * z - rect.width;
                const rawOvY = nh * k * z - rect.height;
                const effOvX = Math.abs(rawOvX) > 12 ? rawOvX : Math.max(80, rect.width * 0.65);
                const effOvY = Math.abs(rawOvY) > 12 ? rawOvY : Math.max(80, rect.height * 0.65);
                st.x = Math.min(100, Math.max(0, drag.x - ((e.clientX - drag.sx) / effOvX) * 100));
                st.y = Math.min(100, Math.max(0, drag.y - ((e.clientY - drag.sy) / effOvY) * 100));
                applyFrame();
            });
            const endDrag = () => {
                if (!drag) return;
                const st = getActiveFrame();
                const moved = Math.round(drag.x) !== Math.round(st.x) || Math.round(drag.y) !== Math.round(st.y);
                drag = null;
                frame.style.cursor = 'grab';
                if (moved) commitFrame();
            };
            frame.addEventListener('pointerup', endDrag);
            frame.addEventListener('pointercancel', endDrag);

            viewPcBtn.addEventListener('click', () => {
                viewMode = 'pc';
                if (window.innerWidth >= 1024 && previewWrap && previewWrap.getAttribute('data-device') !== 'desktop') {
                    this.setDevice('desktop');
                    this.waitForPreviewTransition(() => refreshAll());
                } else {
                    refreshAll();
                }
            });
            viewMobBtn.addEventListener('click', () => {
                viewMode = 'mobile';
                if (window.innerWidth >= 1024 && previewWrap && previewWrap.getAttribute('data-device') !== 'mobile') {
                    this.setDevice('mobile');
                    this.waitForPreviewTransition(() => refreshAll());
                } else {
                    refreshAll();
                }
            });

            fitCoverBtn.addEventListener('click', () => {
                getActiveFrame().fit = 'cover';
                applyFrame();
                commitFrame();
            });
            fitContainBtn.addEventListener('click', () => {
                getActiveFrame().fit = 'contain';
                applyFrame();
                commitFrame();
            });
            resetBtn.addEventListener('click', () => resetFrame(true));
            zoomRange.addEventListener('input', () => {
                getActiveFrame().zoom = clampNum(zoomRange.value, 100, 100, 250);
                applyFrame();
            });
            zoomRange.addEventListener('change', commitFrame);

            uploadBtn.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', () => {
                if (!fileInput.files || !fileInput.files[0]) return;
                const file = fileInput.files[0];
                const prevText = uploadBtnLabel.textContent;
                uploadBtn.disabled = true;
                uploadBtnLabel.textContent = 'Subiendo imagen...';

                const formData = new FormData();
                formData.append('file', file);

                fetch(`/dashboard/${this.slug}/template/upload-image`, {
                    method: 'POST',
                    body: formData
                })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.url) {
                            if (viewMode === 'mobile') {
                                mobUrlVal = data.url;
                                resetFrame(false);
                                if (legacyMobUrlKey && sec.settings) delete sec.settings[legacyMobUrlKey];
                                commitSectionChange(mobUrlKey, data.url);
                                commitFrame();
                            } else {
                                pcUrlVal = data.url;
                                resetFrame(false);
                                commitSectionChange(pcUrlKey, data.url);
                                commitFrame();
                            }
                            refreshAll();
                            if (Storevo.UI && Storevo.UI.Toast) {
                                Storevo.UI.Toast.show(
                                    viewMode === 'mobile' ? 'Imagen para celular subida y aplicada' : 'Imagen subida y aplicada',
                                    'success'
                                );
                            }
                        } else if (Storevo.UI && Storevo.UI.Toast) {
                            Storevo.UI.Toast.show(data.message || 'Error al subir imagen', 'error');
                        }
                    })
                    .catch(() => {
                        if (Storevo.UI && Storevo.UI.Toast) {
                            Storevo.UI.Toast.show('Error de conexión al subir la imagen', 'error');
                        }
                    })
                    .finally(() => {
                        uploadBtn.disabled = false;
                        uploadBtnLabel.textContent = prevText;
                        fileInput.value = '';
                        refreshAll();
                    });
            });

            removeBtn.addEventListener('click', () => {
                if (viewMode === 'mobile') {
                    if (mobUrlVal) {
                        mobUrlVal = '';
                        if (legacyMobUrlKey && sec.settings) delete sec.settings[legacyMobUrlKey];
                        commitSectionChange(mobUrlKey, null);
                        refreshAll();
                        return;
                    }
                }
                pcUrlVal = '';
                mobUrlVal = '';
                if (legacyMobUrlKey && sec.settings) delete sec.settings[legacyMobUrlKey];
                commitSectionChange(mobUrlKey, null);
                resetFrame(false);
                commitSectionChange(pcUrlKey, '');
                commitFrame();
                refreshAll();
            });

            urlInput.addEventListener('input', () => {
                const val = urlInput.value.trim();
                if (viewMode === 'mobile') {
                    mobUrlVal = val;
                    if (legacyMobUrlKey && sec.settings) delete sec.settings[legacyMobUrlKey];
                    commitSectionChange(mobUrlKey, val || null);
                } else {
                    pcUrlVal = val;
                    commitSectionChange(pcUrlKey, val);
                }
                refreshAll();
            });

            actionsRow.appendChild(fileInput);
            actionsRow.appendChild(uploadBtn);
            imgBox.appendChild(viewRow);
            imgBox.appendChild(modeStatusNote);
            imgBox.appendChild(frame);
            imgBox.appendChild(controls);
            imgBox.appendChild(infoLine);
            imgBox.appendChild(actionsRow);
            imgBox.appendChild(urlInput);
            return imgBox;
        };

        const fieldsSchema = this.getFieldsForType(sec.type);
        fieldsSchema.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'space-y-1.5';
            wrapper.setAttribute('data-field-key', field.key);

            const label = document.createElement('label');
            label.className = 'block text-xs font-bold text-slate-300';
            label.textContent = Storevo.EditorUI
                ? Storevo.EditorUI.getFriendlyLabel(sec.type, field.key, field.label)
                : field.label;
            if (Storevo.EditorUI) {
                Storevo.EditorUI.decorateBrandLabel(label, sec.type, field.key);
            }
            wrapper.appendChild(label);

            const currentVal = sec.settings[field.key] !== undefined && sec.settings[field.key] !== null
                ? sec.settings[field.key]
                : (field.defaultVal !== undefined ? field.defaultVal : '');

            if (field.type === 'image') {
                wrapper.appendChild(buildInteractiveImageWidget(field, currentVal));
            } else if (field.type === 'url') {
                const urlBox = document.createElement('div');
                urlBox.className = 'space-y-2';

                const presetSelect = document.createElement('select');
                presetSelect.className = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none cursor-pointer';

                const normalizedCurrent = this.normalizeInternalUrlForSelect(currentVal);

                const navGroup = document.createElement('optgroup');
                navGroup.label = 'Menú Principal de tu Tienda';
                const basePages = [];
                if (field.allowEmpty) {
                    basePages.push({ value: '', label: '— Sin enlace —' });
                }
                basePages.push(
                    { value: '/catalog', label: 'Todo el Catálogo' },
                    { value: '/', label: 'Inicio de la Tienda' },
                    { value: '__whatsapp__', label: 'Chat de WhatsApp de la Tienda' },
                    { value: '/wishlist', label: 'Mis Favoritos (Lista de Deseos)' },
                    { value: '/cart', label: 'Bolsa de Compras' }
                );

                let matchedPreset = false;
                basePages.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value;
                    o.textContent = opt.label;
                    if (String(opt.value) === String(normalizedCurrent)) {
                        o.selected = true;
                        matchedPreset = true;
                    }
                    navGroup.appendChild(o);
                });
                presetSelect.appendChild(navGroup);

                if (this.categories && this.categories.length > 0) {
                    const catGroup = document.createElement('optgroup');
                    catGroup.label = 'Categorías de tu Tienda';
                    this.categories.forEach(c => {
                        const o = document.createElement('option');
                        o.value = '/catalog?category=' + c.id;
                        o.textContent = 'Categoría: ' + c.name;
                        if (o.value === normalizedCurrent) {
                            o.selected = true;
                            matchedPreset = true;
                        }
                        catGroup.appendChild(o);
                    });
                    presetSelect.appendChild(catGroup);
                }

                if (this.theme.customPages && this.theme.customPages.length > 0) {
                    const cpGroup = document.createElement('optgroup');
                    cpGroup.label = 'Páginas Personalizadas';
                    this.theme.customPages.forEach(cp => {
                        if (!cp || !cp.slug) return;
                        const o = document.createElement('option');
                        o.value = '/page/' + cp.slug;
                        o.textContent = 'Página: ' + (cp.title || cp.slug);
                        if (o.value === normalizedCurrent) {
                            o.selected = true;
                            matchedPreset = true;
                        }
                        cpGroup.appendChild(o);
                    });
                    presetSelect.appendChild(cpGroup);
                }

                const pageBasePath = this.getActivePageRelativeBasePath();
                const pageAnchors = (this.getActivePageSections(false) || [])
                    .filter(s => s && s.settings && String(s.settings.layoutAnchor || '').trim() !== '')
                    .map(s => {
                        const anchorId = String(s.settings.layoutAnchor).trim();
                        const sDef = this.catalogDefinitions[s.type] || { label: s.type };
                        return {
                            value: pageBasePath ? (pageBasePath + '#' + anchorId) : ('#' + anchorId),
                            label: '#' + anchorId + ' (' + sDef.label + ')'
                        };
                    });

                if (pageAnchors.length > 0) {
                    const anchorGroup = document.createElement('optgroup');
                    anchorGroup.label = 'Anclas de esta Página';
                    pageAnchors.forEach(aOpt => {
                        const o = document.createElement('option');
                        o.value = aOpt.value;
                        o.textContent = aOpt.label;
                        if (o.value === normalizedCurrent) {
                            o.selected = true;
                            matchedPreset = true;
                        }
                        anchorGroup.appendChild(o);
                    });
                    presetSelect.appendChild(anchorGroup);
                }

                const extGroup = document.createElement('optgroup');
                extGroup.label = 'Ancla Manual o Enlace Externo';
                const customOpt = document.createElement('option');
                customOpt.value = '__custom__';
                customOpt.textContent = 'Escribir #ancla o enlace externo (Instagram, Web...)';
                if (!matchedPreset) {
                    customOpt.selected = true;
                }
                extGroup.appendChild(customOpt);
                presetSelect.appendChild(extGroup);

                const customUrlInput = document.createElement('input');
                customUrlInput.type = 'text';
                customUrlInput.value = matchedPreset ? '' : currentVal;
                customUrlInput.placeholder = 'Ej: #mi-seccion o https://instagram.com/mitienda';
                customUrlInput.className = (matchedPreset ? 'hidden ' : '') + 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-storevo-500 focus:outline-none';

                presetSelect.addEventListener('change', () => {
                    if (presetSelect.value === '__custom__') {
                        customUrlInput.classList.remove('hidden');
                        customUrlInput.focus();
                    } else {
                        customUrlInput.classList.add('hidden');
                        commitSectionChange(field.key, presetSelect.value);
                    }
                });

                customUrlInput.addEventListener('input', () => {
                    let raw = customUrlInput.value.trim();
                    if (raw.startsWith('#') && raw.length > 1 && pageBasePath) {
                        raw = pageBasePath + raw;
                    }
                    commitSectionChange(field.key, raw);
                });

                urlBox.appendChild(presetSelect);
                urlBox.appendChild(customUrlInput);
                wrapper.appendChild(urlBox);

            } else if (field.type === 'textarea') {
                const input = document.createElement('textarea');
                input.rows = 3;
                input.value = currentVal;
                input.placeholder = field.placeholder || '';
                input.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none';
                input.addEventListener('input', () => {
                    commitSectionChange(field.key, input.value);
                });
                wrapper.appendChild(input);

            } else if (field.type === 'select') {
                const select = document.createElement('select');
                select.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none cursor-pointer';
                (field.options || []).forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value;
                    o.textContent = Storevo.EditorUI ? Storevo.EditorUI.cleanOptionText(opt.label) : opt.label;
                    if (String(opt.value) === String(currentVal)) o.selected = true;
                    select.appendChild(o);
                });
                select.addEventListener('change', () => {
                    commitSectionChange(field.key, select.value);

                    if (sec.type === 'product_grid') {
                        if (field.key === 'source') {
                            const catWrapper = container.querySelector('[data-field-key="categoryId"]');
                            if (catWrapper) {
                                catWrapper.classList.toggle('hidden', select.value !== 'CATEGORY');
                            }
                        } else if (field.key === 'categoryId' && select.value) {
                            sec.settings.source = 'CATEGORY';
                            const sourceSelect = container.querySelector('[data-field-key="source"] select');
                            if (sourceSelect) sourceSelect.value = 'CATEGORY';
                        }
                    }
                });
                wrapper.appendChild(select);
                if (Storevo.EditorUI) {
                    Storevo.EditorUI.enhanceSelect(wrapper, select, field, sec.type);
                }

                if (sec.type === 'product_grid' && field.key === 'categoryId') {
                    const currentSource = sec.settings.source || 'NEWEST';
                    if (currentSource !== 'CATEGORY') {
                        wrapper.classList.add('hidden');
                    }
                }

            } else if (field.type === 'color') {
                const colorRow = document.createElement('div');
                colorRow.className = 'flex items-center gap-2';

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = currentVal || '#0f172a';
                colorInput.className = 'w-8 h-8 rounded cursor-pointer bg-transparent';

                const hexInput = document.createElement('input');
                hexInput.type = 'text';
                hexInput.value = currentVal || '#0f172a';
                hexInput.className = 'flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white';

                colorInput.addEventListener('input', () => {
                    hexInput.value = colorInput.value;
                    commitSectionChange(field.key, colorInput.value);
                });
                hexInput.addEventListener('input', () => {
                    const cleanHex = hexInput.value.trim();
                    if (cleanHex.length === 7 && /^#[0-9a-fA-F]{6}/.test(cleanHex)) {
                        colorInput.value = cleanHex;
                        commitSectionChange(field.key, cleanHex);
                    }
                });

                colorRow.appendChild(colorInput);
                colorRow.appendChild(hexInput);
                wrapper.appendChild(colorRow);

            } else if (field.type === 'checkbox') {
                const checkLabel = document.createElement('label');
                checkLabel.className = 'flex items-center gap-2.5 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800';
                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.checked = Boolean(currentVal);
                chk.className = 'w-4 h-4 rounded border-slate-700 text-storevo-500';
                chk.addEventListener('change', () => {
                    commitSectionChange(field.key, chk.checked);
                });
                const span = document.createElement('span');
                span.className = 'text-xs font-medium text-slate-300';
                span.textContent = field.placeholder || 'Activar opción';
                checkLabel.appendChild(chk);
                checkLabel.appendChild(span);
                if (Storevo.EditorUI) {
                    Storevo.EditorUI.enhanceCheckbox(checkLabel, chk, field);
                }
                wrapper.innerHTML = '';
                wrapper.appendChild(checkLabel);

            } else {
                const input = document.createElement('input');
                input.type = field.type || 'text';
                input.value = currentVal;
                input.placeholder = field.placeholder || '';
                input.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none';
                input.addEventListener('input', () => {
                    if (sec.type === 'featured_video' && field.key === 'videoUrl') {
                        if (!sec.settings) sec.settings = {};
                        const extracted = this.extractYoutubeId(input.value);
                        if (extracted) {
                            sec.settings.videoId = extracted;
                        } else {
                            delete sec.settings.videoId;
                        }
                    }
                    commitSectionChange(field.key, input.value);
                    if (sec.type === 'hero_banner' && field.key === 'secondaryButtonText') {
                        const secUrlWrap = container.querySelector('[data-field-key="secondaryButtonUrl"]');
                        if (secUrlWrap) {
                            secUrlWrap.classList.toggle('hidden', !input.value.trim());
                        }
                    }
                });
                wrapper.appendChild(input);
                if (sec.type === 'hero_banner' && field.key === 'overlayOpacity' && Storevo.EditorUI) {
                    Storevo.EditorUI.enhanceOverlayRange(wrapper, input, currentVal, commitSectionChange);
                }
            }

            if (sec.type === 'hero_banner' && field.key === 'secondaryButtonUrl') {
                const secBtnText = sec.settings.secondaryButtonText || '';
                if (!String(secBtnText).trim()) {
                    wrapper.classList.add('hidden');
                }
            }

            if (typeof field.showIf === 'function') {
                wrapper._showIf = field.showIf;
                wrapper.classList.toggle('hidden', !field.showIf(sec.settings));
            }

            container.appendChild(wrapper);
        });

        if (Storevo.EditorUI) {
            Storevo.EditorUI.organizeInspectorFields(container, sec);
        }

        // Bloque transversal colapsable: "Diseño de la sección"
        const layoutSupport = this.getLayoutSupport(sec.type);
        const layoutFields = [];

        if (layoutSupport.bg) {
            layoutFields.push(
                {
                    key: 'layoutBgMode',
                    label: 'Fondo de la sección',
                    type: 'select',
                    defaultVal: 'none',
                    options: [
                        { value: 'none', label: 'Sin fondo (Predeterminado)' },
                        { value: 'solid', label: 'Color sólido personalizado' },
                        { value: 'image', label: 'Imagen de fondo personalizada' }
                    ]
                },
                {
                    key: 'layoutBgColor',
                    label: 'Color de fondo de la sección',
                    type: 'color',
                    defaultVal: '#f1f5f9',
                    showIf: (s) => Boolean(s && s.layoutBgMode === 'solid')
                },
                {
                    key: 'layoutBgImageUrl',
                    label: 'Imagen de fondo de la sección',
                    type: 'image',
                    defaultVal: '',
                    showIf: (s) => Boolean(s && s.layoutBgMode === 'image')
                },
                {
                    key: 'layoutBgOverlay',
                    label: 'Oscuridad del velo sobre la imagen (0% a 90%)',
                    type: 'range_overlay',
                    defaultVal: 40,
                    showIf: (s) => Boolean(s && s.layoutBgMode === 'image' && String(s.layoutBgImageUrl || '').trim() !== '')
                },
                {
                    key: 'layoutTone',
                    label: 'Contraste de textos sobre la imagen',
                    type: 'select',
                    defaultVal: 'dark',
                    options: [
                        { value: 'dark', label: 'Texto claro (Ideal para fondos oscuros)' },
                        { value: 'light', label: 'Texto oscuro (Ideal para fondos claros)' }
                    ],
                    showIf: (s) => Boolean(s && s.layoutBgMode === 'image' && String(s.layoutBgImageUrl || '').trim() !== '')
                }
            );
        }

        if (layoutSupport.spacing) {
            const spacingOptions = [
                { value: 'default', label: 'Predeterminado de la sección' },
                { value: 'none', label: 'Sin espacio (0px)' },
                { value: 'sm', label: 'Compacto (24px)' },
                { value: 'lg', label: 'Amplio (72px / 96px en PC)' }
            ];
            layoutFields.push(
                { key: 'layoutSpaceTop', label: 'Espaciado superior', type: 'select', defaultVal: 'default', options: spacingOptions },
                { key: 'layoutSpaceBottom', label: 'Espaciado inferior', type: 'select', defaultVal: 'default', options: spacingOptions }
            );
        }

        if (layoutSupport.width) {
            layoutFields.push({
                key: 'layoutWidth',
                label: 'Ancho del contenido',
                type: 'select',
                defaultVal: 'default',
                options: [
                    { value: 'default', label: 'Estándar centrado' },
                    { value: 'full', label: 'Ancho completo (100%)' }
                ]
            });
        }

        if (layoutSupport.visibility) {
            layoutFields.push({
                key: 'layoutVisibility',
                label: 'Visibilidad por dispositivo',
                type: 'select',
                defaultVal: 'all',
                options: [
                    { value: 'all', label: 'Mostrar en PC y celular (Predeterminado)' },
                    { value: 'desktop_only', label: 'Ocultar en celular (Solo visible en PC)' },
                    { value: 'mobile_only', label: 'Ocultar en PC (Solo visible en celular)' }
                ]
            });
        }

        if (layoutSupport.schedule) {
            layoutFields.push({
                key: 'scheduleRange',
                label: 'Programación de publicación (Inicio y Fin)',
                type: 'schedule_range',
                defaultVal: ''
            });
        }

        if (layoutSupport.anchor) {
            layoutFields.push({
                key: 'layoutAnchor',
                label: 'ID de ancla (enlace directo)',
                type: 'anchor',
                defaultVal: '',
                placeholder: 'ej: como-comprar o preguntas-frecuentes'
            });
        }

        if (layoutFields.length > 0) {
            const detailsEl = document.createElement('details');
            detailsEl.className = 'sv-ed-group';
            detailsEl.setAttribute('data-acc', 'section-layout');

            const hasCustomLayout = [
                'layoutBgMode', 'layoutBgColor', 'layoutBgImageUrl',
                'layoutSpaceTop', 'layoutSpaceBottom', 'layoutWidth',
                'layoutVisibility', 'scheduleStart', 'scheduleEnd', 'layoutAnchor'
            ].some(k => sec.settings && sec.settings[k] !== undefined && sec.settings[k] !== null && String(sec.settings[k]).trim() !== '' && sec.settings[k] !== 'default' && sec.settings[k] !== 'none' && sec.settings[k] !== 'all');
            if (hasCustomLayout) {
                detailsEl.open = true;
            }

            const summaryEl = document.createElement('summary');
            summaryEl.className = 'sv-ed-group-summary';
            summaryEl.innerHTML =
                '<div class="sv-ed-group-header-left">' +
                '<span class="sv-ed-group-icon">' + (Storevo.EditorUI ? Storevo.EditorUI.icon('sliders') : '') + '</span>' +
                '<div class="sv-ed-group-titles">' +
                '<span class="sv-ed-group-title">Diseño y programación de la sección</span>' +
                '<span class="sv-ed-group-subtitle">Espaciado, fondo, visibilidad PC/móvil, fechas y ancla</span>' +
                '</div>' +
                '</div>' +
                '<svg class="sv-ed-group-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
            detailsEl.appendChild(summaryEl);

            const bodyEl = document.createElement('div');
            bodyEl.className = 'sv-ed-group-body';

            layoutFields.forEach(field => {
                const wrapper = document.createElement('div');
                wrapper.className = 'space-y-1.5';
                wrapper.setAttribute('data-field-key', field.key);

                const label = document.createElement('label');
                label.className = 'block text-xs font-bold text-slate-300';
                label.textContent = field.label;
                wrapper.appendChild(label);

                const currentVal = (sec.settings && sec.settings[field.key] !== undefined && sec.settings[field.key] !== null)
                    ? sec.settings[field.key]
                    : field.defaultVal;

                if (field.type === 'select') {
                    const select = document.createElement('select');
                    select.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none cursor-pointer';
                    (field.options || []).forEach(opt => {
                        const o = document.createElement('option');
                        o.value = opt.value;
                        o.textContent = opt.label;
                        if (String(opt.value) === String(currentVal)) o.selected = true;
                        select.appendChild(o);
                    });
                    select.addEventListener('change', () => {
                        if (field.key === 'layoutBgMode') {
                            if (!sec.settings) sec.settings = {};
                            if (select.value === 'solid') {
                                const colorWrap = bodyEl.querySelector('[data-field-key="layoutBgColor"]');
                                const pickerEl = colorWrap ? colorWrap.querySelector('input[type="color"]') : null;
                                const chosenColor = /^#[0-9a-fA-F]{6}$/.test(sec.settings.layoutBgColor || '')
                                    ? sec.settings.layoutBgColor
                                    : (pickerEl && /^#[0-9a-fA-F]{6}$/.test(pickerEl.value) ? pickerEl.value : '#f1f5f9');
                                delete sec.settings.layoutBgImageUrl;
                                delete sec.settings.layoutBgOverlay;
                                delete sec.settings.layoutBgImageFit;
                                delete sec.settings.layoutBgImagePosX;
                                delete sec.settings.layoutBgImagePosY;
                                delete sec.settings.layoutBgImageZoom;
                                sec.settings.layoutBgColor = chosenColor;
                                sec.settings.layoutTone = this.computeLayoutTone(chosenColor);
                                commitSectionChange('layoutBgMode', 'solid');
                            } else if (select.value === 'image') {
                                delete sec.settings.layoutBgColor;
                                if (sec.settings.layoutBgOverlay === undefined) sec.settings.layoutBgOverlay = 40;
                                if (!sec.settings.layoutTone) sec.settings.layoutTone = 'dark';
                                commitSectionChange('layoutBgMode', 'image');
                            } else {
                                delete sec.settings.layoutBgColor;
                                delete sec.settings.layoutBgImageUrl;
                                delete sec.settings.layoutBgOverlay;
                                delete sec.settings.layoutTone;
                                delete sec.settings.layoutBgImageFit;
                                delete sec.settings.layoutBgImagePosX;
                                delete sec.settings.layoutBgImagePosY;
                                delete sec.settings.layoutBgImageZoom;
                                commitSectionChange('layoutBgMode', null);
                            }
                            return;
                        }
                        if (field.key === 'layoutTone') {
                            commitSectionChange('layoutTone', select.value);
                            return;
                        }
                        const nextVal = select.value === field.defaultVal ? null : select.value;
                        commitSectionChange(field.key, nextVal);
                        this.renderSectionsList();
                    });
                    wrapper.appendChild(select);
                    if (Storevo.EditorUI) {
                        Storevo.EditorUI.enhanceSelect(wrapper, select, field, sec.type);
                    }
                } else if (field.type === 'color') {
                    const colorRow = document.createElement('div');
                    colorRow.className = 'flex items-center gap-2';

                    const safeColor = /^#[0-9a-fA-F]{6}$/.test(String(currentVal || '').trim())
                        ? String(currentVal).trim()
                        : (field.defaultVal || '#f1f5f9');

                    const colorInput = document.createElement('input');
                    colorInput.type = 'color';
                    colorInput.value = safeColor;
                    colorInput.className = 'w-8 h-8 rounded cursor-pointer bg-transparent';

                    const hexInput = document.createElement('input');
                    hexInput.type = 'text';
                    hexInput.value = safeColor;
                    hexInput.className = 'flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white';

                    const applyLayoutColor = (hexVal) => {
                        if (!sec.settings) sec.settings = {};
                        sec.settings.layoutTone = this.computeLayoutTone(hexVal);
                        commitSectionChange(field.key, hexVal);
                    };

                    colorInput.addEventListener('input', () => {
                        hexInput.value = colorInput.value;
                        applyLayoutColor(colorInput.value);
                    });
                    hexInput.addEventListener('input', () => {
                        const cleanHex = hexInput.value.trim();
                        if (/^#[0-9a-fA-F]{6}$/.test(cleanHex)) {
                            colorInput.value = cleanHex;
                            applyLayoutColor(cleanHex);
                        }
                    });

                    colorRow.appendChild(colorInput);
                    colorRow.appendChild(hexInput);
                    wrapper.appendChild(colorRow);
                } else if (field.type === 'image') {
                    wrapper.appendChild(buildInteractiveImageWidget(field, currentVal));
                } else if (field.type === 'range_overlay') {
                    const row = document.createElement('div');
                    row.className = 'sv-ed-range-wrap';
                    const range = document.createElement('input');
                    range.type = 'range';
                    range.min = '0';
                    range.max = '90';
                    range.step = '5';
                    range.value = String(currentVal !== undefined && currentVal !== null ? currentVal : 40);
                    range.className = 'sv-ed-range-input';
                    const badge = document.createElement('span');
                    badge.className = 'sv-ed-range-badge';
                    badge.textContent = range.value + '%';

                    range.addEventListener('input', () => {
                        badge.textContent = range.value + '%';
                    });
                    range.addEventListener('change', () => {
                        commitSectionChange('layoutBgOverlay', parseInt(range.value, 10));
                    });
                    row.appendChild(range);
                    row.appendChild(badge);
                    wrapper.appendChild(row);
                } else if (field.type === 'schedule_range') {
                    const schedBox = document.createElement('div');
                    schedBox.className = 'bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5';

                    const startVal = (sec.settings && sec.settings.scheduleStart) ? String(sec.settings.scheduleStart).substring(0, 16) : '';
                    const endVal = (sec.settings && sec.settings.scheduleEnd) ? String(sec.settings.scheduleEnd).substring(0, 16) : '';

                    schedBox.innerHTML = `
                        <div class="space-y-1">
                            <label class="block text-[11px] font-bold text-slate-400">Mostrar desde (Fecha y hora de inicio)</label>
                            <input type="datetime-local" data-sched-input="start" value="${this.escapeHtml(startVal)}"
                                   class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-storevo-500 focus:outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[11px] font-bold text-slate-400">Ocultar después de (Fecha y hora de fin)</label>
                            <input type="datetime-local" data-sched-input="end" value="${this.escapeHtml(endVal)}"
                                   class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-storevo-500 focus:outline-none">
                        </div>
                        <p class="sv-sched-error hidden text-[11px] font-bold text-red-400 leading-snug"></p>
                        <div class="flex items-center justify-between gap-2 pt-1">
                            <span class="text-[10px] text-slate-500">Hora oficial de Colombia (America/Bogota)</span>
                            <button type="button" class="sv-sched-clear text-[10px] font-bold text-slate-400 hover:text-white transition">Limpiar fechas</button>
                        </div>
                    `;

                    const startInput = schedBox.querySelector('[data-sched-input="start"]');
                    const endInput = schedBox.querySelector('[data-sched-input="end"]');
                    const errorEl = schedBox.querySelector('.sv-sched-error');
                    const clearBtn = schedBox.querySelector('.sv-sched-clear');

                    const validateAndApplySchedule = () => {
                        const sVal = startInput.value ? startInput.value.trim() : '';
                        const eVal = endInput.value ? endInput.value.trim() : '';
                        if (sVal) endInput.min = sVal;
                        else endInput.removeAttribute('min');
                        if (eVal) startInput.max = eVal;
                        else startInput.removeAttribute('max');

                        if (sVal && eVal && eVal <= sVal) {
                            errorEl.textContent = 'La fecha de finalización debe ser posterior a la fecha de inicio.';
                            errorEl.classList.remove('hidden');
                            endInput.classList.add('border-red-500');
                            return;
                        }
                        errorEl.textContent = '';
                        errorEl.classList.add('hidden');
                        endInput.classList.remove('border-red-500');

                        if (!sec.settings) sec.settings = {};
                        if (sVal) sec.settings.scheduleStart = sVal;
                        else delete sec.settings.scheduleStart;
                        if (eVal) sec.settings.scheduleEnd = eVal;
                        else delete sec.settings.scheduleEnd;

                        this.renderSectionsList();
                        this.scheduleAutoSave(true);
                    };

                    startInput.addEventListener('change', validateAndApplySchedule);
                    endInput.addEventListener('change', validateAndApplySchedule);
                    clearBtn.addEventListener('click', () => {
                        startInput.value = '';
                        endInput.value = '';
                        validateAndApplySchedule();
                    });

                    wrapper.appendChild(schedBox);
                } else if (field.type === 'anchor') {
                    const inputWrap = document.createElement('div');
                    inputWrap.className = 'relative flex items-center';

                    const hashPrefix = document.createElement('span');
                    hashPrefix.className = 'absolute left-3 text-xs font-mono font-bold text-slate-500 select-none pointer-events-none';
                    hashPrefix.textContent = '#';

                    const anchorInput = document.createElement('input');
                    anchorInput.type = 'text';
                    anchorInput.maxLength = 40;
                    anchorInput.value = String(currentVal || '');
                    anchorInput.placeholder = field.placeholder || 'ej: ofertas';
                    anchorInput.className = 'w-full pl-6 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:border-storevo-500 focus:outline-none';

                    const hintEl = document.createElement('p');
                    hintEl.className = 'text-[11px] text-slate-500 leading-snug';
                    hintEl.textContent = currentVal
                        ? `Enlázala usando #${currentVal} o /#${currentVal}`
                        : 'Permite saltar a esta sección con un enlace #ancla.';

                    const errorEl = document.createElement('p');
                    errorEl.className = 'hidden text-[11px] font-bold text-red-400 leading-snug';

                    anchorInput.addEventListener('input', () => {
                        const slugged = this.normalizeAnchorSlug(anchorInput.value);
                        if (anchorInput.value !== slugged) {
                            anchorInput.value = slugged;
                        }
                        if (!slugged) {
                            errorEl.textContent = '';
                            errorEl.classList.add('hidden');
                            anchorInput.classList.remove('border-red-500');
                            hintEl.textContent = 'Permite saltar a esta sección con un enlace #ancla.';
                            commitSectionChange('layoutAnchor', null);
                            return;
                        }
                        const check = this.validateLayoutAnchor(slugged, this.activeSectionId);
                        if (!check.valid) {
                            errorEl.textContent = check.message;
                            errorEl.classList.remove('hidden');
                            anchorInput.classList.add('border-red-500');
                            return;
                        }
                        errorEl.textContent = '';
                        errorEl.classList.add('hidden');
                        anchorInput.classList.remove('border-red-500');
                        hintEl.textContent = `Enlázala usando #${slugged} o /#${slugged}`;
                        commitSectionChange('layoutAnchor', slugged);
                    });

                    inputWrap.appendChild(hashPrefix);
                    inputWrap.appendChild(anchorInput);
                    wrapper.appendChild(inputWrap);
                    wrapper.appendChild(errorEl);
                    wrapper.appendChild(hintEl);
                }

                if (typeof field.showIf === 'function') {
                    wrapper._showIf = field.showIf;
                    wrapper.classList.toggle('hidden', !field.showIf(sec.settings));
                }

                bodyEl.appendChild(wrapper);
            });

            const resetRow = document.createElement('div');
            resetRow.className = 'pt-2 border-t border-slate-800/80 flex justify-end';
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'text-[11px] font-bold text-slate-400 hover:text-white transition';
            resetBtn.textContent = 'Restablecer diseño de la sección';
            resetBtn.addEventListener('click', () => {
                if (this.activePage && this.activePage.startsWith('category:') && !this.isCategoryCustomized(this.activePage.substring(9))) {
                    const materializedSec = this.ensureCategoryMaterializedOnEdit(this.activeSectionId);
                    if (materializedSec) {
                        sec = materializedSec;
                        this.activeSectionId = sec.id;
                    }
                }
                if (sec.settings) {
                    [
                        'layoutBgMode', 'layoutBgColor', 'layoutBgImageUrl', 'layoutBgOverlay', 'layoutTone',
                        'layoutBgImageFit', 'layoutBgImagePosX', 'layoutBgImagePosY', 'layoutBgImageZoom',
                        'layoutSpaceTop', 'layoutSpaceBottom', 'layoutWidth',
                        'layoutVisibility', 'scheduleStart', 'scheduleEnd', 'layoutAnchor'
                    ].forEach(k => delete sec.settings[k]);
                }
                this.openInspector(this.activeSectionId);
                this.renderSectionsList();
                this.scheduleAutoSave();
                if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Diseño de la sección restablecido', 'info');
                }
            });
            resetRow.appendChild(resetBtn);
            bodyEl.appendChild(resetRow);

            detailsEl.appendChild(bodyEl);
            container.appendChild(detailsEl);
        }

        this.switchTab('sections');
        this.highlightSectionInIframe(this.activeSectionId);
    },

    closeInspector: function() {
        this.activeSectionId = null;
        this.renderSectionsList();
        document.getElementById('panel-section-inspector').classList.add('hidden');
        document.getElementById('panel-sections-list').classList.remove('hidden');
        this.highlightSectionInIframe(null);
    },

    getFieldsForType: function(type) {
        const catOptions = [{ value: '', label: 'Selecciona una categoría...' }]
            .concat(this.categories.map(c => ({ value: String(c.id), label: c.name })));

        const spotlightProductOptions = [
            { value: '', label: '✨ Automático: Último producto agregado' },
            { value: '__offer__', label: '🏷️ Automático: Primer producto en oferta' }
        ].concat((this.catalogProducts || []).map(p => ({
            value: String(p.id),
            label: `📦 ${p.name}`
        })));

        const trustIconOptions = [
            { value: 'shield', label: '🛡️ Escudo de Compra Segura' },
            { value: 'truck', label: '🚚 Camión de Envíos Nacionales' },
            { value: 'chat', label: '💬 Atención / WhatsApp Directo' },
            { value: 'star', label: '⭐ Calidad Garantizada / Premium' },
            { value: 'clock', label: '⏱️ Despacho Rápido / Entrega Ágil' },
            { value: 'gift', label: '🎁 Empaque Especial / Regalos' },
            { value: 'refresh', label: '🔄 Cambios y Garantía Fácil' },
            { value: 'card', label: '💳 Múltiples Medios de Pago' }
        ];

        switch (type) {
            case 'announcement_bar': {
                const hasLink = (s) => Boolean(s && String(s.linkUrl || '').trim() !== '');
                const isRotatorMode = (s) => {
                    const m = (s && s.animationMode) ? s.animationMode : 'fade';
                    return m !== 'marquee' && m !== 'static';
                };
                const isFirstSectionOnPage = () => {
                    const list = this.getActivePageSections(false) || [];
                    return list.length > 0 && list[0] && list[0].id === this.activeSectionId;
                };
                return [
                    { key: 'headerPosition', label: 'Ubicación del anuncio en el encabezado', type: 'select', defaultVal: 'below_menu', options: [
                            { value: 'below_menu', label: 'Debajo del menú de la tienda y arriba del Banner (Predeterminado)' },
                            { value: 'above_menu', label: 'Arriba del todo (Encima del menú de la tienda)' }
                        ], showIf: isFirstSectionOnPage },
                    { key: 'text', label: 'Mensaje principal del anuncio', type: 'text', placeholder: 'Ej:  Envío gratis en compras mayores a $150.000' },
                    { key: 'text2', label: '2do mensaje rotativo (Opcional)', type: 'text', placeholder: 'Ej:  Paga en línea o pide fácil por WhatsApp' },
                    { key: 'text3', label: '3er mensaje rotativo (Opcional)', type: 'text', placeholder: 'Ej:  Nuevos lanzamientos disponibles hoy' },
                    { key: 'animationMode', label: 'Animación del anuncio', type: 'select', defaultVal: 'fade', options: [
                            { value: 'fade', label: ' Desvanecimiento suave (Fade)' },
                            { value: 'slide_vertical', label: '⬆ Carrusel vertical (Deslizar arriba)' },
                            { value: 'slide_horizontal', label: '➡ Deslizamiento lateral (Slide)' },
                            { value: 'marquee', label: ' Cinta continua infinita (Marquee)' },
                            { value: 'flip', label: ' Giro 3D (Flip vertical)' },
                            { value: 'typewriter', label: ' Máquina de escribir (Typewriter)' },
                            { value: 'pulse_glow', label: ' Pulso / Zoom de atención' },
                            { value: 'static', label: ' Estático (Sin animación)' }
                        ]},
                    { key: 'speed', label: 'Velocidad de la animación', type: 'select', defaultVal: 'normal', options: [
                            { value: 'fast', label: 'Rápida (Dinámica)' },
                            { value: 'normal', label: 'Normal (Recomendada)' },
                            { value: 'slow', label: 'Pausada (Lectura calmada)' }
                        ], showIf: (s) => (!s || s.animationMode !== 'static') },
                    { key: 'barFormat', label: 'Tamaño y estilo tipográfico', type: 'select', defaultVal: 'normal', options: [
                            { value: 'compact', label: 'Compacta y sutil' },
                            { value: 'normal', label: 'Estándar (Recomendado)' },
                            { value: 'uppercase', label: 'Impacto en MAYÚSCULAS (Espaciado amplio)' }
                        ]},
                    { key: 'linkUrl', label: '¿A dónde lleva al hacer clic?', type: 'url', allowEmpty: true, defaultVal: '/catalog' },
                    { key: 'linkText', label: 'Texto del botón / enlace', type: 'text', defaultVal: 'Ver más', placeholder: 'Ej: Ver más, Comprar ahora, Ver ofertas...', showIf: (s) => hasLink(s) && (!s || s.linkStyle !== 'full_bar') },
                    { key: 'linkStyle', label: 'Estilo del enlace de acción', type: 'select', defaultVal: 'underline', options: [
                            { value: 'underline', label: 'Texto subrayado clásico' },
                            { value: 'pill', label: 'Botón tipo píldora destacado' },
                            { value: 'arrow', label: 'Enlace con flecha (→)' },
                            { value: 'full_bar', label: 'Toda la barra clicable (Sin botón separado)' }
                        ], showIf: hasLink },
                    { key: 'showArrows', label: 'Controles de navegación', type: 'checkbox', placeholder: 'Mostrar flechas (‹ ›) a los lados para cambiar de mensaje', defaultVal: false, showIf: isRotatorMode },
                    { key: 'dismissible', label: 'Permitir cerrar anuncio', type: 'checkbox', placeholder: 'Mostrar botón (✕) para que el visitante pueda ocultar la barra', defaultVal: false },
                    { key: 'bgColor', label: 'Color de fondo', type: 'color', defaultVal: '#0f172a' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            }
            case 'hero_banner': {
                const isMultiSlide = (s) => parseInt((s && s.slideCount) || '1', 10) >= 2;
                const heroFields = [
                    { key: 'heroLayout', label: 'Diseño del Banner Principal', type: 'select', defaultVal: 'classic', options: [
                            { value: 'classic', label: 'Portada Clásica (Imagen de fondo completa)' },
                            { value: 'split', label: 'Dividido Editorial (Texto a un lado + Imagen al otro)' },
                            { value: 'compact', label: 'Banner Compacto (Altura reducida)' }
                        ]},
                    { key: 'heroHeight', label: 'Altura del Banner', type: 'select', defaultVal: 'default', options: [
                            { value: 'default', label: 'Automática según el diseño (Predeterminada)' },
                            { value: 'sm', label: 'Compacta (260px móvil / 320px PC)' },
                            { value: 'md', label: 'Mediana Estándar (360px móvil / 460px PC)' },
                            { value: 'lg', label: 'Grande (440px móvil / 560px PC)' },
                            { value: 'xl', label: 'Impacto Amplio (520px móvil / 680px PC)' }
                        ]},
                    { key: 'slideCount', label: 'Modalidad / Cantidad de Slides', type: 'select', defaultVal: '1', options: [
                            { value: '1', label: '1 solo banner fijo (Estándar)' },
                            { value: '2', label: 'Carrusel de 2 slides' },
                            { value: '3', label: 'Carrusel de 3 slides' },
                            { value: '4', label: 'Carrusel de 4 slides' },
                            { value: '5', label: 'Carrusel de 5 slides' }
                        ]},
                    { key: 'autoplay', label: 'Reproducción automática (Autoplay)', type: 'checkbox', placeholder: 'Cambiar de slide automáticamente', defaultVal: true, showIf: isMultiSlide },
                    { key: 'autoplaySpeed', label: 'Velocidad del carrusel', type: 'select', defaultVal: 'normal', options: [
                            { value: 'fast', label: 'Rápida (3.5 segundos)' },
                            { value: 'normal', label: 'Normal (5 segundos)' },
                            { value: 'slow', label: 'Pausada (7 segundos)' }
                        ], showIf: (s) => isMultiSlide(s) && (!s || s.autoplay !== false) },
                    { key: 'alignment', label: 'Alineación del texto', type: 'select', defaultVal: 'center', options: [
                            { value: 'center', label: 'Centrado' },
                            { value: 'left', label: 'Izquierda' }
                        ]},
                    { key: 'overlayOpacity', label: 'Oscuridad sobre la imagen (0 a 90)', type: 'number', defaultVal: 50 },
                    { key: 'bgColor', label: 'Color de fondo del Hero', type: 'color', defaultVal: '#6366f1' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' },
                    { key: 'imageUrl', label: 'Slide 1: Imagen del Banner (PC y Celular)', type: 'image' },
                    { key: 'badgeText', label: 'Slide 1: Etiqueta superior (Opcional)', type: 'text', placeholder: 'Ej: Nueva Colección' },
                    { key: 'title', label: 'Slide 1: Título Principal', type: 'text', placeholder: 'Bienvenido a nuestra tienda' },
                    { key: 'subtitle', label: 'Slide 1: Subtítulo descriptivo', type: 'textarea', placeholder: 'Explora nuestro catálogo...' },
                    { key: 'buttonText', label: 'Slide 1: Texto del botón principal', type: 'text', placeholder: 'Ver Catálogo' },
                    { key: 'buttonUrl', label: 'Slide 1: ¿A dónde lleva el botón principal?', type: 'url', defaultVal: '/catalog' },
                    { key: 'secondaryButtonText', label: 'Slide 1: Texto 2do botón (Dejar vacío para ocultar)', type: 'text', placeholder: 'Ej: Ver Ofertas o Hablar por WhatsApp' },
                    { key: 'secondaryButtonUrl', label: 'Slide 1: ¿A dónde lleva el 2do botón?', type: 'url', defaultVal: '/catalog', showIf: (s) => Boolean(s && String(s.secondaryButtonText || '').trim()) }
                ];

                for (let i = 2; i <= 5; i++) {
                    const showSlide = (s) => parseInt((s && s.slideCount) || '1', 10) >= i;
                    const secBtnKey = `slide${i}SecondaryButtonText`;
                    heroFields.push(
                        { key: `slide${i}ImageUrl`, label: `Slide ${i}: Imagen del Banner (PC y Celular)`, type: 'image', showIf: showSlide },
                        { key: `slide${i}BadgeText`, label: `Slide ${i}: Etiqueta superior (Opcional)`, type: 'text', placeholder: 'Ej: Destacado', showIf: showSlide },
                        { key: `slide${i}Title`, label: `Slide ${i}: Título`, type: 'text', placeholder: `Título del Slide ${i}`, showIf: showSlide },
                        { key: `slide${i}Subtitle`, label: `Slide ${i}: Subtítulo`, type: 'textarea', placeholder: `Descripción del Slide ${i}...`, showIf: showSlide },
                        { key: `slide${i}ButtonText`, label: `Slide ${i}: Texto del botón principal`, type: 'text', defaultVal: 'Ver Catálogo', placeholder: 'Ver Catálogo', showIf: showSlide },
                        { key: `slide${i}ButtonUrl`, label: `Slide ${i}: ¿A dónde lleva el botón principal?`, type: 'url', defaultVal: '/catalog', showIf: showSlide },
                        { key: secBtnKey, label: `Slide ${i}: Texto 2do botón (Opcional)`, type: 'text', placeholder: 'Dejar vacío para ocultar', showIf: showSlide },
                        { key: `slide${i}SecondaryButtonUrl`, label: `Slide ${i}: ¿A dónde lleva el 2do botón?`, type: 'url', defaultVal: '/catalog', showIf: (s) => showSlide(s) && Boolean(s && String(s[secBtnKey] || '').trim()) }
                    );
                }
                return heroFields;
            }
            case 'product_grid':
                return [
                    { key: 'title', label: 'Título de la vitrina', type: 'text', placeholder: 'Novedades' },
                    { key: 'subtitle', label: 'Subtítulo (Opcional)', type: 'text', placeholder: 'Los favoritos de la temporada' },
                    { key: 'source', label: 'Qué productos mostrar', type: 'select', options: [
                            { value: 'NEWEST', label: 'Últimos productos agregados' },
                            { value: 'BEST_SELLERS', label: ' Más vendidos (Ranking de ventas reales)' },
                            { value: 'RECOMMENDED', label: ' Recomendados (En stock + Destacados + Ofertas)' },
                            { value: 'OFFERS', label: ' Solo productos en oferta / descuento' },
                            { value: 'FEATURED', label: ' Productos destacados' },
                            { value: 'CATEGORY', label: ' Productos de una categoría específica' },
                            { value: 'BRAND', label: ' Productos de una marca específica' },
                            { value: 'MANUAL', label: ' Selección manual de productos' }
                        ]},
                    { key: 'categoryId', label: 'Categoría a mostrar', type: 'select', options: catOptions },
                    { key: 'defaultSort', label: 'Ordenamiento de los productos', type: 'select', defaultVal: 'default', options: [
                            { value: 'default', label: 'Automático según el origen elegido' },
                            { value: 'price_asc', label: 'Precio: menor a mayor' },
                            { value: 'price_desc', label: 'Precio: mayor a menor' },
                            { value: 'discount_desc', label: 'Mayor descuento (%)' },
                            { value: 'name_asc', label: 'Nombre: A - Z' }
                        ]},
                    { key: 'displayMode', label: 'Formato de presentación', type: 'select', defaultVal: 'grid', options: [
                            { value: 'grid', label: 'Cuadrícula adaptable (Filas y columnas)' },
                            { value: 'carousel', label: 'Carrusel deslizable horizontal' }
                        ]},
                    { key: 'columnsDesktop', label: 'Columnas visibles en PC', type: 'select', defaultVal: '4', options: [
                            { value: '4', label: '4 productos por fila (Estándar)' },
                            { value: '3', label: '3 productos grandes por fila (Editorial)' }
                        ]},
                    { key: 'limit', label: 'Cantidad máxima de productos', type: 'select', options: [
                            { value: '4', label: '4 productos (1 fila)' },
                            { value: '8', label: '8 productos (2 filas)' },
                            { value: '12', label: '12 productos (3 filas)' },
                            { value: '16', label: '16 productos (4 filas)' },
                            { value: '24', label: '24 productos (Catálogo amplio)' }
                        ]},
                    { key: 'enableTabs', label: 'Pestañas de colecciones (Tabs)', type: 'checkbox', placeholder: 'Organizar distintas selecciones de productos en pestañas (ej: Nuevos, Más vendidos, Ofertas)', defaultVal: false },
                    { key: 'showSortDropdown', label: 'Ordenamiento rápido por precio', type: 'checkbox', placeholder: 'Mostrar selector compacto para que el comprador ordene por precio', defaultVal: false },
                    { key: 'showFilters', label: 'Filtros Dinámicos y Buscador Completo', type: 'checkbox', placeholder: 'Habilitar barra de filtros, tallas, colores y buscador en esta vitrina', defaultVal: false },
                    { key: 'showViewAll', label: 'Enlace al catálogo', type: 'checkbox', placeholder: 'Mostrar botón "Ver todo →"', defaultVal: true }
                ];
            case 'spotlight_product':
                return [
                    { key: 'productId', label: 'Producto a destacar', type: 'select', defaultVal: '', options: spotlightProductOptions },
                    { key: 'badgeText', label: 'Etiqueta destacada', type: 'text', defaultVal: ' Producto Estrella', placeholder: 'Ej: Lanzamiento de la Semana' },
                    { key: 'customTitle', label: 'Título personalizado (Opcional)', type: 'text', placeholder: 'Dejar vacío para usar el nombre del producto' },
                    { key: 'customSubtitle', label: 'Descripción destacada (Opcional)', type: 'textarea', placeholder: 'Dejar vacío para usar la descripción del producto' },
                    { key: 'imageSide', label: 'Posición de la foto en PC', type: 'select', defaultVal: 'left', options: [
                            { value: 'left', label: 'Foto a la izquierda / Texto a la derecha' },
                            { value: 'right', label: 'Texto a la izquierda / Foto a la derecha' }
                        ]},
                    { key: 'imageFit', label: 'Ajuste de la foto del producto', type: 'select', defaultVal: 'contain', options: [
                            { value: 'contain', label: 'Ver el producto completo (recomendado)' },
                            { value: 'cover', label: 'Rellenar todo el espacio (puede recortar)' }
                        ]}
                ];
            case 'featured_categories':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text', placeholder: 'Explora por Categoría' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Encuentra rápidamente lo que buscas' },
                    { key: 'source', label: 'Qué categorías mostrar', type: 'select', defaultVal: 'AUTO', options: [
                            { value: 'AUTO', label: 'Automático (Categorías principales activas)' },
                            { value: 'MANUAL', label: 'Selección manual y orden personalizado' }
                        ]},
                    { key: 'cardLayout', label: 'Estilo visual de las categorías', type: 'select', defaultVal: 'visual', options: [
                            { value: 'visual', label: 'Tarjetas Visuales con Foto Automática del Producto' },
                            { value: 'icon', label: 'Tarjetas Clásicas Limpias con Ícono' },
                            { value: 'pills', label: 'Botones Modernos Tipo Píldora' }
                        ]},
                    { key: 'columns', label: 'Columnas en PC', type: 'select', defaultVal: '4', options: [
                            { value: '4', label: '4 categorías por fila' },
                            { value: '3', label: '3 categorías grandes por fila' }
                        ]},
                    { key: 'showProductCount', label: 'Conteo de productos', type: 'checkbox', placeholder: 'Mostrar la cantidad de productos disponibles en cada categoría', defaultVal: true }
                ];
            case 'countdown_promo':
                return [
                    { key: 'badgeText', label: 'Etiqueta superior', type: 'text', defaultVal: 'Oferta por Tiempo Limitado' },
                    { key: 'title', label: 'Título de la oferta', type: 'text', defaultVal: '¡Aprovecha nuestros descuentos especiales!' },
                    { key: 'subtitle', label: 'Descripción de la promoción', type: 'textarea' },
                    { key: 'endDate', label: 'Fecha y hora límite de la oferta', type: 'datetime-local' },
                    { key: 'onExpire', label: '¿Qué hacer cuando finalice la cuenta regresiva?', type: 'select', defaultVal: 'hide', options: [
                            { value: 'hide', label: 'Ocultar automáticamente la sección en la tienda' },
                            { value: 'message', label: 'Mantener la sección y mostrar un mensaje de finalización' }
                        ]},
                    { key: 'expiredMessage', label: 'Mensaje al finalizar la oferta', type: 'textarea', defaultVal: '¡Esta promoción ha finalizado! Explora nuestro catálogo para ver las referencias disponibles.', showIf: (s) => Boolean(s && s.onExpire === 'message') },
                    { key: 'buttonText', label: 'Texto del botón', type: 'text', defaultVal: 'Ver Ofertas Ahora' },
                    { key: 'buttonUrl', label: '¿A dónde lleva el botón?', type: 'url', defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo', type: 'color', defaultVal: '#0f172a' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'multi_banners': {
                const has3Cards = (s) => parseInt((s && s.cardCount) || '2', 10) >= 3;
                const has4Cards = (s) => parseInt((s && s.cardCount) || '2', 10) >= 4;
                const mbFields = [
                    { key: 'cardCount', label: 'Cantidad de tarjetas / banners', type: 'select', defaultVal: '2', options: [
                            { value: '2', label: '2 tarjetas (Doble clásico)' },
                            { value: '3', label: '3 tarjetas (Triple o Mosaico)' },
                            { value: '4', label: '4 tarjetas (Cuádruple)' }
                        ]},
                    { key: 'bannerLayout', label: 'Distribución en PC', type: 'select', defaultVal: 'equal', options: [
                            { value: 'equal', label: 'Columnas simétricas iguales' },
                            { value: 'mosaic_3', label: 'Mosaico 3 tarjetas (1 grande + 2 apiladas)' },
                            { value: 'cols_3', label: '3 columnas en línea (para 3 tarjetas)' },
                            { value: 'grid_2x2', label: 'Cuadrícula 2x2 (para 4 tarjetas)' },
                            { value: 'cols_4', label: '4 columnas en fila (para 4 tarjetas)' }
                        ]}
                ];
                const defaultBgs = ['#1e293b', '#4f46e5', '#0f766e', '#be123c'];
                for (let i = 1; i <= 4; i++) {
                    const showFn = i === 3 ? has3Cards : (i === 4 ? has4Cards : undefined);
                    mbFields.push(
                        { key: `card${i}ImageUrl`, label: `Tarjeta ${i}: Imagen de Fondo`, type: 'image', showIf: showFn },
                        { key: `card${i}Badge`, label: `Tarjeta ${i}: Etiqueta superior`, type: 'text', showIf: showFn },
                        { key: `card${i}Title`, label: `Tarjeta ${i}: Título`, type: 'text', showIf: showFn },
                        { key: `card${i}Subtitle`, label: `Tarjeta ${i}: Subtítulo`, type: 'text', showIf: showFn },
                        { key: `card${i}ButtonText`, label: `Tarjeta ${i}: Texto del botón`, type: 'text', showIf: showFn },
                        { key: `card${i}ButtonUrl`, label: `Tarjeta ${i}: ¿A dónde lleva el botón?`, type: 'url', defaultVal: '/catalog', showIf: showFn },
                        { key: `card${i}BgColor`, label: `Tarjeta ${i}: Color de fondo`, type: 'color', defaultVal: defaultBgs[i - 1], showIf: showFn }
                    );
                }
                return mbFields;
            }
            case 'promo_banner':
                return [
                    { key: 'imageUrl', label: 'Imagen Lateral de la Promoción', type: 'image' },
                    { key: 'badgeText', label: 'Etiqueta superior', type: 'text', placeholder: 'Destacado' },
                    { key: 'title', label: 'Título de la promoción', type: 'text', placeholder: 'Promoción Especial' },
                    { key: 'subtitle', label: 'Descripción', type: 'textarea', placeholder: 'Detalles de tu promoción...' },
                    { key: 'buttonText', label: 'Texto del botón', type: 'text', placeholder: 'Comprar ahora' },
                    { key: 'buttonUrl', label: '¿A dónde lleva el botón?', type: 'url', defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo del bloque', type: 'color', defaultVal: '#0f172a' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'testimonials':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text', placeholder: 'Opiniones de Compradores Reales' },
                    { key: 'subtitle', label: 'Subtítulo descriptivo', type: 'text', placeholder: 'Calificaciones verificadas de clientes...' },
                    { key: 'displayOrder', label: 'Fuentes y orden de presentación', type: 'select', defaultVal: 'reviews_first', options: [
                            { value: 'reviews_first', label: 'Reseñas verificadas primero + Testimonios manuales' },
                            { value: 'manual_first', label: 'Testimonios manuales primero + Reseñas verificadas' },
                            { value: 'only_reviews', label: 'Mostrar únicamente reseñas de pedidos verificados' },
                            { value: 'only_manual', label: 'Mostrar únicamente testimonios manuales' }
                        ]}
                ];
            case 'how_to_buy':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text', defaultVal: '¿Cómo comprar en nuestra tienda?' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', defaultVal: 'Realiza tu pedido fácil, rápido y 100% seguro' },
                    { key: 'step1Title', label: 'Paso 1: Título', type: 'text' },
                    { key: 'step1Text', label: 'Paso 1: Descripción', type: 'textarea' },
                    { key: 'step2Title', label: 'Paso 2: Título', type: 'text' },
                    { key: 'step2Text', label: 'Paso 2: Descripción', type: 'textarea' },
                    { key: 'step3Title', label: 'Paso 3: Título', type: 'text' },
                    { key: 'step3Text', label: 'Paso 3: Descripción', type: 'textarea' },
                    { key: 'showPaymentBadges', label: 'Sello de Pagos y Envíos', type: 'checkbox', placeholder: 'Mostrar íconos de pago seguro (PSE, Nequi, Tarjetas, WhatsApp)', defaultVal: true }
                ];
            case 'trust_badges': {
                const tbFields = [
                    { key: 'badgeStyle', label: 'Diseño de la Franja', type: 'select', defaultVal: 'cards', options: [
                            { value: 'cards', label: 'Tarjetas Blancas con Sombra' },
                            { value: 'minimal', label: 'Minimalista Integrado al Fondo' },
                            { value: 'secondary', label: 'Franja Destacada en Color Secundario' }
                        ]},
                    { key: 'mobileLayout', label: 'Presentación en Celular', type: 'select', defaultVal: 'stack', options: [
                            { value: 'stack', label: 'Apilados verticalmente (Estándar)' },
                            { value: 'carousel', label: 'Carrusel deslizable horizontal' }
                        ]}
                ];
                const defaultIcons = ['shield', 'truck', 'chat', 'star', 'refresh', 'card'];
                for (let i = 1; i <= 6; i++) {
                    const optLabel = i > 3 ? ' (Opcional — dejar título vacío para ocultar)' : '';
                    tbFields.push(
                        { key: `item${i}Icon`, label: `Beneficio ${i}: Ícono`, type: 'select', defaultVal: defaultIcons[i - 1], options: trustIconOptions },
                        { key: `item${i}Title`, label: `Beneficio ${i}: Título${optLabel}`, type: 'text', placeholder: i > 3 ? 'Ej: Garantía Directa' : '' },
                        { key: `item${i}Text`, label: `Beneficio ${i}: Descripción`, type: 'text', showIf: i > 3 ? (s) => Boolean(s && String(s[`item${i}Title`] || '').trim()) : undefined }
                    );
                }
                return tbFields;
            }
            case 'faq_accordion':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text', defaultVal: 'Preguntas Frecuentes' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', defaultVal: 'Resolvemos tus dudas antes de comprar' },
                    { key: 'enableFaqSchema', label: 'SEO y Datos Estructurados (Schema.org)', type: 'checkbox', placeholder: 'Incluir marcado estructurado FAQPage sincronizado con las preguntas visibles', defaultVal: true }
                ];
            case 'whatsapp_cta': {
                const isSchedOn = (s) => Boolean(s && s.showSchedule === true);
                return [
                    { key: 'title', label: 'Título del bloque', type: 'text' },
                    { key: 'subtitle', label: 'Subtítulo persuasivo', type: 'textarea' },
                    { key: 'buttonText', label: 'Texto del botón de WhatsApp', type: 'text' },
                    { key: 'prefilledMessage', label: 'Mensaje prellenado de WhatsApp (Opcional)', type: 'textarea', placeholder: 'Ej: Hola, estoy visitando su tienda online y me gustaría recibir asesoría.' },
                    { key: 'showSchedule', label: 'Horario de atención en vivo', type: 'checkbox', placeholder: 'Mostrar indicador de estado (En línea / Fuera de horario) según el horario comercial', defaultVal: false },
                    { key: 'scheduleDays', label: 'Días de atención', type: 'select', defaultVal: 'MON_SAT', options: [
                            { value: 'MON_SAT', label: 'Lunes a Sábado' },
                            { value: 'MON_FRI', label: 'Lunes a Viernes' },
                            { value: 'ALL_DAYS', label: 'Todos los días (Lunes a Domingo)' }
                        ], showIf: isSchedOn },
                    { key: 'openTime', label: 'Hora de apertura (24h)', type: 'time', defaultVal: '08:00', showIf: isSchedOn },
                    { key: 'closeTime', label: 'Hora de cierre (24h)', type: 'time', defaultVal: '18:00', showIf: isSchedOn },
                    { key: 'scheduleText', label: 'Texto visible del horario (Opcional)', type: 'text', placeholder: 'Ej: Lun a Sáb de 8:00 am a 6:00 pm', showIf: isSchedOn }
                ];
            }
            case 'visit_us':
                return [
                    { key: 'badgeText', label: 'Etiqueta superior (Opcional)', type: 'text', defaultVal: 'Punto Físico' },
                    { key: 'title', label: 'Título de la sección', type: 'text', defaultVal: 'Visítanos en Nuestra Tienda' },
                    { key: 'subtitle', label: 'Subtítulo descriptivo', type: 'textarea', defaultVal: 'Conoce nuestros productos personalmente y recibe asesoría directa.' },
                    { key: 'address', label: 'Dirección física del local', type: 'text', placeholder: 'Ej: Calle 85 # 12-34, Local 102' },
                    { key: 'city', label: 'Ciudad / Municipio', type: 'text', placeholder: 'Ej: Bogotá, Medellín, Cartagena...' },
                    { key: 'reference', label: 'Punto de referencia o centro comercial (Opcional)', type: 'text', placeholder: 'Ej: Frente al Parque Principal / Piso 2' },
                    { key: 'hoursText', label: 'Horario de atención al público', type: 'textarea', placeholder: 'Ej: Lunes a Sábado: 9:00 am a 7:00 pm\nDomingos y festivos: 10:00 am a 4:00 pm' },
                    { key: 'phone', label: 'Teléfono de contacto (Dejar vacío para usar el WhatsApp de la tienda)', type: 'text', placeholder: 'Ej: 300 123 4567' },
                    { key: 'imageUrl', label: 'Foto del punto físico / fachada (Opcional)', type: 'image' },
                    { key: 'imageSide', label: 'Posición de la foto en PC', type: 'select', defaultVal: 'right', options: [
                            { value: 'right', label: 'Foto a la derecha / Información a la izquierda' },
                            { value: 'left', label: 'Foto a la izquierda / Información a la derecha' }
                        ], showIf: (s) => Boolean(s && String(s.imageUrl || '').trim()) },
                    { key: 'mapUrl', label: 'Enlace a Google Maps / Waze (Opcional)', type: 'text', placeholder: 'https://maps.google.com/...' },
                    { key: 'mapButtonText', label: 'Texto del botón de mapa', type: 'text', defaultVal: 'Cómo llegar en Google Maps', showIf: (s) => Boolean(s && String(s.mapUrl || '').trim()) },
                    { key: 'showWhatsappBtn', label: 'Botón de consulta por WhatsApp', type: 'checkbox', placeholder: 'Mostrar botón para consultar ubicación por WhatsApp', defaultVal: true }
                ];
            case 'payment_methods':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text', defaultVal: 'Medios de Pago Aceptados' },
                    { key: 'subtitle', label: 'Subtítulo descriptivo', type: 'text', defaultVal: 'Compra con total tranquilidad a través de nuestros canales habilitados' },
                    { key: 'paymentStyle', label: 'Estilo visual del bloque', type: 'select', defaultVal: 'cards', options: [
                            { value: 'cards', label: 'Tarjetas claras sobre contenedor blanco' },
                            { value: 'secondary', label: 'Franja destacada en Color Secundario' }
                        ]},
                    { key: 'showSecurityNote', label: 'Sello de seguridad inferior', type: 'checkbox', placeholder: 'Mostrar nota de protección de pagos bajo las tarjetas', defaultVal: true }
                ];
            case 'rich_text': {
                const hasRichImg = (s) => Boolean(s && String(s.imageUrl || '').trim());
                const hasRichBtn = (s) => Boolean(s && String(s.buttonText || '').trim());
                return [
                    { key: 'badgeText', label: 'Etiqueta superior (Opcional)', type: 'text', placeholder: 'Ej: Nuestra Historia o Servicios' },
                    { key: 'title', label: 'Título', type: 'text', placeholder: 'Sobre Nosotros' },
                    { key: 'content', label: 'Contenido principal', type: 'textarea', placeholder: 'Escribe aquí la historia, presentación de marca o servicios de tu tienda...' },
                    { key: 'bulletItems', label: 'Lista con viñetas (Opcional — escribe 1 punto por línea)', type: 'textarea', placeholder: 'Atención personalizada\nEnvíos seguros a todo el país\nGarantía directa' },
                    { key: 'imageUrl', label: 'Imagen opcional de la sección', type: 'image' },
                    { key: 'imagePosition', label: 'Posición de la imagen', type: 'select', defaultVal: 'right', options: [
                            { value: 'right', label: 'Imagen a la derecha / Texto a la izquierda' },
                            { value: 'left', label: 'Imagen a la izquierda / Texto a la derecha' },
                            { value: 'top', label: 'Imagen arriba del texto' },
                            { value: 'bottom', label: 'Imagen debajo del texto' }
                        ], showIf: hasRichImg },
                    { key: 'textAlign', label: 'Alineación del texto', type: 'select', defaultVal: 'center', options: [
                            { value: 'center', label: 'Centrado' },
                            { value: 'left', label: 'Izquierda (Editorial)' }
                        ]},
                    { key: 'buttonText', label: 'Texto del botón (Dejar vacío para ocultar)', type: 'text', placeholder: 'Ej: Ver Catálogo o Hablar por WhatsApp' },
                    { key: 'buttonUrl', label: '¿A dónde lleva el botón?', type: 'url', defaultVal: '/catalog', showIf: hasRichBtn }
                ];
            }
            case 'featured_video':
                return [
                    { key: 'badgeText', label: 'Etiqueta superior (Opcional)', type: 'text', placeholder: 'Ej: Conoce Más' },
                    { key: 'title', label: 'Título de la sección (Opcional)', type: 'text', placeholder: 'Mira nuestros productos en acción' },
                    { key: 'subtitle', label: 'Descripción opcional', type: 'textarea', placeholder: 'Explica brevemente qué verán tus clientes en el video...' },
                    { key: 'videoUrl', label: 'Enlace del video de YouTube', type: 'text', placeholder: 'Ej: https://www.youtube.com/watch?v=... o Shorts' },
                    { key: 'aspectRatio', label: 'Proporción del video', type: 'select', defaultVal: '16:9', options: [
                            { value: '16:9', label: 'Horizontal panorámico (16:9)' },
                            { value: '9:16', label: 'Vertical móvil / Shorts (9:16)' }
                        ]},
                    { key: 'coverImageUrl', label: 'Imagen de portada personalizada (Opcional)', type: 'image' },
                    { key: 'buttonText', label: 'Texto del botón (Dejar vacío para ocultar)', type: 'text', placeholder: 'Ej: Ver Productos Destacados' },
                    { key: 'buttonUrl', label: '¿A dónde lleva el botón?', type: 'url', defaultVal: '/catalog', showIf: (s) => Boolean(s && String(s.buttonText || '').trim()) }
                ];
            case 'stats_counter': {
                const statIconOptions = [{ value: 'none', label: '— Sin ícono —' }].concat(trustIconOptions);
                return [
                    { key: 'title', label: 'Título de la sección (Opcional)', type: 'text', placeholder: 'Nuestra Trayectoria en Cifras' },
                    { key: 'subtitle', label: 'Descripción opcional', type: 'text', placeholder: 'Resultados que respaldan cada pedido' },
                    { key: 'statStyle', label: 'Estilo visual de los indicadores', type: 'select', defaultVal: 'cards', options: [
                            { value: 'cards', label: 'Tarjetas Blancas con Sombra' },
                            { value: 'minimal', label: 'Minimalista Integrado al Fondo' },
                            { value: 'secondary', label: 'Franja Destacada en Color Secundario' }
                        ]},
                    { key: 'item1Icon', label: 'Indicador 1: Ícono', type: 'select', defaultVal: 'star', options: statIconOptions },
                    { key: 'item1Value', label: 'Indicador 1: Cifra o dato', type: 'text', placeholder: 'Ej: +1.500' },
                    { key: 'item1Label', label: 'Indicador 1: Etiqueta descriptiva', type: 'text', placeholder: 'Ej: Clientes satisfechos' },
                    { key: 'item2Icon', label: 'Indicador 2: Ícono', type: 'select', defaultVal: 'truck', options: statIconOptions },
                    { key: 'item2Value', label: 'Indicador 2: Cifra o dato', type: 'text', placeholder: 'Ej: 100%' },
                    { key: 'item2Label', label: 'Indicador 2: Etiqueta descriptiva', type: 'text', placeholder: 'Ej: Envíos seguros en el país' },
                    { key: 'item3Icon', label: 'Indicador 3: Ícono (Opcional)', type: 'select', defaultVal: 'clock', options: statIconOptions },
                    { key: 'item3Value', label: 'Indicador 3: Cifra (Dejar vacío para ocultar)', type: 'text', placeholder: 'Ej: 24h - 72h' },
                    { key: 'item3Label', label: 'Indicador 3: Etiqueta descriptiva', type: 'text', placeholder: 'Ej: Despacho ágil y garantizado' },
                    { key: 'item4Icon', label: 'Indicador 4: Ícono (Opcional)', type: 'select', defaultVal: 'shield', options: statIconOptions },
                    { key: 'item4Value', label: 'Indicador 4: Cifra (Dejar vacío para ocultar)', type: 'text', placeholder: 'Ej: 5 Años' },
                    { key: 'item4Label', label: 'Indicador 4: Etiqueta descriptiva', type: 'text', placeholder: 'Ej: Experiencia en el mercado' }
                ];
            }
            case 'gallery_lookbook': {
                const fields = [
                    { key: 'title', label: 'Título de la galería (Opcional)', type: 'text', placeholder: 'Inspiración y Estilo' },
                    { key: 'subtitle', label: 'Descripción opcional', type: 'textarea', placeholder: 'Presenta tu colección, estilo o galería de fotos...' },
                    { key: 'columns', label: 'Columnas en computador', type: 'select', defaultVal: '3', options: [
                            { value: '2', label: '2 columnas grandes' },
                            { value: '3', label: '3 columnas (Editorial)' },
                            { value: '4', label: '4 columnas (Mosaico compacto)' }
                        ]},
                    { key: 'imageAspect', label: 'Proporción de las fotos', type: 'select', defaultVal: 'portrait', options: [
                            { value: 'portrait', label: 'Vertical Lookbook (4:5)' },
                            { value: 'square', label: 'Cuadrada (1:1)' },
                            { value: 'landscape', label: 'Horizontal (4:3)' }
                        ]}
                ];
                for (let i = 1; i <= 6; i++) {
                    const imgKey = `item${i}ImageUrl`;
                    const hasImg = (s) => Boolean(s && String(s[imgKey] || '').trim());
                    fields.push(
                        { key: imgKey, label: `Imagen ${i}${i > 3 ? ' (Opcional)' : ''}`, type: 'image' },
                        { key: `item${i}Caption`, label: `Imagen ${i}: Texto sobre la foto (Opcional)`, type: 'text', placeholder: 'Ej: Nueva Colección o Look Urbano', showIf: hasImg },
                        { key: `item${i}LinkUrl`, label: `Imagen ${i}: Enlace al hacer clic (Opcional)`, type: 'url', allowEmpty: true, defaultVal: '', showIf: hasImg }
                    );
                }
                return fields;
            }
            case 'brand_carousel': {
                const isManualBrands = (s) => !s || String(s.source || 'MANUAL').toUpperCase() !== 'AUTO';
                const brandFields = [
                    { key: 'title', label: 'Título de la sección (Opcional)', type: 'text', placeholder: 'Marcas que Comercializamos' },
                    { key: 'subtitle', label: 'Subtítulo opcional', type: 'text', placeholder: 'Productos originales con respaldo y garantía' },
                    { key: 'source', label: 'Origen de las marcas', type: 'select', defaultVal: 'MANUAL', options: [
                            { value: 'MANUAL', label: 'Manual (yo cargo nombre, logo y enlace)' },
                            { value: 'AUTO', label: 'Automático (marcas de mis productos activos)' }
                        ]},
                    { key: 'displayMode', label: 'Formato de visualización', type: 'select', defaultVal: 'grid', options: [
                            { value: 'grid', label: 'Cuadrícula adaptable centrada' },
                            { value: 'carousel', label: 'Carrusel deslizable con flechas' }
                        ]},
                    { key: 'logoSize', label: 'Tamaño visual de los logotipos', type: 'select', defaultVal: 'md', options: [
                            { value: 'sm', label: 'Compacto (Sutil)' },
                            { value: 'md', label: 'Mediano (Estándar)' },
                            { value: 'lg', label: 'Grande (Destacado)' }
                        ]},
                    { key: 'grayscale', label: 'Efecto monocromático', type: 'checkbox', placeholder: 'Mostrar logotipos en escala de grises y a color al pasar el cursor', defaultVal: false }
                ];
                for (let i = 1; i <= 6; i++) {
                    const nameKey = `item${i}Name`;
                    const imgKey = `item${i}ImageUrl`;
                    const hasBrandData = (s) => isManualBrands(s) && Boolean(s && (String(s[nameKey] || '').trim() || String(s[imgKey] || '').trim()));
                    brandFields.push(
                        { key: nameKey, label: `Marca ${i}: Nombre${i > 4 ? ' (Opcional)' : ''}`, type: 'text', placeholder: `Ej: Marca ${i}`, showIf: isManualBrands },
                        { key: imgKey, label: `Marca ${i}: Logotipo (Opcional)`, type: 'image', showIf: isManualBrands },
                        { key: `item${i}LinkUrl`, label: `Marca ${i}: Enlace al hacer clic (Opcional)`, type: 'url', allowEmpty: true, defaultVal: '', showIf: hasBrandData }
                    );
                }
                return brandFields;
            }
            case 'social_showcase': {
                const socialFields = [
                    { key: 'handleText', label: 'Usuario o etiqueta superior (Opcional)', type: 'text', placeholder: 'Ej: @nuestratienda' },
                    { key: 'title', label: 'Título de la sección', type: 'text', placeholder: 'Síguenos en Redes Sociales' },
                    { key: 'subtitle', label: 'Descripción opcional', type: 'textarea', placeholder: 'Conoce nuestros últimos lanzamientos y promociones...' },
                    { key: 'instagramUrl', label: 'Instagram (Usuario @ o URL — si está vacío usa el de Configuración)', type: 'text', placeholder: 'Ej: @mitienda o https://instagram.com/mitienda' },
                    { key: 'tiktokUrl', label: 'TikTok (Usuario @ o URL — si está vacío usa el de Configuración)', type: 'text', placeholder: 'Ej: @mitienda o https://tiktok.com/@mitienda' },
                    { key: 'facebookUrl', label: 'Facebook (Usuario o URL — si está vacío usa el de Configuración)', type: 'text', placeholder: 'Ej: https://facebook.com/mitienda' },
                    { key: 'showWhatsapp', label: 'Botón de WhatsApp', type: 'checkbox', placeholder: 'Mostrar botón directo al WhatsApp de la tienda', defaultVal: true }
                ];
                for (let i = 1; i <= 4; i++) {
                    const imgKey = `post${i}ImageUrl`;
                    const hasPostImg = (s) => Boolean(s && String(s[imgKey] || '').trim());
                    socialFields.push(
                        { key: imgKey, label: `Foto destacada ${i} (Opcional)`, type: 'image' },
                        { key: `post${i}Caption`, label: `Foto ${i}: Texto o descripción corta (Opcional)`, type: 'text', placeholder: 'Ej: Nuevo lanzamiento', showIf: hasPostImg },
                        { key: `post${i}LinkUrl`, label: `Foto ${i}: Enlace al hacer clic (Opcional)`, type: 'url', allowEmpty: true, defaultVal: '', showIf: hasPostImg }
                    );
                }
                return socialFields;
            }
            case 'catalog_results':
                return [
                    { key: 'showHeader', label: 'Encabezado del Catálogo', type: 'checkbox', placeholder: 'Mostrar título y descripción del catálogo', defaultVal: true },
                    { key: 'headerBadge', label: 'Etiqueta superior', type: 'text', defaultVal: 'Colección', placeholder: 'Ej: Colección' },
                    { key: 'headerTitle', label: 'Título principal de esta página', type: 'text', defaultVal: 'Todo el Catálogo' },
                    { key: 'headerSubtitle', label: 'Subtítulo descriptivo', type: 'textarea', defaultVal: 'Explora todos nuestros productos disponibles.' },
                    { key: 'showCategoryPills', label: 'Navegación rápida de categorías', type: 'checkbox', placeholder: 'Mostrar píldoras de categorías arriba del listado', defaultVal: true },
                    { key: 'showSearchAndSort', label: 'Buscador y Ordenamiento', type: 'checkbox', placeholder: 'Mostrar barra de búsqueda en vivo y selector de orden', defaultVal: true },
                    { key: 'filterLayout', label: 'Disposición de Filtros en PC', type: 'select', defaultVal: 'sidebar', options: [
                            { value: 'sidebar', label: 'Barra Lateral Izquierda en PC + Drawer en Móvil' },
                            { value: 'topbar', label: 'Barra Horizontal Desplegable Superior' },
                            { value: 'none', label: 'Ocultar panel de filtros avanzados' }
                        ]},
                    { key: 'showFilterAvailability', label: 'Filtro de Disponibilidad y Ofertas', type: 'checkbox', placeholder: 'Permitir filtrar por En stock / En oferta', defaultVal: true },
                    { key: 'showFilterPrice', label: 'Filtro de Rango de Precio', type: 'checkbox', placeholder: 'Permitir filtrar por precio mínimo y máximo', defaultVal: true },
                    { key: 'showFilterCategory', label: 'Filtro de Categorías con conteo', type: 'checkbox', placeholder: 'Mostrar filtro de categorías laterales', defaultVal: true },
                    { key: 'showFilterVariants', label: 'Filtros de Variantes (Tallas, Colores con swatches...)', type: 'checkbox', placeholder: 'Generar filtros automáticos de Tallas y Colores con stock', defaultVal: true },
                    { key: 'showFilterAttributes', label: 'Filtros de Ficha Técnica (Marca, Material, Género...)', type: 'checkbox', placeholder: 'Generar filtros automáticos desde las especificaciones', defaultVal: true },
                    { key: 'columnsDesktop', label: 'Columnas de productos en PC', type: 'select', defaultVal: '4', options: [
                            { value: '4', label: '4 productos por fila (Estándar)' },
                            { value: '3', label: '3 productos grandes por fila (Editorial)' }
                        ]}
                ];
            case 'product_main':
                return [
                    { key: 'relatedTitle', label: 'Título de Productos Relacionados', type: 'text', defaultVal: 'También te puede interesar' },
                    { key: 'relatedSubtitle', label: 'Subtítulo de Productos Relacionados', type: 'text', defaultVal: 'Otros productos de nuestro catálogo' }
                ];
            default:
                return [];
        }
    },

    initGlobalStylesInputs: function() {
        const gs = this.theme.globalStyles;

        const bindColor = (pickerId, hexId, prop, fallback) => {
            const picker = document.getElementById(pickerId);
            const hex = document.getElementById(hexId);
            if (!picker || !hex) return;

            const initial = gs[prop] || fallback;
            picker.value = initial;
            hex.value = initial;

            picker.oninput = () => {
                hex.value = picker.value;
                gs[prop] = picker.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
            hex.oninput = () => {
                if (/^#[0-9a-fA-F]{6}$/.test(hex.value.trim())) {
                    picker.value = hex.value.trim();
                    gs[prop] = hex.value.trim();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                }
            };
        };

        bindColor('style-primary-color', 'style-primary-color-hex', 'primaryColor', '#6366f1');
        bindColor('style-secondary-color', 'style-secondary-color-hex', 'secondaryColor', '#0f172a');
        bindColor('style-bg-color', 'style-bg-color-hex', 'backgroundColor', '#f8fafc');
        bindColor('style-text-color', 'style-text-color-hex', 'textColor', '#0f172a');

        const bindSelect = (id, prop, fallback, reloadNeeded = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = gs[prop] !== undefined && gs[prop] !== null ? String(gs[prop]) : fallback;
            el.onchange = () => {
                gs[prop] = el.value === 'true' ? true : (el.value === 'false' ? false : el.value);
                this.syncFontPairHighlight();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(reloadNeeded);
            };
        };

        bindSelect('style-navbar-style', 'navbarStyle', 'light');
        bindSelect('style-navbar-link-format', 'navbarLinkFormat', 'normal');
        bindSelect('style-navbar-link-hover', 'navbarLinkHover', 'color');
        bindSelect('style-navbar-sticky', 'navbarSticky', 'true');
        bindSelect('style-navbar-dropdown-style', 'navbarDropdownStyle', 'mega');
        bindSelect('style-navbar-dropdown-anim', 'navbarDropdownAnim', 'slide_up');
        bindSelect('style-navbar-trigger', 'navbarTrigger', 'hover');
        bindSelect('style-navbar-speed', 'navbarSpeed', 'normal');

        // ---- Identidad de la tienda: logo / nombre (Navegación y Cabecera) ----
        bindSelect('style-navbar-brand-mode', 'navbarBrandMode', 'logo', true);
        bindSelect('style-navbar-logo-size', 'navbarLogoSize', 'md', true);

        const brandModeSel = document.getElementById('style-navbar-brand-mode');
        const logoFields = document.getElementById('style-logo-fields');
        const syncLogoFields = () => {
            if (logoFields && brandModeSel) logoFields.classList.toggle('hidden', brandModeSel.value === 'text');
        };
        if (brandModeSel) {
            brandModeSel.addEventListener('change', syncLogoFields);
            syncLogoFields();
        }

        const bindLogoUploader = (prefix, prop) => {
            const wrap = document.getElementById(prefix + '-wrap');
            const preview = document.getElementById(prefix + '-preview');
            const fileInput = document.getElementById(prefix + '-file');
            const uploadBtn = document.getElementById(prefix + '-btn');
            const removeBtn = document.getElementById(prefix + '-remove');
            if (!wrap || !preview || !fileInput || !uploadBtn || !removeBtn) return;

            const toast = (msg, type) => {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(msg, type);
            };
            const paint = () => {
                const url = gs[prop] || '';
                preview.src = url;
                wrap.classList.toggle('hidden', !url);
                removeBtn.classList.toggle('hidden', !url);
                const label = uploadBtn.querySelector('span');
                if (label) label.textContent = url ? 'Cambiar logo' : 'Subir logo desde mi equipo';
            };
            paint();

            uploadBtn.onclick = () => fileInput.click();

            fileInput.onchange = () => {
                const file = fileInput.files && fileInput.files[0];
                if (!file) return;
                if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
                    toast('Formato no permitido. Usa PNG, WEBP o JPG.', 'error');
                    fileInput.value = '';
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    toast('El logo supera el límite de 10 MB.', 'error');
                    fileInput.value = '';
                    return;
                }

                const label = uploadBtn.querySelector('span');
                const originalText = label ? label.textContent : '';
                uploadBtn.disabled = true;
                if (label) label.textContent = 'Subiendo logo...';

                const formData = new FormData();
                formData.append('file', file);

                fetch(`/dashboard/${this.slug}/template/upload-image`, { method: 'POST', body: formData })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.url) {
                            gs[prop] = data.url;
                            paint();
                            this.scheduleAutoSave(true);
                            toast('Logo subido y aplicado', 'success');
                        } else {
                            if (label) label.textContent = originalText;
                            toast(data.message || 'Error al subir el logo', 'error');
                        }
                    })
                    .catch(() => {
                        if (label) label.textContent = originalText;
                        toast('Error de conexión al subir el logo', 'error');
                    })
                    .finally(() => {
                        uploadBtn.disabled = false;
                        fileInput.value = '';
                        paint();
                    });
            };

            removeBtn.onclick = () => {
                gs[prop] = '';
                paint();
                this.scheduleAutoSave(true);
            };
        };

        bindLogoUploader('style-logo-light', 'navbarLogoUrl');
        bindLogoUploader('style-logo-dark', 'navbarLogoDarkUrl');

        const compactScrollChk = document.getElementById('style-navbar-compact-scroll');
        if (compactScrollChk) {
            compactScrollChk.checked = Boolean(gs.navbarCompactOnScroll);
            compactScrollChk.onchange = () => {
                gs.navbarCompactOnScroll = compactScrollChk.checked;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        const showHomeChk = document.getElementById('style-navbar-show-home');
        if (showHomeChk) {
            showHomeChk.checked = gs.navbarShowHome !== false;
            showHomeChk.onchange = () => {
                gs.navbarShowHome = showHomeChk.checked;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        const showCatalogChk = document.getElementById('style-navbar-show-catalog');
        if (showCatalogChk) {
            showCatalogChk.checked = gs.navbarShowCatalog !== false;
            showCatalogChk.onchange = () => {
                gs.navbarShowCatalog = showCatalogChk.checked;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        bindSelect('style-heading-font', 'headingFont', 'Inter', true);
        bindSelect('style-body-font', 'bodyFont', 'Inter', true);
        bindSelect('style-heading-transform', 'headingTransform', 'none');
        bindSelect('style-font-scale', 'fontScale', 'standard');

        bindSelect('style-border-radius', 'borderRadius', '1rem');
        bindSelect('style-button-radius', 'buttonRadius', 'classic');

        const navLayoutContainer = document.getElementById('style-navbar-layout');
        if (navLayoutContainer) {
            const currentNavLayout = gs.navbarLayout || 'classic';
            navLayoutContainer.querySelectorAll('.nav-layout-opt').forEach(btn => {
                const val = btn.getAttribute('data-value');
                btn.classList.toggle('is-selected', val === currentNavLayout);
                btn.onclick = () => {
                    gs.navbarLayout = val;
                    // Ajustes de submenú al elegir Boutique Izquierdo o Departamentos Ancho (respetando Inicio y Catálogo tal como el usuario los tenga)
                    if (val === 'retail_left') {
                        gs.navbarDropdownStyle = 'dual_drawer';
                        gs.navbarTrigger = 'click';
                        const ddSel = document.getElementById('style-navbar-dropdown-style');
                        const trSel = document.getElementById('style-navbar-trigger');
                        if (ddSel) ddSel.value = 'dual_drawer';
                        if (trSel) trSel.value = 'click';
                    } else if (val === 'department_strip') {
                        gs.navbarDropdownStyle = 'full_columns';
                        const ddSel = document.getElementById('style-navbar-dropdown-style');
                        if (ddSel) ddSel.value = 'full_columns';
                    }
                    navLayoutContainer.querySelectorAll('.nav-layout-opt').forEach(b => b.classList.toggle('is-selected', b === btn));
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(true);
                };
            });
        }

        const cardStyleContainer = document.getElementById('style-card-style');
        if (cardStyleContainer) {
            const currentCardStyle = gs.cardStyle || 'elevated';
            cardStyleContainer.querySelectorAll('.card-style-opt').forEach(btn => {
                const val = btn.getAttribute('data-value');
                btn.classList.toggle('is-selected', val === currentCardStyle);
                btn.onclick = () => {
                    gs.cardStyle = val;
                    cardStyleContainer.querySelectorAll('.card-style-opt').forEach(b => b.classList.toggle('is-selected', b === btn));
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            });
        }

        const fontPairsContainer = document.getElementById('style-font-pairs');
        if (fontPairsContainer) {
            fontPairsContainer.querySelectorAll('.font-pair-opt').forEach(btn => {
                btn.onclick = () => {
                    const h = btn.getAttribute('data-heading');
                    const b = btn.getAttribute('data-body');
                    gs.headingFont = h;
                    gs.bodyFont = b;
                    const hSel = document.getElementById('style-heading-font');
                    const bSel = document.getElementById('style-body-font');
                    if (hSel) hSel.value = h;
                    if (bSel) bSel.value = b;
                    this.syncFontPairHighlight();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(true);
                };
            });
            this.syncFontPairHighlight();
        }

        const navReset = document.getElementById('style-nav-reset');
        if (navReset) {
            navReset.onclick = () => {
                gs.navbarLayout = 'classic';
                gs.navbarStyle = 'light';
                gs.navbarLinkFormat = 'normal';
                gs.navbarLinkHover = 'color';
                gs.navbarSticky = true;
                gs.navbarDropdownStyle = 'mega';
                gs.navbarDropdownAnim = 'slide_up';
                gs.navbarTrigger = 'hover';
                gs.navbarSpeed = 'normal';
                gs.navbarCompactOnScroll = false;
                gs.navbarShowHome = true;
                gs.navbarShowCatalog = true;
                this.initGlobalStylesInputs();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(true);
            };
        }

        const typoReset = document.getElementById('style-typography-reset');
        if (typoReset) {
            typoReset.onclick = () => {
                gs.headingFont = 'Inter';
                gs.bodyFont = 'Inter';
                gs.headingTransform = 'none';
                gs.fontScale = 'standard';
                this.initGlobalStylesInputs();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(true);
            };
        }

        const shapeReset = document.getElementById('style-shape-reset');
        if (shapeReset) {
            shapeReset.onclick = () => {
                gs.borderRadius = '1rem';
                gs.buttonRadius = 'classic';
                this.initGlobalStylesInputs();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        // =====================================================================
        // 4.B SISTEMA GLOBAL DE TARJETAS DE PRODUCTOS
        // =====================================================================
        const CARD_STYLE_PRESETS = {
            commercial: {
                cardPreset: 'commercial',
                cardStyle: 'elevated',
                cardRadius: 'sync',
                cardShadow: 'sm',
                cardImageAspect: 'square',
                cardImageFit: 'cover',
                cardImagePadding: 'flush',
                cardContentAlign: 'left',
                cardMetaMode: 'category',
                cardDiscountBadge: 'percent',
                cardShowStatusBadges: true,
                cardShowOldPrice: true,
                cardPriceSize: 'normal',
                cardButtonStyle: 'solid',
                cardActionMode: 'always',
                cardWishlistMode: 'always',
                cardImageHover: 'carousel',
                cardHoverLift: 'lift'
            },
            boutique: {
                cardPreset: 'boutique',
                cardStyle: 'boutique',
                cardRadius: '0px',
                cardShadow: 'none',
                cardImageAspect: 'portrait',
                cardImageFit: 'cover',
                cardImagePadding: 'flush',
                cardContentAlign: 'center',
                cardMetaMode: 'brand',
                cardDiscountBadge: 'label',
                cardShowStatusBadges: true,
                cardShowOldPrice: true,
                cardPriceSize: 'normal',
                cardButtonStyle: 'dark',
                cardActionMode: 'hover',
                cardWishlistMode: 'hover',
                cardImageHover: 'carousel',
                cardHoverLift: 'none'
            },
            poster: {
                cardPreset: 'poster',
                cardStyle: 'poster',
                cardRadius: '1.5rem',
                cardShadow: 'lg',
                cardImageAspect: 'tall',
                cardImageFit: 'cover',
                cardImagePadding: 'flush',
                cardContentAlign: 'left',
                cardMetaMode: 'category',
                cardDiscountBadge: 'percent',
                cardShowStatusBadges: true,
                cardShowOldPrice: true,
                cardPriceSize: 'large',
                cardButtonStyle: 'solid',
                cardActionMode: 'always',
                cardWishlistMode: 'always',
                cardImageHover: 'carousel',
                cardHoverLift: 'scale'
            },
            bento: {
                cardPreset: 'bento',
                cardStyle: 'bento',
                cardRadius: '1.5rem',
                cardShadow: 'md',
                cardImageAspect: 'square',
                cardImageFit: 'cover',
                cardImagePadding: 'inset',
                cardContentAlign: 'left',
                cardMetaMode: 'both',
                cardDiscountBadge: 'percent',
                cardShowStatusBadges: true,
                cardShowOldPrice: true,
                cardPriceSize: 'normal',
                cardButtonStyle: 'split',
                cardActionMode: 'always',
                cardWishlistMode: 'always',
                cardImageHover: 'carousel',
                cardHoverLift: 'glow'
            },
            compact: {
                cardPreset: 'compact',
                cardStyle: 'outlined',
                cardRadius: '0px',
                cardShadow: 'none',
                cardImageAspect: 'square',
                cardImageFit: 'cover',
                cardImagePadding: 'flush',
                cardContentAlign: 'left',
                cardMetaMode: 'both',
                cardDiscountBadge: 'percent',
                cardShowStatusBadges: true,
                cardShowOldPrice: true,
                cardPriceSize: 'normal',
                cardButtonStyle: 'dark',
                cardActionMode: 'always',
                cardWishlistMode: 'always',
                cardImageHover: 'carousel',
                cardHoverLift: 'border'
            },
            gallery: {
                cardPreset: 'gallery',
                cardStyle: 'soft',
                cardRadius: '1rem',
                cardShadow: 'sm',
                cardImageAspect: 'portrait',
                cardImageFit: 'cover',
                cardImagePadding: 'inset',
                cardContentAlign: 'center',
                cardMetaMode: 'category',
                cardDiscountBadge: 'percent',
                cardShowStatusBadges: true,
                cardShowOldPrice: true,
                cardPriceSize: 'large',
                cardButtonStyle: 'outline',
                cardActionMode: 'always',
                cardWishlistMode: 'always',
                cardImageHover: 'second_image',
                cardHoverLift: 'glow'
            }
        };

        const DEFAULT_GLOBAL_CARD_STYLES = CARD_STYLE_PRESETS.commercial;
        Object.entries(DEFAULT_GLOBAL_CARD_STYLES).forEach(([k, defVal]) => {
            if (gs[k] === undefined || gs[k] === null) {
                gs[k] = defVal;
            }
        });

        const cardPresetWrap = document.getElementById('style-card-preset');
        const cardSelectMap = {
            'style-card-radius': 'cardRadius',
            'style-card-shadow': 'cardShadow',
            'style-card-img-aspect': 'cardImageAspect',
            'style-card-img-fit': 'cardImageFit',
            'style-card-img-padding': 'cardImagePadding',
            'style-card-align': 'cardContentAlign',
            'style-card-meta': 'cardMetaMode',
            'style-card-discount-badge': 'cardDiscountBadge',
            'style-card-price-size': 'cardPriceSize',
            'style-card-btn-style': 'cardButtonStyle',
            'style-card-action-mode': 'cardActionMode',
            'style-card-wishlist-mode': 'cardWishlistMode',
            'style-card-img-hover': 'cardImageHover',
            'style-card-hover-lift': 'cardHoverLift'
        };
        const cardCheckboxMap = {
            'style-card-old-price': 'cardShowOldPrice',
            'style-card-status-badges': 'cardShowStatusBadges'
        };

        const syncGlobalCardUI = () => {
            const g = this.theme.globalStyles;
            if (cardPresetWrap) {
                const activePreset = g.cardPreset || 'commercial';
                cardPresetWrap.querySelectorAll('button[data-value]').forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-value') === activePreset);
                });
            }
            if (cardStyleContainer) {
                const activeCardStyle = g.cardStyle || 'elevated';
                cardStyleContainer.querySelectorAll('.card-style-opt').forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-value') === activeCardStyle);
                });
            }
            Object.entries(cardSelectMap).forEach(([elId, propKey]) => {
                const el = document.getElementById(elId);
                if (el) {
                    el.value = g[propKey] !== undefined && g[propKey] !== null
                        ? String(g[propKey])
                        : String(DEFAULT_GLOBAL_CARD_STYLES[propKey]);
                }
            });
            Object.entries(cardCheckboxMap).forEach(([elId, propKey]) => {
                const chk = document.getElementById(elId);
                if (chk) {
                    chk.checked = g[propKey] !== undefined && g[propKey] !== null
                        ? Boolean(g[propKey])
                        : Boolean(DEFAULT_GLOBAL_CARD_STYLES[propKey]);
                }
            });
        };

        if (cardPresetWrap) {
            cardPresetWrap.querySelectorAll('button[data-value]').forEach(btn => {
                btn.onclick = () => {
                    const presetKey = btn.getAttribute('data-value');
                    const presetConfig = CARD_STYLE_PRESETS[presetKey];
                    if (!presetConfig) return;
                    Object.assign(this.theme.globalStyles, presetConfig);
                    syncGlobalCardUI();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            });
        }

        Object.entries(cardSelectMap).forEach(([elId, propKey]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.onchange = () => {
                this.theme.globalStyles[propKey] = el.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        Object.entries(cardCheckboxMap).forEach(([elId, propKey]) => {
            const chk = document.getElementById(elId);
            if (!chk) return;
            chk.onchange = () => {
                this.theme.globalStyles[propKey] = chk.checked;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        const cardsResetBtn = document.getElementById('style-cards-reset');
        if (cardsResetBtn) {
            cardsResetBtn.onclick = () => {
                Object.assign(this.theme.globalStyles, CARD_STYLE_PRESETS.commercial);
                syncGlobalCardUI();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
                if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Estilo de tarjetas restablecido', 'info');
                }
            };
        }

        syncGlobalCardUI();

        // =====================================================================
        // 4.C SISTEMA GLOBAL DE PÁGINA DE DETALLE DEL PRODUCTO
        // =====================================================================
        const DETAIL_STYLE_PRESETS = {
            conversion: {
                detailPreset: 'conversion',
                detailInfoStyle: 'buybox',
                detailStickyMode: 'sticky_info',
                detailGalleryPosition: 'left',
                detailLayoutRatio: '50_50',
                detailGalleryLayout: 'bottom',
                detailGalleryArrows: true,
                detailImageAspect: 'square',
                detailImageFit: 'cover',
                detailImageZoom: true,
                detailBuyLayout: 'standard',
                detailVariantStyle: 'rounded',
                detailShowBreadcrumbs: true,
                detailShowMeta: true,
                detailShowSku: true,
                detailShowSavingsBadge: true,
                detailShowStock: true,
                detailShowTrustStrip: true,
                detailShowShare: true,
                detailShowSpecs: true,
                detailSpecsOpen: 'collapsed',
                detailShowPolicies: true,
                detailShowRelated: true,
                detailRelatedCols: '4'
            },
            fashion_lookbook: {
                detailPreset: 'fashion_lookbook',
                detailInfoStyle: 'clean',
                detailStickyMode: 'sticky_info',
                detailGalleryPosition: 'left',
                detailLayoutRatio: '60_40',
                detailGalleryLayout: 'grid',
                detailGalleryArrows: true,
                detailImageAspect: 'portrait',
                detailImageFit: 'cover',
                detailImageZoom: true,
                detailBuyLayout: 'stacked',
                detailVariantStyle: 'pills',
                detailShowBreadcrumbs: true,
                detailShowMeta: true,
                detailShowSku: false,
                detailShowSavingsBadge: true,
                detailShowStock: true,
                detailShowTrustStrip: true,
                detailShowShare: true,
                detailShowSpecs: true,
                detailSpecsOpen: 'collapsed',
                detailShowPolicies: true,
                detailShowRelated: true,
                detailRelatedCols: '3'
            },
            tech_specs: {
                detailPreset: 'tech_specs',
                detailInfoStyle: 'card',
                detailStickyMode: 'sticky_gallery',
                detailGalleryPosition: 'left',
                detailLayoutRatio: '45_55',
                detailGalleryLayout: 'bottom',
                detailGalleryArrows: true,
                detailImageAspect: 'square',
                detailImageFit: 'contain',
                detailImageZoom: true,
                detailBuyLayout: 'side_by_side',
                detailVariantStyle: 'rounded',
                detailShowBreadcrumbs: true,
                detailShowMeta: true,
                detailShowSku: true,
                detailShowSavingsBadge: true,
                detailShowStock: true,
                detailShowTrustStrip: true,
                detailShowShare: true,
                detailShowSpecs: true,
                detailSpecsOpen: 'expanded',
                detailShowPolicies: true,
                detailShowRelated: true,
                detailRelatedCols: '4'
            },
            luxury_boutique: {
                detailPreset: 'luxury_boutique',
                detailInfoStyle: 'clean',
                detailStickyMode: 'sticky_info',
                detailGalleryPosition: 'left',
                detailLayoutRatio: '50_50',
                detailGalleryLayout: 'left',
                detailGalleryArrows: false,
                detailImageAspect: 'tall',
                detailImageFit: 'cover',
                detailImageZoom: true,
                detailBuyLayout: 'stacked',
                detailVariantStyle: 'underline',
                detailShowBreadcrumbs: false,
                detailShowMeta: true,
                detailShowSku: false,
                detailShowSavingsBadge: false,
                detailShowStock: false,
                detailShowTrustStrip: true,
                detailShowShare: true,
                detailShowSpecs: true,
                detailSpecsOpen: 'collapsed',
                detailShowPolicies: true,
                detailShowRelated: true,
                detailRelatedCols: '3'
            },
            express_sale: {
                detailPreset: 'express_sale',
                detailInfoStyle: 'card',
                detailStickyMode: 'sticky_info',
                detailGalleryPosition: 'left',
                detailLayoutRatio: '50_50',
                detailGalleryLayout: 'carousel',
                detailGalleryArrows: true,
                detailImageAspect: 'square',
                detailImageFit: 'cover',
                detailImageZoom: false,
                detailBuyLayout: 'stacked',
                detailVariantStyle: 'pills',
                detailShowBreadcrumbs: false,
                detailShowMeta: true,
                detailShowSku: false,
                detailShowSavingsBadge: true,
                detailShowStock: true,
                detailShowTrustStrip: true,
                detailShowShare: true,
                detailShowSpecs: true,
                detailSpecsOpen: 'collapsed',
                detailShowPolicies: true,
                detailShowRelated: true,
                detailRelatedCols: '4'
            },
            urban_drop: {
                detailPreset: 'urban_drop',
                detailInfoStyle: 'outlined',
                detailStickyMode: 'sticky_info',
                detailGalleryPosition: 'left',
                detailLayoutRatio: '60_40',
                detailGalleryLayout: 'stack',
                detailGalleryArrows: true,
                detailImageAspect: 'square',
                detailImageFit: 'cover',
                detailImageZoom: true,
                detailBuyLayout: 'side_by_side',
                detailVariantStyle: 'square',
                detailShowBreadcrumbs: true,
                detailShowMeta: true,
                detailShowSku: true,
                detailShowSavingsBadge: true,
                detailShowStock: true,
                detailShowTrustStrip: true,
                detailShowShare: true,
                detailShowSpecs: true,
                detailSpecsOpen: 'collapsed',
                detailShowPolicies: true,
                detailShowRelated: true,
                detailRelatedCols: '4'
            }
        };

        const DEFAULT_GLOBAL_DETAIL_STYLES = DETAIL_STYLE_PRESETS.conversion;
        Object.entries(DEFAULT_GLOBAL_DETAIL_STYLES).forEach(([k, defVal]) => {
            if (gs[k] === undefined || gs[k] === null) {
                gs[k] = defVal;
            }
        });

        const detailPresetWrap = document.getElementById('style-detail-preset');
        const detailInfoStyleWrap = document.getElementById('style-detail-info-style');

        const detailSelectMap = {
            'style-detail-gallery-pos': 'detailGalleryPosition',
            'style-detail-layout-ratio': 'detailLayoutRatio',
            'style-detail-sticky': 'detailStickyMode',
            'style-detail-gallery-layout': 'detailGalleryLayout',
            'style-detail-img-aspect': 'detailImageAspect',
            'style-detail-img-fit': 'detailImageFit',
            'style-detail-buy-layout': 'detailBuyLayout',
            'style-detail-variant-style': 'detailVariantStyle',
            'style-detail-specs-open': 'detailSpecsOpen',
            'style-detail-related-cols': 'detailRelatedCols'
        };

        const detailCheckboxMap = {
            'style-detail-gallery-arrows': 'detailGalleryArrows',
            'style-detail-img-zoom': 'detailImageZoom',
            'style-detail-breadcrumbs': 'detailShowBreadcrumbs',
            'style-detail-meta': 'detailShowMeta',
            'style-detail-savings': 'detailShowSavingsBadge',
            'style-detail-sku': 'detailShowSku',
            'style-detail-share': 'detailShowShare',
            'style-detail-stock': 'detailShowStock',
            'style-detail-trust': 'detailShowTrustStrip',
            'style-detail-specs': 'detailShowSpecs',
            'style-detail-policies': 'detailShowPolicies',
            'style-detail-related': 'detailShowRelated'
        };

        const syncGlobalDetailUI = () => {
            const g = this.theme.globalStyles;
            if (detailPresetWrap) {
                const activePreset = g.detailPreset || 'conversion';
                detailPresetWrap.querySelectorAll('button[data-value]').forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-value') === activePreset);
                });
            }
            if (detailInfoStyleWrap) {
                const activeInfoStyle = g.detailInfoStyle || 'clean';
                detailInfoStyleWrap.querySelectorAll('button[data-value]').forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-value') === activeInfoStyle);
                });
            }
            Object.entries(detailSelectMap).forEach(([elId, propKey]) => {
                const el = document.getElementById(elId);
                if (el) {
                    el.value = g[propKey] !== undefined && g[propKey] !== null
                        ? String(g[propKey])
                        : String(DEFAULT_GLOBAL_DETAIL_STYLES[propKey]);
                }
            });
            Object.entries(detailCheckboxMap).forEach(([elId, propKey]) => {
                const chk = document.getElementById(elId);
                if (chk) {
                    chk.checked = g[propKey] !== undefined && g[propKey] !== null
                        ? Boolean(g[propKey])
                        : Boolean(DEFAULT_GLOBAL_DETAIL_STYLES[propKey]);
                }
            });
        };

        if (detailPresetWrap) {
            detailPresetWrap.querySelectorAll('button[data-value]').forEach(btn => {
                btn.onclick = () => {
                    const presetKey = btn.getAttribute('data-value');
                    const presetConfig = DETAIL_STYLE_PRESETS[presetKey];
                    if (!presetConfig) return;
                    Object.assign(this.theme.globalStyles, presetConfig);
                    syncGlobalDetailUI();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            });
        }

        if (detailInfoStyleWrap) {
            detailInfoStyleWrap.querySelectorAll('button[data-value]').forEach(btn => {
                btn.onclick = () => {
                    this.theme.globalStyles.detailInfoStyle = btn.getAttribute('data-value') || 'clean';
                    syncGlobalDetailUI();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            });
        }

        Object.entries(detailSelectMap).forEach(([elId, propKey]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.onchange = () => {
                this.theme.globalStyles[propKey] = el.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        Object.entries(detailCheckboxMap).forEach(([elId, propKey]) => {
            const chk = document.getElementById(elId);
            if (!chk) return;
            chk.onchange = () => {
                this.theme.globalStyles[propKey] = chk.checked;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        const detailResetBtn = document.getElementById('style-detail-reset');
        if (detailResetBtn) {
            detailResetBtn.onclick = () => {
                Object.assign(this.theme.globalStyles, DETAIL_STYLE_PRESETS.conversion);
                syncGlobalDetailUI();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
                if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Configuración de ficha de producto restablecida', 'info');
                }
            };
        }

        syncGlobalDetailUI();
        // =====================================================================
        // 5. SISTEMA GLOBAL DE FILTROS Y BÚSQUEDA
        // Los handlers leen this.theme.globalStyles EN EL MOMENTO del evento
        // (no un `gs` capturado) y se reasignan con onclick/onchange, así que
        // sobreviven al reemplazo del tema (presets, descartar, restablecer).
        // =====================================================================
        const DEFAULT_GLOBAL_FILTER_STYLES = {
            filterEnabled: true,
            filterLayout: 'drawer',
            filterShowSearch: true,
            filterShowSort: true,
            filterShowCount: true,
            filterShowCategory: true,
            filterShowPrice: true,
            filterShowOffers: true,
            filterShowAvailability: true,
            filterShowBrand: true,
            filterShowVariants: true,
            filterShowSpecs: false
        };
        const liveStyles = () => this.theme.globalStyles;

        Object.entries(DEFAULT_GLOBAL_FILTER_STYLES).forEach(([k, defVal]) => {
            if (gs[k] === undefined || gs[k] === null) {
                gs[k] = defVal;
            }
        });

        const filterLayoutWrap = document.getElementById('style-filter-layout');
        const filterCheckboxMap = {
            'style-filter-enabled': 'filterEnabled',
            'style-filter-search': 'filterShowSearch',
            'style-filter-sort': 'filterShowSort',
            'style-filter-count': 'filterShowCount',
            'style-filter-category': 'filterShowCategory',
            'style-filter-price': 'filterShowPrice',
            'style-filter-offers': 'filterShowOffers',
            'style-filter-availability': 'filterShowAvailability',
            'style-filter-brand': 'filterShowBrand',
            'style-filter-variants': 'filterShowVariants',
            'style-filter-specs': 'filterShowSpecs'
        };

        const syncGlobalFilterUI = () => {
            const g = liveStyles();
            const activeLayout = g.filterLayout || 'drawer';
            if (filterLayoutWrap) {
                filterLayoutWrap.querySelectorAll('button[data-value]').forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-value') === activeLayout);
                });
            }
            Object.entries(filterCheckboxMap).forEach(([elId, propKey]) => {
                const chk = document.getElementById(elId);
                if (chk) {
                    chk.checked = g[propKey] !== undefined && g[propKey] !== null
                        ? Boolean(g[propKey])
                        : DEFAULT_GLOBAL_FILTER_STYLES[propKey];
                }
            });
        };

        if (filterLayoutWrap) {
            filterLayoutWrap.querySelectorAll('button[data-value]').forEach(btn => {
                btn.onclick = () => {
                    liveStyles().filterLayout = btn.getAttribute('data-value') || 'drawer';
                    syncGlobalFilterUI();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            });
        }

        Object.entries(filterCheckboxMap).forEach(([elId, propKey]) => {
            const chk = document.getElementById(elId);
            if (chk) {
                chk.onchange = () => {
                    liveStyles()[propKey] = chk.checked;
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            }
        });

        const filterResetBtn = document.getElementById('style-filters-reset');
        if (filterResetBtn) {
            filterResetBtn.onclick = () => {
                Object.assign(liveStyles(), DEFAULT_GLOBAL_FILTER_STYLES);
                syncGlobalFilterUI();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
                if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Configuración global de filtros restablecida', 'info');
                }
            };
        }

        syncGlobalFilterUI();

        // =====================================================================
        // 6. SISTEMA GLOBAL DEL BUSCADOR DE PRODUCTOS
        // =====================================================================
        const DEFAULT_GLOBAL_SEARCH_STYLES = {
            searchEnabled: true,
            searchMode: 'predictive',
            searchNavbarVariant: 'auto',
            searchMobileMode: 'fullscreen',
            searchInputStyle: 'sync',
            searchInputSize: 'normal',
            searchButtonMode: 'icon',
            searchAnim: 'slide_up',
            searchPlaceholder: 'Buscar productos...',
            searchButtonLabel: 'Buscar',
            searchEmptyMessage: 'No encontramos productos para tu búsqueda',
            searchMinChars: 2,
            searchDebounceMs: 250,
            searchMaxSuggestions: 6,
            searchShowProductImg: true,
            searchShowProductPrice: true,
            searchShowProductDiscount: true,
            searchShowProductCategory: true,
            searchShowProductBrand: false,
            searchSuggestCategories: true,
            searchSuggestBrands: true,
            searchShowRecent: true,
            searchPopularTerms: '',
            searchCategoryScope: 'none',
            searchAdvancedEnabled: false,
            searchMatchVariants: true,
            searchMatchSpecs: true,
            searchAdvCategory: true,
            searchAdvBrand: true,
            searchAdvPrice: true,
            searchAdvAvailability: true,
            searchAdvVariants: true,
            searchAdvSpecs: false
        };

        Object.entries(DEFAULT_GLOBAL_SEARCH_STYLES).forEach(([k, defVal]) => {
            if (gs[k] === undefined || gs[k] === null) {
                gs[k] = defVal;
            }
        });

        const searchModeWrap = document.getElementById('style-search-mode');
        const searchLiveGroup = document.getElementById('style-search-live-group');
        const searchPredictiveExtras = document.getElementById('style-search-predictive-extras');
        const searchAdvCriteriaGroup = document.getElementById('style-search-adv-criteria-group');

        const searchSelectMap = {
            'style-search-navbar-variant': 'searchNavbarVariant',
            'style-search-mobile-mode': 'searchMobileMode',
            'style-search-category-scope': 'searchCategoryScope',
            'style-search-input-style': 'searchInputStyle',
            'style-search-input-size': 'searchInputSize',
            'style-search-button-mode': 'searchButtonMode',
            'style-search-anim': 'searchAnim',
            'style-search-min-chars': 'searchMinChars',
            'style-search-debounce-ms': 'searchDebounceMs',
            'style-search-max-suggestions': 'searchMaxSuggestions'
        };

        const searchTextMap = {
            'style-search-placeholder': 'searchPlaceholder',
            'style-search-button-label': 'searchButtonLabel',
            'style-search-empty-message': 'searchEmptyMessage',
            'style-search-popular-terms': 'searchPopularTerms'
        };

        const searchCheckboxMap = {
            'style-search-enabled': 'searchEnabled',
            'style-search-show-img': 'searchShowProductImg',
            'style-search-show-price': 'searchShowProductPrice',
            'style-search-show-discount': 'searchShowProductDiscount',
            'style-search-show-category': 'searchShowProductCategory',
            'style-search-show-brand': 'searchShowProductBrand',
            'style-search-show-recent': 'searchShowRecent',
            'style-search-match-variants': 'searchMatchVariants',
            'style-search-match-specs': 'searchMatchSpecs',
            'style-search-advanced-enabled': 'searchAdvancedEnabled',
            'style-search-adv-brand': 'searchAdvBrand',
            'style-search-adv-price': 'searchAdvPrice',
            'style-search-adv-availability': 'searchAdvAvailability',
            'style-search-adv-variants': 'searchAdvVariants',
            'style-search-adv-specs': 'searchAdvSpecs'
        };

        const syncGlobalSearchUI = () => {
            const g = liveStyles();
            const activeMode = g.searchMode || 'predictive';

            if (searchModeWrap) {
                searchModeWrap.querySelectorAll('button[data-value]').forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-value') === activeMode);
                });
            }

            // Mostrar únicamente las opciones pertinentes según la modalidad seleccionada
            if (searchLiveGroup) {
                searchLiveGroup.classList.toggle('hidden', activeMode === 'traditional');
            }
            if (searchPredictiveExtras) {
                searchPredictiveExtras.classList.toggle('hidden', activeMode === 'instant');
            }
            if (searchAdvCriteriaGroup) {
                searchAdvCriteriaGroup.classList.toggle('hidden', !g.searchAdvancedEnabled);
            }

            Object.entries(searchSelectMap).forEach(([elId, propKey]) => {
                const el = document.getElementById(elId);
                if (el) {
                    el.value = g[propKey] !== undefined && g[propKey] !== null
                        ? String(g[propKey])
                        : String(DEFAULT_GLOBAL_SEARCH_STYLES[propKey]);
                }
            });

            Object.entries(searchTextMap).forEach(([elId, propKey]) => {
                const el = document.getElementById(elId);
                if (el && document.activeElement !== el) {
                    el.value = g[propKey] !== undefined && g[propKey] !== null
                        ? String(g[propKey])
                        : String(DEFAULT_GLOBAL_SEARCH_STYLES[propKey]);
                }
            });

            Object.entries(searchCheckboxMap).forEach(([elId, propKey]) => {
                const chk = document.getElementById(elId);
                if (chk) {
                    chk.checked = g[propKey] !== undefined && g[propKey] !== null
                        ? Boolean(g[propKey])
                        : Boolean(DEFAULT_GLOBAL_SEARCH_STYLES[propKey]);
                }
            });

            const suggestCatsChk = document.getElementById('style-search-suggest-cats');
            if (suggestCatsChk) {
                suggestCatsChk.checked = g.searchSuggestCategories !== false;
            }
        };

        if (searchModeWrap) {
            searchModeWrap.querySelectorAll('button[data-value]').forEach(btn => {
                btn.onclick = () => {
                    liveStyles().searchMode = btn.getAttribute('data-value') || 'predictive';
                    syncGlobalSearchUI();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            });
        }

        Object.entries(searchSelectMap).forEach(([elId, propKey]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.onchange = () => {
                const isNumeric = propKey === 'searchMinChars' || propKey === 'searchDebounceMs' || propKey === 'searchMaxSuggestions';
                liveStyles()[propKey] = isNumeric ? parseInt(el.value, 10) : el.value;
                syncGlobalSearchUI();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        Object.entries(searchTextMap).forEach(([elId, propKey]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.oninput = () => {
                liveStyles()[propKey] = el.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        Object.entries(searchCheckboxMap).forEach(([elId, propKey]) => {
            const chk = document.getElementById(elId);
            if (!chk) return;
            chk.onchange = () => {
                liveStyles()[propKey] = chk.checked;
                if (propKey === 'searchAdvBrand') {
                    liveStyles().searchAdvCategory = chk.checked;
                }
                syncGlobalSearchUI();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        const suggestCatsChk = document.getElementById('style-search-suggest-cats');
        if (suggestCatsChk) {
            suggestCatsChk.onchange = () => {
                liveStyles().searchSuggestCategories = suggestCatsChk.checked;
                liveStyles().searchSuggestBrands = suggestCatsChk.checked;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        const searchResetBtn = document.getElementById('style-search-reset');
        if (searchResetBtn) {
            searchResetBtn.onclick = () => {
                Object.assign(liveStyles(), DEFAULT_GLOBAL_SEARCH_STYLES);
                syncGlobalSearchUI();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
                if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Configuración del buscador restablecida', 'info');
                }
            };
        }

        syncGlobalSearchUI();

        // =====================================================================
        // PIE DE PÁGINA GLOBAL (FOOTER)
        // =====================================================================
        const DEFAULT_FOOTER_DESCRIPTION = 'Bienvenido a nuestra tienda online. Descubre nuestro catálogo con los mejores productos.';
        const DEFAULT_GLOBAL_FOOTER_STYLES = {
            footerLayout: 'classic',
            footerTone: 'secondary',
            footerBrandMode: 'text',
            footerDescription: DEFAULT_FOOTER_DESCRIPTION,
            footerCopyrightText: '',
            footerShowSocial: true,
            footerShowContact: true,
            footerShowCategories: true,
            footerShowPages: true,
            footerShowCredit: true
        };

        const footerLayoutWrap = document.getElementById('style-footer-layout');
        const footerToneSel = document.getElementById('style-footer-tone');
        const footerBrandModeSel = document.getElementById('style-footer-brand-mode');
        const footerDescInput = document.getElementById('style-footer-description');
        const footerCopyInput = document.getElementById('style-footer-copyright');
        const footerCheckboxMap = {
            'style-footer-show-social': 'footerShowSocial',
            'style-footer-show-contact': 'footerShowContact',
            'style-footer-show-categories': 'footerShowCategories',
            'style-footer-show-pages': 'footerShowPages',
            'style-footer-show-credit': 'footerShowCredit'
        };

        const syncFooterUI = () => {
            const s = liveStyles();
            const activeFooterLayout = s.footerLayout || 'classic';
            if (footerLayoutWrap) {
                footerLayoutWrap.querySelectorAll('button[data-value]').forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-value') === activeFooterLayout);
                });
            }
            if (footerToneSel) footerToneSel.value = s.footerTone || 'secondary';
            if (footerBrandModeSel) footerBrandModeSel.value = s.footerBrandMode || 'text';
            if (footerDescInput) {
                footerDescInput.value = s.footerDescription !== undefined && s.footerDescription !== null
                    ? String(s.footerDescription)
                    : DEFAULT_FOOTER_DESCRIPTION;
            }
            if (footerCopyInput) {
                footerCopyInput.value = s.footerCopyrightText !== undefined && s.footerCopyrightText !== null
                    ? String(s.footerCopyrightText)
                    : '';
            }
            Object.entries(footerCheckboxMap).forEach(([elId, propKey]) => {
                const chk = document.getElementById(elId);
                if (chk) {
                    chk.checked = s[propKey] !== undefined && s[propKey] !== null ? Boolean(s[propKey]) : true;
                }
            });
        };

        if (footerLayoutWrap) {
            footerLayoutWrap.querySelectorAll('button[data-value]').forEach(btn => {
                btn.onclick = () => {
                    liveStyles().footerLayout = btn.getAttribute('data-value') || 'classic';
                    syncFooterUI();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                };
            });
        }

        if (footerToneSel) {
            footerToneSel.onchange = () => {
                liveStyles().footerTone = footerToneSel.value || 'secondary';
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        if (footerBrandModeSel) {
            footerBrandModeSel.onchange = () => {
                liveStyles().footerBrandMode = footerBrandModeSel.value || 'text';
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        if (footerDescInput) {
            footerDescInput.oninput = () => {
                liveStyles().footerDescription = footerDescInput.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        if (footerCopyInput) {
            footerCopyInput.oninput = () => {
                liveStyles().footerCopyrightText = footerCopyInput.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        Object.entries(footerCheckboxMap).forEach(([elId, propKey]) => {
            const chk = document.getElementById(elId);
            if (!chk) return;
            chk.onchange = () => {
                liveStyles()[propKey] = chk.checked;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        });

        const footerResetBtn = document.getElementById('style-footer-reset');
        if (footerResetBtn) {
            footerResetBtn.onclick = () => {
                Object.assign(liveStyles(), DEFAULT_GLOBAL_FOOTER_STYLES);
                syncFooterUI();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
                if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Configuración del pie de página restablecida', 'info');
                }
            };
        }

        syncFooterUI();
        if (Storevo.EditorUI && typeof Storevo.EditorUI.enhanceGlobalStylesPanel === 'function') {
            Storevo.EditorUI.enhanceGlobalStylesPanel();
        }
    },

    syncFontPairHighlight: function() {
        const gs = this.theme.globalStyles || {};
        const fontPairsContainer = document.getElementById('style-font-pairs');
        if (!fontPairsContainer) return;
        fontPairsContainer.querySelectorAll('.font-pair-opt').forEach(btn => {
            const match = btn.getAttribute('data-heading') === (gs.headingFont || 'Inter')
                && btn.getAttribute('data-body') === (gs.bodyFont || 'Inter');
            btn.classList.toggle('is-selected', match);
        });
    },

    previousThemeSnapshot: null,
    activePresetCategory: 'all',
    activePresetId: null,
    presetsIndex: null,
    presetsIndexPromise: null,
    baseThemeDefaults: null,
    baseThemePromise: null,
    presetConfigCache: {},

    getPresetsDefinitions: function() {
        return Array.isArray(this.presetsIndex) ? this.presetsIndex : [];
    },

    ensurePresetsIndexLoaded: function() {
        if (Array.isArray(this.presetsIndex)) {
            return Promise.resolve(this.presetsIndex);
        }
        if (this.presetsIndexPromise) {
            return this.presetsIndexPromise;
        }
        this.presetsIndexPromise = fetch('/theme-templates/index.json', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => {
                this.presetsIndex = Array.isArray(data) ? data : [];
                return this.presetsIndex;
            })
            .catch(err => {
                console.error('[Storevo.ThemeEditor] Error cargando índice de plantillas:', err);
                this.presetsIndex = [];
                return [];
            })
            .finally(() => {
                this.presetsIndexPromise = null;
            });
        return this.presetsIndexPromise;
    },

    ensureBaseThemeLoaded: function() {
        if (this.baseThemeDefaults) {
            return Promise.resolve(this.baseThemeDefaults);
        }
        if (this.baseThemePromise) {
            return this.baseThemePromise;
        }
        this.baseThemePromise = fetch('/theme-templates/base-theme.json', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => {
                this.baseThemeDefaults = data || { globalStyles: {}, sectionDefaults: {} };
                return this.baseThemeDefaults;
            })
            .finally(() => {
                this.baseThemePromise = null;
            });
        return this.baseThemePromise;
    },

    interpolatePresetTokens: function(node) {
        const name = this.storeName || 'Nuestra Tienda';
        const nameUpper = name.toUpperCase();
        if (typeof node === 'string') {
            return node
                .replace(/\{\{storeNameUpper\}\}/g, nameUpper)
                .replace(/\{\{storeName\}\}/g, name);
        }
        if (Array.isArray(node)) {
            return node.map(item => this.interpolatePresetTokens(item));
        }
        if (node && typeof node === 'object') {
            const out = {};
            Object.keys(node).forEach(k => {
                out[k] = this.interpolatePresetTokens(node[k]);
            });
            return out;
        }
        return node;
    },

    hydratePresetWithBase: function(diffConfig, baseTheme) {
        // Soportar tanto JSON directo { globalStyles, sections, pages } como envuelto en { config: { ... } }
        const rawConfig = (diffConfig && diffConfig.config && typeof diffConfig.config === 'object')
            ? diffConfig.config
            : (diffConfig || {});

        const baseGs = (baseTheme && baseTheme.globalStyles) || {};
        const secDefaultsMap = (baseTheme && baseTheme.sectionDefaults) || {};
        const mergedGlobalStyles = Object.assign({}, baseGs, rawConfig.globalStyles || {});

        const hydrateSection = (sec) => {
            if (!sec || !sec.type) return sec;
            const typeDefaults = secDefaultsMap[sec.type] || {};
            const mergedSettings = Object.assign({}, typeDefaults, sec.settings || {});
            const out = {
                id: sec.id,
                type: sec.type,
                enabled: sec.enabled !== undefined ? Boolean(sec.enabled) : true,
                settings: mergedSettings
            };
            if (sec.type === 'catalog_results' || sec.type === 'product_main' || sec.locked === true) {
                out.locked = true;
            }
            return out;
        };

        const rawHomeList = Array.isArray(rawConfig.sections)
            ? rawConfig.sections
            : (rawConfig.pages && Array.isArray(rawConfig.pages.home) ? rawConfig.pages.home : []);

        const homeSections = rawHomeList.map(hydrateSection);

        const pages = {};
        if (rawConfig.pages && typeof rawConfig.pages === 'object') {
            Object.keys(rawConfig.pages).forEach(pageKey => {
                const list = rawConfig.pages[pageKey];
                pages[pageKey] = Array.isArray(list) ? list.map(hydrateSection) : [];
            });
        }
        if (!Array.isArray(pages.home) || pages.home.length === 0) {
            pages.home = JSON.parse(JSON.stringify(homeSections));
        }

        const hydrated = {
            globalStyles: mergedGlobalStyles,
            sections: homeSections,
            pages: pages
        };
        return this.interpolatePresetTokens(hydrated);
    },

    loadPresetConfigById: function(presetId) {
        const cleanId = String(presetId || '').trim();
        if (!cleanId) return Promise.reject(new Error('ID de plantilla inválido'));

        const fetchDiffPromise = (this.presetConfigCache && this.presetConfigCache[cleanId])
            ? Promise.resolve(this.presetConfigCache[cleanId])
            : fetch(`/theme-templates/${encodeURIComponent(cleanId)}.json`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            })
                .then(res => {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.json();
                })
                .then(rawDiff => {
                    if (!this.presetConfigCache) this.presetConfigCache = {};
                    this.presetConfigCache[cleanId] = rawDiff;
                    return rawDiff;
                });

        return Promise.all([this.ensureBaseThemeLoaded(), fetchDiffPromise])
            .then(([baseTheme, rawDiff]) => {
                const diffClone = JSON.parse(JSON.stringify(rawDiff));
                return this.hydratePresetWithBase(diffClone, baseTheme);
            });
    },

    loadAndApplyPreset: function(presetMeta, triggerBtn) {
        if (!presetMeta || !presetMeta.id) return;
        const labelEl = triggerBtn ? triggerBtn.querySelector('span') : null;
        const originalText = labelEl ? labelEl.textContent : '';

        if (triggerBtn) {
            triggerBtn.disabled = true;
            if (labelEl) labelEl.textContent = 'Cargando plantilla...';
        }

        this.loadPresetConfigById(presetMeta.id)
            .then(resolvedConfig => {
                try {
                    this.applyPreset(Object.assign({}, presetMeta, { config: resolvedConfig }));
                } catch (applyErr) {
                    console.error('[Storevo.ThemeEditor] Error aplicando la plantilla en el editor:', applyErr);
                    if (triggerBtn) {
                        triggerBtn.disabled = false;
                        if (labelEl) labelEl.textContent = originalText;
                    }
                    if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show('Error al aplicar la plantilla en el editor', 'error');
                    }
                }
            })
            .catch(err => {
                console.error('[Storevo.ThemeEditor] No se pudo descargar el JSON de la plantilla:', err);
                if (triggerBtn) {
                    triggerBtn.disabled = false;
                    if (labelEl) labelEl.textContent = originalText;
                }
                if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('No se pudo cargar la plantilla seleccionada', 'error');
                }
            });
    },

    filterPresets: function(category) {
        this.activePresetCategory = category || 'all';
        const pillsWrap = document.getElementById('preset-category-pills');
        if (pillsWrap) {
            pillsWrap.querySelectorAll('.preset-cat-btn').forEach(btn => {
                const isSelected = btn.getAttribute('data-cat') === this.activePresetCategory;
                btn.className = isSelected
                    ? 'preset-cat-btn px-2.5 py-1 rounded-lg text-[11px] font-bold bg-storevo-500 text-white whitespace-nowrap transition'
                    : 'preset-cat-btn px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950 text-slate-400 hover:text-white border border-slate-800 whitespace-nowrap transition';
            });
        }
        this.renderPresetsCatalog();
    },

    renderPresetsCatalog: function() {
        const container = document.getElementById('presets-cards-container');
        if (!container) return;

        if (!Array.isArray(this.presetsIndex)) {
            container.innerHTML = `
                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                    <p class="text-xs font-bold text-slate-300">Cargando catálogo de plantillas...</p>
                </div>
            `;
            this.ensurePresetsIndexLoaded().then(() => {
                this.renderPresetsCatalog();
            });
            return;
        }

        container.innerHTML = '';

        const allPresets = this.presetsIndex;
        const allBtn = document.querySelector('#preset-category-pills .preset-cat-btn[data-cat="all"]');
        if (allBtn) {
            allBtn.textContent = `Todas (${allPresets.length})`;
        }

        const filtered = this.activePresetCategory === 'all'
            ? allPresets
            : allPresets.filter(p => p.category === this.activePresetCategory);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
                    <p class="text-xs font-bold text-slate-300">No hay plantillas en esta categoría todavía</p>
                    <p class="text-[11px] text-slate-500">Selecciona «Todas» para explorar los diseños disponibles.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(preset => {
            const isCurrent = this.activePresetId === preset.id;
            const card = document.createElement('div');
            card.className = `bg-slate-950 border rounded-2xl p-4 space-y-3 transition-all ${
                isCurrent ? 'border-storevo-500 ring-1 ring-storevo-500/40' : 'border-slate-800 hover:border-storevo-500/50'
            }`;

            const swatchesHtml = (preset.colors || []).map(hex =>
                `<span class="w-4 h-4 rounded-full border border-slate-700 inline-block shadow-sm" style="background-color: ${hex};"></span>`
            ).join('');

            card.innerHTML = `
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-storevo-400">${this.escapeHtml(preset.tag)}</span>
                        <h4 class="text-sm font-bold text-white mt-0.5">${this.escapeHtml(preset.name)}</h4>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">${swatchesHtml}</div>
                </div>
                <div class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800/90 text-[10px] font-bold text-slate-300">
                    ${this.escapeHtml(preset.layoutSummary || '')}
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">${this.escapeHtml(preset.description)}</p>
                <button type="button" class="apply-preset-btn w-full py-2.5 px-3 ${
                isCurrent
                    ? 'bg-storevo-500/20 text-storevo-300 border-storevo-500/40'
                    : 'bg-slate-800 hover:bg-storevo-500 text-slate-200 hover:text-white border-slate-700'
            } border rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
                    <span>${isCurrent ? '✓ Plantilla activa en vista previa' : 'Probar plantilla en vista previa'}</span>
                </button>
            `;

            const applyBtn = card.querySelector('.apply-preset-btn');
            applyBtn.addEventListener('click', () => {
                this.loadAndApplyPreset(preset, applyBtn);
            });

            container.appendChild(card);
        });
    },

    mergeUserContentIntoPreset: function(oldSections, newSections) {
        if (!Array.isArray(oldSections) || !Array.isArray(newSections)) return;

        // Regla de propiedad:
        // La plantilla decide apariencia, estructura y textos de ejemplo.
        // El comerciante conserva SUS fotos subidas, encuadres (*ImageFit/*ImagePosX/*ImagePosY/*ImageZoom),
        // fechas de ofertas, anclas, redes y vínculos a productos/categorías/marcas.
        const PRESERVED_MEDIA_AND_DATA_KEYS = [
            // Fotos y medios subidos
            'imageUrl', 'mobileImageUrl',
            'slide2ImageUrl', 'slide2MobileImageUrl',
            'slide3ImageUrl', 'slide3MobileImageUrl',
            'slide4ImageUrl', 'slide4MobileImageUrl',
            'slide5ImageUrl', 'slide5MobileImageUrl',
            'card1ImageUrl', 'card2ImageUrl', 'card3ImageUrl', 'card4ImageUrl',
            'videoUrl', 'videoId', 'coverImageUrl',
            'item1ImageUrl', 'item2ImageUrl', 'item3ImageUrl', 'item4ImageUrl', 'item5ImageUrl', 'item6ImageUrl',
            'post1ImageUrl', 'post2ImageUrl', 'post3ImageUrl', 'post4ImageUrl',
            // Vínculos a productos, categorías, marcas, fechas y anclas
            'productId', 'productIds', 'categoryId', 'categoryIds', 'brandId', 'brandName', 'endDate',
            'manualItems', 'items', 'bulletItems',
            'layoutAnchor', 'layoutBgImageUrl', 'layoutVisibility', 'scheduleStart', 'scheduleEnd',
            // Datos propios de vitrina de marcas y redes sociales
            'handleText', 'instagramUrl', 'tiktokUrl', 'facebookUrl', 'showWhatsapp',
            'item1Name', 'item2Name', 'item3Name', 'item4Name', 'item5Name', 'item6Name',
            'item1LinkUrl', 'item2LinkUrl', 'item3LinkUrl', 'item4LinkUrl', 'item5LinkUrl', 'item6LinkUrl',
            'post1Caption', 'post2Caption', 'post3Caption', 'post4Caption',
            'post1LinkUrl', 'post2LinkUrl', 'post3LinkUrl', 'post4LinkUrl'
        ];
        const isPreservedKey = (k) => PRESERVED_MEDIA_AND_DATA_KEYS.includes(k) || /[iI]mage(Mobile)?(Url|Fit|PosX|PosY|Zoom)$/.test(k);

        const usedOldIds = new Set();

        newSections.forEach(newSec => {
            if (!newSec || !newSec.settings) return;
            const matchOld = oldSections.find(oldSec =>
                oldSec && oldSec.type === newSec.type && !usedOldIds.has(oldSec.id)
            );
            if (!matchOld || !matchOld.settings) return;

            usedOldIds.add(matchOld.id);

            Object.keys(matchOld.settings).forEach(key => {
                if (!isPreservedKey(key)) return;
                const oldVal = matchOld.settings[key];
                if (typeof oldVal === 'string' && oldVal.trim() !== '') {
                    // En spotlight_product no pisar el producto real del comerciante con '__offer__'
                    if (key === 'productId' && oldVal === '__offer__' && newSec.settings.productId && newSec.settings.productId !== '') {
                        return;
                    }
                    newSec.settings[key] = oldVal;
                } else if (typeof oldVal === 'number' || typeof oldVal === 'boolean') {
                    newSec.settings[key] = oldVal;
                } else if (Array.isArray(oldVal) && oldVal.length > 0) {
                    newSec.settings[key] = JSON.parse(JSON.stringify(oldVal));
                }
            });

            // Si el comerciante tenía una vitrina de productos o carrusel de marcas vinculado a una categoría/marca/selección propia, conservar su origen (source)
            if ((newSec.type === 'product_grid' || newSec.type === 'brand_carousel') && matchOld.settings.source) {
                const oldSource = String(matchOld.settings.source).trim();
                const hasCustomBinding =
                    (oldSource === 'CATEGORY' && matchOld.settings.categoryId) ||
                    (oldSource === 'BRAND' && matchOld.settings.brandName) ||
                    (oldSource === 'MANUAL' && matchOld.settings.productIds) ||
                    (newSec.type === 'brand_carousel' && (oldSource === 'AUTO' || oldSource === 'MANUAL'));
                if (hasCustomBinding) {
                    newSec.settings.source = oldSource;
                }
            }
        });
    },

    applyPreset: function(preset) {
        if (!preset || !preset.config) return;

        // Guardar copia de seguridad antes del primer cambio de plantilla para poder Deshacer
        if (!this.previousThemeSnapshot) {
            this.previousThemeSnapshot = JSON.parse(JSON.stringify(this.theme));
        }

        const keepChk = document.getElementById('preset-keep-content-chk');
        const keepContent = keepChk ? keepChk.checked : true;

        const sourceTheme = this.previousThemeSnapshot || this.theme || {};
        const nextTheme = JSON.parse(JSON.stringify(preset.config));
        const currentCustomPages = Array.isArray(sourceTheme.customPages)
            ? JSON.parse(JSON.stringify(sourceTheme.customPages))
            : ((this.theme && Array.isArray(this.theme.customPages))
                ? JSON.parse(JSON.stringify(this.theme.customPages))
                : []);

        if (keepContent) {
            const baseOldSections = Array.isArray(sourceTheme.sections) ? sourceTheme.sections : [];
            this.mergeUserContentIntoPreset(baseOldSections, nextTheme.sections);

            if (sourceTheme.pages && nextTheme.pages && typeof nextTheme.pages === 'object') {
                Object.keys(nextTheme.pages).forEach(pageKey => {
                    const oldPageSecs = sourceTheme.pages[pageKey];
                    const newPageSecs = nextTheme.pages[pageKey];
                    if (Array.isArray(oldPageSecs) && Array.isArray(newPageSecs)) {
                        this.mergeUserContentIntoPreset(oldPageSecs, newPageSecs);
                    }
                });
            }
            if (sourceTheme.pages && typeof sourceTheme.pages === 'object') {
                nextTheme.pages = nextTheme.pages || {};
                Object.keys(sourceTheme.pages).forEach(pageKey => {
                    if (pageKey.startsWith('page:') && !nextTheme.pages[pageKey]) {
                        nextTheme.pages[pageKey] = JSON.parse(JSON.stringify(sourceTheme.pages[pageKey]));
                    }
                });
            }
        }

        const prevGs = (sourceTheme && sourceTheme.globalStyles) || (this.theme && this.theme.globalStyles) || {};
        const preservedMerchantStyles = {};
        ['navbarBrandMode', 'navbarLogoUrl', 'navbarLogoDarkUrl', 'navbarLogoSize'].forEach(k => {
            if (prevGs[k] !== undefined && prevGs[k] !== null && prevGs[k] !== '') {
                preservedMerchantStyles[k] = prevGs[k];
            }
        });
        if (keepContent) {
            [
                'footerBrandMode',
                'footerDescription',
                'footerCopyrightText',
                'footerShowSocial',
                'footerShowContact',
                'footerShowCategories',
                'footerShowPages',
                'footerShowCredit'
            ].forEach(k => {
                if (prevGs[k] !== undefined && prevGs[k] !== null) {
                    preservedMerchantStyles[k] = prevGs[k];
                }
            });
            if (typeof prevGs.searchPopularTerms === 'string' && prevGs.searchPopularTerms.trim() !== '') {
                preservedMerchantStyles.searchPopularTerms = prevGs.searchPopularTerms;
            }
        }

        this.theme = nextTheme;
        this.theme.customPages = currentCustomPages;
        this.theme.globalStyles = Object.assign({}, nextTheme.globalStyles || {}, preservedMerchantStyles);
        this.activePresetId = preset.id;
        this.activeSectionId = null;

        // Garantizar que pages.home, pages.catalog y pages.product estén completos y sincronizados con this.theme.sections
        this.ensurePagesStructure();

        // Sincronizar todos los controles del panel de estilos globales
        this.initGlobalStylesInputs();

        const undoBanner = document.getElementById('preset-undo-banner');
        if (undoBanner) undoBanner.classList.remove('hidden');

        // Reemplazo seguro de closeSettingsModal() (que no existía)
        if (typeof this.closeSettingsModal === 'function') {
            this.closeSettingsModal();
        } else {
            const panelInspector = document.getElementById('panel-section-inspector');
            if (panelInspector) panelInspector.classList.add('hidden');
            this.highlightSectionInIframe(null);
        }

        this.renderSectionsList();
        this.renderPresetsCatalog();
        this.pushLiveStylesToIframe();
        this.scheduleAutoSave(true);

        if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show(
                keepContent
                    ? `Plantilla «${preset.name}» aplicada conservando tus fotos y productos`
                    : `Plantilla «${preset.name}» aplicada en tu tienda`,
                'success'
            );
        }
    },

    undoPresetApplication: function() {
        if (!this.previousThemeSnapshot) return;
        this.theme = JSON.parse(JSON.stringify(this.previousThemeSnapshot));
        this.previousThemeSnapshot = null;
        this.activePresetId = null;
        this.activeSectionId = null;

        this.ensurePagesStructure();

        const undoBanner = document.getElementById('preset-undo-banner');
        if (undoBanner) undoBanner.classList.add('hidden');

        this.initGlobalStylesInputs();

        if (typeof this.closeSettingsModal === 'function') {
            this.closeSettingsModal();
        } else {
            const panelInspector = document.getElementById('panel-section-inspector');
            if (panelInspector) panelInspector.classList.add('hidden');
            this.highlightSectionInIframe(null);
        }

        this.renderSectionsList();
        this.renderPresetsCatalog();
        this.pushLiveStylesToIframe();
        this.scheduleAutoSave(true);

        if (window.Storevo && Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show('Se restauró tu diseño anterior', 'info');
        }
    },

    renderAddSectionModalCatalog: function() {
        const grid = document.getElementById('available-sections-grid');
        if (!grid) return;
        if (Storevo.EditorUI && typeof Storevo.EditorUI.renderCategorizedAddSectionModal === 'function') {
            Storevo.EditorUI.renderCategorizedAddSectionModal(grid, this.catalogDefinitions, (type) => this.addSection(type));
            return;
        }
        grid.innerHTML = '';

        Object.entries(this.catalogDefinitions).forEach(([type, def]) => {
            if (def.anchorOnly) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'text-left p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-storevo-500 transition flex flex-col justify-between gap-2 group';
            btn.innerHTML =
                '<div>' +
                '<p class="text-sm font-bold text-white group-hover:text-storevo-400 transition-colors">' + this.escapeHtml(def.label) + '</p>' +
                '<p class="text-xs text-slate-400 mt-1">' + this.escapeHtml(def.description) + '</p>' +
                '</div>' +
                '<span class="text-[11px] font-bold text-storevo-400 inline-flex items-center gap-1 mt-2">+ Añadir sección</span>';
            btn.addEventListener('click', () => this.addSection(type));
            grid.appendChild(btn);
        });
    },

    openAddSectionModal: function() {
        const modal = document.getElementById('add-section-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeAddSectionModal: function() {
        const modal = document.getElementById('add-section-modal');
        if (modal) modal.classList.add('hidden');
    },

    addSection: function(type) {
        const def = this.catalogDefinitions[type];
        if (!def || def.anchorOnly) return;

        const newSection = {
            id: 'sec_' + Date.now().toString(36),
            type: type,
            enabled: true,
            locked: false,
            settings: JSON.parse(JSON.stringify(def.defaultSettings || {}))
        };

        const list = this.getActivePageSections(true);
        // Si estamos en una página de categoría o catálogo y agregamos un banner/contador, colocarlo arriba del listado si el listado es el único bloque
        if ((this.activePage === 'catalog' || (this.activePage && this.activePage.startsWith('category:')))
            && (type === 'hero_banner' || type === 'countdown_promo' || type === 'promo_banner' || type === 'announcement_bar')
            && list.length === 1 && list[0].type === 'catalog_results') {
            list.unshift(newSection);
        } else {
            list.push(newSection);
        }

        this.closeAddSectionModal();
        this.renderPageSelector();
        this.syncPageContextBars();
        this.renderSectionsList();
        this.openInspector(newSection.id);
        this.scheduleAutoSave(true);
    },

    scheduleAutoSave: function(reloadIframe = true) {
        this.markUnpublishedChanges(true);
        this.setSyncStatus('pending', 'Guardando borrador...');
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.autoSaveTimer = null; // switchPage usa este valor para saber si hay un guardado pendiente
            this.saveDraft(false, reloadIframe);
        }, 650);
    },

    saveDraft: function(showToast = false, reloadIframe = true) {
        this.setSyncStatus('saving', 'Sincronizando vista previa...');
        const overlay = document.getElementById('preview-loading-overlay');
        if (reloadIframe && overlay) overlay.classList.remove('hidden');

        fetch(`/dashboard/${this.slug}/template/save-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.theme)
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    if (reloadIframe) {
                        this.reloadPreviewIframe();
                    }
                    this.setSyncStatus('synced', 'Borrador guardado');
                    if (showToast && Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show(data.message, 'success');
                    }
                } else {
                    if (overlay) overlay.classList.add('hidden');
                    this.setSyncStatus('error', 'Error al sincronizar');
                    if (Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show(data.message || 'Error al guardar borrador', 'error');
                    }
                }
            })
            .catch(() => {
                if (overlay) overlay.classList.add('hidden');
                this.setSyncStatus('error', 'Sin conexión');
            });
    },

    publish: function() {
        const btn = document.getElementById('btn-publish-theme');
        if (btn) btn.disabled = true;

        fetch(`/dashboard/${this.slug}/template/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.theme)
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.markUnpublishedChanges(false);
                    this.reloadPreviewIframe();
                    this.setSyncStatus('synced', '¡Publicado en tienda!');
                    if (Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show(data.message, 'success');
                    }
                } else if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show(data.message || 'No se pudo publicar', 'error');
                }
            })
            .catch(() => {
                if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Error de red al publicar.', 'error');
                }
            })
            .finally(() => {
                if (btn) btn.disabled = false;
            });
    },

    discardDraft: function() {
        const executeDiscard = () => {
            fetch(`/dashboard/${this.slug}/template/discard-draft`, { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.theme) {
                        this.theme = data.theme;
                        this.ensurePagesStructure();
                        this.markUnpublishedChanges(false);
                        this.closeInspector();
                        this.renderPageSelector();
                        this.syncPageContextBars();
                        this.renderSectionsList();
                        this.initGlobalStylesInputs();
                        this.reloadPreviewIframe();
                        if (Storevo.UI && Storevo.UI.Toast) {
                            Storevo.UI.Toast.show(data.message, 'success');
                        }
                    }
                });
        };

        if (Storevo.UI && Storevo.UI.Modal && typeof Storevo.UI.Modal.showConfirm === 'function') {
            Storevo.UI.Modal.showConfirm('¿Descartar los cambios actuales del borrador y volver a tu diseño publicado?', executeDiscard);
        } else if (confirm('¿Descartar los cambios actuales del borrador y volver a tu diseño publicado?')) {
            executeDiscard();
        }
    },

    resetTheme: function() {
        const executeReset = () => {
            fetch(`/dashboard/${this.slug}/template/reset`, { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.theme) {
                        this.theme = data.theme;
                        this.ensurePagesStructure();
                        this.markUnpublishedChanges(true);
                        this.closeInspector();
                        this.renderPageSelector();
                        this.syncPageContextBars();
                        this.renderSectionsList();
                        this.initGlobalStylesInputs();
                        this.reloadPreviewIframe();
                        if (Storevo.UI && Storevo.UI.Toast) {
                            Storevo.UI.Toast.show(data.message, 'success');
                        }
                    }
                });
        };

        if (Storevo.UI && Storevo.UI.Modal && typeof Storevo.UI.Modal.showConfirm === 'function') {
            Storevo.UI.Modal.showConfirm('¿Restablecer el borrador a las secciones iniciales de fábrica?', executeReset);
        } else if (confirm('¿Restablecer el borrador a las secciones iniciales de fábrica?')) {
            executeReset();
        }
    },

    reloadPreviewIframe: function() {
        const iframe = document.getElementById('storefront-preview-iframe');
        const overlay = document.getElementById('preview-loading-overlay');
        if (!iframe) return;

        let previousScrollY = 0;
        try {
            if (iframe.contentWindow) {
                previousScrollY = iframe.contentWindow.scrollY || 0;
            }
        } catch (e) {}

        // Intentar actualización quirúrgica sin parpadeo blanco si el iframe ya está cargado en el mismo origen
        const canSoftRefresh = Boolean(
            iframe.contentDocument &&
            iframe.contentWindow &&
            iframe.contentDocument.getElementById('storevoMainContent')
        );

        if (canSoftRefresh) {
            const fetchUrl = `${this.previewUrl}${this.previewUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
            fetch(fetchUrl, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'text/html', 'X-Storevo-Navigation': 'partial' }
            })
                .then(res => res.ok ? res.text() : Promise.reject(new Error('HTTP ' + res.status)))
                .then(html => {
                    const parser = new DOMParser();
                    const nextDoc = parser.parseFromString(html, 'text/html');
                    const iDoc = iframe.contentDocument;
                    const iWin = iframe.contentWindow;

                    const currentMain = iDoc.getElementById('storevoMainContent');
                    const nextMain = nextDoc.getElementById('storevoMainContent');
                    if (!currentMain || !nextMain) {
                        throw new Error('Contenedor principal no encontrado');
                    }

                    // 1. Sincronizar los enlaces de páginas personalizadas en el Navbar (si se crearon, renombraron o activaron/ocultaron)
                    const currentMenu = iDoc.querySelector('#storeNavbar .sv-nav__menu');
                    const nextMenu = nextDoc.querySelector('#storeNavbar .sv-nav__menu');
                    if (currentMenu && nextMenu) {
                        currentMenu.querySelectorAll('a[data-page-slug]').forEach(el => el.remove());
                        nextMenu.querySelectorAll('a[data-page-slug]').forEach(el => {
                            currentMenu.appendChild(iDoc.importNode(el, true));
                        });
                    }
                    const currentStrip = iDoc.querySelector('#storeNavbar .sv-nav-double-strip');
                    const nextStrip = nextDoc.querySelector('#storeNavbar .sv-nav-double-strip');
                    if (currentStrip && nextStrip) {
                        currentStrip.innerHTML = nextStrip.innerHTML;
                    }
                    // 1.b. Sincronizar la identidad de la tienda (logo / nombre) en la cabecera y en el menú móvil
                    const currentLogo = iDoc.querySelector('#storeNavbar .sv-nav__logo');
                    const nextLogo = nextDoc.querySelector('#storeNavbar .sv-nav__logo');
                    if (currentLogo && nextLogo) {
                        currentLogo.className = nextLogo.className;
                        const nextLogoSize = nextLogo.getAttribute('data-logo-size');
                        if (nextLogoSize) {
                            currentLogo.setAttribute('data-logo-size', nextLogoSize);
                        } else {
                            currentLogo.removeAttribute('data-logo-size');
                        }
                        currentLogo.innerHTML = nextLogo.innerHTML;
                    }
                    const currentDrawerBrand = iDoc.querySelector('#storeNavbar .sv-drawer__header > div:first-child');
                    const nextDrawerBrand = nextDoc.querySelector('#storeNavbar .sv-drawer__header > div:first-child');
                    if (currentDrawerBrand && nextDrawerBrand) {
                        currentDrawerBrand.innerHTML = nextDrawerBrand.innerHTML;
                    }

                    // 1.c. Sincronizar el pie de página (#storeFooter) fuera de <main>
                    const currentFooter = iDoc.getElementById('storeFooter');
                    const nextFooter = nextDoc.getElementById('storeFooter');
                    if (currentFooter && nextFooter) {
                        currentFooter.replaceWith(iDoc.importNode(nextFooter, true));
                    }

                    // 2. Limpiar intervalos activos de la vista anterior y vaciar el host superior de anuncios antes de inyectar el nuevo <main>
                    if (Array.isArray(iWin.__storevoPageIntervals)) {
                        iWin.__storevoPageIntervals.forEach(id => iWin.clearInterval(id));
                        iWin.__storevoPageIntervals.length = 0;
                    }
                    const topAnnHost = iDoc.getElementById('storevoTopAnnouncementHost');
                    if (topAnnHost) {
                        topAnnHost.innerHTML = '';
                    }

                    // 2.b. Reemplazar el contenido principal (<main>) y puente de filtros
                    currentMain.innerHTML = nextMain.innerHTML;

                    const currentScriptsBox = iDoc.getElementById('storevo-page-scripts');
                    const nextScriptsBox = nextDoc.getElementById('storevo-page-scripts');
                    if (currentScriptsBox && nextScriptsBox) {
                        currentScriptsBox.innerHTML = nextScriptsBox.innerHTML;
                    }

                    // 3. Re-ejecutar scripts inline de secciones (ej. contadores regresivos y rotador de anuncios)
                    Array.from(currentMain.querySelectorAll('script:not([src])')).forEach(oldScript => {
                        const newScript = iDoc.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                        newScript.textContent = oldScript.textContent;
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    });

                    // 4. Notificar a store-layout.html para que reevalúe announcement_bar (above_menu vs below_menu), Hero Overlay y paginación
                    iDoc.dispatchEvent(new CustomEvent('storevo:page-load'));

                    if (iWin.Storevo) {
                        if (iWin.Storevo.Catalog && typeof iWin.Storevo.Catalog.init === 'function') iWin.Storevo.Catalog.init();
                        if (iWin.Storevo.ProductDetail && typeof iWin.Storevo.ProductDetail.init === 'function') iWin.Storevo.ProductDetail.init();
                        if (iWin.Storevo.Cart && typeof iWin.Storevo.Cart.init === 'function') iWin.Storevo.Cart.init();
                        if (iWin.Storevo.Router && typeof iWin.Storevo.Router.syncActiveLinks === 'function') {
                            iWin.Storevo.Router.syncActiveLinks(new URL(this.previewUrl, window.location.origin));
                        }
                    }

                    this.pushLiveStylesToIframe();
                    this.syncProductsFromIframe();
                    if (overlay) overlay.classList.add('hidden');

                    if (this.activeSectionId) {
                        this.highlightSectionInIframe(this.activeSectionId);
                    } else if (previousScrollY > 0) {
                        iWin.scrollTo(0, previousScrollY);
                    }
                    document.dispatchEvent(new CustomEvent('storevo:preview-dom-updated'));
                })
                .catch(() => {
                    // Fallback seguro a recarga estándar del iframe si algo falla
                    this.hardReloadPreviewIframe(iframe, overlay, previousScrollY);
                });
            return;
        }

        this.hardReloadPreviewIframe(iframe, overlay, previousScrollY);
    },
    hardReloadPreviewIframe: function(iframe, overlay, previousScrollY) {
        const onLoadHandler = () => {
            if (overlay) overlay.classList.add('hidden');
            this.syncProductsFromIframe();
            try {
                if (this.activeSectionId) {
                    this.highlightSectionInIframe(this.activeSectionId);
                } else if (iframe.contentWindow && previousScrollY > 0) {
                    iframe.contentWindow.scrollTo(0, previousScrollY);
                }
            } catch (e) {}
            document.dispatchEvent(new CustomEvent('storevo:preview-dom-updated'));
            iframe.removeEventListener('load', onLoadHandler);
        };

        iframe.addEventListener('load', onLoadHandler);
        iframe.src = `${this.previewUrl}&t=${Date.now()}`;
    },
    highlightSectionInIframe: function(sectionId) {
        const iframe = document.getElementById('storefront-preview-iframe');
        if (!iframe || !iframe.contentWindow) return;
        try {
            iframe.contentWindow.postMessage({
                type: 'storevo:highlight-section',
                sectionId: sectionId
            }, window.location.origin);
        } catch (e) {}
    },

    scrollToSectionInIframe: function(sectionId) {
        this.highlightSectionInIframe(sectionId);
    },

    setSyncStatus: function(state, text) {
        const statusEl = document.getElementById('editor-sync-status');
        if (!statusEl) return;

        let dotClass = 'bg-emerald-400';
        if (state === 'pending' || state === 'saving') dotClass = 'bg-orange-400 animate-pulse';
        if (state === 'error') dotClass = 'bg-red-400';

        statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span><span>${this.escapeHtml(text)}</span>`;
    },

    escapeHtml: function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.ThemeEditor.init());
} else {
    Storevo.ThemeEditor.init();
}
/* ==========================================================================
   EXTENSIÓN FASE PRODUCT_GRID (BRAND, MANUAL, FEATURED) + DEEP-LINK CATEGORÍAS
   ========================================================================== */
(function() {
    function initProductGridAndCategoryExtension() {
        if (!window.Storevo || !Storevo.ThemeEditor) return;
        const TE = Storevo.ThemeEditor;
        if (TE.__productGridExtended) return;
        TE.__productGridExtended = true;

        const bridge = document.getElementById('theme-editor-bridge');
        TE.brands = [];
        TE.manualProductsCache = new Map();

        if (bridge) {
            try {
                TE.brands = JSON.parse(bridge.getAttribute('data-brands') || '[]');
            } catch (e) {
                TE.brands = [];
            }
        }

        function parseManualIds(raw) {
            if (!raw) return [];
            if (Array.isArray(raw)) {
                return raw.map(x => parseInt(x, 10)).filter(n => !isNaN(n) && n > 0);
            }
            return String(raw).split(',')
                .map(s => parseInt(s.trim(), 10))
                .filter((n, idx, arr) => !isNaN(n) && n > 0 && arr.indexOf(n) === idx);
        }

        TE.refreshBrands = function(cb) {
            if (!TE.slug) return;
            fetch(`/dashboard/${TE.slug}/template/brands`, { headers: { 'Accept': 'application/json' } })
                .then(r => r.ok ? r.json() : [])
                .then(list => {
                    if (Array.isArray(list)) TE.brands = list;
                    if (typeof cb === 'function') cb(TE.brands);
                })
                .catch(() => {
                    if (typeof cb === 'function') cb(TE.brands);
                });
        };

        function getActiveInspectedSection() {
            if (!TE.activeSectionId) return null;
            const list = TE.getActivePageSections(false) || [];
            return list.find(s => s && s.id === TE.activeSectionId) || null;
        }

        function materializeAndSave() {
            if (TE.activePage && TE.activePage.startsWith('category:') && !TE.isCategoryCustomized(TE.activePage.substring(9))) {
                TE.ensureCategoryMaterializedOnEdit(TE.activeSectionId);
            }
            TE.scheduleAutoSave(true);
        }

        function enhanceProductGridForm() {
            const container = document.getElementById('inspector-fields-container');
            if (!container) return;

            const sec = getActiveInspectedSection();
            if (!sec || sec.type !== 'product_grid') return;

            const sourceWrap = container.querySelector('[data-field-key="source"]');
            const sourceSelect = sourceWrap ? sourceWrap.querySelector('select') : null;
            if (!sourceSelect || sourceSelect.dataset.svEnhanced === 'true') return;

            sourceSelect.dataset.svEnhanced = 'true';
            sec.settings = sec.settings || {};

            const catWrap = container.querySelector('[data-field-key="categoryId"]');
            const colsWrap = container.querySelector('[data-field-key="columnsDesktop"]');
            const colsSelect = colsWrap ? colsWrap.querySelector('select') : null;
            const limitWrap = container.querySelector('[data-field-key="limit"]');
            const limitSelect = limitWrap ? limitWrap.querySelector('select') : null;

            // Función que adapta el selector de Cantidad máxima de productos (filas de 3 vs filas de 4)
            function syncLimitOptionsForColumns(colsMode, convertRows) {
                if (!limitSelect) return;
                const isThreeCols = String(colsMode) === '3';
                let currentLimit = parseInt(sec.settings.limit || limitSelect.value || (isThreeCols ? '6' : '8'), 10);

                if (convertRows) {
                    if (isThreeCols) {
                        const map4to3 = { 4: 3, 8: 6, 12: 9, 16: 12, 24: 24 };
                        if (map4to3[currentLimit]) currentLimit = map4to3[currentLimit];
                    } else {
                        const map3to4 = { 3: 4, 6: 8, 9: 12, 12: 12, 15: 16, 24: 24 };
                        if (map3to4[currentLimit]) currentLimit = map3to4[currentLimit];
                    }
                }

                const optionsFor3 = [
                    { v: 3, t: '3 productos (1 fila)' },
                    { v: 6, t: '6 productos (2 filas)' },
                    { v: 9, t: '9 productos (3 filas)' },
                    { v: 12, t: '12 productos (4 filas)' },
                    { v: 15, t: '15 productos (5 filas)' },
                    { v: 24, t: '24 productos (8 filas)' }
                ];
                const optionsFor4 = [
                    { v: 4, t: '4 productos (1 fila)' },
                    { v: 8, t: '8 productos (2 filas)' },
                    { v: 12, t: '12 productos (3 filas)' },
                    { v: 16, t: '16 productos (4 filas)' },
                    { v: 24, t: '24 productos (6 filas)' }
                ];

                const targetList = isThreeCols ? optionsFor3 : optionsFor4;
                if (!targetList.some(o => o.v === currentLimit)) {
                    currentLimit = isThreeCols ? 6 : 8;
                }

                limitSelect.innerHTML = targetList.map(o =>
                    `<option value="${o.v}" ${o.v === currentLimit ? 'selected' : ''}>${o.t}</option>`
                ).join('');
                limitSelect.value = String(currentLimit);
                sec.settings.limit = currentLimit;
            }

            const initialCols = String(sec.settings.columnsDesktop || '4') === '3' ? '3' : '4';
            sec.settings.columnsDesktop = initialCols;
            if (colsSelect) {
                colsSelect.value = initialCols;
                syncLimitOptionsForColumns(initialCols, false);

                colsSelect.addEventListener('change', () => {
                    const nextCols = colsSelect.value === '3' ? '3' : '4';
                    sec.settings.columnsDesktop = nextCols;
                    syncLimitOptionsForColumns(nextCols, true);

                    const iframe = document.getElementById('storefront-preview-iframe');
                    if (iframe && iframe.contentDocument) {
                        const gridEl = iframe.contentDocument.getElementById('sv-grid-' + sec.id)
                            || iframe.contentDocument.querySelector(`[data-section-id="${sec.id}"] .sv-catalog-grid`);
                        if (gridEl) {
                            gridEl.setAttribute('data-cols', nextCols);
                        }
                    }
                    materializeAndSave();
                });
            }

            // Contenedor dinámico para BRAND, FEATURED y MANUAL
            const extraHost = document.createElement('div');
            extraHost.className = 'space-y-3 mt-2 pt-2 border-t border-slate-800/80';
            sourceWrap.insertAdjacentElement('afterend', extraHost);

            function renderSourceSpecificControls() {
                const src = String(sourceSelect.value || 'NEWEST').toUpperCase();
                sec.settings.source = src;

                if (catWrap) {
                    catWrap.classList.toggle('hidden', src !== 'CATEGORY');
                }

                extraHost.innerHTML = '';

                if (src === 'FEATURED') {
                    extraHost.innerHTML = `
                        <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 leading-relaxed">
                            <p class="font-bold text-amber-300 mb-0.5 inline-flex items-center gap-1.5">${Storevo.EditorUI ? Storevo.EditorUI.icon('star', 'w-3.5 h-3.5') : ''}<span>Productos Destacados</span></p>
                            <p class="text-[11px] text-slate-300">Se mostrarán automáticamente los productos activos marcados como destacados en el listado de Productos del Dashboard.</p>
                        </div>
                    `;
                    return;
                }

                if (src === 'BEST_SELLERS') {
                    extraHost.innerHTML = `
                        <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200 leading-relaxed">
                            <p class="font-bold text-emerald-300 mb-0.5 inline-flex items-center gap-1.5">${Storevo.EditorUI ? Storevo.EditorUI.icon('flame', 'w-3.5 h-3.5') : ''}<span>Ranking de Más Vendidos</span></p>
                            <p class="text-[11px] text-slate-300">Ordena tus productos automáticamente según las unidades vendidas en pedidos confirmados y pagados.</p>
                        </div>
                    `;
                    return;
                }

                if (src === 'RECOMMENDED') {
                    extraHost.innerHTML = `
                        <div class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200 leading-relaxed">
                            <p class="font-bold text-indigo-300 mb-0.5 inline-flex items-center gap-1.5">${Storevo.EditorUI ? Storevo.EditorUI.icon('sparkles', 'w-3.5 h-3.5') : ''}<span>Selección Recomendada</span></p>
                            <p class="text-[11px] text-slate-300">Prioriza productos con disponibilidad inmediata combinando destacados, ofertas activas e historial de ventas.</p>
                        </div>
                    `;
                    return;
                }

                if (src === 'BRAND') {
                    const renderBrandSelect = () => {
                        const selectedBrandId = String(sec.settings.brandId || '');
                        const selectedBrandName = String(sec.settings.brandName || '');
                        const optionsHtml = [`<option value="">— Selecciona una marca —</option>`]
                            .concat((TE.brands || []).map(b => {
                                const isSel = (selectedBrandId && String(b.id) === selectedBrandId)
                                    || (!selectedBrandId && selectedBrandName && b.name.toLowerCase() === selectedBrandName.toLowerCase());
                                return `<option value="${b.id}" data-name="${String(b.name).replace(/"/g, '&quot;')}" ${isSel ? 'selected' : ''}>${b.name} (${b.productCount || 0})</option>`;
                            })).join('');

                        extraHost.innerHTML = `
                            <div class="space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <label class="block text-xs font-bold text-slate-300">Marca a mostrar</label>
                                    <button type="button" class="sv-refresh-brands-btn text-[11px] font-bold text-indigo-400 hover:text-indigo-300">Actualizar marcas</button>
                                </div>
                                <select class="sv-brand-picker-select w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none">
                                    ${optionsHtml}
                                </select>
                            </div>
                        `;

                        const brandSel = extraHost.querySelector('.sv-brand-picker-select');
                        const refreshBtn = extraHost.querySelector('.sv-refresh-brands-btn');

                        if (brandSel) {
                            brandSel.addEventListener('change', () => {
                                const opt = brandSel.options[brandSel.selectedIndex];
                                sec.settings.brandId = brandSel.value || '';
                                sec.settings.brandName = opt ? (opt.getAttribute('data-name') || '') : '';
                                materializeAndSave();
                            });
                        }
                        if (refreshBtn) {
                            refreshBtn.addEventListener('click', () => {
                                refreshBtn.textContent = 'Actualizando...';
                                TE.refreshBrands(() => renderBrandSelect());
                            });
                        }
                    };

                    TE.refreshBrands(() => renderBrandSelect());
                    return;
                }

                if (src === 'MANUAL') {
                    let selectedIds = parseManualIds(sec.settings.productIds);

                    extraHost.innerHTML = `
                        <div class="space-y-2.5">
                            <div class="flex items-center justify-between">
                                <label class="block text-xs font-bold text-slate-300">Productos seleccionados (<span class="sv-manual-count">${selectedIds.length}</span>)</label>
                                <span class="text-[10px] text-slate-500">Usa ↑/↓ para ordenar</span>
                            </div>
                            <div class="sv-manual-selected-list space-y-1.5 max-h-56 overflow-y-auto pr-1"></div>
                            <div class="pt-1">
                                <input type="text" placeholder="Buscar producto por nombre, marca o SKU..."
                                       class="sv-manual-search-input w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none">
                                <div class="sv-manual-search-results mt-2 space-y-1 max-h-48 overflow-y-auto"></div>
                            </div>
                        </div>
                    `;

                    const listEl = extraHost.querySelector('.sv-manual-selected-list');
                    const countEl = extraHost.querySelector('.sv-manual-count');
                    const searchInput = extraHost.querySelector('.sv-manual-search-input');
                    const resultsEl = extraHost.querySelector('.sv-manual-search-results');

                    const syncManualIds = () => {
                        sec.settings.productIds = selectedIds.join(',');
                        if (countEl) countEl.textContent = String(selectedIds.length);
                        renderSelectedManualList();
                        materializeAndSave();
                    };

                    const renderSelectedManualList = () => {
                        if (!listEl) return;
                        if (selectedIds.length === 0) {
                            listEl.innerHTML = `<p class="text-[11px] text-slate-500 italic py-2 text-center bg-slate-950/60 rounded-lg border border-dashed border-slate-800">Aún no has seleccionado productos manuales.</p>`;
                            return;
                        }
                        const lastIdx = selectedIds.length - 1;
                        listEl.innerHTML = selectedIds.map((id, idx) => {
                            const meta = TE.manualProductsCache.get(id) || { id, name: 'Producto #' + id, imageUrl: '/img/placeholder.jpg' };
                            return `
                                <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <img src="${meta.imageUrl || '/img/placeholder.jpg'}" class="w-8 h-8 rounded object-cover flex-shrink-0 border border-slate-800" alt="">
                                        <div class="min-w-0">
                                            <p class="font-bold text-white truncate">${meta.name}</p>
                                            <p class="text-[10px] text-slate-400 truncate">${meta.sku ? 'SKU: ' + meta.sku : ''}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1 flex-shrink-0">
                                        <button type="button" data-move-up="${idx}" ${idx === 0 ? 'disabled' : ''} class="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30">↑</button>
                                        <button type="button" data-move-down="${idx}" ${idx === lastIdx ? 'disabled' : ''} class="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30">↓</button>
                                        <button type="button" data-remove-id="${id}" class="px-1.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400">✕</button>
                                    </div>
                                </div>
                            `;
                        }).join('');

                        listEl.querySelectorAll('[data-move-up]').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const i = parseInt(btn.getAttribute('data-move-up'), 10);
                                if (i > 0) {
                                    const prevIdx = i - 1;
                                    const tmp = selectedIds[prevIdx];
                                    selectedIds[prevIdx] = selectedIds[i];
                                    selectedIds[i] = tmp;
                                    syncManualIds();
                                }
                            });
                        });
                        listEl.querySelectorAll('[data-move-down]').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const i = parseInt(btn.getAttribute('data-move-down'), 10);
                                const maxIdx = selectedIds.length - 1;
                                if (i < maxIdx) {
                                    const nextIdx = i + 1;
                                    const tmp = selectedIds[nextIdx];
                                    selectedIds[nextIdx] = selectedIds[i];
                                    selectedIds[i] = tmp;
                                    syncManualIds();
                                }
                            });
                        });
                        listEl.querySelectorAll('[data-remove-id]').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const rmId = parseInt(btn.getAttribute('data-remove-id'), 10);
                                selectedIds = selectedIds.filter(x => x !== rmId);
                                syncManualIds();
                                runPickerSearch(searchInput ? searchInput.value : '');
                            });
                        });
                    };

                    const runPickerSearch = (q) => {
                        if (!resultsEl || !TE.slug) return;
                        fetch(`/dashboard/${TE.slug}/template/products-search?q=${encodeURIComponent(q || '')}&limit=15`, {
                            headers: { 'Accept': 'application/json' }
                        })
                            .then(r => r.ok ? r.json() : [])
                            .then(items => {
                                if (!Array.isArray(items)) return;
                                items.forEach(it => TE.manualProductsCache.set(Number(it.id), it));
                                const available = items.filter(it => !selectedIds.includes(Number(it.id)));
                                if (available.length === 0) {
                                    resultsEl.innerHTML = `<p class="text-[11px] text-slate-500 py-1.5 text-center">No hay más productos que coincidan.</p>`;
                                    return;
                                }
                                resultsEl.innerHTML = available.map(it => `
                                    <button type="button" data-add-prod-id="${it.id}"
                                            class="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left text-xs transition">
                                        <div class="flex items-center gap-2 min-w-0">
                                            <img src="${it.imageUrl || '/img/placeholder.jpg'}" class="w-7 h-7 rounded object-cover flex-shrink-0" alt="">
                                            <span class="font-medium text-slate-200 truncate">${it.name}</span>
                                        </div>
                                        <span class="text-[10px] font-bold text-indigo-400 flex-shrink-0">+ Agregar</span>
                                    </button>
                                `).join('');

                                resultsEl.querySelectorAll('[data-add-prod-id]').forEach(btn => {
                                    btn.addEventListener('click', () => {
                                        const addId = parseInt(btn.getAttribute('data-add-prod-id'), 10);
                                        if (!isNaN(addId) && !selectedIds.includes(addId)) {
                                            selectedIds.push(addId);
                                            syncManualIds();
                                            runPickerSearch(searchInput ? searchInput.value : '');
                                        }
                                    });
                                });
                            });
                    };

                    if (selectedIds.length > 0 && TE.slug) {
                        fetch(`/dashboard/${TE.slug}/template/products-search?ids=${selectedIds.join(',')}`, {
                            headers: { 'Accept': 'application/json' }
                        })
                            .then(r => r.ok ? r.json() : [])
                            .then(items => {
                                if (Array.isArray(items)) {
                                    items.forEach(it => TE.manualProductsCache.set(Number(it.id), it));
                                    const validSet = new Set(items.map(it => Number(it.id)));
                                    selectedIds = selectedIds.filter(id => validSet.has(id));
                                }
                                renderSelectedManualList();
                            })
                            .catch(() => renderSelectedManualList());
                    } else {
                        renderSelectedManualList();
                    }

                    runPickerSearch('');

                    let searchTimer = null;
                    if (searchInput) {
                        searchInput.addEventListener('input', () => {
                            clearTimeout(searchTimer);
                            searchTimer = setTimeout(() => runPickerSearch(searchInput.value.trim()), 250);
                        });
                    }
                }
            }

            sourceSelect.addEventListener('change', () => {
                renderSourceSpecificControls();
            });

            renderSourceSpecificControls();

            // Constructor de Pestañas (Tabs) cuando enableTabs está activo
            const enableTabsWrap = container.querySelector('[data-field-key="enableTabs"]');
            const enableTabsChk = enableTabsWrap ? enableTabsWrap.querySelector('input[type="checkbox"]') : null;
            if (enableTabsWrap && enableTabsChk) {
                const tabsHost = document.createElement('div');
                tabsHost.className = 'space-y-3 mt-2 pt-2 border-t border-slate-800/80';
                enableTabsWrap.insertAdjacentElement('afterend', tabsHost);

                const renderTabsEditor = () => {
                    if (!enableTabsChk.checked) {
                        tabsHost.innerHTML = '';
                        tabsHost.classList.add('hidden');
                        return;
                    }
                    tabsHost.classList.remove('hidden');
                    if (!sec.settings.tab1Label && !sec.settings.tab2Label) {
                        sec.settings.tab1Label = 'Novedades';
                        sec.settings.tab1Source = sec.settings.source || 'NEWEST';
                        sec.settings.tab2Label = 'Más Vendidos';
                        sec.settings.tab2Source = 'BEST_SELLERS';
                        sec.settings.tab3Label = 'En Oferta';
                        sec.settings.tab3Source = 'OFFERS';
                    }

                    const catOptsHtml = [`<option value="">— Selecciona categoría —</option>`]
                        .concat((TE.categories || []).map(c => `<option value="${c.id}">${TE.escapeHtml(c.name)}</option>`)).join('');
                    const brandOptsHtml = [`<option value="">— Selecciona marca —</option>`]
                        .concat((TE.brands || []).map(b => `<option value="${b.id}" data-name="${TE.escapeHtml(b.name)}">${TE.escapeHtml(b.name)}</option>`)).join('');

                    tabsHost.innerHTML = [1, 2, 3, 4].map(i => {
                        const lbl = sec.settings[`tab${i}Label`] || '';
                        const tSrc = sec.settings[`tab${i}Source`] || (i === 1 ? 'NEWEST' : (i === 2 ? 'BEST_SELLERS' : 'OFFERS'));
                        const tCat = String(sec.settings[`tab${i}CategoryId`] || '');
                        const tBrandId = String(sec.settings[`tab${i}BrandId`] || '');
                        return `
                            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2" data-tab-cfg="${i}">
                                <div class="flex items-center justify-between">
                                    <span class="text-[11px] font-black uppercase tracking-wider text-indigo-400">Pestaña ${i}${i > 2 ? ' (Opcional)' : ''}</span>
                                </div>
                                <input type="text" data-tab-lbl="${i}" value="${TE.escapeHtml(lbl)}"
                                       placeholder="${i <= 2 ? 'Ej: Novedades o Más vendidos' : 'Dejar vacío para ocultar pestaña'}"
                                       class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none">
                                <select data-tab-src="${i}" class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none">
                                    <option value="NEWEST" ${tSrc === 'NEWEST' ? 'selected' : ''}>Últimos productos agregados</option>
                                    <option value="BEST_SELLERS" ${tSrc === 'BEST_SELLERS' ? 'selected' : ''}>Más vendidos</option>
                                    <option value="RECOMMENDED" ${tSrc === 'RECOMMENDED' ? 'selected' : ''}>Recomendados</option>
                                    <option value="OFFERS" ${tSrc === 'OFFERS' ? 'selected' : ''}>En oferta / descuento</option>
                                    <option value="FEATURED" ${tSrc === 'FEATURED' ? 'selected' : ''}>Destacados</option>
                                    <option value="CATEGORY" ${tSrc === 'CATEGORY' ? 'selected' : ''}>Categoría específica</option>
                                    <option value="BRAND" ${tSrc === 'BRAND' ? 'selected' : ''}>Marca específica</option>
                                </select>
                                <div data-tab-cat-wrap="${i}" class="${tSrc === 'CATEGORY' ? '' : 'hidden'}">
                                    <select data-tab-cat="${i}" class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white">
                                        ${catOptsHtml}
                                    </select>
                                </div>
                                <div data-tab-brand-wrap="${i}" class="${tSrc === 'BRAND' ? '' : 'hidden'}">
                                    <select data-tab-brand="${i}" class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white">
                                        ${brandOptsHtml}
                                    </select>
                                </div>
                            </div>
                        `;
                    }).join('');

                    [1, 2, 3, 4].forEach(i => {
                        const box = tabsHost.querySelector(`[data-tab-cfg="${i}"]`);
                        if (!box) return;
                        const lblInput = box.querySelector(`[data-tab-lbl="${i}"]`);
                        const srcSel = box.querySelector(`[data-tab-src="${i}"]`);
                        const catWrap = box.querySelector(`[data-tab-cat-wrap="${i}"]`);
                        const catSel = box.querySelector(`[data-tab-cat="${i}"]`);
                        const brandWrap = box.querySelector(`[data-tab-brand-wrap="${i}"]`);
                        const brandSel = box.querySelector(`[data-tab-brand="${i}"]`);

                        if (catSel && sec.settings[`tab${i}CategoryId`]) {
                            catSel.value = String(sec.settings[`tab${i}CategoryId`]);
                        }
                        if (brandSel && sec.settings[`tab${i}BrandId`]) {
                            brandSel.value = String(sec.settings[`tab${i}BrandId`]);
                        }

                        lblInput.addEventListener('input', () => {
                            sec.settings[`tab${i}Label`] = lblInput.value.trim();
                            materializeAndSave();
                        });
                        srcSel.addEventListener('change', () => {
                            sec.settings[`tab${i}Source`] = srcSel.value;
                            catWrap.classList.toggle('hidden', srcSel.value !== 'CATEGORY');
                            brandWrap.classList.toggle('hidden', srcSel.value !== 'BRAND');
                            materializeAndSave();
                        });
                        if (catSel) {
                            catSel.addEventListener('change', () => {
                                sec.settings[`tab${i}CategoryId`] = catSel.value || '';
                                materializeAndSave();
                            });
                        }
                        if (brandSel) {
                            brandSel.addEventListener('change', () => {
                                const opt = brandSel.options[brandSel.selectedIndex];
                                sec.settings[`tab${i}BrandId`] = brandSel.value || '';
                                sec.settings[`tab${i}BrandName`] = opt ? (opt.getAttribute('data-name') || '') : '';
                                materializeAndSave();
                            });
                        }
                    });
                };

                enableTabsChk.addEventListener('change', () => {
                    renderTabsEditor();
                    materializeAndSave();
                });

                TE.refreshBrands(() => renderTabsEditor());
            }
        }

        function enhanceFeaturedCategoriesForm() {
            const container = document.getElementById('inspector-fields-container');
            if (!container) return;
            const sec = getActiveInspectedSection();
            if (!sec || sec.type !== 'featured_categories') return;

            const sourceWrap = container.querySelector('[data-field-key="source"]');
            const sourceSelect = sourceWrap ? sourceWrap.querySelector('select') : null;
            if (!sourceSelect || sourceSelect.dataset.svCatEnhanced === 'true') return;
            sourceSelect.dataset.svCatEnhanced = 'true';
            sec.settings = sec.settings || {};

            const manualHost = document.createElement('div');
            manualHost.className = 'space-y-2.5 mt-2 pt-2 border-t border-slate-800/80';
            sourceWrap.insertAdjacentElement('afterend', manualHost);

            let selectedCatIds = parseManualIds(sec.settings.categoryIds);

            const renderManualCategoriesUI = () => {
                const mode = String(sourceSelect.value || 'AUTO').toUpperCase();
                if (mode !== 'MANUAL') {
                    manualHost.innerHTML = '';
                    manualHost.classList.add('hidden');
                    return;
                }
                manualHost.classList.remove('hidden');

                const allCats = Array.isArray(TE.categories) ? TE.categories : [];
                const byId = new Map(allCats.map(c => [Number(c.id), c]));
                selectedCatIds = selectedCatIds.filter(id => byId.has(id));
                const availableCats = allCats.filter(c => !selectedCatIds.includes(Number(c.id)));
                const lastIdx = selectedCatIds.length - 1;

                const selectedHtml = selectedCatIds.length === 0
                    ? `<p class="text-[11px] text-slate-500 italic py-2 text-center bg-slate-950/60 rounded-lg border border-dashed border-slate-800">Selecciona las categorías que deseas destacar.</p>`
                    : selectedCatIds.map((id, idx) => {
                        const cat = byId.get(id);
                        return `
                            <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                                <span class="font-bold text-white truncate">${TE.escapeHtml(cat.name)}</span>
                                <div class="flex items-center gap-1 flex-shrink-0">
                                    <button type="button" data-cat-up="${idx}" ${idx === 0 ? 'disabled' : ''} class="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30">↑</button>
                                    <button type="button" data-cat-down="${idx}" ${idx === lastIdx ? 'disabled' : ''} class="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30">↓</button>
                                    <button type="button" data-cat-rm="${id}" class="px-1.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400">✕</button>
                                </div>
                            </div>
                        `;
                    }).join('');

                const addOptionsHtml = [`<option value="">+ Añadir categoría a la sección...</option>`]
                    .concat(availableCats.map(c => `<option value="${c.id}">${TE.escapeHtml(c.name)}</option>`)).join('');

                manualHost.innerHTML = `
                    <div class="flex items-center justify-between">
                        <label class="block text-xs font-bold text-slate-300">Categorías seleccionadas (${selectedCatIds.length})</label>
                        <span class="text-[10px] text-slate-500">Usa ↑/↓ para ordenar</span>
                    </div>
                    <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">${selectedHtml}</div>
                    <select class="sv-add-cat-select w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none">
                        ${addOptionsHtml}
                    </select>
                `;

                const syncCatIds = () => {
                    sec.settings.categoryIds = selectedCatIds.join(',');
                    renderManualCategoriesUI();
                    materializeAndSave();
                };

                manualHost.querySelectorAll('[data-cat-up]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-cat-up'), 10);
                        if (i > 0) {
                            const tmp = selectedCatIds[i - 1];
                            selectedCatIds[i - 1] = selectedCatIds[i];
                            selectedCatIds[i] = tmp;
                            syncCatIds();
                        }
                    });
                });
                manualHost.querySelectorAll('[data-cat-down]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-cat-down'), 10);
                        if (i < selectedCatIds.length - 1) {
                            const tmp = selectedCatIds[i + 1];
                            selectedCatIds[i + 1] = selectedCatIds[i];
                            selectedCatIds[i] = tmp;
                            syncCatIds();
                        }
                    });
                });
                manualHost.querySelectorAll('[data-cat-rm]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const rmId = parseInt(btn.getAttribute('data-cat-rm'), 10);
                        selectedCatIds = selectedCatIds.filter(x => x !== rmId);
                        syncCatIds();
                    });
                });
                const addSel = manualHost.querySelector('.sv-add-cat-select');
                if (addSel) {
                    addSel.addEventListener('change', () => {
                        const addId = parseInt(addSel.value, 10);
                        if (!isNaN(addId) && !selectedCatIds.includes(addId)) {
                            selectedCatIds.push(addId);
                            syncCatIds();
                        }
                    });
                }
            };

            sourceSelect.addEventListener('change', renderManualCategoriesUI);
            renderManualCategoriesUI();
        }

        function enhanceTestimonialsForm() {
            const container = document.getElementById('inspector-fields-container');
            if (!container) return;
            const sec = getActiveInspectedSection();
            if (!sec || sec.type !== 'testimonials') return;

            const orderWrap = container.querySelector('[data-field-key="displayOrder"]');
            if (!orderWrap || orderWrap.dataset.svTestimEnhanced === 'true') return;
            orderWrap.dataset.svTestimEnhanced = 'true';
            sec.settings = sec.settings || {};
            if (!Array.isArray(sec.settings.manualItems)) {
                sec.settings.manualItems = [];
            }

            const host = document.createElement('div');
            host.className = 'space-y-3 mt-3 pt-3 border-t border-slate-800';
            orderWrap.insertAdjacentElement('afterend', host);

            const renderManualTestimonials = () => {
                const items = sec.settings.manualItems;
                const lastIdx = items.length - 1;

                const listHtml = items.length === 0
                    ? `<p class="text-[11px] text-slate-500 italic py-3 px-2 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800">No has agregado testimonios manuales todavía. Las reseñas de pedidos verificados se muestran automáticamente.</p>`
                    : items.map((it, idx) => {
                        const hasImg = Boolean(it.imageUrl && String(it.imageUrl).trim());
                        return `
                            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5" data-testim-idx="${idx}">
                                <div class="flex items-center justify-between gap-2">
                                    <span class="text-[11px] font-black uppercase tracking-wider text-storevo-400 inline-flex items-center gap-1.5">
                                        ${Storevo.EditorUI && (it.sourceType === 'whatsapp' || it.sourceType === 'instagram') ? Storevo.EditorUI.brandBadge(it.sourceType) : ''}
                                        <span>Testimonio #${idx + 1}</span>
                                    </span>
                                    <div class="flex items-center gap-1">
                                        <button type="button" data-t-up="${idx}" ${idx === 0 ? 'disabled' : ''} class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30">↑</button>
                                        <button type="button" data-t-down="${idx}" ${idx === lastIdx ? 'disabled' : ''} class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30">↓</button>
                                        <button type="button" data-t-del="${idx}" class="px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400">✕</button>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="text" data-t-field="authorName" value="${TE.escapeHtml(it.authorName || '')}" placeholder="Nombre del cliente"
                                           class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-storevo-500 focus:outline-none">
                                    <input type="text" data-t-field="authorMeta" value="${TE.escapeHtml(it.authorMeta || '')}" placeholder="Ciudad o @usuario (Opcional)"
                                           class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-storevo-500 focus:outline-none">
                                </div>
                                <select data-t-field="sourceType" class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white">
                                    <option value="whatsapp" ${it.sourceType === 'whatsapp' ? 'selected' : ''}>Recibido por WhatsApp</option>
                                    <option value="instagram" ${it.sourceType === 'instagram' ? 'selected' : ''}>Recibido por Instagram</option>
                                    <option value="direct" ${(!it.sourceType || it.sourceType === 'direct') ? 'selected' : ''}>Cliente directo</option>
                                </select>
                                <textarea data-t-field="text" rows="2" placeholder="Escribe el mensaje del testimonio..."
                                          class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-storevo-500 focus:outline-none">${TE.escapeHtml(it.text || '')}</textarea>
                                <label class="flex items-start gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 cursor-pointer">
                                    <input type="checkbox" data-t-field="authorized" ${it.authorized ? 'checked' : ''} class="mt-0.5 w-3.5 h-3.5 rounded border-slate-700 text-storevo-500">
                                    <span class="text-[11px] text-slate-300 leading-snug">Cuento con autorización del cliente para publicar una imagen o captura de su testimonio</span>
                                </label>
                                <div class="space-y-1.5 ${it.authorized ? '' : 'hidden'}" data-t-img-zone="${idx}">
                                    ${hasImg ? `<div class="relative h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                                        <img src="${TE.escapeHtml(it.imageUrl)}" class="w-full h-full object-contain" alt="">
                                        <button type="button" data-t-rm-img="${idx}" class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Quitar</button>
                                    </div>` : ''}
                                    <input type="file" data-t-file="${idx}" accept="image/jpeg,image/png,image/webp" class="hidden">
                                    <button type="button" data-t-upload="${idx}" class="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-storevo-500 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold transition">
                                        Subir captura de WhatsApp / Instagram
                                    </button>
                                    <p class="text-[10px] text-slate-500">Recomendado: 1080×1350 px (vertical) o 1080×1080 px · JPG, PNG o WEBP · máx. 10 MB.</p>
                                </div>
                            </div>
                        `;
                    }).join('');

                host.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-200">Testimonios manuales (${items.length})</span>
                        <button type="button" class="sv-add-testim-btn px-2.5 py-1 rounded-lg bg-storevo-500 hover:bg-storevo-600 text-white text-[11px] font-bold transition">+ Añadir testimonio</button>
                    </div>
                    <div class="space-y-2.5">${listHtml}</div>
                `;

                host.querySelector('.sv-add-testim-btn')?.addEventListener('click', () => {
                    items.push({
                        authorName: 'Cliente satisfecho',
                        authorMeta: '',
                        sourceType: 'whatsapp',
                        text: 'Excelente atención y entrega rápida. ¡Muy recomendados!',
                        authorized: false,
                        imageUrl: ''
                    });
                    renderManualTestimonials();
                    materializeAndSave();
                });

                host.querySelectorAll('[data-testim-idx]').forEach(cardEl => {
                    const idx = parseInt(cardEl.getAttribute('data-testim-idx'), 10);
                    const item = items[idx];
                    if (!item) return;

                    cardEl.querySelectorAll('[data-t-field]').forEach(inputEl => {
                        const fKey = inputEl.getAttribute('data-t-field');
                        if (inputEl.type === 'checkbox') {
                            inputEl.addEventListener('change', () => {
                                item[fKey] = inputEl.checked;
                                if (!inputEl.checked) item.imageUrl = '';
                                renderManualTestimonials();
                                materializeAndSave();
                            });
                        } else {
                            inputEl.addEventListener('input', () => {
                                item[fKey] = inputEl.value;
                                materializeAndSave();
                            });
                        }
                    });

                    const fileInput = cardEl.querySelector(`[data-t-file="${idx}"]`);
                    const uploadBtn = cardEl.querySelector(`[data-t-upload="${idx}"]`);
                    const rmImgBtn = cardEl.querySelector(`[data-t-rm-img="${idx}"]`);

                    if (uploadBtn && fileInput) {
                        uploadBtn.addEventListener('click', () => fileInput.click());
                        fileInput.addEventListener('change', () => {
                            if (!fileInput.files || !fileInput.files[0]) return;
                            uploadBtn.disabled = true;
                            uploadBtn.textContent = 'Subiendo captura...';
                            const fd = new FormData();
                            fd.append('file', fileInput.files[0]);
                            fetch(`/dashboard/${TE.slug}/template/upload-image`, { method: 'POST', body: fd })
                                .then(r => r.json())
                                .then(data => {
                                    if (data.success && data.url) {
                                        item.imageUrl = data.url;
                                        renderManualTestimonials();
                                        materializeAndSave();
                                    }
                                })
                                .finally(() => {
                                    uploadBtn.disabled = false;
                                    fileInput.value = '';
                                });
                        });
                    }
                    if (rmImgBtn) {
                        rmImgBtn.addEventListener('click', () => {
                            item.imageUrl = '';
                            renderManualTestimonials();
                            materializeAndSave();
                        });
                    }
                });

                host.querySelectorAll('[data-t-up]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-t-up'), 10);
                        if (i > 0) {
                            const tmp = items[i - 1];
                            items[i - 1] = items[i];
                            items[i] = tmp;
                            renderManualTestimonials();
                            materializeAndSave();
                        }
                    });
                });
                host.querySelectorAll('[data-t-down]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-t-down'), 10);
                        if (i < items.length - 1) {
                            const tmp = items[i + 1];
                            items[i + 1] = items[i];
                            items[i] = tmp;
                            renderManualTestimonials();
                            materializeAndSave();
                        }
                    });
                });
                host.querySelectorAll('[data-t-del]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-t-del'), 10);
                        items.splice(i, 1);
                        renderManualTestimonials();
                        materializeAndSave();
                    });
                });
            };

            renderManualTestimonials();
        }

        function enhanceFaqAccordionForm() {
            const container = document.getElementById('inspector-fields-container');
            if (!container) return;
            const sec = getActiveInspectedSection();
            if (!sec || sec.type !== 'faq_accordion') return;

            const schemaWrap = container.querySelector('[data-field-key="enableFaqSchema"]');
            if (!schemaWrap || schemaWrap.dataset.svFaqEnhanced === 'true') return;
            schemaWrap.dataset.svFaqEnhanced = 'true';
            sec.settings = sec.settings || {};

            if (!Array.isArray(sec.settings.items) || sec.settings.items.length === 0) {
                const migrated = [];
                for (let i = 1; i <= 5; i++) {
                    const q = String(sec.settings[`q${i}`] || '').trim();
                    const a = String(sec.settings[`a${i}`] || '').trim();
                    if (q || a) migrated.push({ q, a });
                }
                if (migrated.length === 0) {
                    migrated.push(
                        { q: '¿Cuáles son los métodos de pago disponibles?', a: 'Puedes realizar tu pedido con pago seguro en línea o coordinar directamente con nosotros por WhatsApp.' },
                        { q: '¿Cuánto tarda en llegar mi pedido?', a: 'Despachamos a todo el país. El tiempo estimado de entrega es de 2 a 5 días hábiles según tu ciudad.' },
                        { q: '¿Tienen cambios o garantías?', a: 'Sí, todos nuestros productos cuentan con garantía y soporte directo.' }
                    );
                }
                sec.settings.items = migrated;
            }

            const host = document.createElement('div');
            host.className = 'space-y-3 mt-3 pt-3 border-t border-slate-800';
            schemaWrap.insertAdjacentElement('afterend', host);

            const syncLegacyFaqFields = () => {
                const items = sec.settings.items || [];
                for (let i = 1; i <= 5; i++) {
                    sec.settings[`q${i}`] = items[i - 1] ? items[i - 1].q : '';
                    sec.settings[`a${i}`] = items[i - 1] ? items[i - 1].a : '';
                }
            };

            const renderFaqItemsEditor = () => {
                const items = sec.settings.items;
                const lastIdx = items.length - 1;

                const listHtml = items.map((faq, idx) => `
                    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2" data-faq-idx="${idx}">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[11px] font-black uppercase tracking-wider text-storevo-400">Pregunta #${idx + 1}</span>
                            <div class="flex items-center gap-1">
                                <button type="button" data-faq-up="${idx}" ${idx === 0 ? 'disabled' : ''} class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30">↑</button>
                                <button type="button" data-faq-down="${idx}" ${idx === lastIdx ? 'disabled' : ''} class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30">↓</button>
                                <button type="button" data-faq-del="${idx}" class="px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400">✕</button>
                            </div>
                        </div>
                        <input type="text" data-faq-q="${idx}" value="${TE.escapeHtml(faq.q || '')}" placeholder="Escribe la pregunta..."
                               class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white focus:border-storevo-500 focus:outline-none">
                        <textarea data-faq-a="${idx}" rows="2" placeholder="Escribe la respuesta..."
                                  class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-storevo-500 focus:outline-none">${TE.escapeHtml(faq.a || '')}</textarea>
                    </div>
                `).join('');

                host.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-200">Preguntas (${items.length})</span>
                        <button type="button" class="sv-add-faq-btn px-2.5 py-1 rounded-lg bg-storevo-500 hover:bg-storevo-600 text-white text-[11px] font-bold transition">+ Añadir pregunta</button>
                    </div>
                    <div class="space-y-2.5">${listHtml}</div>
                `;

                host.querySelector('.sv-add-faq-btn')?.addEventListener('click', () => {
                    items.push({ q: '¿Nueva pregunta frecuente?', a: 'Escribe aquí la respuesta para tus compradores.' });
                    syncLegacyFaqFields();
                    renderFaqItemsEditor();
                    materializeAndSave();
                });

                host.querySelectorAll('[data-faq-q]').forEach(inp => {
                    inp.addEventListener('input', () => {
                        const i = parseInt(inp.getAttribute('data-faq-q'), 10);
                        if (items[i]) {
                            items[i].q = inp.value;
                            syncLegacyFaqFields();
                            materializeAndSave();
                        }
                    });
                });
                host.querySelectorAll('[data-faq-a]').forEach(inp => {
                    inp.addEventListener('input', () => {
                        const i = parseInt(inp.getAttribute('data-faq-a'), 10);
                        if (items[i]) {
                            items[i].a = inp.value;
                            syncLegacyFaqFields();
                            materializeAndSave();
                        }
                    });
                });
                host.querySelectorAll('[data-faq-up]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-faq-up'), 10);
                        if (i > 0) {
                            const tmp = items[i - 1];
                            items[i - 1] = items[i];
                            items[i] = tmp;
                            syncLegacyFaqFields();
                            renderFaqItemsEditor();
                            materializeAndSave();
                        }
                    });
                });
                host.querySelectorAll('[data-faq-down]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-faq-down'), 10);
                        if (i < items.length - 1) {
                            const tmp = items[i + 1];
                            items[i + 1] = items[i];
                            items[i] = tmp;
                            syncLegacyFaqFields();
                            renderFaqItemsEditor();
                            materializeAndSave();
                        }
                    });
                });
                host.querySelectorAll('[data-faq-del]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const i = parseInt(btn.getAttribute('data-faq-del'), 10);
                        items.splice(i, 1);
                        syncLegacyFaqFields();
                        renderFaqItemsEditor();
                        materializeAndSave();
                    });
                });
            };

            renderFaqItemsEditor();
        }

        function enhanceMultiBannersForm() {
            const container = document.getElementById('inspector-fields-container');
            if (!container) return;
            const sec = getActiveInspectedSection();
            if (!sec || sec.type !== 'multi_banners') return;

            const countWrap = container.querySelector('[data-field-key="cardCount"]');
            const layoutWrap = container.querySelector('[data-field-key="bannerLayout"]');
            const countSel = countWrap ? countWrap.querySelector('select') : null;
            const layoutSel = layoutWrap ? layoutWrap.querySelector('select') : null;
            if (!countSel || !layoutSel || countSel.dataset.svMbEnhanced === 'true') return;
            countSel.dataset.svMbEnhanced = 'true';
            sec.settings = sec.settings || {};

            const layoutOptionsByCount = {
                '2': [
                    { value: 'equal', label: '2 columnas simétricas (50% / 50%)' },
                    { value: 'split_left', label: 'Tarjeta 1 destacada ancha (60% / 40%)' },
                    { value: 'split_right', label: 'Tarjeta 2 destacada ancha (40% / 60%)' }
                ],
                '3': [
                    { value: 'cols_3', label: '3 columnas iguales en fila' },
                    { value: 'mosaic_3', label: 'Mosaico destacado (1 grande + 2 apiladas)' }
                ],
                '4': [
                    { value: 'grid_2x2', label: 'Cuadrícula 2×2 (2 arriba y 2 abajo)' },
                    { value: 'cols_4', label: '4 columnas en una sola fila' }
                ]
            };

            const syncLayoutOptions = (userChangedCount) => {
                const countVal = String(countSel.value || sec.settings.cardCount || '2');
                const validList = layoutOptionsByCount[countVal] || layoutOptionsByCount['2'];
                let currentLayout = String(sec.settings.bannerLayout || layoutSel.value || '');
                if (!validList.some(o => o.value === currentLayout)) {
                    currentLayout = validList[0].value;
                    sec.settings.bannerLayout = currentLayout;
                }
                layoutSel.innerHTML = validList.map(o =>
                    `<option value="${o.value}" ${o.value === currentLayout ? 'selected' : ''}>${o.label}</option>`
                ).join('');
                layoutSel.value = currentLayout;
                if (userChangedCount) {
                    materializeAndSave();
                }
            };

            countSel.addEventListener('change', () => syncLayoutOptions(true));
            syncLayoutOptions(false);
        }

        const runAllInspectorEnhancers = () => {
            enhanceProductGridForm();
            enhanceFeaturedCategoriesForm();
            enhanceTestimonialsForm();
            enhanceFaqAccordionForm();
            enhanceMultiBannersForm();
        };

        const sidebar = document.getElementById('theme-editor-sidebar');
        if (sidebar) {
            const obs = new MutationObserver(() => runAllInspectorEnhancers());
            obs.observe(sidebar, { childList: true, subtree: true });
            runAllInspectorEnhancers();
        }

        const urlPage = new URLSearchParams(window.location.search).get('page');
        const initialPage = (urlPage || (bridge && bridge.getAttribute('data-initial-page')) || '').trim();
        if (initialPage && typeof TE.switchPage === 'function') {
            setTimeout(() => {
                TE.switchPage(initialPage);
            }, 80);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductGridAndCategoryExtension);
    } else {
        setTimeout(initProductGridAndCategoryExtension, 0);
    }
})();

/* ==========================================================================
   APARTADO GLOBAL: PAGINACIÓN Y CARGA DE PRODUCTOS (ESTILOS GLOBALES)
   ========================================================================== */
(function() {
    function initGlobalPaginationStylesPanel() {
        if (!window.Storevo || !Storevo.ThemeEditor) return;
        const TE = Storevo.ThemeEditor;
        if (TE.__paginationStylesMounted) return;
        TE.__paginationStylesMounted = true;

        function getStorePrimary() {
            return (TE.theme && TE.theme.globalStyles && TE.theme.globalStyles.primaryColor) || '#6366f1';
        }

        function getStoreSecondary() {
            return (TE.theme && TE.theme.globalStyles && TE.theme.globalStyles.secondaryColor) || '#0f172a';
        }

        function isValidHex(val) {
            return /^#[0-9a-fA-F]{6}$/.test(String(val || '').trim());
        }

        function ensureGlobalStylesObject() {
            if (!TE.theme) TE.theme = {};
            if (!TE.theme.globalStyles) TE.theme.globalStyles = {};
            const gs = TE.theme.globalStyles;
            const defaults = {
                paginationMode: 'numbered',
                paginationPageSize: 12,
                paginationButtonShape: 'rounded',
                paginationButtonSize: 'md',
                paginationAlign: 'center',
                paginationSpacing: 'md',
                paginationBorderWidth: '1px',
                paginationColorMode: 'brand',
                paginationBgColor: '#ffffff',
                paginationTextColor: getStoreSecondary(),
                paginationBorderColor: '#e2e8f0',
                paginationActiveBgColor: getStorePrimary(),
                paginationActiveTextColor: '#ffffff',
                paginationShowCounter: true,
                paginationShowPrevNext: true
            };
            Object.keys(defaults).forEach(k => {
                if (gs[k] === undefined || gs[k] === null || gs[k] === '') {
                    gs[k] = defaults[k];
                }
            });
            return gs;
        }

        function postLivePaginationStyles() {
            ensureGlobalStylesObject();
            if (typeof TE.pushLiveStylesToIframe === 'function') {
                TE.pushLiveStylesToIframe();
            }
            if (typeof TE.scheduleAutoSave === 'function') {
                TE.scheduleAutoSave(false);
            }
        }

        function buildColorFieldHtml(idPrefix, labelText) {
            return `
                <div>
                    <label id="${idPrefix}-label" class="block text-[10px] font-bold text-slate-400 mb-1">${labelText}</label>
                    <div class="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 focus-within:border-storevo-500 transition">
                        <input type="color" id="${idPrefix}" class="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer flex-shrink-0 p-0">
                        <input type="text" id="${idPrefix}-hex" maxlength="7" placeholder="#6366F1"
                               class="w-full bg-transparent border-0 text-[11px] font-mono font-bold text-white uppercase focus:outline-none focus:ring-0 px-1">
                    </div>
                </div>
            `;
        }

        function mountPaginationAccordion() {
            if (document.getElementById('style-acc-pagination')) return;

            const firstStyleAcc = document.querySelector('#theme-editor-sidebar details.style-acc');
            const stylesContainer = firstStyleAcc ? firstStyleAcc.parentElement : null;
            if (!stylesContainer) return;

            ensureGlobalStylesObject();

            const details = document.createElement('details');
            details.className = 'style-acc';
            details.id = 'style-acc-pagination';
            details.innerHTML = `
                <summary>
                    <div>
                        <span class="style-acc-title">Paginación y carga de productos</span>
                        <span class="style-acc-hint">Aplica al Catálogo General y a todas las Categorías</span>
                    </div>
                    <svg class="style-acc-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </summary>
                <div class="style-acc-body space-y-4 text-xs">
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">Modo de paginación</label>
                        <select id="gs-pag-mode" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-storevo-500 focus:outline-none">
                            <option value="numbered">Numerada (1, 2, 3…)</option>
                            <option value="compact">Numerada compacta (Página X de Y)</option>
                            <option value="load_more">Cargar más (Botón)</option>
                            <option value="infinite">Desplazamiento infinito (Scroll)</option>
                            <option value="arrows">Navegación con flechas</option>
                            <option value="counter_more">Mostrar más con contador y progreso</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">Productos por página / por carga (Catálogo)</label>
                        <select id="gs-pag-size" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-storevo-500 focus:outline-none">
                            <option value="4">4 productos</option>
                            <option value="6">6 productos</option>
                            <option value="8">8 productos</option>
                            <option value="12">12 productos (Recomendado)</option>
                            <option value="16">16 productos</option>
                            <option value="20">20 productos</option>
                            <option value="24">24 productos</option>
                            <option value="32">32 productos</option>
                            <option value="48">48 productos</option>
                        </select>
                        <p class="text-[10px] text-slate-500 mt-1">Las vitrinas de productos en Inicio respetan su propio límite de filas.</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3" data-pag-group="layout">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-400 mb-1">Alineación</label>
                            <select id="gs-pag-align" class="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-storevo-500 focus:outline-none">
                                <option value="left">Izquierda</option>
                                <option value="center">Centro</option>
                                <option value="right">Derecha</option>
                                <option value="between">Distribuido</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-400 mb-1">Espaciado</label>
                            <select id="gs-pag-spacing" class="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-storevo-500 focus:outline-none">
                                <option value="sm">Compacto</option>
                                <option value="md">Estándar</option>
                                <option value="lg">Amplio</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2.5" data-pag-group="buttons">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-400 mb-1">Forma</label>
                            <select id="gs-pag-shape" class="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-storevo-500 focus:outline-none">
                                <option value="rounded">Redondeado</option>
                                <option value="pill">Píldora</option>
                                <option value="square">Cuadrado</option>
                                <option value="sync">Sincronizar</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-400 mb-1">Tamaño</label>
                            <select id="gs-pag-btn-size" class="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-storevo-500 focus:outline-none">
                                <option value="sm">Pequeño</option>
                                <option value="md">Mediano</option>
                                <option value="lg">Grande</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-400 mb-1">Borde</label>
                            <select id="gs-pag-border-w" class="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-storevo-500 focus:outline-none">
                                <option value="0px">Sin borde</option>
                                <option value="1px">Fino (1px)</option>
                                <option value="2px">Grueso (2px)</option>
                            </select>
                        </div>
                    </div>

                    <div class="pt-2 border-t border-slate-800/80 space-y-3">
                        <div class="flex items-center justify-between gap-2">
                            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-300">Colores de paginación</label>
                            <button type="button" id="gs-pag-sync-brand-btn"
                                    class="hidden text-[10px] font-bold text-storevo-400 hover:text-storevo-300 transition">
                                Tomar colores de la tienda
                            </button>
                        </div>
                        <select id="gs-pag-color-mode" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:border-storevo-500 focus:outline-none">
                            <option value="brand">Automático (Usar Primario y Secundario de la tienda)</option>
                            <option value="custom">Personalizar colores manualmente</option>
                        </select>

                        <div id="gs-pag-custom-colors-wrap" class="space-y-3 hidden pt-1">
                            <div class="grid grid-cols-2 gap-2.5" data-pag-group="active-colors">
                                ${buildColorFieldHtml('gs-pag-active-bg', 'Fondo página activa')}
                                <div data-pag-group="active-text-color">
                                    ${buildColorFieldHtml('gs-pag-active-text', 'Texto página activa')}
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2.5" data-pag-group="inactive-colors">
                                ${buildColorFieldHtml('gs-pag-bg', 'Fondo botón inactivo')}
                                ${buildColorFieldHtml('gs-pag-text', 'Texto botón (Secundario)')}
                                <div class="col-span-2">
                                    ${buildColorFieldHtml('gs-pag-border', 'Color del borde')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2.5 pt-2 border-t border-slate-800/80" data-pag-group="toggles">
                        <label class="flex items-center justify-between gap-2 cursor-pointer" data-pag-toggle="counter">
                            <span class="text-xs font-medium text-slate-300">Mostrar contador de productos</span>
                            <input type="checkbox" id="gs-pag-counter" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-storevo-500 focus:ring-storevo-500">
                        </label>
                        <label class="flex items-center justify-between gap-2 cursor-pointer" data-pag-toggle="prev-next">
                            <span class="text-xs font-medium text-slate-300">Mostrar botones Anterior / Siguiente</span>
                            <input type="checkbox" id="gs-pag-prev-next" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-storevo-500 focus:ring-storevo-500">
                        </label>
                    </div>
                </div>
            `;

            stylesContainer.appendChild(details);
            syncInputsFromGlobalStyles();
            bindPaginationInputs();
            if (Storevo.EditorUI && typeof Storevo.EditorUI.enhanceGlobalStylesPanel === 'function') {
                Storevo.EditorUI.enhanceGlobalStylesPanel();
            }
        }

        function updateModeSpecificVisibility(mode, colorMode) {
            const panel = document.getElementById('style-acc-pagination');
            if (!panel) return;

            const isPageBased = (mode === 'numbered' || mode === 'compact' || mode === 'arrows');
            const hasPrevNextOption = (mode === 'numbered' || mode === 'compact');
            const isInfinite = (mode === 'infinite');
            const isCounterMore = (mode === 'counter_more');
            const isCustomColor = (colorMode === 'custom');

            const buttonsGroup = panel.querySelector('[data-pag-group="buttons"]');
            const customColorsWrap = document.getElementById('gs-pag-custom-colors-wrap');
            const syncBrandBtn = document.getElementById('gs-pag-sync-brand-btn');
            const inactiveColorsGroup = panel.querySelector('[data-pag-group="inactive-colors"]');
            const activeTextColorGroup = panel.querySelector('[data-pag-group="active-text-color"]');
            const counterToggle = panel.querySelector('[data-pag-toggle="counter"]');
            const prevNextToggle = panel.querySelector('[data-pag-toggle="prev-next"]');
            const activeBgLabel = document.getElementById('gs-pag-active-bg-label');
            const activeTextLabel = document.getElementById('gs-pag-active-text-label');

            if (buttonsGroup) buttonsGroup.classList.toggle('hidden', isInfinite);
            if (customColorsWrap) customColorsWrap.classList.toggle('hidden', !isCustomColor);
            if (syncBrandBtn) syncBrandBtn.classList.toggle('hidden', !isCustomColor);
            if (inactiveColorsGroup) inactiveColorsGroup.classList.toggle('hidden', !isPageBased);
            if (activeTextColorGroup) activeTextColorGroup.classList.toggle('hidden', isInfinite);
            if (counterToggle) counterToggle.classList.toggle('hidden', isCounterMore);
            if (prevNextToggle) prevNextToggle.classList.toggle('hidden', !hasPrevNextOption);

            if (activeBgLabel) {
                activeBgLabel.textContent = isPageBased
                    ? 'Fondo página activa (Primario)'
                    : (isInfinite ? 'Color del indicador' : 'Fondo botón principal');
            }
            if (activeTextLabel) {
                activeTextLabel.textContent = isPageBased ? 'Texto página activa' : 'Texto botón principal';
            }
        }

        function setColorPairValue(idPrefix, hexVal) {
            const safeHex = isValidHex(hexVal) ? hexVal.toUpperCase() : '#6366F1';
            const colorEl = document.getElementById(idPrefix);
            const hexEl = document.getElementById(idPrefix + '-hex');
            if (colorEl) colorEl.value = safeHex.toLowerCase();
            if (hexEl && document.activeElement !== hexEl) hexEl.value = safeHex;
        }

        function syncInputsFromGlobalStyles() {
            const gs = ensureGlobalStylesObject();
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = String(val);
            };
            const setCheck = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.checked = Boolean(val);
            };

            setVal('gs-pag-mode', gs.paginationMode);
            setVal('gs-pag-size', gs.paginationPageSize);
            setVal('gs-pag-align', gs.paginationAlign);
            setVal('gs-pag-spacing', gs.paginationSpacing);
            setVal('gs-pag-shape', gs.paginationButtonShape);
            setVal('gs-pag-btn-size', gs.paginationButtonSize);
            setVal('gs-pag-border-w', gs.paginationBorderWidth);
            setVal('gs-pag-color-mode', gs.paginationColorMode || 'brand');

            setColorPairValue('gs-pag-bg', gs.paginationBgColor || '#ffffff');
            setColorPairValue('gs-pag-text', gs.paginationTextColor || getStoreSecondary());
            setColorPairValue('gs-pag-border', gs.paginationBorderColor || '#e2e8f0');
            setColorPairValue('gs-pag-active-bg', gs.paginationActiveBgColor || getStorePrimary());
            setColorPairValue('gs-pag-active-text', gs.paginationActiveTextColor || '#ffffff');

            setCheck('gs-pag-counter', gs.paginationShowCounter);
            setCheck('gs-pag-prev-next', gs.paginationShowPrevNext);

            updateModeSpecificVisibility(gs.paginationMode, gs.paginationColorMode || 'brand');
        }

        function bindColorPair(idPrefix, gsKey) {
            const colorEl = document.getElementById(idPrefix);
            const hexEl = document.getElementById(idPrefix + '-hex');
            if (!colorEl || !hexEl) return;

            colorEl.addEventListener('input', () => {
                const gs = ensureGlobalStylesObject();
                const val = colorEl.value.toUpperCase();
                hexEl.value = val;
                gs[gsKey] = colorEl.value;
                postLivePaginationStyles();
            });

            hexEl.addEventListener('input', () => {
                let raw = hexEl.value.trim();
                if (raw && !raw.startsWith('#')) {
                    raw = '#' + raw;
                }
                if (isValidHex(raw)) {
                    const gs = ensureGlobalStylesObject();
                    colorEl.value = raw.toLowerCase();
                    gs[gsKey] = raw.toLowerCase();
                    postLivePaginationStyles();
                }
            });

            hexEl.addEventListener('blur', () => {
                const gs = ensureGlobalStylesObject();
                let raw = hexEl.value.trim();
                if (raw && !raw.startsWith('#')) raw = '#' + raw;
                if (isValidHex(raw)) {
                    hexEl.value = raw.toUpperCase();
                } else {
                    hexEl.value = String(gs[gsKey] || colorEl.value || '#000000').toUpperCase();
                }
            });
        }

        function bindPaginationInputs() {
            const standardControls = [
                { id: 'gs-pag-mode', key: 'paginationMode', type: 'str' },
                { id: 'gs-pag-size', key: 'paginationPageSize', type: 'int' },
                { id: 'gs-pag-align', key: 'paginationAlign', type: 'str' },
                { id: 'gs-pag-spacing', key: 'paginationSpacing', type: 'str' },
                { id: 'gs-pag-shape', key: 'paginationButtonShape', type: 'str' },
                { id: 'gs-pag-btn-size', key: 'paginationButtonSize', type: 'str' },
                { id: 'gs-pag-border-w', key: 'paginationBorderWidth', type: 'str' },
                { id: 'gs-pag-color-mode', key: 'paginationColorMode', type: 'str' },
                { id: 'gs-pag-counter', key: 'paginationShowCounter', type: 'bool' },
                { id: 'gs-pag-prev-next', key: 'paginationShowPrevNext', type: 'bool' }
            ];

            standardControls.forEach(item => {
                const el = document.getElementById(item.id);
                if (!el) return;
                const handler = () => {
                    const gs = ensureGlobalStylesObject();
                    if (item.type === 'int') {
                        gs[item.key] = parseInt(el.value, 10) || 12;
                    } else if (item.type === 'bool') {
                        gs[item.key] = Boolean(el.checked);
                    } else {
                        gs[item.key] = el.value;
                    }
                    if (item.key === 'paginationColorMode' && gs.paginationColorMode === 'custom') {
                        if (!isValidHex(gs.paginationActiveBgColor)) gs.paginationActiveBgColor = getStorePrimary();
                        if (!isValidHex(gs.paginationTextColor)) gs.paginationTextColor = getStoreSecondary();
                        syncInputsFromGlobalStyles();
                    }
                    updateModeSpecificVisibility(gs.paginationMode, gs.paginationColorMode);
                    postLivePaginationStyles();
                };
                el.addEventListener('input', handler);
                el.addEventListener('change', handler);
            });

            bindColorPair('gs-pag-active-bg', 'paginationActiveBgColor');
            bindColorPair('gs-pag-active-text', 'paginationActiveTextColor');
            bindColorPair('gs-pag-bg', 'paginationBgColor');
            bindColorPair('gs-pag-text', 'paginationTextColor');
            bindColorPair('gs-pag-border', 'paginationBorderColor');

            const syncBrandBtn = document.getElementById('gs-pag-sync-brand-btn');
            if (syncBrandBtn) {
                syncBrandBtn.addEventListener('click', () => {
                    const gs = ensureGlobalStylesObject();
                    gs.paginationActiveBgColor = getStorePrimary();
                    gs.paginationActiveTextColor = '#ffffff';
                    gs.paginationBgColor = '#ffffff';
                    gs.paginationTextColor = getStoreSecondary();
                    gs.paginationBorderColor = '#e2e8f0';
                    syncInputsFromGlobalStyles();
                    postLivePaginationStyles();
                });
            }
        }

        window.addEventListener('message', (e) => {
            if (e.origin !== window.location.origin || !e.data) return;
            if (e.data.type === 'storevo:page-loaded') {
                syncInputsFromGlobalStyles();
                if (typeof TE.pushLiveStylesToIframe === 'function') {
                    TE.pushLiveStylesToIframe();
                }
            }
        });

        const sidebar = document.getElementById('theme-editor-sidebar');
        if (sidebar) {
            const obs = new MutationObserver(() => mountPaginationAccordion());
            obs.observe(sidebar, { childList: true, subtree: true });
        }
        mountPaginationAccordion();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobalPaginationStylesPanel);
    } else {
        setTimeout(initGlobalPaginationStylesPanel, 50);
    }
})();