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
            label: 'Barra de Anuncio Superior',
            description: 'Cintillo superior con hasta 3 mensajes rotativos para promociones o envíos gratis.',
            defaultSettings: {
                text: '🚚 ¡Envío gratis en compras superiores a $150.000!',
                text2: '',
                text3: '',
                bgColor: '#0f172a',
                textColor: '#ffffff',
                linkUrl: '/catalog'
            }
        },
        hero_banner: {
            label: 'Banner Principal (Hero)',
            description: 'Portada de gran impacto con 3 estilos de diseño, imagen y hasta 2 botones.',
            defaultSettings: {
                heroLayout: 'classic',
                badgeText: 'Nueva Colección',
                title: 'Descubre lo mejor de nuestra tienda',
                subtitle: 'Calidad garantizada con envíos a toda Colombia.',
                buttonText: 'Ver Catálogo',
                buttonUrl: '/catalog',
                secondaryButtonText: '',
                secondaryButtonUrl: '/catalog',
                imageUrl: '',
                overlayOpacity: 50,
                bgColor: '#6366f1',
                textColor: '#ffffff',
                alignment: 'center'
            }
        },
        product_grid: {
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
            label: 'Producto Estrella / Destacado',
            description: 'Destaca un producto específico en gran formato con foto grande, precio y compra rápida.',
            defaultSettings: {
                productId: '',
                badgeText: '🔥 Producto Estrella',
                customTitle: '',
                customSubtitle: '',
                imageSide: 'left'
            }
        },
        featured_categories: {
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
            label: 'Oferta con Contador Regresivo',
            description: 'Banner de urgencia con reloj en vivo (Días, Horas, Minutos y Segundos) para ofertas.',
            defaultSettings: {
                badgeText: '⚡ Oferta por Tiempo Limitado',
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
            label: 'Reseñas Verificadas de Clientes',
            description: 'Muestra automáticamente las calificaciones reales dejadas por compradores en sus pedidos.',
            defaultSettings: {
                title: 'Opiniones de Compradores Reales',
                subtitle: 'Calificaciones verificadas de clientes que compraron en nuestra tienda'
            }
        },
        how_to_buy: {
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
            label: 'Banner de Asesoría por WhatsApp',
            description: 'Invita a tus clientes a escribirte por WhatsApp con un solo clic.',
            defaultSettings: {
                title: '¿Tienes dudas con tu talla o pedido?',
                subtitle: 'Escríbenos por WhatsApp y te asesoramos en minutos para elegir el producto ideal.',
                buttonText: 'Hablar con un asesor en WhatsApp'
            }
        },
        rich_text: {
            label: 'Texto Libre / Sobre Nosotros',
            description: 'Sección limpia para contar la historia de tu marca o información clave.',
            defaultSettings: {
                title: 'Sobre Nuestra Marca',
                content: 'Somos una tienda comprometida con ofrecerte la mejor calidad y atención personalizada en cada pedido.'
            }
        },
        catalog_results: {
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
            { value: 'home', label: '🏠 Página de Inicio (Portada)' },
            { value: 'catalog', label: '🛍️ Página de Catálogo General' },
            { value: 'product', label: '📦 Ficha de Producto (Detalle)' }
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
                    const customTag = this.isCategoryCustomized(c.id) ? ' ✨ Personalizada' : '';
                    o.textContent = `🏷️ ${c.name}${customTag}`;
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
                    const customTag = this.isCategoryCustomized(c.id) ? ' ✨ Personalizada' : '';
                    o.textContent = `📁 ${c.name}${customTag}`;
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
                o.textContent = `📄 ${cp.title || cp.slug}${cp.showInNavbar !== false ? ' (En menú)' : ''}`;
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
                badgeEl.textContent = '✨ Diseño propio';
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

    setDevice: function(device) {
        const wrapper = document.getElementById('preview-viewport-wrapper');
        const btnDesktop = document.getElementById('btn-device-desktop');
        const btnMobile = document.getElementById('btn-device-mobile');

        if (wrapper) wrapper.setAttribute('data-device', device);

        if (btnDesktop && btnMobile) {
            const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-800 text-white shadow-sm';
            const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-400 hover:text-white';
            btnDesktop.className = device === 'desktop' ? activeClass : inactiveClass;
            btnMobile.className = device === 'mobile' ? activeClass : inactiveClass;
        }
    },

    initSortable: function() {
        const container = document.getElementById('sortable-sections-container');
        if (!container || typeof Sortable === 'undefined') return;

        Sortable.create(container, {
            handle: '.drag-handle',
            animation: 180,
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                const currentList = this.getActivePageSections(true);
                const orderedIds = Array.from(container.querySelectorAll('[data-sec-id]'))
                    .map(el => el.getAttribute('data-sec-id'));

                const reordered = [];
                orderedIds.forEach(id => {
                    const found = currentList.find(s => s.id === id);
                    if (found) reordered.push(found);
                });
                this.setActivePageSections(reordered);
                this.scheduleAutoSave();
            }
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
            const subtitle = isLocked
                ? 'Sección principal de esta página (Clic para personalizar)'
                : ((sec.settings && (sec.settings.title || sec.settings.customTitle || sec.settings.badgeText || sec.settings.text || sec.settings.card1Title || sec.settings.headerTitle)) || def.label);
            const isEnabled = isLocked ? true : (sec.enabled !== false);

            const row = document.createElement('div');
            row.setAttribute('data-sec-id', sec.id);
            row.className = `group flex items-center justify-between gap-2 p-3 rounded-xl border transition-all ${
                isLocked
                    ? 'bg-slate-950 border-storevo-500/40 hover:border-storevo-500'
                    : (isEnabled
                        ? 'bg-slate-950 border-slate-800 hover:border-storevo-500/50'
                        : 'bg-slate-950/50 border-slate-800/50 opacity-50')
            }`;

            const actionsHtml = isLocked
                ? `<span class="px-2 py-0.5 rounded-md bg-storevo-500/15 text-storevo-300 border border-storevo-500/30 text-[10px] font-bold flex-shrink-0" title="Esta sección es obligatoria en esta vista, pero puedes moverla y personalizar sus opciones">Fija</span>`
                : `<div class="flex items-center gap-0.5 flex-shrink-0">
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
                    <button type="button" class="drag-handle p-1 text-slate-500 hover:text-slate-300 cursor-move flex-shrink-0" title="Arrastrar para mover">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                    </button>
                    <button type="button" class="sec-edit-trigger text-left min-w-0 flex-1">
                        <p class="text-xs font-bold text-white truncate">${this.escapeHtml(def.label)}</p>
                        <p class="text-[11px] text-slate-500 truncate mt-0.5">${this.escapeHtml(subtitle)}</p>
                    </button>
                </div>
                ${actionsHtml}
            `;

            row.querySelector('.sec-edit-trigger').addEventListener('click', () => this.openInspector(sec.id));
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

        const commitSectionChange = (key, value) => {
            if (this.activePage && this.activePage.startsWith('category:') && !this.isCategoryCustomized(this.activePage.substring(9))) {
                const materializedSec = this.ensureCategoryMaterializedOnEdit(this.activeSectionId);
                if (materializedSec) {
                    sec = materializedSec;
                    this.activeSectionId = sec.id;
                }
            }
            if (!sec.settings) sec.settings = {};
            sec.settings[key] = value;
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

        const fieldsSchema = this.getFieldsForType(sec.type);
        fieldsSchema.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'space-y-1.5';
            wrapper.setAttribute('data-field-key', field.key);

            const label = document.createElement('label');
            label.className = 'block text-xs font-bold text-slate-300';
            label.textContent = field.label;
            wrapper.appendChild(label);

            const currentVal = sec.settings[field.key] !== undefined && sec.settings[field.key] !== null
                ? sec.settings[field.key]
                : (field.defaultVal !== undefined ? field.defaultVal : '');

            if (field.type === 'image') {
                const imgBox = document.createElement('div');
                imgBox.className = 'bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5';

                const previewWrap = document.createElement('div');
                previewWrap.className = currentVal ? 'relative h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800' : 'hidden relative h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800';
                const imgEl = document.createElement('img');
                imgEl.src = currentVal || '';
                imgEl.className = 'w-full h-full object-cover';
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow';
                removeBtn.textContent = 'Quitar imagen';
                previewWrap.appendChild(imgEl);
                previewWrap.appendChild(removeBtn);

                const actionsRow = document.createElement('div');
                actionsRow.className = 'flex items-center gap-2';

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/jpeg,image/png,image/webp';
                fileInput.className = 'hidden';

                const uploadBtn = document.createElement('button');
                uploadBtn.type = 'button';
                uploadBtn.className = 'w-full py-2 px-3 bg-slate-800 hover:bg-storevo-500 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5';
                uploadBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg><span>Subir imagen desde mi equipo</span>';

                const urlInput = document.createElement('input');
                urlInput.type = 'text';
                urlInput.value = currentVal;
                urlInput.placeholder = 'O pega una URL de imagen (https://...)';
                urlInput.className = 'w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-storevo-500 focus:outline-none';

                uploadBtn.addEventListener('click', () => fileInput.click());

                fileInput.addEventListener('change', () => {
                    if (!fileInput.files || !fileInput.files[0]) return;
                    const file = fileInput.files[0];
                    const originalBtnHtml = uploadBtn.innerHTML;
                    uploadBtn.disabled = true;
                    uploadBtn.innerHTML = '<span class="animate-pulse">Subiendo imagen...</span>';

                    const formData = new FormData();
                    formData.append('file', file);

                    fetch(`/dashboard/${this.slug}/template/upload-image`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(r => r.json())
                        .then(data => {
                            if (data.success && data.url) {
                                urlInput.value = data.url;
                                imgEl.src = data.url;
                                previewWrap.classList.remove('hidden');
                                commitSectionChange(field.key, data.url);
                                if (Storevo.UI && Storevo.UI.Toast) {
                                    Storevo.UI.Toast.show('Imagen subida y aplicada', 'success');
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
                            uploadBtn.innerHTML = originalBtnHtml;
                            fileInput.value = '';
                        });
                });

                removeBtn.addEventListener('click', () => {
                    urlInput.value = '';
                    imgEl.src = '';
                    previewWrap.classList.add('hidden');
                    commitSectionChange(field.key, '');
                });

                urlInput.addEventListener('input', () => {
                    const val = urlInput.value.trim();
                    if (val) {
                        imgEl.src = val;
                        previewWrap.classList.remove('hidden');
                    } else {
                        previewWrap.classList.add('hidden');
                    }
                    commitSectionChange(field.key, val);
                });

                actionsRow.appendChild(fileInput);
                actionsRow.appendChild(uploadBtn);
                imgBox.appendChild(previewWrap);
                imgBox.appendChild(actionsRow);
                imgBox.appendChild(urlInput);
                wrapper.appendChild(imgBox);

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
                        o.value = `/catalog?category=${c.id}`;
                        o.textContent = `Categoría: ${c.name}`;
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
                        o.value = `/page/${cp.slug}`;
                        o.textContent = `Página: ${cp.title || cp.slug}`;
                        if (o.value === normalizedCurrent) {
                            o.selected = true;
                            matchedPreset = true;
                        }
                        cpGroup.appendChild(o);
                    });
                    presetSelect.appendChild(cpGroup);
                }

                const extGroup = document.createElement('optgroup');
                extGroup.label = 'Externo';
                const customOpt = document.createElement('option');
                customOpt.value = '__custom__';
                customOpt.textContent = 'Otro enlace externo (Instagram, TikTok, Web...)';
                if (!matchedPreset) {
                    customOpt.selected = true;
                }
                extGroup.appendChild(customOpt);
                presetSelect.appendChild(extGroup);

                const customUrlInput = document.createElement('input');
                customUrlInput.type = 'text';
                customUrlInput.value = matchedPreset ? '' : currentVal;
                customUrlInput.placeholder = 'Pega aquí el enlace (Ej: https://instagram.com/mitienda)';
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
                    commitSectionChange(field.key, customUrlInput.value.trim());
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
                    o.textContent = opt.label;
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
                    if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value.trim())) {
                        colorInput.value = hexInput.value.trim();
                        commitSectionChange(field.key, hexInput.value.trim());
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
                wrapper.innerHTML = '';
                wrapper.appendChild(checkLabel);

            } else {
                const input = document.createElement('input');
                input.type = field.type || 'text';
                input.value = currentVal;
                input.placeholder = field.placeholder || '';
                input.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none [color-scheme:dark]';
                input.addEventListener('input', () => {
                    commitSectionChange(field.key, input.value);
                    if (sec.type === 'hero_banner' && field.key === 'secondaryButtonText') {
                        const secUrlWrap = container.querySelector('[data-field-key="secondaryButtonUrl"]');
                        if (secUrlWrap) {
                            secUrlWrap.classList.toggle('hidden', !input.value.trim());
                        }
                    }
                });
                wrapper.appendChild(input);
            }

            if (sec.type === 'hero_banner' && field.key === 'secondaryButtonUrl') {
                const secBtnText = sec.settings.secondaryButtonText || '';
                if (!String(secBtnText).trim()) {
                    wrapper.classList.add('hidden');
                }
            }

            container.appendChild(wrapper);
        });

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
            case 'announcement_bar':
                return [
                    { key: 'text', label: 'Mensaje principal del anuncio', type: 'text', placeholder: 'Ej: 🚚 Envío gratis en compras mayores a $150.000' },
                    { key: 'text2', label: '2do mensaje rotativo (Opcional)', type: 'text', placeholder: 'Ej: 💳 Paga en línea o pide fácil por WhatsApp' },
                    { key: 'text3', label: '3er mensaje rotativo (Opcional)', type: 'text', placeholder: 'Ej: ✨ Nuevos lanzamientos disponibles hoy' },
                    { key: 'linkUrl', label: '¿A dónde lleva al hacer clic?', type: 'url', allowEmpty: true, defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo', type: 'color', defaultVal: '#0f172a' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'hero_banner':
                return [
                    { key: 'heroLayout', label: 'Diseño del Banner Principal', type: 'select', defaultVal: 'classic', options: [
                            { value: 'classic', label: 'Portada Clásica (Imagen de fondo completa)' },
                            { value: 'split', label: 'Dividido Editorial (Texto a un lado + Imagen al otro)' },
                            { value: 'compact', label: 'Banner Compacto (Altura reducida)' }
                        ]},
                    { key: 'imageUrl', label: 'Imagen del Banner', type: 'image' },
                    { key: 'overlayOpacity', label: 'Oscuridad sobre la imagen (0 a 90)', type: 'number', defaultVal: 50 },
                    { key: 'badgeText', label: 'Etiqueta superior (Opcional)', type: 'text', placeholder: 'Ej: Nueva Colección' },
                    { key: 'title', label: 'Título Principal', type: 'text', placeholder: 'Bienvenido a nuestra tienda' },
                    { key: 'subtitle', label: 'Subtítulo descriptivo', type: 'textarea', placeholder: 'Explora nuestro catálogo...' },
                    { key: 'alignment', label: 'Alineación del texto', type: 'select', options: [
                            { value: 'center', label: 'Centrado' },
                            { value: 'left', label: 'Izquierda' }
                        ]},
                    { key: 'buttonText', label: 'Texto del botón principal', type: 'text', placeholder: 'Ver Catálogo' },
                    { key: 'buttonUrl', label: '¿A dónde lleva el botón principal?', type: 'url', defaultVal: '/catalog' },
                    { key: 'secondaryButtonText', label: 'Texto 2do botón (Dejar vacío para ocultar)', type: 'text', placeholder: 'Ej: Ver Ofertas o Hablar por WhatsApp' },
                    { key: 'secondaryButtonUrl', label: '¿A dónde lleva el 2do botón?', type: 'url', defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo', type: 'color', defaultVal: '#6366f1' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'product_grid':
                return [
                    { key: 'title', label: 'Título de la vitrina', type: 'text', placeholder: 'Novedades' },
                    { key: 'subtitle', label: 'Subtítulo (Opcional)', type: 'text', placeholder: 'Los favoritos de la temporada' },
                    { key: 'source', label: 'Qué productos mostrar', type: 'select', options: [
                            { value: 'NEWEST', label: 'Últimos productos agregados' },
                            { value: 'OFFERS', label: 'Solo productos en oferta / descuento' },
                            { value: 'CATEGORY', label: 'Productos de una categoría específica' }
                        ]},
                    { key: 'categoryId', label: 'Categoría a mostrar', type: 'select', options: catOptions },
                    { key: 'limit', label: 'Cantidad máxima de productos', type: 'select', options: [
                            { value: '4', label: '4 productos (1 fila)' },
                            { value: '8', label: '8 productos (2 filas)' },
                            { value: '12', label: '12 productos (3 filas)' },
                            { value: '24', label: '24 productos (Catálogo amplio)' }
                        ]},
                    { key: 'showFilters', label: 'Filtros Dinámicos y Buscador', type: 'checkbox', placeholder: 'Habilitar barra de filtros, tallas, colores y buscador en esta vitrina', defaultVal: false },
                    { key: 'showViewAll', label: 'Enlace al catálogo', type: 'checkbox', placeholder: 'Mostrar botón "Ver todo →"', defaultVal: true }
                ];
            case 'spotlight_product':
                return [
                    { key: 'productId', label: 'Producto a destacar', type: 'select', defaultVal: '', options: spotlightProductOptions },
                    { key: 'badgeText', label: 'Etiqueta destacada', type: 'text', defaultVal: '🔥 Producto Estrella', placeholder: 'Ej: Lanzamiento de la Semana' },
                    { key: 'customTitle', label: 'Título personalizado (Opcional)', type: 'text', placeholder: 'Dejar vacío para usar el nombre del producto' },
                    { key: 'customSubtitle', label: 'Descripción destacada (Opcional)', type: 'textarea', placeholder: 'Dejar vacío para usar la descripción del producto' },
                    { key: 'imageSide', label: 'Posición de la foto en PC', type: 'select', defaultVal: 'left', options: [
                            { value: 'left', label: 'Foto a la izquierda / Texto a la derecha' },
                            { value: 'right', label: 'Texto a la izquierda / Foto a la derecha' }
                        ]}
                ];
            case 'featured_categories':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text', placeholder: 'Explora por Categoría' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Encuentra rápidamente lo que buscas' },
                    { key: 'cardLayout', label: 'Estilo visual de las categorías', type: 'select', defaultVal: 'visual', options: [
                            { value: 'visual', label: 'Tarjetas Visuales con Foto Automática del Producto' },
                            { value: 'icon', label: 'Tarjetas Clásicas Limpias con Ícono' },
                            { value: 'pills', label: 'Botones Modernos Tipo Píldora' }
                        ]},
                    { key: 'columns', label: 'Columnas en PC', type: 'select', defaultVal: '4', options: [
                            { value: '4', label: '4 categorías por fila' },
                            { value: '3', label: '3 categorías grandes por fila' }
                        ]}
                ];
            case 'countdown_promo':
                return [
                    { key: 'badgeText', label: 'Etiqueta superior', type: 'text', defaultVal: '⚡ Oferta por Tiempo Limitado' },
                    { key: 'title', label: 'Título de la oferta', type: 'text', defaultVal: '¡Aprovecha nuestros descuentos especiales!' },
                    { key: 'subtitle', label: 'Descripción de la promoción', type: 'textarea' },
                    { key: 'endDate', label: 'Fecha y hora límite (Opcional: si se deja vacío dura 24h)', type: 'datetime-local' },
                    { key: 'buttonText', label: 'Texto del botón', type: 'text', defaultVal: 'Ver Ofertas Ahora' },
                    { key: 'buttonUrl', label: '¿A dónde lleva el botón?', type: 'url', defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo', type: 'color', defaultVal: '#0f172a' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'multi_banners':
                return [
                    { key: 'card1ImageUrl', label: 'Tarjeta 1: Imagen de Fondo', type: 'image' },
                    { key: 'card1Badge', label: 'Tarjeta 1: Etiqueta', type: 'text' },
                    { key: 'card1Title', label: 'Tarjeta 1: Título', type: 'text' },
                    { key: 'card1Subtitle', label: 'Tarjeta 1: Subtítulo', type: 'text' },
                    { key: 'card1ButtonText', label: 'Tarjeta 1: Texto del botón', type: 'text' },
                    { key: 'card1ButtonUrl', label: 'Tarjeta 1: ¿A dónde lleva el botón?', type: 'url', defaultVal: '/catalog' },
                    { key: 'card1BgColor', label: 'Tarjeta 1: Color de fondo', type: 'color', defaultVal: '#1e293b' },
                    { key: 'card2ImageUrl', label: 'Tarjeta 2: Imagen de Fondo', type: 'image' },
                    { key: 'card2Badge', label: 'Tarjeta 2: Etiqueta', type: 'text' },
                    { key: 'card2Title', label: 'Tarjeta 2: Título', type: 'text' },
                    { key: 'card2Subtitle', label: 'Tarjeta 2: Subtítulo', type: 'text' },
                    { key: 'card2ButtonText', label: 'Tarjeta 2: Texto del botón', type: 'text' },
                    { key: 'card2ButtonUrl', label: 'Tarjeta 2: ¿A dónde lleva el botón?', type: 'url', defaultVal: '/catalog' },
                    { key: 'card2BgColor', label: 'Tarjeta 2: Color de fondo', type: 'color', defaultVal: '#4f46e5' }
                ];
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
                    { key: 'subtitle', label: 'Subtítulo descriptivo', type: 'text', placeholder: 'Calificaciones verificadas de clientes...' }
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
            case 'trust_badges':
                return [
                    { key: 'badgeStyle', label: 'Diseño de la Franja', type: 'select', defaultVal: 'cards', options: [
                            { value: 'cards', label: 'Tarjetas Blancas con Sombra' },
                            { value: 'minimal', label: 'Minimalista Integrado al Fondo' },
                            { value: 'secondary', label: 'Franja Destacada en Color Secundario' }
                        ]},
                    { key: 'item1Icon', label: 'Beneficio 1: Ícono', type: 'select', defaultVal: 'shield', options: trustIconOptions },
                    { key: 'item1Title', label: 'Beneficio 1: Título', type: 'text' },
                    { key: 'item1Text', label: 'Beneficio 1: Descripción', type: 'text' },
                    { key: 'item2Icon', label: 'Beneficio 2: Ícono', type: 'select', defaultVal: 'truck', options: trustIconOptions },
                    { key: 'item2Title', label: 'Beneficio 2: Título', type: 'text' },
                    { key: 'item2Text', label: 'Beneficio 2: Descripción', type: 'text' },
                    { key: 'item3Icon', label: 'Beneficio 3: Ícono', type: 'select', defaultVal: 'chat', options: trustIconOptions },
                    { key: 'item3Title', label: 'Beneficio 3: Título', type: 'text' },
                    { key: 'item3Text', label: 'Beneficio 3: Descripción', type: 'text' }
                ];
            case 'faq_accordion':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text' },
                    { key: 'q1', label: 'Pregunta 1', type: 'text' },
                    { key: 'a1', label: 'Respuesta 1', type: 'textarea' },
                    { key: 'q2', label: 'Pregunta 2', type: 'text' },
                    { key: 'a2', label: 'Respuesta 2', type: 'textarea' },
                    { key: 'q3', label: 'Pregunta 3', type: 'text' },
                    { key: 'a3', label: 'Respuesta 3', type: 'textarea' },
                    { key: 'q4', label: 'Pregunta 4 (Opcional)', type: 'text', placeholder: 'Dejar vacío si no se usa' },
                    { key: 'a4', label: 'Respuesta 4 (Opcional)', type: 'textarea' },
                    { key: 'q5', label: 'Pregunta 5 (Opcional)', type: 'text', placeholder: 'Dejar vacío si no se usa' },
                    { key: 'a5', label: 'Respuesta 5 (Opcional)', type: 'textarea' }
                ];
            case 'whatsapp_cta':
                return [
                    { key: 'title', label: 'Título del bloque', type: 'text' },
                    { key: 'subtitle', label: 'Subtítulo persuasivo', type: 'textarea' },
                    { key: 'buttonText', label: 'Texto del botón de WhatsApp', type: 'text' }
                ];
            case 'rich_text':
                return [
                    { key: 'title', label: 'Título', type: 'text', placeholder: 'Sobre Nosotros' },
                    { key: 'content', label: 'Contenido', type: 'textarea', placeholder: 'Escribe aquí la historia o mensaje de tu tienda...' }
                ];
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

        const compactScrollChk = document.getElementById('style-navbar-compact-scroll');
        if (compactScrollChk) {
            compactScrollChk.checked = Boolean(gs.navbarCompactOnScroll);
            compactScrollChk.onchange = () => {
                gs.navbarCompactOnScroll = compactScrollChk.checked;
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

    getPresetsDefinitions: function() {
        const name = this.storeName || 'Nuestra Tienda';
        return [
            {
                id: 'atelier_provenza',
                category: 'moda_calzado',
                name: 'Atelier Provenza',
                tag: 'Ropa, Boutique y Moda de Autor',
                layoutSummary: 'Navbar Boutique Centrado • Tarjeta Editorial 4:5 • Galería Lookbook',
                colors: ['#9a6b56', '#1c1917', '#faf8f5'],
                description: 'Editorial de alta costura con tipografía Cormorant Garamond y Manrope, tarjetas verticales limpias, catálogo de 3 columnas amplias y ficha en mosaico 60/40.',
                config: {
                    globalStyles: {
                        primaryColor: '#9a6b56',
                        secondaryColor: '#1c1917',
                        backgroundColor: '#faf8f5',
                        textColor: '#1c1917',
                        headingFont: 'Cormorant Garamond',
                        bodyFont: 'Manrope',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '0.375rem',
                        buttonRadius: 'square',
                        navbarLayout: 'centered',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'underline_center',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'fade',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'slow',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'clean',
                        cardRadius: '0px',
                        cardShadow: 'none',
                        cardImageAspect: 'portrait',
                        cardImageFit: 'cover',
                        cardImagePadding: 'flush',
                        cardContentAlign: 'left',
                        cardMetaMode: 'category',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'dark',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'none',
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
                        detailShowStock: false,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'collapsed',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '3',
                        filterEnabled: true,
                        filterLayout: 'drawer',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: false,
                        filterShowVariants: true,
                        filterShowSpecs: false,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'expandable_icon',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'underline',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'fade',
                        searchPlaceholder: 'Buscar vestidos, blusas, tallas...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos prendas para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 250,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: false,
                        searchSuggestCategories: true,
                        searchSuggestBrands: false,
                        searchShowRecent: true,
                        searchPopularTerms: 'Vestidos, Lino, Blusas, Conjuntos, Ofertas',
                        searchCategoryScope: 'none',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: false,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: false
                    },
                    sections: [
                        {
                            id: 'sec_ann_ap', type: 'announcement_bar', enabled: true,
                            settings: { text: '✨ Envíos a toda Colombia • Cambios de talla fáciles y rápidos', text2: '💳 Pago seguro en línea con PSE, Nequi y Tarjetas', text3: '💬 Asesoría personalizada de tallaje por WhatsApp', bgColor: '#1c1917', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_ap', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'NUEVA COLECCIÓN', title: 'Siluetas de autor y elegancia natural en ' + name, subtitle: 'Prendas diseñadas para destacar en cada ocasión con telas seleccionadas y confección impecable.', buttonText: 'Ver Colección', buttonUrl: '/catalog', secondaryButtonText: 'Asesoría de Talla', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 40, bgColor: '#1c1917', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_ap', type: 'featured_categories', enabled: true,
                            settings: { title: 'Líneas de Colección', subtitle: 'Explora nuestras categorías principales', cardLayout: 'visual', columns: '3' }
                        },
                        {
                            id: 'sec_grid_ap', type: 'product_grid', enabled: true,
                            settings: { title: 'Nuevos Ingresos', subtitle: 'Piezas recién llegadas a nuestra boutique', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_ap', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '✨ PIEZA DE LA SEMANA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_multi_ap', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Esenciales', card1Title: 'Básicos de Armario', card1Subtitle: 'Versatilidad y frescura para todos los días', card1ButtonText: 'Explorar', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#1c1917', card2Badge: 'Edición Limitada', card2Title: 'Ocasiones Especiales', card2Subtitle: 'Diseños exclusivos en unidades limitadas', card2ButtonText: 'Descubrir', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#9a6b56' }
                        },
                        {
                            id: 'sec_rich_ap', type: 'rich_text', enabled: true,
                            settings: { title: 'Nuestra Filosofía de Diseño', content: 'En ' + name + ' cuidamos cada corte, textura y caída para entregarte prendas atemporales hechas con dedicación en Colombia.' }
                        },
                        {
                            id: 'sec_test_ap', type: 'testimonials', enabled: true,
                            settings: { title: 'Experiencias de Nuestras Clientas', subtitle: 'Calificaciones reales verificadas en cada pedido' }
                        },
                        {
                            id: 'sec_wa_ap', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Tienes dudas con tu talla o medidas?', subtitle: 'Escríbenos por WhatsApp y te asesoramos en minutos para que elijas el fit ideal.', buttonText: 'Hablar con una asesora en WhatsApp' }
                        },
                        {
                            id: 'sec_trust_ap', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'minimal', item1Icon: 'shield', item1Title: 'Compra 100% Protegida', item1Text: 'Paga en línea con total tranquilidad o coordina por WhatsApp.', item2Icon: 'truck', item2Title: 'Envíos a Toda Colombia', item2Text: 'Empaque delicado y despacho seguro hasta tu puerta.', item3Icon: 'refresh', item3Title: 'Cambios de Talla Fáciles', item3Text: 'Te acompañamos si necesitas cambiar la talla de tu prenda.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'LOOKBOOK', headerTitle: 'Catálogo de Colección', headerSubtitle: 'Filtra por talla, color o categoría para encontrar tu prenda ideal.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: false, columnsDesktop: '3', showDiscountPercent: true }
                        }],
                        product: [
                            {
                                id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                                settings: { galleryLayout: 'grid', showBreadcrumbs: true, showSku: false, showStockCounter: false, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Completa tu Look', relatedSubtitle: 'Prendas que combinan con tu elección' }
                            }
                        ]
                    }
                }
            },
            {
                id: 'nexo_digital',
                category: 'tecnologia',
                name: 'Nexo Digital',
                tag: 'Tecnología, Audio y Accesorios',
                layoutSummary: 'Navbar Buscador Comercial • Tarjetas Bento Contain • Ficha Técnica Abierta',
                colors: ['#2563eb', '#0f172a', '#f1f5f9'],
                description: 'Estructura tipo marketplace tecnológico con buscador prominente en cabecera, submenú Maestro-Detalle, tarjetas Bento con imagen completa sin recorte y especificaciones técnicas desplegadas.',
                config: {
                    globalStyles: {
                        primaryColor: '#2563eb',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f1f5f9',
                        textColor: '#0f172a',
                        headingFont: 'Plus Jakarta Sans',
                        bodyFont: 'Inter',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'marketplace',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'normal',
                        navbarLinkHover: 'slide_bg',
                        navbarSticky: true,
                        navbarDropdownStyle: 'split',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true,
                        cardPreset: 'bento',
                        cardStyle: 'bento',
                        cardRadius: '1rem',
                        cardShadow: 'sm',
                        cardImageAspect: 'square',
                        cardImageFit: 'contain',
                        cardImagePadding: 'inset',
                        cardContentAlign: 'left',
                        cardMetaMode: 'brand',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'solid',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'glow',
                        detailPreset: 'tech_specs',
                        detailInfoStyle: 'card',
                        detailStickyMode: 'sticky_gallery',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'left',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'contain',
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
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'sidebar',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: true,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'inline_bar',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon_text',
                        searchAnim: 'slide_up',
                        searchPlaceholder: 'Buscar por referencia, marca, modelo o especificación...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos equipos o accesorios para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 150,
                        searchMaxSuggestions: 8,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Audífonos, Cargador, Smartwatch, Gamer, Ofertas',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: true,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_nd', type: 'announcement_bar', enabled: true,
                            settings: { text: '⚡ Garantía directa en todos los equipos • Despacho rápido y asegurado a toda Colombia', text2: '💳 Paga en línea con PSE, Nequi, Tarjetas o coordina por WhatsApp', text3: '🛡️ Equipos verificados y soporte técnico directo', bgColor: '#2563eb', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_nd', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'TECNOLOGÍA GARANTIZADA', title: 'Innovación y alto rendimiento en ' + name, subtitle: 'Encuentra dispositivos, audio y accesorios con respaldo real, especificaciones claras y envío ágil.', buttonText: 'Explorar Catálogo', buttonUrl: '/catalog', secondaryButtonText: 'Asesoría Técnica', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 45, bgColor: '#1e293b', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_nd', type: 'featured_categories', enabled: true,
                            settings: { title: 'Categorías Tecnológicas', subtitle: 'Accede directo a la línea de productos que buscas', cardLayout: 'icon', columns: '4' }
                        },
                        {
                            id: 'sec_cd_nd', type: 'countdown_promo', enabled: true,
                            settings: { badgeText: '⚡ OFERTAS TECH DE LA SEMANA', title: '¡Precios especiales en referencias seleccionadas!', subtitle: 'Unidades disponibles en inventario con despacho inmediato.', endDate: '', buttonText: 'Ver Ofertas Ahora', buttonUrl: '/catalog', bgColor: '#090d16', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_grid_nd', type: 'product_grid', enabled: true,
                            settings: { title: 'Catálogo Tecnológico', subtitle: 'Busca por referencia o filtra por marca, capacidad y precio', source: 'NEWEST', categoryId: '', limit: 12, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_nd', type: 'spotlight_product', enabled: true,
                            settings: { productId: '__offer__', badgeText: '⚡ OFERTA DESTACADA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_trust_nd', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'shield', item1Title: 'Garantía Real', item1Text: 'Respaldo directo ante defectos de fabricación.', item2Icon: 'truck', item2Title: 'Envío Asegurado', item2Text: 'Empaque de alta protección hasta tu ciudad.', item3Icon: 'card', item3Title: 'Múltiples Medios de Pago', item3Text: 'PSE, Nequi, Daviplata, tarjetas o WhatsApp.' }
                        },
                        {
                            id: 'sec_steps_nd', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo comprar tu equipo en ' + name + '?', subtitle: 'Proceso 100% transparente, rápido y seguro', step1Title: 'Revisa la ficha técnica', step1Text: 'Verifica compatibilidad, capacidad y especificaciones en el producto.', step2Title: 'Ingresa tus datos de envío', step2Text: 'Indica tu ciudad, dirección exacta y datos de facturación.', step3Title: 'Paga en línea o por WhatsApp', step3Text: 'Usa nuestra pasarela segura o confirma directamente con un asesor.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_faq_nd', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Resolvemos tus dudas técnicas antes de comprar', q1: '¿Qué cubre la garantía de los productos?', a1: 'Todos nuestros productos cuentan con garantía directa por defectos de fábrica y acompañamiento técnico.', q2: '¿Cuánto tarda el envío a mi ciudad?', a2: 'Despachamos en menos de 24 horas hábiles. La entrega toma de 1 a 4 días hábiles según tu ubicación.', q3: '¿Los equipos son nuevos y originales?', a3: 'Sí, comercializamos referencias verificadas y selladas con sus accesorios correspondientes.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'CATÁLOGO OFICIAL', headerTitle: 'Todos los Equipos y Accesorios', headerSubtitle: 'Usa los filtros laterales para buscar por marca, especificaciones técnicas y rango de precio.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'left', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Accesorios y Equipos Compatibles', relatedSubtitle: 'Complementa tu compra con estas referencias' }
                        }]
                    }
                }
            },
            {
                id: 'distrito_urbano',
                category: 'moda_calzado',
                name: 'Distrito Urbano',
                tag: 'Gorras, Streetwear y Urbano',
                layoutSummary: 'Navbar Transparente Hero • Tarjeta Brutalista 2px • Galería Cascada',
                colors: ['#e11d48', '#09090b', '#f4f4f5'],
                description: 'Estética streetwear audaz con tipografía Syne en mayúsculas, tarjetas de contorno negro 2px, contador de drops, filtro por marcas y galería en cascada.',
                config: {
                    globalStyles: {
                        primaryColor: '#e11d48',
                        secondaryColor: '#09090b',
                        backgroundColor: '#f4f4f5',
                        textColor: '#09090b',
                        headingFont: 'Syne',
                        bodyFont: 'Space Grotesk',
                        headingTransform: 'uppercase',
                        fontScale: 'standard',
                        borderRadius: '0.375rem',
                        buttonRadius: 'square',
                        navbarLayout: 'hero_overlay',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'pill',
                        navbarSticky: true,
                        navbarDropdownStyle: 'strip',
                        navbarDropdownAnim: 'slide_down',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true,
                        cardPreset: 'compact',
                        cardStyle: 'outlined',
                        cardRadius: '0px',
                        cardShadow: 'none',
                        cardImageAspect: 'square',
                        cardImageFit: 'cover',
                        cardImagePadding: 'flush',
                        cardContentAlign: 'left',
                        cardMetaMode: 'brand',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'large',
                        cardButtonStyle: 'dark',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'border',
                        detailPreset: 'urban_drop',
                        detailInfoStyle: 'outlined',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'stack',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'cover',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'square',
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
                        detailRelatedCols: '4',
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
                        filterShowSpecs: false,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'modal_trigger',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'square',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'scale',
                        searchPlaceholder: 'Buscar gorras, oversize, marcas o tallas...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos referencias para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 150,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Gorras, Oversize, Hoodies, Camisetas, Drops',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: false
                    },
                    sections: [
                        {
                            id: 'sec_hero_du', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'NUEVO DROP DISPONIBLE', title: 'CULTURA URBANA Y EXCLUSIVIDAD EN ' + name, subtitle: 'Gorras originales, siluetas oversize y accesorios con unidades limitadas. Despachos rápidos a toda Colombia.', buttonText: 'EXPLORAR EL DROP', buttonUrl: '/catalog', secondaryButtonText: 'WHATSAPP DIRECTO', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 55, bgColor: '#09090b', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_ann_du', type: 'announcement_bar', enabled: true,
                            settings: { text: '🔥 UNIDADES LIMITADAS POR REFERENCIA • ENVÍOS A TODA COLOMBIA', text2: '💳 PAGA FÁCIL CON NEQUI, DAVIPLATA, PSE O TARJETAS', text3: '🧢 100% CALIDAD GARANTIZADA EN CADA PRENDA Y GORRA', bgColor: '#e11d48', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_cats_du', type: 'featured_categories', enabled: true,
                            settings: { title: 'Categorías del Drop', subtitle: 'Filtra rápido por línea de producto', cardLayout: 'pills', columns: '4' }
                        },
                        {
                            id: 'sec_spot_du', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '🔥 DROP EXCLUSIVO', customTitle: '', customSubtitle: '', imageSide: 'right' }
                        },
                        {
                            id: 'sec_grid_du', type: 'product_grid', enabled: true,
                            settings: { title: 'Recién Llegados', subtitle: 'Filtra por marca, talla o disponibilidad inmediata', source: 'NEWEST', categoryId: '', limit: 8, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_cd_du', type: 'countdown_promo', enabled: true,
                            settings: { badgeText: '⚡ FLASH SALE 24H', title: 'PRECIOS ESPECIALES ANTES DE AGOTAR EXISTENCIAS', subtitle: 'Aprovecha descuentos en referencias seleccionadas del catálogo.', endDate: '', buttonText: 'Ver Rebajas', buttonUrl: '/catalog', bgColor: '#09090b', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_multi_du', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Headwear', card1Title: 'Colección de Gorras', card1Subtitle: 'Fitted, Snapback y Trucker', card1ButtonText: 'Ver Gorras', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#09090b', card2Badge: 'Streetwear', card2Title: 'Prendas Oversize', card2Subtitle: 'Camisetas de alto gramaje y hoodies', card2ButtonText: 'Ver Prendas', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#e11d48' }
                        },
                        {
                            id: 'sec_trust_du', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'secondary', item1Icon: 'star', item1Title: 'Calidad Premium', item1Text: 'Bordados, telas de alto gramaje y acabados impecables.', item2Icon: 'truck', item2Title: 'Envíos en Caja Protegida', item2Text: 'Tus gorras viajan protegidas sin deformarse.', item3Icon: 'chat', item3Title: 'Atención Directa', item3Text: 'Confirmación y soporte rápido por WhatsApp.' }
                        },
                        {
                            id: 'sec_faq_du', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Todo sobre envíos, tallas y pagos', q1: '¿Cómo envían las gorras para que no se dañen?', a1: 'Todas nuestras gorras se despachan en caja rígida protectora para garantizar que lleguen intactas a tu ciudad.', q2: '¿Cómo sé qué talla elegir?', a2: 'En cada producto encuentras las tallas disponibles. Si tienes dudas con tu medida en centímetros, escríbenos por WhatsApp.', q3: '¿Qué medios de pago reciben?', a3: 'Aceptamos Nequi, Daviplata, PSE, tarjetas débito/crédito y coordinación directa por WhatsApp.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'STREETWEAR & CAPS', headerTitle: 'Catálogo Urbano', headerSubtitle: 'Filtra por marca, talla o disponibilidad en tiempo real.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'stack', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Completa el Outfit', relatedSubtitle: 'Otras referencias del drop actual' }
                        }]
                    }
                }
            },
            {
                id: 'paso_firme',
                category: 'moda_calzado',
                name: 'Paso Firme',
                tag: 'Zapatos, Tenis y Calzado',
                layoutSummary: 'Navbar Clásico Maestro-Detalle • Carrusel de Ángulos • Filtro de Tallas',
                colors: ['#ea580c', '#0f172a', '#f8fafc'],
                description: 'Especializada en tiendas de calzado y sneakers: facilita filtrar por número de talla (35 al 44), revisar múltiples ángulos del zapato y consultar políticas de cambio.',
                config: {
                    globalStyles: {
                        primaryColor: '#ea580c',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Montserrat',
                        bodyFont: 'DM Sans',
                        headingTransform: 'uppercase',
                        fontScale: 'standard',
                        borderRadius: '0.75rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'classic',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'underline_slide',
                        navbarSticky: true,
                        navbarDropdownStyle: 'split',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'normal',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'elevated',
                        cardRadius: '0.5rem',
                        cardShadow: 'sm',
                        cardImageAspect: 'square',
                        cardImageFit: 'cover',
                        cardImagePadding: 'flush',
                        cardContentAlign: 'left',
                        cardMetaMode: 'both',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'large',
                        cardButtonStyle: 'solid',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'lift',
                        detailPreset: 'conversion',
                        detailInfoStyle: 'buybox',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'left',
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
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'sidebar',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: true,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'auto',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'slide_up',
                        searchPlaceholder: 'Buscar por modelo, talla (ej. 37, 40) o color...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos calzado con ese criterio',
                        searchMinChars: 2,
                        searchDebounceMs: 200,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Tenis, Botas, Cuero, Talla 38, Talla 40, Ofertas',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: true,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_pf', type: 'announcement_bar', enabled: true,
                            settings: { text: '👟 Cambios de talla fáciles y garantizados • Envíos a toda Colombia', text2: '💳 Paga con PSE, Nequi, Tarjetas o coordina tu pedido por WhatsApp', text3: '', bgColor: '#0f172a', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_pf', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'CONFORT Y DISEÑO EN CADA PASO', title: 'Encuentra tu par ideal en ' + name, subtitle: 'Calzado elaborado con materiales resistentes, suelas de alto confort y hormas pensadas para tu día a día.', buttonText: 'Ver Catálogo de Calzado', buttonUrl: '/catalog', secondaryButtonText: 'Consultar mi Talla', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 45, bgColor: '#0f172a', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_trust_pf', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'refresh', item1Title: 'Cambio de Talla Seguro', item1Text: 'Si no te queda como esperabas, gestionamos el cambio rápido.', item2Icon: 'shield', item2Title: 'Garantía de Calidad', item2Text: 'Costuras, pegues y materiales con respaldo directo.', item3Icon: 'truck', item3Title: 'Despacho Nacional', item3Text: 'Enviamos en caja original hasta la puerta de tu casa.' }
                        },
                        {
                            id: 'sec_cats_pf', type: 'featured_categories', enabled: true,
                            settings: { title: 'Explora por Línea de Calzado', subtitle: 'Para dama, caballero y todos los estilos', cardLayout: 'visual', columns: '4' }
                        },
                        {
                            id: 'sec_grid_pf', type: 'product_grid', enabled: true,
                            settings: { title: 'Nuevos Modelos Disponibles', subtitle: 'Filtra tu número de talla para ver los pares con entrega inmediata', source: 'NEWEST', categoryId: '', limit: 12, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_pf', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '👟 EL MÁS VENDIDO', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_promo_pf', type: 'promo_banner', enabled: true,
                            settings: { badgeText: 'CALIDAD COLOMBIANA', title: 'Materiales pensados para durar', subtitle: 'Seleccionamos suelas antideslizantes, plantillas anatómicas y acabados de primera calidad.', buttonText: 'Descubrir Modelos', buttonUrl: '/catalog', imageUrl: '', bgColor: '#0f172a', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_steps_pf', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo pedir tus zapatos en ' + name + '?', subtitle: 'Recibe tu par favorito sin salir de casa', step1Title: 'Elige modelo y talla', step1Text: 'Selecciona tu número habitual y agrégalo a la bolsa.', step2Title: 'Completa tu dirección', step2Text: 'Ingresa tus datos de entrega en cualquier ciudad o municipio.', step3Title: 'Paga o confirma por WhatsApp', step3Text: 'Realiza tu pago seguro en línea o coordina con un asesor.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_faq_pf', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes sobre Tallas y Envíos', subtitle: 'Compra con total seguridad', q1: '¿El tallaje es normal o debo pedir una talla más?', a1: 'Nuestras referencias manejan horma nacional estándar. En la ficha técnica de cada zapato indicamos el material y ajuste.', q2: '¿Qué pasa si necesito cambiar la talla cuando me llegue?', a2: 'Puedes solicitar el cambio de talla escribiéndonos a nuestro WhatsApp dentro de los plazos de nuestra política de cambios.', q3: '¿Cuánto demora la entrega?', a3: 'Entre 2 y 5 días hábiles según tu ciudad en Colombia.' }
                        },
                        {
                            id: 'sec_wa_pf', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿No estás seguro de tu talla en centímetros?', subtitle: 'Mide tu pie del talón a la punta y escríbenos por WhatsApp para confirmarte tu talla exacta.', buttonText: 'Confirmar mi talla por WhatsApp' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'COLECCIÓN DE CALZADO', headerTitle: 'Todos los Modelos', headerSubtitle: 'Selecciona tu talla en los filtros para ver los pares disponibles hoy.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'left', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Otros modelos que te pueden gustar', relatedSubtitle: 'Disponibles en nuestro catálogo de calzado' }
                        }]
                    }
                }
            },
            {
                id: 'aura_botanica',
                category: 'belleza_bienestar',
                name: 'Aura Botánica',
                tag: 'Belleza, Maquillaje y Skincare',
                layoutSummary: 'Navbar Cristal Editorial • Tarjetas Suaves 24px • Tonos Malva',
                colors: ['#c06c84', '#2d232e', '#fff9fb'],
                description: 'Diseño delicado y luminoso para cosmética, cuidado facial y capilar. Bordes orgánicos de 24px, botones píldora, tarjetas centradas y especificaciones de ingredientes abiertas.',
                config: {
                    globalStyles: {
                        primaryColor: '#c06c84',
                        secondaryColor: '#2d232e',
                        backgroundColor: '#fff9fb',
                        textColor: '#2d232e',
                        headingFont: 'Playfair Display',
                        bodyFont: 'Plus Jakarta Sans',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1.5rem',
                        buttonRadius: 'pill',
                        navbarLayout: 'editorial',
                        navbarStyle: 'glass',
                        navbarLinkFormat: 'normal',
                        navbarLinkHover: 'color',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'normal',
                        navbarCompactOnScroll: true,
                        cardPreset: 'gallery',
                        cardStyle: 'soft',
                        cardRadius: '1.5rem',
                        cardShadow: 'sm',
                        cardImageAspect: 'square',
                        cardImageFit: 'cover',
                        cardImagePadding: 'inset',
                        cardContentAlign: 'center',
                        cardMetaMode: 'brand',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'outline',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'glow',
                        detailPreset: 'conversion',
                        detailInfoStyle: 'clean',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'bottom',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'cover',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'pills',
                        detailShowBreadcrumbs: true,
                        detailShowMeta: true,
                        detailShowSku: false,
                        detailShowSavingsBadge: true,
                        detailShowStock: true,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
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
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'expandable_icon',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'pill',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'fade',
                        searchPlaceholder: 'Buscar sérum, protector solar, labial, marca...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos productos de belleza para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 200,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Protector solar, Sérum, Hidratante, Capilar, Kit',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_ab', type: 'announcement_bar', enabled: true,
                            settings: { text: '🌸 Productos 100% originales • Asesoría de rutina gratis por WhatsApp', text2: '🚚 Envíos cuidadosos a toda Colombia • Pago seguro con PSE y Nequi', text3: '', bgColor: '#2d232e', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_ab', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'CUIDADO FACIAL, CAPILAR Y MAQUILLAJE', title: 'Realza tu brillo natural con ' + name, subtitle: 'Fórmulas seleccionadas para hidratar, proteger y transformar tu rutina diaria de cuidado personal.', buttonText: 'Explorar Productos', buttonUrl: '/catalog', secondaryButtonText: 'Asesoría de Piel', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 35, bgColor: '#c06c84', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_ab', type: 'featured_categories', enabled: true,
                            settings: { title: 'Explora por Necesidad', subtitle: 'Encuentra el paso ideal para tu rutina', cardLayout: 'pills', columns: '4' }
                        },
                        {
                            id: 'sec_grid_ab', type: 'product_grid', enabled: true,
                            settings: { title: 'Favoritos de Temporada', subtitle: 'Los más amados para el cuidado diario', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_ab', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '🌸 FAVORITO DE LA RUTINA', customTitle: '', customSubtitle: '', imageSide: 'right' }
                        },
                        {
                            id: 'sec_multi_ab', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Skincare', card1Title: 'Cuidado Facial', card1Subtitle: 'Limpieza, hidratación y protección solar', card1ButtonText: 'Ver Skincare', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#c06c84', card2Badge: 'Haircare & Makeup', card2Title: 'Capilar y Maquillaje', card2Subtitle: 'Nutrición profunda y tonos en tendencia', card2ButtonText: 'Descubrir', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#2d232e' }
                        },
                        {
                            id: 'sec_test_ab', type: 'testimonials', enabled: true,
                            settings: { title: 'Resultados que Hablan por Sí Mismos', subtitle: 'Opiniones verificadas de clientas reales' }
                        },
                        {
                            id: 'sec_faq_ab', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Dudas Frecuentes sobre tu Rutina', subtitle: 'Compra con confianza y respaldo', q1: '¿Todos los productos son originales?', a1: 'Sí, garantizamos productos 100% originales, sellados y con fecha de vencimiento vigente.', q2: '¿Me ayudan a armar mi rutina según mi tipo de piel?', a2: '¡Claro que sí! Escríbenos por WhatsApp si tienes piel grasa, mixta, seca o sensible y te recomendamos las mejores opciones.', q3: '¿Cómo empacan los envíos?', a3: 'Protegemos cada frasco y envase con material amortiguador para que lleguen en perfecto estado.' }
                        },
                        {
                            id: 'sec_wa_ab', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿No sabes qué elegir para tu tipo de piel o cabello?', subtitle: 'Recibe asesoría personalizada sin costo por WhatsApp antes de hacer tu pedido.', buttonText: 'Recibir asesoría en WhatsApp' }
                        },
                        {
                            id: 'sec_trust_ab', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'star', item1Title: 'Originalidad Garantizada', item1Text: 'Marcas y fórmulas auténticas para tu tranquilidad.', item2Icon: 'gift', item2Title: 'Empaque Especial', item2Text: 'Cada pedido se prepara con dedicación y cuidado.', item3Icon: 'truck', item3Title: 'Envíos Nacionales', item3Text: 'Llegamos rápido a todas las ciudades del país.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'BELLEZA & BIENESTAR', headerTitle: 'Catálogo de Cuidado Personal', headerSubtitle: 'Filtra por marca, categoría, tono o presentación.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Complementa tu Rutina', relatedSubtitle: 'Productos que potencian tus resultados' }
                        }]
                    }
                }
            },
            {
                id: 'vitalidad_pro',
                category: 'belleza_bienestar',
                name: 'Vitalidad Pro',
                tag: 'Suplementos, Fitness y Salud',
                layoutSummary: 'Navbar Buscador Activo • Tarjetas Bento Contain • Tabla Técnica Abierta',
                colors: ['#0d9488', '#111827', '#f0fdfa'],
                description: 'Diseñada para tiendas de proteínas, suplementos, vitaminas y mercados saludables. Muestra tarros y empaques sin recorte, marcas visibles y filtro por sabor o peso.',
                config: {
                    globalStyles: {
                        primaryColor: '#0d9488',
                        secondaryColor: '#111827',
                        backgroundColor: '#f0fdfa',
                        textColor: '#111827',
                        headingFont: 'Montserrat',
                        bodyFont: 'Plus Jakarta Sans',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'marketplace',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'pill',
                        navbarSticky: true,
                        navbarDropdownStyle: 'split',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true,
                        cardPreset: 'bento',
                        cardStyle: 'bento',
                        cardRadius: '1rem',
                        cardShadow: 'sm',
                        cardImageAspect: 'square',
                        cardImageFit: 'contain',
                        cardImagePadding: 'inset',
                        cardContentAlign: 'left',
                        cardMetaMode: 'brand',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'solid',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'lift',
                        detailPreset: 'tech_specs',
                        detailInfoStyle: 'card',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'left',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'contain',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'pills',
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
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'sidebar',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: true,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'inline_bar',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon_text',
                        searchAnim: 'slide_up',
                        searchPlaceholder: 'Buscar proteína, creatina, vitaminas, marca o sabor...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos suplementos para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 150,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Proteína, Creatina, Pre-entreno, Vitaminas, Colágeno',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: true,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_vp', type: 'announcement_bar', enabled: true,
                            settings: { text: '💪 Suplementos 100% originales y sellados • Despacho rápido a toda Colombia', text2: '💳 Paga con PSE, Nequi, Tarjetas o pide asesoría por WhatsApp', text3: '', bgColor: '#111827', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_vp', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'NUTRICIÓN Y BIENESTAR REAL', title: 'Alcanza tus metas físicas y de salud con ' + name, subtitle: 'Proteínas, creatinas, vitaminas y alimentación saludable de marcas certificadas.', buttonText: 'Ver Suplementos', buttonUrl: '/catalog', secondaryButtonText: 'Asesoría de Objetivos', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 45, bgColor: '#0d9488', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_vp', type: 'featured_categories', enabled: true,
                            settings: { title: 'Explora por Objetivo', subtitle: 'Nutrición deportiva y bienestar diario', cardLayout: 'icon', columns: '4' }
                        },
                        {
                            id: 'sec_grid_vp', type: 'product_grid', enabled: true,
                            settings: { title: 'Catálogo de Suplementos', subtitle: 'Filtra por marca, sabor o presentación en libras/servicios', source: 'NEWEST', categoryId: '', limit: 8, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_vp', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '💪 TOP VENTAS FITNESS', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_trust_vp', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'secondary', item1Icon: 'shield', item1Title: 'Sellos de Autenticidad', item1Text: 'Productos originales de distribuidores autorizados.', item2Icon: 'clock', item2Title: 'Despacho Ágil', item2Text: 'Para que nunca interrumpas tu suplementación.', item3Icon: 'chat', item3Title: 'Guía Personalizada', item3Text: 'Te orientamos según tu etapa de entrenamiento.' }
                        },
                        {
                            id: 'sec_test_vp', type: 'testimonials', enabled: true,
                            settings: { title: 'Clientes Entrenando con Nosotros', subtitle: 'Reseñas verificadas de compradores reales' }
                        },
                        {
                            id: 'sec_faq_vp', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Transparencia y respaldo en tu nutrición', q1: '¿Los suplementos cuentan con sello de seguridad?', a1: 'Sí, todos los productos se entregan completamente sellados de fábrica y con lote verificable.', q2: '¿Cómo elijo el sabor o tamaño del producto?', a2: 'Dentro de cada producto puedes seleccionar el sabor (Vainilla, Chocolate, Fresa, etc.) y presentación antes de agregar a la bolsa.', q3: '¿Hacen envíos a toda Colombia?', a3: 'Sí, despachamos a todas las ciudades y municipios del país.' }
                        },
                        {
                            id: 'sec_wa_vp', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Buscas volumen, definición o bienestar general?', subtitle: 'Escríbenos por WhatsApp y te recomendamos el suplemento exacto para tu meta.', buttonText: 'Hablar con un asesor en WhatsApp' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'CATÁLOGO NUTRICIONAL', headerTitle: 'Todos los Suplementos', headerSubtitle: 'Filtra por marca, sabor, tamaño o disponibilidad.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'left', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Combínalo en tu Stack', relatedSubtitle: 'Suplementos complementarios recomendados' }
                        }]
                    }
                }
            },
            {
                id: 'oro_y_bruma',
                category: 'accesorios_joyas',
                name: 'Oro y Bruma',
                tag: 'Joyas, Bisutería Fina y Relojería',
                layoutSummary: 'Navbar Transparente Hero • Fuente Cinzel • Esquinas Rectas 0px',
                colors: ['#b48327', '#141413', '#fcfbf9'],
                description: 'Minimalismo de alta joyería en tonos dorado champaña, ónix y alabastro. Tipografía clásica Cinzel + Lora, bordes rectos de 0px, tarjetas centradas y galería de acercamiento.',
                config: {
                    globalStyles: {
                        primaryColor: '#b48327',
                        secondaryColor: '#141413',
                        backgroundColor: '#fcfbf9',
                        textColor: '#141413',
                        headingFont: 'Cinzel',
                        bodyFont: 'Lora',
                        headingTransform: 'uppercase',
                        fontScale: 'standard',
                        borderRadius: '0px',
                        buttonRadius: 'square',
                        navbarLayout: 'hero_overlay',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'opacity',
                        navbarSticky: true,
                        navbarDropdownStyle: 'strip',
                        navbarDropdownAnim: 'fade',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'slow',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'clean',
                        cardRadius: '0px',
                        cardShadow: 'none',
                        cardImageAspect: 'square',
                        cardImageFit: 'cover',
                        cardImagePadding: 'flush',
                        cardContentAlign: 'center',
                        cardMetaMode: 'category',
                        cardDiscountBadge: 'label',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'dark',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'none',
                        detailPreset: 'luxury_boutique',
                        detailInfoStyle: 'clean',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'stack',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'cover',
                        detailImageZoom: true,
                        detailBuyLayout: 'stacked',
                        detailVariantStyle: 'square',
                        detailShowBreadcrumbs: true,
                        detailShowMeta: true,
                        detailShowSku: true,
                        detailShowSavingsBadge: false,
                        detailShowStock: false,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'drawer',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: false,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'expandable_icon',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'underline',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'fade',
                        searchPlaceholder: 'Buscar anillos, cadenas, aretes, oro laminado...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos joyas para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 250,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: false,
                        searchShowProductCategory: true,
                        searchShowProductBrand: false,
                        searchSuggestCategories: true,
                        searchSuggestBrands: false,
                        searchShowRecent: true,
                        searchPopularTerms: 'Anillos, Cadenas, Aretes, Pulseras, Regalos',
                        searchCategoryScope: 'none',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: false,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_hero_ob', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'ALTA JOYERÍA Y DETALLES ETERNOS', title: name, subtitle: 'Piezas con brillo propio, acabados certificados y estuche de lujo incluido en cada pedido.', buttonText: 'EXPLORAR COLECCIÓN', buttonUrl: '/catalog', secondaryButtonText: 'ASESORÍA EXCLUSIVA', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 55, bgColor: '#141413', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_ann_ob', type: 'announcement_bar', enabled: true,
                            settings: { text: '💎 Incluye estuche de regalo y certificado de garantía • Envíos asegurados en Colombia', text2: '✨ Paga en línea con PSE, Nequi, Tarjetas o coordina por WhatsApp', text3: '', bgColor: '#141413', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_cats_ob', type: 'featured_categories', enabled: true,
                            settings: { title: 'Colecciones de Joyería', subtitle: 'Descubre cada línea de nuestra marca', cardLayout: 'visual', columns: '4' }
                        },
                        {
                            id: 'sec_grid_ob', type: 'product_grid', enabled: true,
                            settings: { title: 'Piezas Destacadas', subtitle: 'Acabados delicados y materiales seleccionados', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_ob', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '💎 PIEZA INSIGNIA', customTitle: '', customSubtitle: '', imageSide: 'right' }
                        },
                        {
                            id: 'sec_multi_ob', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Para Ella', card1Title: 'Sutileza y Brillo', card1Subtitle: 'Collares, dijes, topos y anillos', card1ButtonText: 'Ver Colección', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#141413', card2Badge: 'Para Él', card2Title: 'Carácter y Presencia', card2Subtitle: 'Cadenas, tejidos, pulsos y relojería', card2ButtonText: 'Explorar', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#b48327' }
                        },
                        {
                            id: 'sec_trust_ob', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'secondary', item1Icon: 'gift', item1Title: 'Estuche de Lujo Incluido', item1Text: 'Listo para entregar como un regalo inolvidable.', item2Icon: 'shield', item2Title: 'Garantía Certificada', item2Text: 'Respaldo sobre el material y el baño de tu joya.', item3Icon: 'truck', item3Title: 'Envío Asegurado', item3Text: 'Despacho protegido a cualquier ciudad del país.' }
                        },
                        {
                            id: 'sec_test_ob', type: 'testimonials', enabled: true,
                            settings: { title: 'Clientes que Brillan con ' + name, subtitle: 'Calificaciones reales verificadas por pedido' }
                        },
                        {
                            id: 'sec_faq_ob', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Cuidado y Garantía de tus Joyas', subtitle: 'Resolvemos tus inquietudes', q1: '¿Cómo sé mi talla de anillo o el largo de cadena?', a1: 'En las especificaciones de cada joya detallamos las medidas en milímetros y centímetros. También te asesoramos por WhatsApp.', q2: '¿Viene empacado para regalo?', a2: 'Sí, todos nuestros pedidos incluyen estuche de presentación sin costo adicional.', q3: '¿Qué cuidados debo tener con mis piezas?', a3: 'Recomendamos evitar el contacto directo con perfumes o cremas y guardarlas en su estuche individual.' }
                        },
                        {
                            id: 'sec_wa_ob', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Buscas un regalo especial o necesitas ayuda con la medida?', subtitle: 'Escríbenos a nuestro WhatsApp y te enviamos videos detallados de las piezas.', buttonText: 'Hablar con un asesor de joyería' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'JOYERÍA EXCLUSIVA', headerTitle: 'Todas las Colecciones', headerSubtitle: 'Filtra por material, medida o categoría.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '3', showDiscountPercent: false }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'stack', showBreadcrumbs: true, showSku: true, showStockCounter: false, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Combínalo con estas Piezas', relatedSubtitle: 'Armoniza tu selección con nuestra colección' }
                        }]
                    }
                }
            },
            {
                id: 'veta_de_cuero',
                category: 'accesorios_joyas',
                name: 'Veta de Cuero',
                tag: 'Bolsos, Morrales y Marroquinería',
                layoutSummary: 'Navbar Editorial • Tonos Coñac y Espresso • Ficha de Dimensiones',
                colors: ['#7c2d12', '#1c1917', '#faf7f2'],
                description: 'Inspirada en la tradición marroquinera colombiana. Tonos cuero coñac y pergamino, tipografía Playfair Display + Manrope, zoom de herrajes y medidas detalladas.',
                config: {
                    globalStyles: {
                        primaryColor: '#7c2d12',
                        secondaryColor: '#1c1917',
                        backgroundColor: '#faf7f2',
                        textColor: '#1c1917',
                        headingFont: 'Playfair Display',
                        bodyFont: 'Manrope',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '0.75rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'editorial',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'underline',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'normal',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'elevated',
                        cardRadius: '0.5rem',
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
                        cardButtonStyle: 'dark',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'lift',
                        detailPreset: 'conversion',
                        detailInfoStyle: 'clean',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'left',
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
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'drawer',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: false,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'auto',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'slide_up',
                        searchPlaceholder: 'Buscar bolsos, morrales, billeteras, correas...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos artículos de marroquinería para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 200,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: false,
                        searchSuggestCategories: true,
                        searchSuggestBrands: false,
                        searchShowRecent: true,
                        searchPopularTerms: 'Bolsos, Morrales, Billeteras, Manos libres, Correas',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: false,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_vc', type: 'announcement_bar', enabled: true,
                            settings: { text: '👜 Marroquinería con garantía en costuras y herrajes • Envíos a toda Colombia', text2: '💳 Paga seguro con PSE, Nequi, Tarjetas o pide por WhatsApp', text3: '', bgColor: '#1c1917', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_vc', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'TRADICIÓN Y DISEÑO EN MARROQUINERÍA', title: 'Piezas hechas para acompañarte por años en ' + name, subtitle: 'Bolsos, morrales, manos libres y billeteras con acabados de primera calidad, compartimentos funcionales y estilo atemporal.', buttonText: 'Ver Colección', buttonUrl: '/catalog', secondaryButtonText: 'Hablar por WhatsApp', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 45, bgColor: '#1c1917', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_vc', type: 'featured_categories', enabled: true,
                            settings: { title: 'Nuestras Líneas de Marroquinería', subtitle: 'Funcionalidad y elegancia en cada detalle', cardLayout: 'visual', columns: '4' }
                        },
                        {
                            id: 'sec_grid_vc', type: 'product_grid', enabled: true,
                            settings: { title: 'Nuevos Diseños', subtitle: 'Desliza las fotos de cada producto para ver su interior y acabados', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_vc', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '👜 HECHO EN COLOMBIA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_promo_vc', type: 'promo_banner', enabled: true,
                            settings: { badgeText: 'ARTESANÍA Y DURABILIDAD', title: 'Herrajes resistentes y costuras reforzadas', subtitle: 'Cada pieza pasa por un control riguroso para garantizarte comodidad, capacidad y resistencia diaria.', buttonText: 'Explorar Catálogo', buttonUrl: '/catalog', imageUrl: '', bgColor: '#7c2d12', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_multi_vc', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Bolsos & Cartera', card1Title: 'Línea Femenina', card1Subtitle: 'Manos libres, shopping bags y clutches', card1ButtonText: 'Ver Bolsos', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#7c2d12', card2Badge: 'Viaje & Oficina', card2Title: 'Morrales y Billeteras', card2Subtitle: 'Compartimentos porta-PC y organizadores', card2ButtonText: 'Ver Morrales', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#1c1917' }
                        },
                        {
                            id: 'sec_test_vc', type: 'testimonials', enabled: true,
                            settings: { title: 'Lo que Opinan Nuestros Clientes', subtitle: 'Calificaciones reales de compradores en Colombia' }
                        },
                        {
                            id: 'sec_faq_vc', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Dimensiones, materiales y garantía', q1: '¿Dónde puedo ver las medidas exactas del bolso o morral?', a1: 'En cada producto encontrarás la sección de Especificaciones Técnicas desplegada con el alto, ancho, fondo y material.', q2: '¿Qué cubre la garantía?', a2: 'Todos nuestros productos tienen garantía directa sobre costuras, cierres, cremalleras y herrajes.', q3: '¿Cómo limpiar y cuidar mi bolso?', a3: 'Límpialo con un paño suave ligeramente húmedo y utiliza cremas humectantes neutras para marroquinería.' }
                        },
                        {
                            id: 'sec_trust_vc', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'secondary', item1Icon: 'shield', item1Title: 'Garantía de Taller', item1Text: 'Respaldo directo en herrajes, cierres y costuras.', item2Icon: 'truck', item2Title: 'Envíos a Todo el País', item2Text: 'Empaque protegido para conservar la horma del bolso.', item3Icon: 'card', item3Title: 'Pago 100% Seguro', item3Text: 'PSE, Nequi, tarjetas o coordinación por WhatsApp.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'MARROQUINERÍA', headerTitle: 'Catálogo de Bolsos y Accesorios', headerSubtitle: 'Filtra por color, categoría, material o rango de precio.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'left', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Combínalo con estas Billeteras y Correas', relatedSubtitle: 'Otras piezas de nuestra colección marroquinera' }
                        }]
                    }
                }
            },
            {
                id: 'pulso_activo',
                category: 'deportes',
                name: 'Pulso Activo',
                tag: 'Deportes, Ciclismo y Ropa Deportiva',
                layoutSummary: 'Navbar Compacto Rápido • Fuente Oswald Impacto • Galería Carrusel',
                colors: ['#16a34a', '#0f172a', '#f8fafc'],
                description: 'Energía atlética para tiendas de ropa deportiva, activewear, ciclismo, running e implementos de gimnasio. Títulos condensados Oswald y transiciones de 140ms.',
                config: {
                    globalStyles: {
                        primaryColor: '#16a34a',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Oswald',
                        bodyFont: 'DM Sans',
                        headingTransform: 'uppercase',
                        fontScale: 'standard',
                        borderRadius: '0.75rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'compact',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'underline_slide',
                        navbarSticky: true,
                        navbarDropdownStyle: 'flyout',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'elevated',
                        cardRadius: '0.5rem',
                        cardShadow: 'md',
                        cardImageAspect: 'portrait',
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
                        cardHoverLift: 'lift',
                        detailPreset: 'express_sale',
                        detailInfoStyle: 'card',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'carousel',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'cover',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'rounded',
                        detailShowBreadcrumbs: true,
                        detailShowMeta: true,
                        detailShowSku: false,
                        detailShowSavingsBadge: true,
                        detailShowStock: true,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
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
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'auto',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'slide_up',
                        searchPlaceholder: 'Buscar licras, conjuntos, ciclismo, pesas, tallas...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos artículos deportivos para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 150,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Conjuntos, Licras, Camisetas, Ciclismo, Accesorios, Ofertas',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_pa', type: 'announcement_bar', enabled: true,
                            settings: { text: '⚡ ENTRENA SIN LÍMITES • TELAS DE ALTO RENDIMIENTO Y SECADO RÁPIDO', text2: '🚚 Despachos ágiles a toda Colombia • Cambios de talla garantizados', text3: '', bgColor: '#16a34a', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_pa', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'COLECCIÓN DEPORTIVA', title: 'SUPERA CADA ENTRENAMIENTO CON ' + name, subtitle: 'Prendas deportivas de alta compresión, transpirabilidad y ajuste ergonómico para gimnasio, running y ciclismo.', buttonText: 'VER EQUIPAMIENTO', buttonUrl: '/catalog', secondaryButtonText: 'OFERTAS DEPORTIVAS', secondaryButtonUrl: '/catalog', imageUrl: '', overlayOpacity: 50, bgColor: '#0f172a', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_pa', type: 'featured_categories', enabled: true,
                            settings: { title: 'Elige tu Disciplina', subtitle: 'Indumentaria y accesorios diseñados para rendir', cardLayout: 'visual', columns: '4' }
                        },
                        {
                            id: 'sec_grid_pa', type: 'product_grid', enabled: true,
                            settings: { title: 'Equipamiento y Ropa Deportiva', subtitle: 'Filtra por talla, color o línea de entrenamiento', source: 'NEWEST', categoryId: '', limit: 8, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_cd_pa', type: 'countdown_promo', enabled: true,
                            settings: { badgeText: '⚡ SEMANA DEL DEPORTE', title: 'DESCUENTOS ESPECIALES EN REFERENCIAS SELECCIONADAS', subtitle: 'Renueva tu ropa de entrenamiento antes de que termine la promoción.', endDate: '', buttonText: 'Aprovechar Ofertas', buttonUrl: '/catalog', bgColor: '#0f172a', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_multi_pa', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Activewear', card1Title: 'Línea Gym & Running', card1Subtitle: 'Conjuntos, leggins, shorts y tops de soporte', card1ButtonText: 'Ver Ropa', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#0f172a', card2Badge: 'Accesorios', card2Title: 'Implementos y Ciclismo', card2Subtitle: 'Termos, bandas, guantes y uniformes', card2ButtonText: 'Ver Implementos', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#16a34a' }
                        },
                        {
                            id: 'sec_trust_pa', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'secondary', item1Icon: 'clock', item1Title: 'Despacho Rápido', item1Text: 'Alistamos tu pedido con agilidad para toda Colombia.', item2Icon: 'refresh', item2Title: 'Cambios de Talla', item2Text: 'Respaldo directo si necesitas otra talla.', item3Icon: 'shield', item3Title: 'Telas de Alto Desempeño', item3Text: 'Costuras reforzadas que no transparentan.' }
                        },
                        {
                            id: 'sec_test_pa', type: 'testimonials', enabled: true,
                            settings: { title: 'Deportistas que Entrenan con ' + name, subtitle: 'Opiniones reales verificadas en cada compra' }
                        },
                        {
                            id: 'sec_steps_pa', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo hacer tu pedido?', subtitle: 'Compra en minutos desde tu celular o computador', step1Title: 'Selecciona talla y color', step1Text: 'Elige tus prendas e implementos deportivos.', step2Title: 'Datos de entrega', step2Text: 'Ingresa tu dirección y ciudad en Colombia.', step3Title: 'Pago en línea o WhatsApp', step3Text: 'Paga con PSE, Nequi, tarjetas o confirma por WhatsApp.', showPaymentBadges: true }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'ALTO RENDIMIENTO', headerTitle: 'Catálogo Deportivo', headerSubtitle: 'Filtra por talla, disciplina o rango de precio.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'carousel', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Complementa tu Entrenamiento', relatedSubtitle: 'Otros productos recomendados para ti' }
                        }]
                    }
                }
            },
            {
                id: 'casa_serena',
                category: 'hogar_mascotas',
                name: 'Casa Serena',
                tag: 'Hogar, Muebles y Decoración',
                layoutSummary: 'Navbar Boutique • Tarjetas Poster Ambientales • Catálogo 3 Columnas',
                colors: ['#5f6f52', '#283618', '#f9f8f3'],
                description: 'Estética cálida y arquitectónica en tonos verde salvia y lino natural. Ideal para tiendas de decoración, muebles, iluminación, lencería de hogar y artículos bajo pedido.',
                config: {
                    globalStyles: {
                        primaryColor: '#5f6f52',
                        secondaryColor: '#283618',
                        backgroundColor: '#f9f8f3',
                        textColor: '#1e2418',
                        headingFont: 'Lora',
                        bodyFont: 'Outfit',
                        headingTransform: 'none',
                        fontScale: 'large',
                        borderRadius: '1rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'centered',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'normal',
                        navbarLinkHover: 'underline',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'fade',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'slow',
                        navbarCompactOnScroll: true,
                        cardPreset: 'poster',
                        cardStyle: 'poster',
                        cardRadius: '1rem',
                        cardShadow: 'md',
                        cardImageAspect: 'portrait',
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
                        cardHoverLift: 'scale',
                        detailPreset: 'fashion_lookbook',
                        detailInfoStyle: 'clean',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '60_40',
                        detailGalleryLayout: 'grid',
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
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '3',
                        filterEnabled: true,
                        filterLayout: 'drawer',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: false,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'expandable_icon',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'fade',
                        searchPlaceholder: 'Buscar lámparas, cojines, muebles, ropa de cama...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos artículos de hogar para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 250,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: false,
                        searchSuggestCategories: true,
                        searchSuggestBrands: false,
                        searchShowRecent: true,
                        searchPopularTerms: 'Lámparas, Cojines, Espejos, Mesas, Ropa de cama',
                        searchCategoryScope: 'none',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: false,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_cs', type: 'announcement_bar', enabled: true,
                            settings: { text: '🏡 Diseño y calidez para tu hogar • Envíos cuidadosos a toda Colombia', text2: '💬 Asesoría personalizada de medidas y acabados por WhatsApp', text3: '', bgColor: '#283618', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_cs', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'INTERIORISMO & BIENESTAR', title: 'Transforma cada rincón de tu casa con ' + name, subtitle: 'Mobiliario, decoración y textiles seleccionados para crear espacios acogedores, funcionales y llenos de armonía.', buttonText: 'Explorar Espacios', buttonUrl: '/catalog', secondaryButtonText: 'Cotizar por WhatsApp', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 40, bgColor: '#283618', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_cats_cs', type: 'featured_categories', enabled: true,
                            settings: { title: 'Explora por Ambiente', subtitle: 'Piezas pensadas para cada espacio de tu hogar', cardLayout: 'visual', columns: '3' }
                        },
                        {
                            id: 'sec_grid_cs', type: 'product_grid', enabled: true,
                            settings: { title: 'Nuevas Piezas de Colección', subtitle: 'Entrega inmediata y referencias fabricadas bajo pedido', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_promo_cs', type: 'promo_banner', enabled: true,
                            settings: { badgeText: 'CURADURÍA PARA EL HOGAR', title: 'Materiales nobles que perduran en el tiempo', subtitle: 'Maderas, fibras naturales, cerámica e iluminación que elevan la calidez de tu sala, comedor o habitación.', buttonText: 'Ver Catálogo', buttonUrl: '/catalog', imageUrl: '', bgColor: '#5f6f52', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_spot_cs', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '🏡 PIEZA PROTAGONISTA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_rich_cs', type: 'rich_text', enabled: true,
                            settings: { title: 'Hogares con Identidad Propia', content: 'En ' + name + ' acompañamos la creación de tus espacios con objetos y muebles seleccionados por su estética, proporción y durabilidad.' }
                        },
                        {
                            id: 'sec_test_cs', type: 'testimonials', enabled: true,
                            settings: { title: 'Hogares Felices en Colombia', subtitle: 'Experiencias reales de nuestros compradores' }
                        },
                        {
                            id: 'sec_wa_cs', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Necesitas confirmar dimensiones o acabados para tu espacio?', subtitle: 'Escríbenos por WhatsApp y te asesoramos con fotos reales, medidas y tiempos de entrega.', buttonText: 'Hablar con un asesor de hogar' }
                        },
                        {
                            id: 'sec_trust_cs', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'truck', item1Title: 'Embalaje de Alta Protección', item1Text: 'Cuidamos cada pieza durante todo el trayecto hasta tu hogar.', item2Icon: 'shield', item2Title: 'Garantía de Calidad', item2Text: 'Materiales y acabados respaldados directamente.', item3Icon: 'chat', item3Title: 'Atención Personalizada', item3Text: 'Acompañamiento antes, durante y después de tu compra.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'COLECCIÓN HOGAR', headerTitle: 'Todos los Artículos y Muebles', headerSubtitle: 'Filtra por ambiente, dimensiones, disponibilidad o rango de precio.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '3', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'grid', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Armoniza tu Espacio con estas Piezas', relatedSubtitle: 'Complementos de nuestra colección de hogar' }
                        }]
                    }
                }
            },
            {
                id: 'huella_feliz',
                category: 'hogar_mascotas',
                name: 'Huella Feliz',
                tag: 'Mascotas, Concentrados y Pet Shop',
                layoutSummary: 'Navbar Buscador Amigable • Fuentes Quicksand + Nunito • Bordes 24px',
                colors: ['#f97316', '#1e293b', '#fffdf9'],
                description: 'Alegre, cercana y muy fácil de usar para tiendas de mascotas. Fuentes redondeadas, buscador visible para recompra rápida de alimento y filtros por marca o peso en kg.',
                config: {
                    globalStyles: {
                        primaryColor: '#f97316',
                        secondaryColor: '#1e293b',
                        backgroundColor: '#fffdf9',
                        textColor: '#1e293b',
                        headingFont: 'Quicksand',
                        bodyFont: 'Nunito',
                        headingTransform: 'none',
                        fontScale: 'large',
                        borderRadius: '1.5rem',
                        buttonRadius: 'pill',
                        navbarLayout: 'marketplace',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'pill',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'scale',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'elevated',
                        cardRadius: '1.5rem',
                        cardShadow: 'sm',
                        cardImageAspect: 'square',
                        cardImageFit: 'contain',
                        cardImagePadding: 'inset',
                        cardContentAlign: 'left',
                        cardMetaMode: 'brand',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'solid',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'lift',
                        detailPreset: 'conversion',
                        detailInfoStyle: 'card',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'bottom',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'contain',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'pills',
                        detailShowBreadcrumbs: true,
                        detailShowMeta: true,
                        detailShowSku: false,
                        detailShowSavingsBadge: true,
                        detailShowStock: true,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
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
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'inline_bar',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'pill',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon_text',
                        searchAnim: 'scale',
                        searchPlaceholder: 'Buscar concentrado, arena, juguetes, marca o peso...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos productos para tu mascota con esa búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 150,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Perros, Gatos, Concentrado, Arena, Snacks, Camas',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_hf', type: 'announcement_bar', enabled: true,
                            settings: { text: '🐾 Todo para consentir a tu peludo • Entrega rápida en tu ciudad y a toda Colombia', text2: '💳 Paga fácil con Nequi, Daviplata, PSE o pide por WhatsApp', text3: '', bgColor: '#1e293b', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_hf', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'BIENESTAR Y ALEGRÍA PARA TU MASCOTA', title: 'Nutrición, juegos y cuidado con amor en ' + name, subtitle: 'Encuentra el alimento concentrado, snacks, camas, juguetes y accesorios favoritos de tu perro o gato.', buttonText: 'Ver Todo para Mascotas', buttonUrl: '/catalog', secondaryButtonText: 'Pedir por WhatsApp', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 40, bgColor: '#f97316', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_hf', type: 'featured_categories', enabled: true,
                            settings: { title: '¿Para quién compras hoy?', subtitle: 'Toca una categoría para ver sus productos', cardLayout: 'pills', columns: '4' }
                        },
                        {
                            id: 'sec_grid_hf', type: 'product_grid', enabled: true,
                            settings: { title: 'Favoritos de los Peludos', subtitle: 'Busca por marca de alimento, talla de accesorio o presentación en kilos', source: 'NEWEST', categoryId: '', limit: 8, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_multi_hf', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Perros', card1Title: 'Mundo Canino', card1Subtitle: 'Alimento, correas, camas y juguetes', card1ButtonText: 'Ver Perros', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#f97316', card2Badge: 'Gatos', card2Title: 'Mundo Felino', card2Subtitle: 'Arenas, rascadores, húmedos y snacks', card2ButtonText: 'Ver Gatos', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#1e293b' }
                        },
                        {
                            id: 'sec_spot_hf', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '🐾 EL RECOMENDADO DE LA SEMANA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_steps_hf', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo pedir el alimento o accesorios de tu mascota?', subtitle: 'Rápido y sin quedarte sin concentrado', step1Title: 'Elige presentación o talla', step1Text: 'Selecciona el peso en kilos o la talla del accesorio.', step2Title: 'Indica tu dirección', step2Text: 'Escribe tus datos para enviarlo hasta tu puerta.', step3Title: 'Paga en línea o por WhatsApp', step3Text: 'Recibimos PSE, Nequi, tarjetas o confirmación directa.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_test_hf', type: 'testimonials', enabled: true,
                            settings: { title: 'Familias Peludas Felices', subtitle: 'Calificaciones reales de nuestros clientes' }
                        },
                        {
                            id: 'sec_wa_hf', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Dudas con la talla del arnés o el alimento para su edad?', subtitle: 'Escríbenos por WhatsApp y te ayudamos a elegir la mejor opción para tu perro o gato.', buttonText: 'Consultar por WhatsApp' }
                        },
                        {
                            id: 'sec_trust_hf', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'clock', item1Title: 'Despacho Oportuno', item1Text: 'Sabemos que el alimento de tu mascota no puede esperar.', item2Icon: 'shield', item2Title: 'Alimento Fresco', item2Text: 'Lotes con amplia fecha de vencimiento y buen almacenamiento.', item3Icon: 'chat', item3Title: 'Atención Cercana', item3Text: 'Amamos a los animales tanto como tú.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'PET SHOP', headerTitle: 'Todo para tu Mascota', headerSubtitle: 'Filtra por marca, peso en kilos, etapa de vida o categoría.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Para Consentirlo aún Más', relatedSubtitle: 'Snacks, juguetes y complementos recomendados' }
                        }]
                    }
                }
            },
            {
                id: 'detalle_magico',
                category: 'regalos_artesanias',
                name: 'Detalle Mágico',
                tag: 'Regalos, Flores y Desayunos Sorpresa',
                layoutSummary: 'Doble Barra Comercial • Etiquetas Bajo Pedido • Pasos de Dedicatoria',
                colors: ['#db2777', '#3b0764', '#fdf8fa'],
                description: 'Pensada para floristerías, desayunos sorpresa, anchetas y tiendas de detalles. Resalta productos bajo pedido, ocasiones especiales y coordinación por WhatsApp.',
                config: {
                    globalStyles: {
                        primaryColor: '#db2777',
                        secondaryColor: '#3b0764',
                        backgroundColor: '#fdf8fa',
                        textColor: '#1f122b',
                        headingFont: 'Poppins',
                        bodyFont: 'Nunito',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1.5rem',
                        buttonRadius: 'pill',
                        navbarLayout: 'double_bar',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'pill',
                        navbarSticky: true,
                        navbarDropdownStyle: 'flyout',
                        navbarDropdownAnim: 'scale',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'normal',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'elevated',
                        cardRadius: '1.5rem',
                        cardShadow: 'md',
                        cardImageAspect: 'square',
                        cardImageFit: 'cover',
                        cardImagePadding: 'flush',
                        cardContentAlign: 'center',
                        cardMetaMode: 'category',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'solid',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'lift',
                        detailPreset: 'conversion',
                        detailInfoStyle: 'card',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'bottom',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'cover',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'pills',
                        detailShowBreadcrumbs: true,
                        detailShowMeta: true,
                        detailShowSku: false,
                        detailShowSavingsBadge: true,
                        detailShowStock: true,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'drawer',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: false,
                        filterShowVariants: true,
                        filterShowSpecs: false,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'auto',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'pill',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'scale',
                        searchPlaceholder: 'Buscar desayunos, rosas, cumpleaños, aniversario...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos detalles para esa búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 200,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: false,
                        searchSuggestCategories: true,
                        searchSuggestBrands: false,
                        searchShowRecent: true,
                        searchPopularTerms: 'Desayunos, Rosas, Cumpleaños, Aniversario, Chocolates',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: false,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: false
                    },
                    sections: [
                        {
                            id: 'sec_ann_dm', type: 'announcement_bar', enabled: true,
                            settings: { text: '🎁 Entregas sorpresa a domicilio • Incluye tarjeta con tu mensaje personalizado', text2: '💳 Paga desde cualquier lugar con PSE, Nequi, Tarjetas o por WhatsApp', text3: '', bgColor: '#3b0764', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_dm', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'DETALLES QUE EMOCIONAN', title: 'Celebra momentos inolvidables con ' + name, subtitle: 'Desayunos sorpresa, arreglos florales, cajas de regalo y detalles hechos al instante para sorprender a quien más quieres.', buttonText: 'Ver Catálogo de Regalos', buttonUrl: '/catalog', secondaryButtonText: 'Personalizar por WhatsApp', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 40, bgColor: '#3b0764', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_dm', type: 'featured_categories', enabled: true,
                            settings: { title: 'Explora por Ocasión Especial', subtitle: 'Encuentra el regalo perfecto según el momento', cardLayout: 'visual', columns: '4' }
                        },
                        {
                            id: 'sec_grid_dm', type: 'product_grid', enabled: true,
                            settings: { title: 'Sorpresas Más Pedidas', subtitle: 'Filtra por tu presupuesto o tipo de detalle', source: 'NEWEST', categoryId: '', limit: 8, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_steps_dm', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo enviar tu sorpresa con ' + name + '?', subtitle: 'Nosotros nos encargamos de que todo salga perfecto', step1Title: 'Elige tu detalle favorito', step1Text: 'Selecciona el arreglo, desayuno o caja de regalo.', step2Title: 'Dirección y dedicatoria', step2Text: 'Ingresa los datos de quien recibe y escribe el mensaje de la tarjeta en Notas.', step3Title: 'Paga o coordina por WhatsApp', step3Text: 'Realiza tu pago en línea o confirma los detalles de entrega con nosotros.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_spot_dm', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '🎁 EL REGALO PERFECTO', customTitle: '', customSubtitle: '', imageSide: 'right' }
                        },
                        {
                            id: 'sec_test_dm', type: 'testimonials', enabled: true,
                            settings: { title: 'Sonrisas Entregadas', subtitle: 'Calificaciones reales de clientes que sorprendieron a sus seres queridos' }
                        },
                        {
                            id: 'sec_faq_dm', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Todo sobre entregas, mensajes y pagos', q1: '¿Dónde escribo el mensaje para la tarjeta de regalo?', a1: 'Al finalizar tu pedido verás el campo de Notas adicionales donde puedes escribir la dedicatoria y la fecha de entrega deseada.', q2: '¿Puedo comprar desde otra ciudad o desde el exterior?', a2: 'Sí, puedes pagar en línea o coordinar con nosotros por WhatsApp y nosotros entregamos la sorpresa en la dirección que nos indiques.', q3: '¿Con cuánta anticipación debo hacer mi pedido?', a3: 'Recomendamos programar con al menos 1 día de anticipación o consultarnos disponibilidad para entregas el mismo día por WhatsApp.' }
                        },
                        {
                            id: 'sec_wa_dm', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Quieres armar un detalle personalizado a tu gusto?', subtitle: 'Escríbenos por WhatsApp y te ayudamos a combinar flores, chocolates, globos o productos especiales.', buttonText: 'Personalizar regalo en WhatsApp' }
                        },
                        {
                            id: 'sec_trust_dm', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'gift', item1Title: 'Presentación Impecable', item1Text: 'Cuidamos cada moño, empaque, tarjeta y producto fresco.', item2Icon: 'clock', item2Title: 'Entregas Puntuales', item2Text: 'Coordinamos cada entrega con total compromiso.', item3Icon: 'chat', item3Title: 'Acompañamiento por WhatsApp', item3Text: 'Te confirmamos cuando tu sorpresa sea entregada.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'CATÁLOGO DE REGALOS', headerTitle: 'Todos Nuestros Detalles', headerSubtitle: 'Filtra por rango de presupuesto u ocasión especial.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: false, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Otros Detalles que te Encantarán', relatedSubtitle: 'Opciones ideales para sorprender' }
                        }]
                    }
                }
            },
            {
                id: 'manos_de_origen',
                category: 'regalos_artesanias',
                name: 'Manos de Origen',
                tag: 'Artesanías, Tejidos y Hecho a Mano',
                layoutSummary: 'Navbar Minimalista Drawer • Tarjetas Poster • Historia Artesanal',
                colors: ['#b45309', '#292524', '#faf6f0'],
                description: 'Para emprendimientos artesanales, mochilas tejidas, cerámica, cestería y arte manual colombiano. Tonos arcilla y algodón crudo con galería mosaico 2x2.',
                config: {
                    globalStyles: {
                        primaryColor: '#b45309',
                        secondaryColor: '#292524',
                        backgroundColor: '#faf6f0',
                        textColor: '#292524',
                        headingFont: 'Lora',
                        bodyFont: 'Plus Jakarta Sans',
                        headingTransform: 'none',
                        fontScale: 'large',
                        borderRadius: '1rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'minimal',
                        navbarStyle: 'page',
                        navbarLinkFormat: 'normal',
                        navbarLinkHover: 'underline_center',
                        navbarSticky: true,
                        navbarDropdownStyle: 'drawer',
                        navbarDropdownAnim: 'fade',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'slow',
                        navbarCompactOnScroll: false,
                        cardPreset: 'poster',
                        cardStyle: 'poster',
                        cardRadius: '1rem',
                        cardShadow: 'md',
                        cardImageAspect: 'portrait',
                        cardImageFit: 'cover',
                        cardImagePadding: 'flush',
                        cardContentAlign: 'left',
                        cardMetaMode: 'category',
                        cardDiscountBadge: 'label',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'solid',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'scale',
                        detailPreset: 'fashion_lookbook',
                        detailInfoStyle: 'clean',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '60_40',
                        detailGalleryLayout: 'grid',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'cover',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'pills',
                        detailShowBreadcrumbs: true,
                        detailShowMeta: true,
                        detailShowSku: false,
                        detailShowSavingsBadge: true,
                        detailShowStock: true,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '3',
                        filterEnabled: true,
                        filterLayout: 'drawer',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: false,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'expandable_icon',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'fade',
                        searchPlaceholder: 'Buscar mochilas, tejidos, cerámica, sombreros...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos piezas artesanales para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 250,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: false,
                        searchSuggestCategories: true,
                        searchSuggestBrands: false,
                        searchShowRecent: true,
                        searchPopularTerms: 'Mochilas, Tejidos, Cerámica, Sombreros, Hecho a mano',
                        searchCategoryScope: 'none',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: false,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_mo', type: 'announcement_bar', enabled: true,
                            settings: { text: '🧶 Piezas hechas a mano con identidad colombiana • Envíos a todo el país', text2: '💬 Encargos personalizados y atención directa por WhatsApp', text3: '', bgColor: '#292524', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_mo', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'ARTE Y TRADICIÓN HECHA A MANO', title: 'El valor del trabajo artesanal en ' + name, subtitle: 'Cada creación lleva horas de dedicación, fibras seleccionadas y el saber de manos artesanas.', buttonText: 'Descubrir Creaciones', buttonUrl: '/catalog', secondaryButtonText: 'Encargar por WhatsApp', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 45, bgColor: '#292524', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_rich_mo', type: 'rich_text', enabled: true,
                            settings: { title: 'Nuestra Historia y Origen', content: 'En ' + name + ' honramos el oficio hecho a mano. Ninguna pieza es idéntica a otra: cada tejido, moldeado y acabado cuenta una historia auténtica.' }
                        },
                        {
                            id: 'sec_cats_mo', type: 'featured_categories', enabled: true,
                            settings: { title: 'Líneas Artesanales', subtitle: 'Explora nuestras técnicas y colecciones', cardLayout: 'visual', columns: '3' }
                        },
                        {
                            id: 'sec_grid_mo', type: 'product_grid', enabled: true,
                            settings: { title: 'Piezas Disponibles y Bajo Pedido', subtitle: 'Creaciones listas para envío o elaboradas especialmente para ti', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_mo', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '🧶 100% HECHO A MANO', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_promo_mo', type: 'promo_banner', enabled: true,
                            settings: { badgeText: 'TRABAJO BAJO PEDIDO', title: '¿Deseas una combinación de colores o medida especial?', subtitle: 'Elaboramos piezas personalizadas por encargo. Coordina los detalles directamente con nuestro taller.', buttonText: 'Escribir al Taller', buttonUrl: '__whatsapp__', imageUrl: '', bgColor: '#b45309', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_test_mo', type: 'testimonials', enabled: true,
                            settings: { title: 'Quienes Valoran lo Hecho a Mano', subtitle: 'Calificaciones reales de nuestros compradores' }
                        },
                        {
                            id: 'sec_faq_mo', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Tiempos de elaboración, envíos y cuidados', q1: '¿Cuál es la diferencia entre una pieza en stock y una bajo pedido?', a1: 'Las piezas en stock están listas para despacho inmediato. Las piezas marcadas como Bajo pedido se elaboran especialmente para ti tras confirmar tu orden.', q2: '¿Cuánto tarda una pieza elaborada bajo pedido?', a2: 'El tiempo depende de la complejidad de la técnica artesanal; al hacer clic en Pedir por WhatsApp te confirmamos la fecha exacta de entrega.', q3: '¿Realizan envíos a toda Colombia?', a3: 'Sí, enviamos a cualquier municipio o ciudad del país con transportadoras aliadas.' }
                        },
                        {
                            id: 'sec_wa_mo', type: 'whatsapp_cta', enabled: true,
                            settings: { title: 'Conecta directamente con nuestras manos artesanas', subtitle: 'Escríbenos por WhatsApp para conocer más detalles de cada pieza o realizar un encargo especial.', buttonText: 'Hablar por WhatsApp' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'CATÁLOGO ARTESANAL', headerTitle: 'Todas Nuestras Creaciones', headerSubtitle: 'Filtra por técnica, disponibilidad inmediata o bajo pedido.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '3', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'grid', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Otras Creaciones de Nuestro Taller', relatedSubtitle: 'Piezas elaboradas a mano con dedicación' }
                        }]
                    }
                }
            },
            {
                id: 'cosecha_y_horno',
                category: 'regalos_artesanias',
                name: 'Cosecha y Horno',
                tag: 'Café Especial, Pastelería y Gourmet',
                layoutSummary: 'Navbar Boutique • Tonos Café y Caramelo • Variantes en Píldoras',
                colors: ['#854d0e', '#1c1917', '#fefce8'],
                description: 'Cálida y apetitosa para marcas de café de origen colombiano, repostería artesanal, chocolatería y productos gourmet. Destaca notas de cata, gramajes y frescura.',
                config: {
                    globalStyles: {
                        primaryColor: '#854d0e',
                        secondaryColor: '#1c1917',
                        backgroundColor: '#fefce8',
                        textColor: '#1c1917',
                        headingFont: 'Playfair Display',
                        bodyFont: 'DM Sans',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1rem',
                        buttonRadius: 'pill',
                        navbarLayout: 'centered',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'normal',
                        navbarLinkHover: 'underline_center',
                        navbarSticky: true,
                        navbarDropdownStyle: 'strip',
                        navbarDropdownAnim: 'fade',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'normal',
                        navbarCompactOnScroll: true,
                        cardPreset: 'commercial',
                        cardStyle: 'elevated',
                        cardRadius: '1rem',
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
                        cardHoverLift: 'lift',
                        detailPreset: 'conversion',
                        detailInfoStyle: 'card',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'carousel',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'cover',
                        detailImageZoom: true,
                        detailBuyLayout: 'standard',
                        detailVariantStyle: 'pills',
                        detailShowBreadcrumbs: true,
                        detailShowMeta: true,
                        detailShowSku: false,
                        detailShowSavingsBadge: true,
                        detailShowStock: true,
                        detailShowTrustStrip: true,
                        detailShowShare: true,
                        detailShowSpecs: true,
                        detailSpecsOpen: 'expanded',
                        detailShowPolicies: true,
                        detailShowRelated: true,
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'drawer',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: false,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'expandable_icon',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'pill',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon',
                        searchAnim: 'fade',
                        searchPlaceholder: 'Buscar café en grano, tortas, postres, chocolates...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos productos gourmet para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 200,
                        searchMaxSuggestions: 6,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: false,
                        searchSuggestCategories: true,
                        searchSuggestBrands: false,
                        searchShowRecent: true,
                        searchPopularTerms: 'Café en grano, Café molido, Tortas, Postres, Chocolates',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: false,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: false,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_ch', type: 'announcement_bar', enabled: true,
                            settings: { text: '☕ Frescura y sabor artesanal garantizado • Pedidos en línea o por WhatsApp', text2: '💳 Aceptamos Nequi, Daviplata, PSE y Tarjetas', text3: '', bgColor: '#854d0e', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_ch', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'SABOR DE ORIGEN COLOMBIANO', title: 'Aromas y sabores que despiertan los sentidos en ' + name, subtitle: 'Ingredientes seleccionados, tueste y horneado fresco para llevar a tu mesa una experiencia gastronómica auténtica.', buttonText: 'Ver Menú y Catálogo', buttonUrl: '/catalog', secondaryButtonText: 'Encargos por WhatsApp', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 50, bgColor: '#1c1917', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_cats_ch', type: 'featured_categories', enabled: true,
                            settings: { title: 'Nuestras Especialidades', subtitle: 'Elige tu línea favorita', cardLayout: 'pills', columns: '4' }
                        },
                        {
                            id: 'sec_grid_ch', type: 'product_grid', enabled: true,
                            settings: { title: 'Selección de la Casa', subtitle: 'Elige gramaje, tipo de molienda o número de porciones', source: 'NEWEST', categoryId: '', limit: 8, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_ch', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '☕ ESPECIALIDAD DE LA CASA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_rich_ch', type: 'rich_text', enabled: true,
                            settings: { title: 'Del Origen a tu Mesa', content: 'En ' + name + ' cuidamos cada etapa del proceso artesanal para asegurar frescura, aroma y calidad superior en cada pedido.' }
                        },
                        {
                            id: 'sec_steps_ch', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo hacer tu pedido?', subtitle: 'Disfruta nuestros productos frescos en casa', step1Title: 'Elige presentación', step1Text: 'Selecciona tus productos, peso, molienda o porciones.', step2Title: 'Datos de entrega', step2Text: 'Indica tu dirección y notas especiales para la entrega.', step3Title: 'Pago seguro o WhatsApp', step3Text: 'Paga en línea o coordina directamente con nosotros.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_test_ch', type: 'testimonials', enabled: true,
                            settings: { title: 'Lo que Dicen Nuestros Clientes', subtitle: 'Reseñas reales verificadas en cada pedido' }
                        },
                        {
                            id: 'sec_wa_ch', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Tienes un evento especial o pedido corporativo?', subtitle: 'Escríbenos por WhatsApp para cotizar pedidos por cantidad o celebraciones.', buttonText: 'Cotizar en WhatsApp' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'MENÚ & CATÁLOGO', headerTitle: 'Todos Nuestros Productos', headerSubtitle: 'Filtra por presentación, categoría o disponibilidad.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'drawer', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'carousel', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Acompáñalo con estas Opciones', relatedSubtitle: 'Otros sabores de nuestra casa' }
                        }]
                    }
                }
            },
            {
                id: 'todomercado',
                category: 'multitienda',
                name: 'TodoMercado',
                tag: 'Multitiendas, Variedades e Importadores',
                layoutSummary: 'Doble Barra + Acordeón • Vitrina Ofertas + General • Buscador Total',
                colors: ['#4f46e5', '#0f172a', '#f8fafc'],
                description: 'Diseñada para tiendas de productos variados, distribuidoras y comercios multicategoría. Doble barra superior, contador de ofertas, doble vitrina en inicio y filtros completos.',
                config: {
                    globalStyles: {
                        primaryColor: '#4f46e5',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Outfit',
                        bodyFont: 'Inter',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '0.75rem',
                        buttonRadius: 'classic',
                        navbarLayout: 'double_bar',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'pill',
                        navbarSticky: true,
                        navbarDropdownStyle: 'accordion',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true,
                        cardPreset: 'bento',
                        cardStyle: 'elevated',
                        cardRadius: '0.5rem',
                        cardShadow: 'sm',
                        cardImageAspect: 'square',
                        cardImageFit: 'contain',
                        cardImagePadding: 'inset',
                        cardContentAlign: 'left',
                        cardMetaMode: 'both',
                        cardDiscountBadge: 'percent',
                        cardShowStatusBadges: true,
                        cardShowOldPrice: true,
                        cardPriceSize: 'normal',
                        cardButtonStyle: 'solid',
                        cardActionMode: 'always',
                        cardWishlistMode: 'always',
                        cardImageHover: 'carousel',
                        cardHoverLift: 'lift',
                        detailPreset: 'conversion',
                        detailInfoStyle: 'buybox',
                        detailStickyMode: 'sticky_info',
                        detailGalleryPosition: 'left',
                        detailLayoutRatio: '50_50',
                        detailGalleryLayout: 'bottom',
                        detailGalleryArrows: true,
                        detailImageAspect: 'square',
                        detailImageFit: 'contain',
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
                        detailRelatedCols: '4',
                        filterEnabled: true,
                        filterLayout: 'sidebar',
                        filterShowSearch: true,
                        filterShowSort: true,
                        filterShowCount: true,
                        filterShowCategory: true,
                        filterShowPrice: true,
                        filterShowOffers: true,
                        filterShowAvailability: true,
                        filterShowBrand: true,
                        filterShowVariants: true,
                        filterShowSpecs: true,
                        searchEnabled: true,
                        searchMode: 'predictive',
                        searchNavbarVariant: 'inline_bar',
                        searchMobileMode: 'fullscreen',
                        searchInputStyle: 'rounded',
                        searchInputSize: 'normal',
                        searchButtonMode: 'icon_text',
                        searchAnim: 'slide_up',
                        searchPlaceholder: 'Buscar entre cientos de productos, categorías o marcas...',
                        searchButtonLabel: 'Buscar',
                        searchEmptyMessage: 'No encontramos productos para tu búsqueda',
                        searchMinChars: 2,
                        searchDebounceMs: 150,
                        searchMaxSuggestions: 8,
                        searchShowProductImg: true,
                        searchShowProductPrice: true,
                        searchShowProductDiscount: true,
                        searchShowProductCategory: true,
                        searchShowProductBrand: true,
                        searchSuggestCategories: true,
                        searchSuggestBrands: true,
                        searchShowRecent: true,
                        searchPopularTerms: 'Ofertas, Hogar, Tecnología, Belleza, Novedades',
                        searchCategoryScope: 'pills_top',
                        searchAdvancedEnabled: true,
                        searchMatchVariants: true,
                        searchMatchSpecs: true,
                        searchAdvCategory: true,
                        searchAdvBrand: true,
                        searchAdvPrice: true,
                        searchAdvAvailability: true,
                        searchAdvVariants: true,
                        searchAdvSpecs: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_tm', type: 'announcement_bar', enabled: true,
                            settings: { text: '🚚 Envíos a todos los municipios de Colombia • Compra 100% protegida', text2: '💳 Paga en línea con PSE, Nequi, Daviplata y Tarjetas', text3: '📲 ¿Dudas o compras al por mayor? Escríbenos por WhatsApp', bgColor: '#4f46e5', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_tm', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'compact', badgeText: 'BIENVENIDO A ' + name.toUpperCase(), title: 'Todo lo que necesitas en un solo lugar y al mejor precio', subtitle: 'Explora nuestros departamentos, aprovecha las ofertas del día y recibe tu pedido sin salir de casa.', buttonText: 'Ver Todo el Catálogo', buttonUrl: '/catalog', secondaryButtonText: 'Pedir por WhatsApp', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 45, bgColor: '#0f172a', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_tm', type: 'featured_categories', enabled: true,
                            settings: { title: 'Explora por Departamento', subtitle: 'Navega rápidamente entre nuestras secciones', cardLayout: 'pills', columns: '4' }
                        },
                        {
                            id: 'sec_cd_tm', type: 'countdown_promo', enabled: true,
                            settings: { badgeText: '🔥 OFERTAS RELÁMPAGO', title: '¡Precios de oportunidad por tiempo limitado!', subtitle: 'Referencias seleccionadas con descuento especial hasta agotar inventario.', endDate: '', buttonText: 'Ver Ofertas', buttonUrl: '/catalog', bgColor: '#0f172a', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_grid_off_tm', type: 'product_grid', enabled: true,
                            settings: { title: 'Super Ofertas Destacadas', subtitle: 'Productos con descuento activo hoy', source: 'OFFERS', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_multi_tm', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Tendencia', card1Title: 'Nuevos Ingresos', card1Subtitle: 'Lo último que llegó a nuestro inventario', card1ButtonText: 'Ver Novedades', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#0f172a', card2Badge: 'Atención Directa', card2Title: 'Pedidos por WhatsApp', card2Subtitle: 'Te asesoramos en vivo con tu compra', card2ButtonText: 'Abrir WhatsApp', card2ButtonUrl: '__whatsapp__', card2ImageUrl: '', card2BgColor: '#4f46e5' }
                        },
                        {
                            id: 'sec_grid_all_tm', type: 'product_grid', enabled: true,
                            settings: { title: 'Catálogo General Disponible', subtitle: 'Busca por palabra clave o ordena por precio', source: 'NEWEST', categoryId: '', limit: 12, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_steps_tm', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo comprar en ' + name + '?', subtitle: 'Fácil, rápido y seguro en 3 pasos', step1Title: 'Agrega a tu bolsa', step1Text: 'Usa el buscador o explora las categorías para elegir tus productos.', step2Title: 'Datos de entrega', step2Text: 'Ingresa tu nombre, teléfono, ciudad y dirección.', step3Title: 'Paga o confirma por WhatsApp', step3Text: 'Paga en línea con Wompi o envía tu pedido directo a nuestro WhatsApp.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_trust_tm', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'shield', item1Title: 'Compra Protegida', item1Text: 'Respaldo y garantía en todas tus compras.', item2Icon: 'truck', item2Title: 'Cobertura Nacional', item2Text: 'Despachos rápidos a toda Colombia.', item3Icon: 'chat', item3Title: 'Soporte por WhatsApp', item3Text: 'Atención humana y rápida para ayudarte.' }
                        },
                        {
                            id: 'sec_test_tm', type: 'testimonials', enabled: true,
                            settings: { title: 'Opiniones de Nuestros Compradores', subtitle: 'Calificaciones verificadas por pedido' }
                        },
                        {
                            id: 'sec_faq_tm', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Todo lo que necesitas saber antes de pedir', q1: '¿Cómo puedo pagar mi pedido?', a1: 'Aceptamos PSE, Nequi, Daviplata, tarjetas débito y crédito en línea, o coordinación de pedido por WhatsApp.', q2: '¿Cuánto demora en llegar a mi ciudad?', a2: 'El tiempo de entrega estimado es de 2 a 5 días hábiles dependiendo de tu ciudad o municipio.', q3: '¿Los productos tienen garantía?', a3: 'Sí, todos los artículos de nuestro catálogo cuentan con respaldo y garantía directa.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'MULTITIENDA', headerTitle: 'Todo Nuestro Catálogo', headerSubtitle: 'Filtra por departamento, precio, marca, ofertas o disponibilidad.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Clientes También Vieron', relatedSubtitle: 'Otros productos disponibles en nuestra tienda' }
                        }]
                    }
                }
            }
        ];
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
        container.innerHTML = '';

        const allPresets = this.getPresetsDefinitions();
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

            card.querySelector('.apply-preset-btn').addEventListener('click', () => {
                this.applyPreset(preset);
            });

            container.appendChild(card);
        });
    },

    mergeUserContentIntoPreset: function(oldHomeSections, newHomeSections) {
        if (!Array.isArray(oldHomeSections) || !Array.isArray(newHomeSections)) return;
        const usedOldIds = new Set();

        // Conservar únicamente las imágenes subidas por el comerciante, fechas de ofertas y vínculos de productos/categorías,
        // permitiendo que cada plantilla aplique sus propios títulos, etiquetas y textos comerciales especializados.
        const PRESERVED_MEDIA_AND_DATA_KEYS = [
            'imageUrl', 'card1ImageUrl', 'card2ImageUrl',
            'productId', 'categoryId', 'endDate'
        ];

        newHomeSections.forEach(newSec => {
            const match = oldHomeSections.find(oldSec =>
                oldSec && oldSec.type === newSec.type && !usedOldIds.has(oldSec.id)
            );
            if (!match || !match.settings || !newSec.settings) return;
            usedOldIds.add(match.id);

            PRESERVED_MEDIA_AND_DATA_KEYS.forEach(k => {
                const val = match.settings[k];
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                    newSec.settings[k] = val;
                }
            });
        });
    },

    applyPreset: function(preset) {
        this.ensurePagesStructure();

        if (!this.previousThemeSnapshot) {
            this.previousThemeSnapshot = JSON.parse(JSON.stringify(this.theme));
        }

        const keepChk = document.getElementById('preset-keep-content-chk');
        const keepContent = keepChk ? Boolean(keepChk.checked) : true;

        // Tomar como base de contenido el diseño original del usuario antes de probar plantillas en esta sesión
        const baseSourceTheme = this.previousThemeSnapshot || this.theme;
        const oldHomeSections = JSON.parse(JSON.stringify(
            (baseSourceTheme.pages && baseSourceTheme.pages.home) || baseSourceTheme.sections || []
        ));
        const currentCustomPages = Array.isArray(this.theme.customPages)
            ? JSON.parse(JSON.stringify(this.theme.customPages)) : [];

        // Conservar personalizaciones existentes de páginas de categoría
        const preservedCategoryPages = {};
        if (this.theme.pages && typeof this.theme.pages === 'object') {
            Object.entries(this.theme.pages).forEach(([k, v]) => {
                if (k.startsWith('category:') && Array.isArray(v) && v.length > 0) {
                    preservedCategoryPages[k] = JSON.parse(JSON.stringify(v));
                }
            });
        }

        const nextTheme = JSON.parse(JSON.stringify(preset.config));
        if (!nextTheme.pages) nextTheme.pages = {};
        if (Array.isArray(nextTheme.sections)) {
            nextTheme.pages.home = nextTheme.sections;
        }

        if (keepContent && Array.isArray(nextTheme.pages.home)) {
            this.mergeUserContentIntoPreset(oldHomeSections, nextTheme.pages.home);
        }

        if (keepContent) {
            Object.entries(preservedCategoryPages).forEach(([k, v]) => {
                nextTheme.pages[k] = v;
            });
        }

        this.theme = nextTheme;
        this.theme.customPages = currentCustomPages;
        this.theme.globalStyles = Object.assign({}, nextTheme.globalStyles || {});
        this.ensurePagesStructure();

        this.activePresetId = preset.id;
        this.activeSectionId = null;

        const undoBanner = document.getElementById('preset-undo-banner');
        if (undoBanner) undoBanner.classList.remove('hidden');

        this.markUnpublishedChanges(true);
        this.renderPageSelector();
        this.syncPageContextBars();
        this.renderSectionsList();
        this.initGlobalStylesInputs();
        this.renderPresetsCatalog();
        this.pushLiveStylesToIframe();
        this.saveDraft(false, true);

        if (Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show(
                keepContent
                    ? `Plantilla "${preset.name}" aplicada conservando tu contenido`
                    : `Plantilla "${preset.name}" aplicada completa`,
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

        const undoBanner = document.getElementById('preset-undo-banner');
        if (undoBanner) undoBanner.classList.add('hidden');

        this.ensurePagesStructure();
        this.renderPageSelector();
        this.syncPageContextBars();
        this.renderSectionsList();
        this.initGlobalStylesInputs();
        this.renderPresetsCatalog();
        this.saveDraft(false, true);

        if (Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show('Se restauró tu diseño anterior', 'success');
        }
    },

    renderAddSectionModalCatalog: function() {
        const grid = document.getElementById('available-sections-grid');
        if (!grid) return;
        grid.innerHTML = '';

        Object.entries(this.catalogDefinitions).forEach(([type, def]) => {
            if (def.anchorOnly) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'text-left p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-storevo-500 transition flex flex-col justify-between gap-2 group';
            btn.innerHTML = `
                <div>
                    <p class="text-sm font-bold text-white group-hover:text-storevo-400 transition-colors">${this.escapeHtml(def.label)}</p>
                    <p class="text-xs text-slate-400 mt-1">${this.escapeHtml(def.description)}</p>
                </div>
                <span class="text-[11px] font-bold text-storevo-400 inline-flex items-center gap-1 mt-2">
                    + Añadir sección
                </span>
            `;
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

                    // 2. Reemplazar el contenido principal (<main>) y puente de filtros
                    currentMain.innerHTML = nextMain.innerHTML;

                    const currentScriptsBox = iDoc.getElementById('storevo-page-scripts');
                    const nextScriptsBox = nextDoc.getElementById('storevo-page-scripts');
                    if (currentScriptsBox && nextScriptsBox) {
                        currentScriptsBox.innerHTML = nextScriptsBox.innerHTML;
                    }

                    // 3. Re-ejecutar scripts inline de secciones (ej. contadores regresivos) y re-hidratar módulos en 0ms
                    Array.from(currentMain.querySelectorAll('script:not([src])')).forEach(oldScript => {
                        const newScript = iDoc.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                        newScript.textContent = oldScript.textContent;
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    });

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