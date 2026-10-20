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
                        ]},
                    { key: 'showDiscountPercent', label: 'Etiqueta de ahorro en ofertas', type: 'checkbox', placeholder: 'Mostrar porcentaje de descuento (Ej: -20% Oferta)', defaultVal: true }
                ];
            case 'product_main':
                return [
                    { key: 'galleryLayout', label: 'Diseño de la Galería en PC', type: 'select', defaultVal: 'bottom', options: [
                            { value: 'bottom', label: 'Clásico (Imagen principal + Miniaturas abajo)' },
                            { value: 'left', label: 'Editorial Lateral (Miniaturas verticales a la izquierda)' },
                            { value: 'grid', label: 'Mosaico Lookbook (Miniaturas grandes en 2 columnas)' }
                        ]},
                    { key: 'showBreadcrumbs', label: 'Miga de pan (Ruta superior)', type: 'checkbox', placeholder: 'Mostrar ruta Inicio / Catálogo / Categoría', defaultVal: true },
                    { key: 'showSku', label: 'Código SKU', type: 'checkbox', placeholder: 'Mostrar insignia con el SKU del producto', defaultVal: true },
                    { key: 'showStockCounter', label: 'Indicador de unidades disponibles', type: 'checkbox', placeholder: 'Mostrar texto de Stock disponible bajo la cantidad', defaultVal: true },
                    { key: 'showSpecs', label: 'Ficha Técnica (Especificaciones)', type: 'checkbox', placeholder: 'Mostrar acordeón de especificaciones técnicas', defaultVal: true },
                    { key: 'showPolicies', label: 'Políticas de Envío y Devolución', type: 'checkbox', placeholder: 'Mostrar acordeones de políticas configuradas', defaultVal: true },
                    { key: 'showRelatedProducts', label: 'Productos Relacionados', type: 'checkbox', placeholder: 'Mostrar sugerencias de productos al final de la ficha', defaultVal: true },
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
                gs.cardStyle = 'elevated';
                this.initGlobalStylesInputs();
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }
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
                id: 'editorial_couture',
                category: 'fashion',
                name: 'Editorial Haute Couture',
                tag: 'Alta Costura & Moda',
                layoutSummary: 'Navbar Editorial • Bordes Rectos 0px • Galería Lookbook',
                colors: ['#18181b', '#27272a', '#f8fafc'],
                description: 'Composición de revista con tipografía Cormorant Garamond en mayúsculas, tarjetas limpias sin bordes, catálogo de 3 columnas grandes y ficha en mosaico.',
                config: {
                    globalStyles: {
                        primaryColor: '#18181b',
                        secondaryColor: '#27272a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Cormorant Garamond',
                        bodyFont: 'Manrope',
                        headingTransform: 'uppercase',
                        fontScale: 'standard',
                        borderRadius: '0px',
                        buttonRadius: 'square',
                        cardStyle: 'clean',
                        navbarLayout: 'editorial',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'underline_center',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'fade',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'slow',
                        navbarCompactOnScroll: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_ec', type: 'announcement_bar', enabled: true,
                            settings: { text: 'ENVÍOS A TODA COLOMBIA • EDICIÓN LIMITADA DISPONIBLE', text2: 'ATENCIÓN PERSONALIZADA VÍA WHATSAPP', text3: '', bgColor: '#18181b', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_ec', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'COLECCIÓN DE TEMPORADA', title: name, subtitle: 'Siluetas atemporales y acabados de autor diseñados para destacar.', buttonText: 'EXPLORAR COLECCIÓN', buttonUrl: '/catalog', secondaryButtonText: '', secondaryButtonUrl: '/catalog', imageUrl: '', overlayOpacity: 45, bgColor: '#18181b', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_cats_ec', type: 'featured_categories', enabled: true,
                            settings: { title: 'Líneas de Colección', subtitle: 'Explora nuestras categorías principales', cardLayout: 'visual', columns: '3' }
                        },
                        {
                            id: 'sec_grid_ec', type: 'product_grid', enabled: true,
                            settings: { title: 'Nuevos Ingresos', subtitle: 'Piezas seleccionadas de la temporada', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_spot_ec', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: 'PIEZA DE AUTOR', customTitle: '', customSubtitle: '', imageSide: 'right' }
                        },
                        {
                            id: 'sec_rich_ec', type: 'rich_text', enabled: true,
                            settings: { title: 'Filosofía de Marca', content: 'En ' + name + ' creamos colecciones con atención meticulosa al detalle, priorizando materiales nobles y cortes impecables.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'LOOKBOOK', headerTitle: 'Catálogo Completo', headerSubtitle: 'Explora todas las piezas disponibles en nuestra tienda.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'topbar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '3', showDiscountPercent: false }
                        }],
                        product: [
                            {
                                id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                                settings: { galleryLayout: 'grid', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Completa el Look', relatedSubtitle: 'Otras piezas de nuestra colección' }
                            },
                            {
                                id: 'sec_prod_trust_ec', type: 'trust_badges', enabled: true, locked: false,
                                settings: { badgeStyle: 'minimal', item1Icon: 'shield', item1Title: 'Compra Protegida', item1Text: 'Transacciones 100% seguras en línea.', item2Icon: 'truck', item2Title: 'Despacho Nacional', item2Text: 'Envíos cuidados a cualquier ciudad.', item3Icon: 'refresh', item3Title: 'Cambios de Talla', item3Text: 'Soporte directo por WhatsApp.' }
                            }
                        ]
                    }
                }
            },
            {
                id: 'urban_streetwear',
                category: 'fashion',
                name: 'Urbano & Streetwear Drop',
                tag: 'Streetwear & Sneakers',
                layoutSummary: 'Navbar Transparente Hero • Tarjetas Contorno • Contador Drop',
                colors: ['#4f46e5', '#09090b', '#f4f4f5'],
                description: 'Diseño audaz con navbar transparente sobre portada, tarjetas con borde marcado, lanzamiento estrella, contador regresivo y galería lateral.',
                config: {
                    globalStyles: {
                        primaryColor: '#4f46e5',
                        secondaryColor: '#09090b',
                        backgroundColor: '#f4f4f5',
                        textColor: '#09090b',
                        headingFont: 'Space Grotesk',
                        bodyFont: 'Inter',
                        headingTransform: 'uppercase',
                        fontScale: 'standard',
                        borderRadius: '0.75rem',
                        buttonRadius: 'sync',
                        cardStyle: 'outlined',
                        navbarLayout: 'hero_overlay',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'slide_bg',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'scale',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true
                    },
                    sections: [
                        {
                            id: 'sec_hero_us', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'NEW DROP 2026', title: 'ESTILO URBANO SIN LÍMITES EN ' + name, subtitle: 'Referencias exclusivas con unidades limitadas y envío inmediato a todo el país.', buttonText: 'VER EL DROP', buttonUrl: '/catalog', secondaryButtonText: 'WHATSAPP DIRECTO', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 55, bgColor: '#09090b', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cd_us', type: 'countdown_promo', enabled: true,
                            settings: { badgeText: '⚡ FLASH SALE ACTIVO', title: '¡Aprovecha precios de lanzamiento antes de que se agoten!', subtitle: 'Unidades numeradas en referencias seleccionadas.', endDate: '', buttonText: 'Comprar Ofertas', buttonUrl: '/catalog', bgColor: '#4f46e5', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_spot_us', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '🔥 GRAIL DE LA SEMANA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_grid_us', type: 'product_grid', enabled: true,
                            settings: { title: 'Últimos Lanzamientos', subtitle: 'Filtra tu talla disponible en tiempo real', source: 'NEWEST', categoryId: '', limit: 8, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_multi_us', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Hype', card1Title: 'Nuevos Ingresos', card1Subtitle: 'Lo último que llegó a bodega', card1ButtonText: 'Explorar', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#09090b', card2Badge: 'Sale', card2Title: 'Últimas Tallas', card2Subtitle: 'Descuentos especiales hoy', card2ButtonText: 'Ver rebajas', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#4f46e5' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'DROP OFICIAL', headerTitle: 'Todo el Catálogo', headerSubtitle: 'Filtra por talla, color o disponibilidad inmediata.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'left', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Combínalo con', relatedSubtitle: 'Más referencias del drop actual' }
                        }]
                    }
                }
            },
            {
                id: 'tech_gadgets',
                category: 'commercial',
                name: 'Tecnología & Gadgets Pro',
                tag: 'Electrónica, Audio & Accesorios',
                layoutSummary: 'Navbar Buscador Grande • Filtros Laterales • Ficha Técnica',
                colors: ['#2563eb', '#0f172a', '#f8fafc'],
                description: 'Estructura tipo marketplace tecnológico con buscador prominente, categorías con ícono, vitrina con filtros dinámicos y especificaciones técnicas destacadas.',
                config: {
                    globalStyles: {
                        primaryColor: '#2563eb',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Plus Jakarta Sans',
                        bodyFont: 'Inter',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1rem',
                        buttonRadius: 'classic',
                        cardStyle: 'elevated',
                        navbarLayout: 'marketplace',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'normal',
                        navbarLinkHover: 'pill',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_tg', type: 'announcement_bar', enabled: true,
                            settings: { text: '⚡ Garantía real en todos nuestros productos • Despacho rápido a toda Colombia', text2: '💳 Paga seguro con PSE, Nequi, Tarjetas o coordina por WhatsApp', text3: '', bgColor: '#2563eb', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_tg', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'TECNOLOGÍA GARANTIZADA', title: 'Innovación y rendimiento al mejor precio en ' + name, subtitle: 'Equipos y accesorios seleccionados con respaldo técnico y entrega ágil.', buttonText: 'Explorar Catálogo', buttonUrl: '/catalog', secondaryButtonText: 'Asesoría Técnica', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 45, bgColor: '#0f172a', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_tg', type: 'featured_categories', enabled: true,
                            settings: { title: 'Categorías Tecnológicas', subtitle: 'Encuentra rápido el equipo o accesorio que necesitas', cardLayout: 'icon', columns: '4' }
                        },
                        {
                            id: 'sec_grid_tg', type: 'product_grid', enabled: true,
                            settings: { title: 'Equipos Destacados', subtitle: 'Filtra por marca, capacidad o rango de precio', source: 'NEWEST', categoryId: '', limit: 12, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_trust_tg', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'secondary', item1Icon: 'shield', item1Title: 'Garantía Directa', item1Text: 'Todos nuestros equipos cuentan con respaldo real.', item2Icon: 'truck', item2Title: 'Envío Asegurado', item2Text: 'Empaque protegido hasta la puerta de tu casa.', item3Icon: 'chat', item3Title: 'Soporte Especializado', item3Text: 'Te ayudamos a elegir antes y después de tu compra.' }
                        },
                        {
                            id: 'sec_faq_tg', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Resolvemos tus dudas sobre garantía y envíos', q1: '¿Los productos tienen garantía?', a1: 'Sí, todos nuestros productos incluyen garantía por defectos de fábrica y soporte directo.', q2: '¿Cuánto demora el envío a mi ciudad?', a2: 'Despachamos en menos de 24 horas hábiles. La entrega toma entre 1 y 4 días hábiles.', q3: '¿Qué medios de pago aceptan?', a3: 'Aceptamos PSE, Nequi, Daviplata, tarjetas débito/crédito y pedidos por WhatsApp.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'CATÁLOGO OFICIAL', headerTitle: 'Todos los Productos', headerSubtitle: 'Usa el panel lateral para filtrar por marca, especificaciones y disponibilidad.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Accesorios y Equipos Similares', relatedSubtitle: 'Compatibles con tu selección' }
                        }]
                    }
                }
            },
            {
                id: 'whatsapp_express',
                category: 'commercial',
                name: 'Catálogo Express WhatsApp',
                tag: 'Venta Ágil por WhatsApp & Redes',
                layoutSummary: 'Navbar Compacto • Vitrina Directa con Filtros • Botones Píldora',
                colors: ['#059669', '#0f172a', '#f8fafc'],
                description: 'Va directo al grano para clientes que vienen de Instagram o WhatsApp: categorías en píldoras y productos con buscador desde el primer pantallazo.',
                config: {
                    globalStyles: {
                        primaryColor: '#059669',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Outfit',
                        bodyFont: 'Inter',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1rem',
                        buttonRadius: 'pill',
                        cardStyle: 'elevated',
                        navbarLayout: 'compact',
                        navbarStyle: 'primary',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'underline_slide',
                        navbarSticky: true,
                        navbarDropdownStyle: 'cascade',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: false
                    },
                    sections: [
                        {
                            id: 'sec_ann_wa', type: 'announcement_bar', enabled: true,
                            settings: { text: '📲 ¡Haz tu pedido en segundos! Elige tus productos y envíalo directo a nuestro WhatsApp', text2: '🚚 Despachos rápidos a toda Colombia', text3: '', bgColor: '#0f172a', textColor: '#ffffff', linkUrl: '__whatsapp__' }
                        },
                        {
                            id: 'sec_cats_wa', type: 'featured_categories', enabled: true,
                            settings: { title: 'Explora por Categoría', subtitle: 'Toca una categoría para ver sus referencias', cardLayout: 'pills', columns: '4' }
                        },
                        {
                            id: 'sec_grid_wa', type: 'product_grid', enabled: true,
                            settings: { title: 'Catálogo Disponible en ' + name, subtitle: 'Busca por nombre, talla o color y agrega a tu bolsa', source: 'NEWEST', categoryId: '', limit: 12, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_steps_wa', type: 'how_to_buy', enabled: true,
                            settings: { title: '¿Cómo pedir en ' + name + '?', subtitle: 'Fácil, sin registros complicados y en menos de 2 minutos', step1Title: 'Agrega a tu bolsa', step1Text: 'Elige tus productos y opciones favoritas en el catálogo.', step2Title: 'Completa tus datos de envío', step2Text: 'Escribe tu nombre, ciudad y dirección de entrega.', step3Title: 'Paga en línea o envía por WhatsApp', step3Text: 'El sistema arma tu pedido listo para confirmar con nosotros.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_cta_wa', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Quieres atención inmediata por WhatsApp?', subtitle: 'Escríbenos ahora mismo y te ayudamos con precios al por mayor, tallas o tiempos de entrega.', buttonText: 'Abrir Chat de WhatsApp' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'PEDIDO RÁPIDO', headerTitle: 'Catálogo Disponible', headerSubtitle: 'Agrega tus productos a la bolsa para enviar tu pedido.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'topbar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Más productos disponibles', relatedSubtitle: 'Aprovecha el mismo envío agregando más referencias' }
                        }]
                    }
                }
            },
            {
                id: 'jewelry_boutique',
                category: 'boutique',
                name: 'Joyería & Boutique Dorada',
                tag: 'Joyería, Relojería & Perfumería',
                layoutSummary: 'Navbar Boutique Centrado • Fuente Cinzel • Galería Lateral',
                colors: ['#a16207', '#1c1917', '#fafaf9'],
                description: 'Estética de lujo silencioso con tipografía Cinzel y Lora, tonos crema y dorado viejo, menú centrado con efecto de foco y vitrina delicada.',
                config: {
                    globalStyles: {
                        primaryColor: '#a16207',
                        secondaryColor: '#1c1917',
                        backgroundColor: '#fafaf9',
                        textColor: '#1c1917',
                        headingFont: 'Cinzel',
                        bodyFont: 'Lora',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '0.375rem',
                        buttonRadius: 'square',
                        cardStyle: 'clean',
                        navbarLayout: 'centered',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'opacity',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'fade',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'slow',
                        navbarCompactOnScroll: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_jb', type: 'announcement_bar', enabled: true,
                            settings: { text: '✨ Empaque de regalo incluido en todos los pedidos • Envíos asegurados', text2: '', text3: '', bgColor: '#1c1917', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_jb', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'COLECCIÓN EXCLUSIVA', title: name, subtitle: 'Detalles eternos elaborados para acompañar tus momentos más especiales.', buttonText: 'Descubrir Joyas', buttonUrl: '/catalog', secondaryButtonText: '', secondaryButtonUrl: '/catalog', imageUrl: '', overlayOpacity: 45, bgColor: '#1c1917', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_spot_jb', type: 'spotlight_product', enabled: true,
                            settings: { productId: '', badgeText: '✨ PIEZA INSIGNIA', customTitle: '', customSubtitle: '', imageSide: 'left' }
                        },
                        {
                            id: 'sec_grid_jb', type: 'product_grid', enabled: true,
                            settings: { title: 'Piezas Seleccionadas', subtitle: 'Brillo, elegancia y garantía de autenticidad', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_test_jb', type: 'testimonials', enabled: true,
                            settings: { title: 'Experiencias Reales', subtitle: 'Lo que opinan quienes ya recibieron sus piezas' }
                        },
                        {
                            id: 'sec_trust_jb', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'minimal', item1Icon: 'gift', item1Title: 'Estuche de Regalo', item1Text: 'Cada pedido se entrega en empaque especial listo para obsequiar.', item2Icon: 'star', item2Title: 'Calidad Certificada', item2Text: 'Materiales seleccionados con garantía de acabado.', item3Icon: 'truck', item3Title: 'Entrega Segura', item3Text: 'Seguimiento completo hasta tus manos.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'BOUTIQUE', headerTitle: 'Nuestras Colecciones', headerSubtitle: 'Explora cada pieza con acabados de lujo.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'topbar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '3', showDiscountPercent: false }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'left', showBreadcrumbs: true, showSku: true, showStockCounter: false, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Piezas Complementarias', relatedSubtitle: 'Combina tu elección con nuestra colección' }
                        }]
                    }
                }
            },
            {
                id: 'natural_artisan',
                category: 'boutique',
                name: 'Artesanal, Natural & Orgánico',
                tag: 'Cosmética Natural, Hogar & Artesanía',
                layoutSummary: 'Bordes Orgánicos 24px • Tonos Tierra/Oliva • Historia de Marca',
                colors: ['#3f6212', '#292524', '#fafaf9'],
                description: 'Tonos verde oliva y piedra cálida, esquinas suaves orgánicas (24px), portada dividida e historia artesanal que conecta emocionalmente.',
                config: {
                    globalStyles: {
                        primaryColor: '#3f6212',
                        secondaryColor: '#292524',
                        backgroundColor: '#fafaf9',
                        textColor: '#292524',
                        headingFont: 'Lora',
                        bodyFont: 'Nunito',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '1.5rem',
                        buttonRadius: 'pill',
                        cardStyle: 'elevated',
                        navbarLayout: 'centered',
                        navbarStyle: 'page',
                        navbarLinkFormat: 'normal',
                        navbarLinkHover: 'underline_center',
                        navbarSticky: true,
                        navbarDropdownStyle: 'cascade',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'normal',
                        navbarCompactOnScroll: false
                    },
                    sections: [
                        {
                            id: 'sec_hero_na', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'split', badgeText: 'HECHO CON DEDICACIÓN', title: 'Bienestar y esencia natural en ' + name, subtitle: 'Productos creados de forma consciente para cuidar de ti y de tu espacio.', buttonText: 'Conocer Productos', buttonUrl: '/catalog', secondaryButtonText: 'Hablar con Nosotros', secondaryButtonUrl: '__whatsapp__', imageUrl: '', overlayOpacity: 40, bgColor: '#3f6212', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_na', type: 'featured_categories', enabled: true,
                            settings: { title: 'Nuestras Líneas', subtitle: 'Ingredientes y materiales seleccionados con amor', cardLayout: 'pills', columns: '4' }
                        },
                        {
                            id: 'sec_grid_na', type: 'product_grid', enabled: true,
                            settings: { title: 'Favoritos de la Comunidad', subtitle: 'Los más pedidos de nuestra tienda', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_rich_na', type: 'rich_text', enabled: true,
                            settings: { title: 'Nuestro Propósito', content: 'En ' + name + ' creemos en el valor de lo auténtico. Cada pedido es preparado cuidadosamente para llevarte calidad y calidez.' }
                        },
                        {
                            id: 'sec_test_na', type: 'testimonials', enabled: true,
                            settings: { title: 'Palabras de Nuestros Clientes', subtitle: 'Reseñas verificadas de compradores reales' }
                        },
                        {
                            id: 'sec_cta_na', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Deseas una recomendación personalizada?', subtitle: 'Cuéntanos qué buscas por WhatsApp y te guiamos paso a paso.', buttonText: 'Recibir asesoría en WhatsApp' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'CATÁLOGO ARTESANAL', headerTitle: 'Todos Nuestros Productos', headerSubtitle: 'Explora nuestras creaciones disponibles.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '3', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: false, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'También te encantará', relatedSubtitle: 'Armoniza tu pedido con estas opciones' }
                        }]
                    }
                }
            },
            {
                id: 'sport_fitness',
                category: 'fashion',
                name: 'Deportivo & Alto Rendimiento',
                tag: 'Fitness, Suplementos & Ropa Deportiva',
                layoutSummary: 'Tipografía Oswald Impacto • Contorno Firme • Velocidad Rápida',
                colors: ['#dc2626', '#0f172a', '#f8fafc'],
                description: 'Máxima energía visual con tipografía condensada Oswald en mayúsculas, contraste rojo/negro, contador de oferta y navegación ultra rápida.',
                config: {
                    globalStyles: {
                        primaryColor: '#dc2626',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Oswald',
                        bodyFont: 'DM Sans',
                        headingTransform: 'uppercase',
                        fontScale: 'standard',
                        borderRadius: '0.375rem',
                        buttonRadius: 'square',
                        cardStyle: 'outlined',
                        navbarLayout: 'classic',
                        navbarStyle: 'secondary',
                        navbarLinkFormat: 'uppercase',
                        navbarLinkHover: 'underline_slide',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'fast',
                        navbarCompactOnScroll: true
                    },
                    sections: [
                        {
                            id: 'sec_ann_sf', type: 'announcement_bar', enabled: true,
                            settings: { text: '🔥 ENTRENA AL MÁXIMO NIVEL • ENVÍOS RÁPIDOS A TODO EL PAÍS', text2: '', text3: '', bgColor: '#dc2626', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_sf', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'classic', badgeText: 'ALTO RENDIMIENTO', title: 'SUPERA TUS LÍMITES CON ' + name, subtitle: 'Equipamiento, prendas y suplementación diseñada para resultados reales.', buttonText: 'COMPRAR AHORA', buttonUrl: '/catalog', secondaryButtonText: 'VER OFERTAS', secondaryButtonUrl: '/catalog', imageUrl: '', overlayOpacity: 55, bgColor: '#0f172a', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_cats_sf', type: 'featured_categories', enabled: true,
                            settings: { title: 'Categorías de Entrenamiento', subtitle: 'Elige tu disciplina o línea de producto', cardLayout: 'visual', columns: '4' }
                        },
                        {
                            id: 'sec_cd_sf', type: 'countdown_promo', enabled: true,
                            settings: { badgeText: '⚡ PROMO DE TEMPORADA', title: 'DESCUENTOS ESPECIALES POR TIEMPO LIMITADO', subtitle: 'Equípate hoy antes de que finalice la oferta.', endDate: '', buttonText: 'Ver Descuentos', buttonUrl: '/catalog', bgColor: '#0f172a', textColor: '#ffffff' }
                        },
                        {
                            id: 'sec_grid_sf', type: 'product_grid', enabled: true,
                            settings: { title: 'Los Más Vendidos', subtitle: 'Rendimiento comprobado por nuestros clientes', source: 'NEWEST', categoryId: '', limit: 8, showFilters: false, showViewAll: true }
                        },
                        {
                            id: 'sec_trust_sf', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'clock', item1Title: 'Despacho Express', item1Text: 'Procesamos tu pedido en tiempo récord.', item2Icon: 'shield', item2Title: '100% Original', item2Text: 'Calidad y autenticidad garantizada.', item3Icon: 'card', item3Title: 'Todos los Pagos', item3Text: 'PSE, Nequi, tarjetas o WhatsApp.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'CATÁLOGO PRO', headerTitle: 'Todo el Equipamiento', headerSubtitle: 'Filtra por talla, sabor, peso o categoría.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'left', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Potencia tu Compra', relatedSubtitle: 'Productos recomendados para tu rutina' }
                        }]
                    }
                }
            },
            {
                id: 'commercial_megastore',
                category: 'commercial',
                name: 'Comercial Multitienda & Hogar',
                tag: 'Multicategoría, Variedades & Distribuidoras',
                layoutSummary: 'Doble Barra Comercial • Mega Menú • Vitrina 12 Productos',
                colors: ['#0284c7', '#0f172a', '#f8fafc'],
                description: 'Pensada para tiendas con amplio surtido: navbar de doble barra con accesos rápidos, mosaico promocional, filtros laterales y pasos de compra claros.',
                config: {
                    globalStyles: {
                        primaryColor: '#0284c7',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Poppins',
                        bodyFont: 'Inter',
                        headingTransform: 'none',
                        fontScale: 'standard',
                        borderRadius: '0.75rem',
                        buttonRadius: 'classic',
                        cardStyle: 'elevated',
                        navbarLayout: 'double_bar',
                        navbarStyle: 'light',
                        navbarLinkFormat: 'bold',
                        navbarLinkHover: 'pill',
                        navbarSticky: true,
                        navbarDropdownStyle: 'mega',
                        navbarDropdownAnim: 'slide_up',
                        navbarTrigger: 'hover',
                        navbarSpeed: 'normal',
                        navbarCompactOnScroll: true
                    },
                    sections: [
                        {
                            id: 'sec_hero_cm', type: 'hero_banner', enabled: true,
                            settings: { heroLayout: 'compact', badgeText: 'BIENVENIDO A ' + name.toUpperCase(), title: 'Todo lo que buscas en un solo lugar con precios increíbles', subtitle: 'Compra fácil desde casa con envíos seguros a todo el país.', buttonText: 'Ver Todo el Catálogo', buttonUrl: '/catalog', secondaryButtonText: 'Ofertas del Día', secondaryButtonUrl: '/catalog?offers=1', imageUrl: '', overlayOpacity: 50, bgColor: '#0284c7', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_cats_cm', type: 'featured_categories', enabled: true,
                            settings: { title: 'Departamentos y Categorías', subtitle: 'Navega por nuestras secciones principales', cardLayout: 'visual', columns: '4' }
                        },
                        {
                            id: 'sec_multi_cm', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Recomendado', card1Title: 'Novedades de la Semana', card1Subtitle: 'Conoce los productos recién llegados', card1ButtonText: 'Ver novedades', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#0f172a', card2Badge: 'Ahorro', card2Title: 'Precios Especiales', card2Subtitle: 'Descuentos en referencias seleccionadas', card2ButtonText: 'Ver ofertas', card2ButtonUrl: '/catalog?offers=1', card2ImageUrl: '', card2BgColor: '#0284c7' }
                        },
                        {
                            id: 'sec_grid_cm', type: 'product_grid', enabled: true,
                            settings: { title: 'Catálogo Principal', subtitle: 'Busca y filtra entre nuestras referencias disponibles', source: 'NEWEST', categoryId: '', limit: 12, showFilters: true, showViewAll: true }
                        },
                        {
                            id: 'sec_steps_cm', type: 'how_to_buy', enabled: true,
                            settings: { title: 'Compra Fácil y Rápido', subtitle: 'Recibe tu pedido sin salir de casa', step1Title: 'Elige tus productos', step1Text: 'Usa el buscador o los filtros para agregar lo que necesitas a tu bolsa.', step2Title: 'Datos de entrega', step2Text: 'Indícanos tu ciudad y dirección exacta.', step3Title: 'Pago seguro o WhatsApp', step3Text: 'Paga con Wompi o coordina directamente con un asesor.', showPaymentBadges: true }
                        },
                        {
                            id: 'sec_trust_cm', type: 'trust_badges', enabled: true,
                            settings: { badgeStyle: 'cards', item1Icon: 'shield', item1Title: 'Compra Garantizada', item1Text: 'Respaldo total en cada pedido.', item2Icon: 'truck', item2Title: 'Cobertura Nacional', item2Text: 'Llegamos a todos los municipios del país.', item3Icon: 'chat', item3Title: 'Soporte por WhatsApp', item3Text: 'Atención humana y rápida.' }
                        }
                    ],
                    pages: {
                        catalog: [{
                            id: 'sec_catalog_results', type: 'catalog_results', enabled: true, locked: true,
                            settings: { showHeader: true, headerBadge: 'DEPARTAMENTOS', headerTitle: 'Catálogo General', headerSubtitle: 'Filtra por categoría, precio, marca o disponibilidad.', showCategoryPills: true, showSearchAndSort: true, filterLayout: 'sidebar', showFilterPrice: true, showFilterAvailability: true, showFilterCategory: true, showFilterVariants: true, showFilterAttributes: true, columnsDesktop: '4', showDiscountPercent: true }
                        }],
                        product: [{
                            id: 'sec_product_main', type: 'product_main', enabled: true, locked: true,
                            settings: { galleryLayout: 'bottom', showBreadcrumbs: true, showSku: true, showStockCounter: true, showSpecs: true, showPolicies: true, showRelatedProducts: true, relatedTitle: 'Productos Relacionados', relatedSubtitle: 'Clientes también vieron estas referencias' }
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
        const filtered = this.activePresetCategory === 'all'
            ? allPresets
            : allPresets.filter(p => p.category === this.activePresetCategory);

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

        const CONTENT_KEYS = [
            'imageUrl', 'card1ImageUrl', 'card2ImageUrl',
            'title', 'subtitle', 'badgeText', 'buttonText', 'buttonUrl',
            'secondaryButtonText', 'secondaryButtonUrl',
            'text', 'text2', 'text3', 'linkUrl',
            'productId', 'customTitle', 'customSubtitle',
            'card1Badge', 'card1Title', 'card1Subtitle', 'card1ButtonText', 'card1ButtonUrl',
            'card2Badge', 'card2Title', 'card2Subtitle', 'card2ButtonText', 'card2ButtonUrl',
            'content', 'q1', 'a1', 'q2', 'a2', 'q3', 'a3', 'q4', 'a4', 'q5', 'a5',
            'endDate'
        ];

        newHomeSections.forEach(newSec => {
            const match = oldHomeSections.find(oldSec =>
                oldSec && oldSec.type === newSec.type && !usedOldIds.has(oldSec.id)
            );
            if (!match || !match.settings || !newSec.settings) return;
            usedOldIds.add(match.id);

            CONTENT_KEYS.forEach(k => {
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

        const oldHomeSections = JSON.parse(JSON.stringify(this.theme.pages.home || this.theme.sections || []));
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

        // Los filtros son una configuración global independiente de la plantilla: se conservan
        const previousGlobal = this.theme.globalStyles || {};
        const preservedFilterStyles = {};
        Object.keys(previousGlobal).forEach(k => {
            if (k.startsWith('filter')) preservedFilterStyles[k] = previousGlobal[k];
        });

        this.theme = nextTheme;
        this.theme.customPages = currentCustomPages;
        this.theme.globalStyles = Object.assign({}, this.theme.globalStyles, preservedFilterStyles);
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