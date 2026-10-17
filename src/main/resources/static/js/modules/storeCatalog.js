/**
 * Motor de Filtros Dinámicos Inteligentes de Storevo
 * Funciona tanto en la página de Catálogo (catalog_results) como en Vitrinas (product_grid con showFilters=true).
 */
(function() {
    // Máximo de opciones visibles por grupo de filtros antes de mostrar "Ver más"
    const FACET_COLLAPSE_LIMIT = 8;
    // true: "Jeans" y "jeans" (o con tildes distintas) cuentan como la misma categoría en el filtro.
    // false: se muestran por separado, como antes.
    const MERGE_CATEGORIES_BY_NAME = true;

    const COLOR_SWATCH_MAP = {
        'negro': '#111827', 'black': '#111827',
        'blanco': '#ffffff', 'white': '#ffffff',
        'gris': '#9ca3af', 'plomo': '#6b7280', 'grey': '#9ca3af', 'gray': '#9ca3af',
        'plata': 'linear-gradient(135deg,#e5e7eb,#9ca3af)', 'plateado': 'linear-gradient(135deg,#e5e7eb,#9ca3af)',
        'dorado': 'linear-gradient(135deg,#fde68a,#d97706)', 'oro': 'linear-gradient(135deg,#fde68a,#d97706)',
        'rojo': '#ef4444', 'red': '#ef4444',
        'vino': '#7f1d1d', 'vinotinto': '#7f1d1d', 'burdeos': '#7f1d1d', 'bordo': '#7f1d1d',
        'azul': '#2563eb', 'blue': '#2563eb',
        'azul marino': '#1e3a8a', 'marino': '#1e3a8a', 'navy': '#1e3a8a', 'azul oscuro': '#1e3a8a',
        'celeste': '#38bdf8', 'azul claro': '#38bdf8', 'turquesa': '#06b6d4', 'aguamarina': '#2dd4bf',
        'verde': '#16a34a', 'green': '#16a34a',
        'verde oliva': '#4d7c0f', 'oliva': '#4d7c0f', 'militar': '#3f6212', 'verde oscuro': '#14532d',
        'menta': '#6ee7b7', 'verde menta': '#6ee7b7',
        'amarillo': '#eab308', 'mostaza': '#ca8a04', 'yellow': '#eab308',
        'naranja': '#f97316', 'coral': '#fb7185', 'terracota': '#c2410c',
        'rosa': '#f472b6', 'rosado': '#f472b6', 'palo de rosa': '#f9a8d4', 'pink': '#f472b6',
        'fucsia': '#db2777', 'magenta': '#db2777',
        'morado': '#9333ea', 'lila': '#c084fc', 'violeta': '#7c3aed', 'purpura': '#9333ea',
        'cafe': '#78350f', 'marron': '#78350f', 'chocolate': '#451a03', 'tabaco': '#78350f',
        'camel': '#b45309', 'miel': '#d97706', 'caramelo': '#b45309',
        'beige': '#e7dfd3', 'arena': '#e7dfd3', 'crema': '#fef3c7', 'crudo': '#f5f5f4', 'nude': '#f5d0c5', 'marfil': '#fafaf9', 'hueso': '#f5f5f4',
        'multicolor': 'conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)',
        'estampado': 'conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)'
    };

    function normalizeKey(str) {
        return String(str || '').trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function categoryKeyOf(name) {
        return MERGE_CATEGORIES_BY_NAME ? normalizeKey(name) : String(name || '');
    }

    function getSwatchStyle(valueName) {
        const clean = normalizeKey(valueName);
        if (COLOR_SWATCH_MAP[clean]) return COLOR_SWATCH_MAP[clean];
        for (const [k, cssVal] of Object.entries(COLOR_SWATCH_MAP)) {
            if (clean.includes(k)) return cssVal;
        }
        return null;
    }

    function isColorOptionName(optName) {
        const n = normalizeKey(optName);
        return n === 'color' || n === 'colores' || n === 'tono' || n === 'tonos';
    }

    function formatCOP(num) {
        const val = Math.round(Number(num) || 0);
        return '$ ' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function parseBridgeData() {
        const scriptEl = document.getElementById('storevo-filter-data-json');
        if (!scriptEl) return { products: {}, sections: {} };
        try {
            return JSON.parse(scriptEl.textContent || '{}');
        } catch (e) {
            return { products: {}, sections: {} };
        }
    }

    function initFilterableSection(sectionEl, bridgeData, isPrimaryCatalog) {
        const secId = sectionEl.getAttribute('data-section-id') || '';
        const secType = sectionEl.getAttribute('data-section-type') || '';
        const secSettings = (bridgeData.sections && bridgeData.sections[secId]) || {};

        if (secType === 'product_grid' && String(secSettings.showFilters) !== 'true') {
            // Si el servidor pintó la barra pero esta vitrina no tiene filtros activos, se retira
            const staleToolbar = sectionEl.querySelector('.sv-grid-toolbar');
            if (staleToolbar) staleToolbar.remove();
            return;
        }

        const grid = sectionEl.querySelector('#catalog-products-grid') || sectionEl.querySelector('.grid');
        if (!grid) return;

        const cards = Array.from(grid.querySelectorAll('.product-card'));
        if (cards.length === 0) return;

        const filterLayout = secType === 'catalog_results'
            ? (secSettings.filterLayout || 'sidebar')
            : (secSettings.filterLayout || 'topbar');

        const config = {
            filterLayout: filterLayout,
            showPrice: secSettings.showFilterPrice !== false && String(secSettings.showFilterPrice) !== 'false',
            showAvailability: secSettings.showFilterAvailability !== false && String(secSettings.showFilterAvailability) !== 'false',
            showCategory: secSettings.showFilterCategory !== false && String(secSettings.showFilterCategory) !== 'false',
            showVariants: secSettings.showFilterVariants !== false && String(secSettings.showFilterVariants) !== 'false',
            showAttributes: secSettings.showFilterAttributes !== false && String(secSettings.showFilterAttributes) !== 'false'
        };

        // Enriquecer cada tarjeta con los metadatos del puente
        const items = cards.map((card, idx) => {
            const pid = card.getAttribute('data-product-id') || '';
            const meta = (bridgeData.products && bridgeData.products[pid]) || {};
            const price = meta.price !== undefined ? Number(meta.price) : (parseFloat(card.getAttribute('data-price')) || 0);
            const inStock = meta.inStock !== undefined ? Boolean(meta.inStock) : (card.getAttribute('data-in-stock') !== 'false');
            const hasDiscount = meta.hasDiscount !== undefined ? Boolean(meta.hasDiscount) : (card.getAttribute('data-has-discount') === 'true');
            const madeToOrder = meta.madeToOrder !== undefined ? Boolean(meta.madeToOrder) : (card.getAttribute('data-made-to-order') === 'true');
            const categoryName = meta.categoryName || card.getAttribute('data-category') || '';
            const options = meta.options || {};
            const attributes = meta.attributes || {};

            const searchTokens = [
                card.getAttribute('data-name') || '',
                categoryName,
                Object.values(options).flat().join(' '),
                Object.values(attributes).flat().join(' ')
            ].join(' ').toLowerCase();

            return {
                card,
                pid,
                index: parseInt(card.getAttribute('data-index') || idx, 10),
                name: card.getAttribute('data-name') || '',
                searchTokens,
                price,
                inStock,
                hasDiscount,
                madeToOrder,
                categoryName,
                categoryKey: categoryKeyOf(categoryName),
                options,
                attributes
            };
        });

        // Si es un product_grid con filtros activados, inyectar barra de búsqueda y ordenamiento
        if (secType === 'product_grid' && !sectionEl.querySelector('.sv-grid-toolbar')) {
            const toolbar = document.createElement('div');
            toolbar.className = 'sv-grid-toolbar bg-white text-slate-900 p-4 sm:px-5 sm:py-4 store-radius shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6';
            toolbar.innerHTML = `
                <div class="relative flex-1 max-w-md">
                    <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" class="sv-search-input w-full pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all" placeholder="Buscar por nombre, marca, talla o color...">
                    <button type="button" class="sv-search-clear hidden absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span class="sv-visible-count text-slate-900 font-black">${items.length}</span> productos
                    </span>
                    <select class="sv-sort-select px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-brand focus:outline-none cursor-pointer">
                        <option value="default">Más recientes</option>
                        <option value="price_asc">Precio: menor a mayor</option>
                        <option value="price_desc">Precio: mayor a menor</option>
                        <option value="name_asc">Nombre: A - Z</option>
                    </select>
                </div>
            `;
            grid.parentNode.insertBefore(toolbar, grid);
        }

        // Calcular Facets dinámicos aplicando la regla de >= 2 valores distintos
        const facets = computeFacets(items, config);
        const categoryLabelByKey = {};
        facets.categories.forEach(([label, , key]) => { categoryLabelByKey[key] = label; });

        // Construir estructura DOM de filtros alrededor de la grilla
        const searchInput = sectionEl.querySelector('#catalog-search-input, .sv-search-input');
        const clearSearchBtn = sectionEl.querySelector('#catalog-search-clear, .sv-search-clear');
        const sortSelect = sectionEl.querySelector('#catalog-sort-select, .sv-sort-select');
        const visibleCountEl = sectionEl.querySelector('#catalog-visible-count, .sv-visible-count');
        let noMatchesEl = sectionEl.querySelector('#catalog-no-matches');

        if (!noMatchesEl) {
            noMatchesEl = document.createElement('div');
            noMatchesEl.className = 'hidden text-center py-14 bg-white text-slate-900 store-radius border border-slate-200/80 px-4 shadow-sm mb-6';
            noMatchesEl.innerHTML = `
                <h3 class="text-base font-bold text-slate-800">No encontramos productos con estos filtros</h3>
                <p class="text-xs text-slate-500 mt-1 mb-4">Prueba quitando alguno de los filtros seleccionados.</p>
                <button type="button" class="sv-reset-all-btn bg-brand text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md hover-bg-brand transition">Limpiar todos los filtros</button>
            `;
            grid.parentNode.insertBefore(noMatchesEl, grid);
        }

        const chipsBar = document.createElement('div');
        chipsBar.className = 'sv-active-chips-bar hidden';
        grid.parentNode.insertBefore(chipsBar, noMatchesEl);

        const topbarPanel = document.createElement('div');
        topbarPanel.className = 'sv-catalog-topbar-panel';
        grid.parentNode.insertBefore(topbarPanel, chipsBar);

        const workspace = document.createElement('div');
        workspace.className = 'sv-catalog-workspace' + (facets.hasAnyFacet && config.filterLayout !== 'none' ? ' has-facets' : '');
        workspace.setAttribute('data-filter-layout', config.filterLayout);

        const sidebar = document.createElement('aside');
        sidebar.className = 'sv-catalog-sidebar';

        const mainCol = document.createElement('div');
        mainCol.className = 'sv-catalog-main';

        grid.parentNode.insertBefore(workspace, noMatchesEl);
        workspace.appendChild(sidebar);
        workspace.appendChild(mainCol);
        mainCol.appendChild(noMatchesEl);
        mainCol.appendChild(grid);

        // Botón para abrir filtros (visible en móvil siempre que haya facets, y en PC cuando filterLayout == 'topbar')
        let filterToggleBtn = null;
        let filterBadgeEl = null;
        if (facets.hasAnyFacet && config.filterLayout !== 'none' && sortSelect && sortSelect.parentNode) {
            // Siempre en el grupo derecho de la barra (junto al contador), igual en Catálogo y en Vitrinas
            const countHolder = visibleCountEl && visibleCountEl.parentElement;
            const btnWrap = (countHolder && countHolder.parentElement) || sortSelect.parentNode.parentNode;
            filterToggleBtn = document.createElement('button');
            filterToggleBtn.type = 'button';
            filterToggleBtn.className = (config.filterLayout === 'sidebar' ? 'sv-mobile-filter-btn ' : '') +
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-brand text-slate-800 text-xs font-bold transition';
            filterToggleBtn.innerHTML = `
                <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                <span>Filtros</span>
                <span class="sv-filter-badge hidden px-1.5 py-0.5 text-[10px] font-black rounded-full bg-brand text-white">0</span>
            `;
            filterBadgeEl = filterToggleBtn.querySelector('.sv-filter-badge');
            btnWrap.insertBefore(filterToggleBtn, btnWrap.firstChild);
        }

        // Drawer inferior para móvil
        const drawerBackdrop = document.createElement('div');
        drawerBackdrop.className = 'sv-filter-drawer-backdrop';
        drawerBackdrop.innerHTML = `
            <div class="sv-filter-drawer">
                <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-black text-slate-900">Filtrar Productos</h3>
                        <p class="text-xs text-slate-500">Encuentra exactamente lo que buscas</p>
                    </div>
                    <button type="button" class="sv-drawer-close p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="sv-drawer-body p-5 overflow-y-auto space-y-4 flex-1"></div>
                <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
                    <button type="button" class="sv-drawer-clear px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold">Limpiar</button>
                    <button type="button" class="sv-drawer-apply flex-1 py-3 px-5 rounded-xl bg-brand text-white text-xs font-bold shadow-md">Ver resultados</button>
                </div>
            </div>
        `;
        document.body.appendChild(drawerBackdrop);

        function setDrawerOpen(open) {
            drawerBackdrop.classList.toggle('is-open', open);
            document.body.classList.toggle('overflow-hidden', open);
        }

        // Estado reactivo de filtros
        const state = {
            q: searchInput ? (searchInput.value || '').trim() : '',
            sort: 'default',
            onlyInStock: false,
            onlyOffers: false,
            minPrice: null,
            maxPrice: null,
            categories: new Set(),
            options: {},
            attributes: {}
        };

        if (isPrimaryCatalog) {
            restoreStateFromUrl(state, searchInput, sortSelect);
        }

        function toggleSetValue(setObj, val) {
            if (setObj.has(val)) setObj.delete(val);
            else setObj.add(val);
        }

        function toggleMapSetValue(mapObj, groupName, val) {
            if (!mapObj[groupName]) mapObj[groupName] = new Set();
            if (mapObj[groupName].has(val)) {
                mapObj[groupName].delete(val);
                if (mapObj[groupName].size === 0) delete mapObj[groupName];
            } else {
                mapObj[groupName].add(val);
            }
        }

        function resetAllFilters() {
            state.q = '';
            state.sort = 'default';
            state.onlyInStock = false;
            state.onlyOffers = false;
            state.minPrice = null;
            state.maxPrice = null;
            state.categories.clear();
            state.options = {};
            state.attributes = {};
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'default';
            applyFilters();
        }

        function createPill(facet, groupName, value, innerHtml, onClick) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sv-facet-pill';
            btn.dataset.facet = facet;
            if (groupName !== null) btn.dataset.group = groupName;
            if (value !== null) btn.dataset.value = value;
            btn.setAttribute('aria-pressed', 'false');
            btn.innerHTML = innerHtml;
            btn.addEventListener('click', onClick);
            return btn;
        }

        function createGroup(title, rightHtml) {
            const group = document.createElement('div');
            group.className = 'sv-facet-group';
            group.innerHTML = `<div class="sv-facet-title"><span>${escapeHtml(title)}</span>${rightHtml || ''}</div><div class="sv-facet-options-pills"></div>`;
            return group;
        }

        // Si un grupo tiene muchas opciones, muestra las primeras y un botón "Ver más"
        function enableCollapse(group) {
            const pillsWrap = group.querySelector('.sv-facet-options-pills');
            const pills = Array.from(pillsWrap.children);
            if (pills.length <= FACET_COLLAPSE_LIMIT) return;

            pills.forEach((pill, i) => { if (i >= FACET_COLLAPSE_LIMIT) pill.classList.add('sv-pill-extra'); });
            group.setAttribute('data-collapsed', 'true');

            const hiddenCount = pills.length - FACET_COLLAPSE_LIMIT;
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'sv-facet-more';
            toggle.textContent = `Ver más (${hiddenCount})`;
            toggle.setAttribute('aria-expanded', 'false');
            toggle.addEventListener('click', () => {
                const wasCollapsed = group.getAttribute('data-collapsed') === 'true';
                group.setAttribute('data-collapsed', wasCollapsed ? 'false' : 'true');
                toggle.textContent = wasCollapsed ? 'Ver menos' : `Ver más (${hiddenCount})`;
                toggle.setAttribute('aria-expanded', wasCollapsed ? 'true' : 'false');
            });
            group.appendChild(toggle);
        }

        // Se construye UNA sola vez. Después solo se actualiza el estado de lo que ya existe
        // (ver syncFacetUI), para no perder el foco ni las listas expandidas.
        function renderFacetsInto(container, isTopbarGrid) {
            container.innerHTML = '';
            const wrapper = document.createElement('div');
            if (isTopbarGrid) wrapper.className = 'sv-topbar-facets-grid';

            // 1. Disponibilidad y Ofertas
            if (facets.showAvailabilityBlock) {
                const group = createGroup('Disponibilidad');
                const pillsWrap = group.querySelector('.sv-facet-options-pills');

                if (facets.inStockCount > 0 && facets.inStockCount < items.length) {
                    pillsWrap.appendChild(createPill('stock', null, null,
                        `<span>Disponible en stock</span><span class="sv-facet-count">(${facets.inStockCount})</span>`,
                        () => { state.onlyInStock = !state.onlyInStock; applyFilters(); }));
                }
                if (facets.offersCount > 0) {
                    pillsWrap.appendChild(createPill('offers', null, null,
                        `<span>🔥 En Oferta</span><span class="sv-facet-count">(${facets.offersCount})</span>`,
                        () => { state.onlyOffers = !state.onlyOffers; applyFilters(); }));
                }
                wrapper.appendChild(group);
            }

            // 2. Rango de Precio (solo si hay >= 2 precios distintos)
            if (facets.showPriceBlock) {
                const group = document.createElement('div');
                group.className = 'sv-facet-group';
                group.innerHTML = `
                    <div class="sv-facet-title">
                        <span>Precio</span>
                        <span class="text-[10px] font-semibold text-slate-400">${formatCOP(facets.minPrice)} - ${formatCOP(facets.maxPrice)}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="number" class="sv-price-min w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800" placeholder="Mín (${facets.minPrice})">
                        <input type="number" class="sv-price-max w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800" placeholder="Máx (${facets.maxPrice})">
                    </div>
                `;
                const minIn = group.querySelector('.sv-price-min');
                const maxIn = group.querySelector('.sv-price-max');
                const onPriceChange = () => {
                    state.minPrice = minIn.value.trim() !== '' ? Number(minIn.value) : null;
                    state.maxPrice = maxIn.value.trim() !== '' ? Number(maxIn.value) : null;
                    applyFilters();
                };
                minIn.addEventListener('change', onPriceChange);
                maxIn.addEventListener('change', onPriceChange);
                wrapper.appendChild(group);
            }

            // 3. Categorías (si hay >= 2 categorías distintas en la vista)
            if (facets.categories.length >= 2) {
                const group = createGroup('Categoría');
                const pillsWrap = group.querySelector('.sv-facet-options-pills');
                facets.categories.forEach(([catLabel, count, catKey]) => {
                    pillsWrap.appendChild(createPill('cat', null, catKey,
                        `<span>${escapeHtml(catLabel)}</span><span class="sv-facet-count">(${count})</span>`,
                        () => { toggleSetValue(state.categories, catKey); applyFilters(); }));
                });
                enableCollapse(group);
                wrapper.appendChild(group);
            }

            // 4. Opciones de Variantes (Talla, Color con Swatches, etc. con >= 2 valores)
            Object.entries(facets.options).forEach(([optName, entries]) => {
                const isColor = isColorOptionName(optName);
                const group = createGroup(optName);
                const pillsWrap = group.querySelector('.sv-facet-options-pills');

                entries.forEach(([valName, count]) => {
                    const swatchCss = isColor ? getSwatchStyle(valName) : null;
                    const swatchHtml = swatchCss
                        ? `<span class="sv-color-swatch" style="background: ${swatchCss};"></span>`
                        : '';
                    pillsWrap.appendChild(createPill('opt', optName, valName,
                        `${swatchHtml}<span>${escapeHtml(valName)}</span><span class="sv-facet-count">(${count})</span>`,
                        () => { toggleMapSetValue(state.options, optName, valName); applyFilters(); }));
                });
                enableCollapse(group);
                wrapper.appendChild(group);
            });

            // 5. Atributos de Ficha Técnica (Marca, Material, Género, etc. con >= 2 valores)
            Object.entries(facets.attributes).forEach(([attrName, entries]) => {
                const group = createGroup(attrName);
                const pillsWrap = group.querySelector('.sv-facet-options-pills');

                entries.forEach(([valName, count]) => {
                    pillsWrap.appendChild(createPill('attr', attrName, valName,
                        `<span>${escapeHtml(valName)}</span><span class="sv-facet-count">(${count})</span>`,
                        () => { toggleMapSetValue(state.attributes, attrName, valName); applyFilters(); }));
                });
                enableCollapse(group);
                wrapper.appendChild(group);
            });

            container.appendChild(wrapper);
        }

        function pillIsActive(btn) {
            const facet = btn.dataset.facet;
            const value = btn.dataset.value;
            const group = btn.dataset.group;
            if (facet === 'stock') return state.onlyInStock;
            if (facet === 'offers') return state.onlyOffers;
            if (facet === 'cat') return state.categories.has(value);
            if (facet === 'opt') return Boolean(state.options[group] && state.options[group].has(value));
            if (facet === 'attr') return Boolean(state.attributes[group] && state.attributes[group].has(value));
            return false;
        }

        // Actualiza en sitio las tres copias del filtro (barra lateral, panel superior y drawer móvil)
        function syncFacetUI() {
            const containers = [sidebar, topbarPanel, drawerBackdrop.querySelector('.sv-drawer-body')];
            containers.forEach(container => {
                if (!container) return;
                container.querySelectorAll('.sv-facet-pill').forEach(btn => {
                    const active = pillIsActive(btn);
                    btn.classList.toggle('is-active', active);
                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                const minIn = container.querySelector('.sv-price-min');
                const maxIn = container.querySelector('.sv-price-max');
                if (minIn && minIn !== document.activeElement) minIn.value = state.minPrice !== null ? state.minPrice : '';
                if (maxIn && maxIn !== document.activeElement) maxIn.value = state.maxPrice !== null ? state.maxPrice : '';
            });
        }

        function renderActiveChips() {
            chipsBar.innerHTML = '';
            const chips = [];

            if (state.q) {
                chips.push({ label: `Búsqueda: "${state.q}"`, remove: () => { state.q = ''; if (searchInput) searchInput.value = ''; } });
            }
            if (state.onlyInStock) {
                chips.push({ label: 'En stock', remove: () => { state.onlyInStock = false; } });
            }
            if (state.onlyOffers) {
                chips.push({ label: '🔥 En oferta', remove: () => { state.onlyOffers = false; } });
            }
            if (state.minPrice !== null || state.maxPrice !== null) {
                const minTxt = state.minPrice !== null ? formatCOP(state.minPrice) : '$ 0';
                const maxTxt = state.maxPrice !== null ? formatCOP(state.maxPrice) : 'Máx';
                chips.push({ label: `Precio: ${minTxt} - ${maxTxt}`, remove: () => { state.minPrice = null; state.maxPrice = null; } });
            }
            state.categories.forEach(cat => {
                chips.push({ label: `Categoría: ${categoryLabelByKey[cat] || cat}`, remove: () => state.categories.delete(cat) });
            });
            Object.entries(state.options).forEach(([optName, valSet]) => {
                valSet.forEach(val => {
                    chips.push({ label: `${optName}: ${val}`, remove: () => toggleMapSetValue(state.options, optName, val) });
                });
            });
            Object.entries(state.attributes).forEach(([attrName, valSet]) => {
                valSet.forEach(val => {
                    chips.push({ label: `${attrName}: ${val}`, remove: () => toggleMapSetValue(state.attributes, attrName, val) });
                });
            });

            if (filterBadgeEl) {
                filterBadgeEl.textContent = String(chips.length);
                filterBadgeEl.classList.toggle('hidden', chips.length === 0);
            }

            if (chips.length === 0) {
                chipsBar.classList.add('hidden');
                return;
            }

            chipsBar.classList.remove('hidden');
            chips.forEach(c => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sv-active-chip';
                btn.innerHTML = `<span>${escapeHtml(c.label)}</span><span>✕</span>`;
                btn.onclick = () => { c.remove(); applyFilters(); };
                chipsBar.appendChild(btn);
            });

            const clearAll = document.createElement('button');
            clearAll.type = 'button';
            clearAll.className = 'text-xs font-bold text-brand hover:underline ml-2';
            clearAll.textContent = 'Limpiar todo';
            clearAll.onclick = resetAllFilters;
            chipsBar.appendChild(clearAll);
        }

        function applyFilters() {
            const query = (state.q || '').trim().toLowerCase();
            if (clearSearchBtn) {
                clearSearchBtn.classList.toggle('hidden', query.length === 0);
            }

            const matched = [];
            items.forEach(item => {
                let ok = true;
                if (query && !item.searchTokens.includes(query)) ok = false;
                if (ok && state.onlyInStock && !item.inStock) ok = false;
                if (ok && state.onlyOffers && !item.hasDiscount) ok = false;
                if (ok && state.minPrice !== null && item.price < state.minPrice) ok = false;
                if (ok && state.maxPrice !== null && item.price > state.maxPrice) ok = false;
                if (ok && state.categories.size > 0 && !state.categories.has(item.categoryKey)) ok = false;

                if (ok) {
                    for (const [optName, selectedVals] of Object.entries(state.options)) {
                        if (!selectedVals || selectedVals.size === 0) continue;
                        const prodVals = item.options[optName] || [];
                        const hasMatch = prodVals.some(v => selectedVals.has(v));
                        if (!hasMatch) { ok = false; break; }
                    }
                }
                if (ok) {
                    for (const [attrName, selectedVals] of Object.entries(state.attributes)) {
                        if (!selectedVals || selectedVals.size === 0) continue;
                        const prodVals = item.attributes[attrName] || [];
                        const hasMatch = prodVals.some(v => selectedVals.has(v));
                        if (!hasMatch) { ok = false; break; }
                    }
                }

                item.card.classList.toggle('hidden', !ok);
                if (ok) matched.push(item);
            });

            // Ordenar resultados visibles
            matched.sort((a, b) => {
                if (state.sort === 'price_asc') return a.price - b.price;
                if (state.sort === 'price_desc') return b.price - a.price;
                if (state.sort === 'name_asc') return a.name.localeCompare(b.name);
                return a.index - b.index;
            });

            matched.forEach(m => grid.appendChild(m.card));

            if (visibleCountEl) visibleCountEl.textContent = String(matched.length);
            const applyDrawerBtn = drawerBackdrop.querySelector('.sv-drawer-apply');
            if (applyDrawerBtn) applyDrawerBtn.textContent = `Ver ${matched.length} productos`;

            if (noMatchesEl) {
                noMatchesEl.classList.toggle('hidden', matched.length > 0);
                grid.classList.toggle('hidden', matched.length === 0);
            }

            if (facets.hasAnyFacet && config.filterLayout !== 'none') {
                syncFacetUI();
            }
            renderActiveChips();

            if (isPrimaryCatalog) {
                syncUrlWithState(state);
            }
        }

        // Eventos de barra de búsqueda, orden y drawer
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                state.q = searchInput.value;
                applyFilters();
            });
        }
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                state.q = '';
                if (searchInput) { searchInput.value = ''; searchInput.focus(); }
                applyFilters();
            });
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                state.sort = sortSelect.value;
                applyFilters();
            });
        }

        const resetSearchBtn = sectionEl.querySelector('#catalog-reset-search, .sv-reset-all-btn');
        if (resetSearchBtn) {
            resetSearchBtn.addEventListener('click', resetAllFilters);
        }

        if (filterToggleBtn) {
            filterToggleBtn.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    setDrawerOpen(true);
                } else if (config.filterLayout === 'topbar') {
                    topbarPanel.classList.toggle('is-open');
                } else {
                    setDrawerOpen(true);
                }
            });
        }

        drawerBackdrop.querySelector('.sv-drawer-close').addEventListener('click', () => setDrawerOpen(false));
        drawerBackdrop.querySelector('.sv-drawer-apply').addEventListener('click', () => setDrawerOpen(false));
        drawerBackdrop.querySelector('.sv-drawer-clear').addEventListener('click', resetAllFilters);
        drawerBackdrop.addEventListener('click', (e) => {
            if (e.target === drawerBackdrop) setDrawerOpen(false);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawerBackdrop.classList.contains('is-open')) setDrawerOpen(false);
        });

        // Los filtros se construyen una sola vez; applyFilters solo actualiza su estado
        if (facets.hasAnyFacet && config.filterLayout !== 'none') {
            renderFacetsInto(sidebar, false);
            renderFacetsInto(topbarPanel, true);
            renderFacetsInto(drawerBackdrop.querySelector('.sv-drawer-body'), false);
        }

        applyFilters();
    }

    function computeFacets(items, config) {
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        const distinctPrices = new Set();
        let inStockCount = 0;
        let offersCount = 0;
        const catCounts = new Map();
        const optCounts = {};
        const attrCounts = {};

        items.forEach(it => {
            if (it.price > 0) {
                minPrice = Math.min(minPrice, it.price);
                maxPrice = Math.max(maxPrice, it.price);
                distinctPrices.add(it.price);
            }
            if (it.inStock) inStockCount++;
            if (it.hasDiscount) offersCount++;

            if (it.categoryName) {
                const entry = catCounts.get(it.categoryKey) || { label: it.categoryName, count: 0 };
                entry.count++;
                catCounts.set(it.categoryKey, entry);
            }
            Object.entries(it.options || {}).forEach(([optName, vals]) => {
                if (!optCounts[optName]) optCounts[optName] = new Map();
                (vals || []).forEach(v => {
                    optCounts[optName].set(v, (optCounts[optName].get(v) || 0) + 1);
                });
            });
            Object.entries(it.attributes || {}).forEach(([attrName, vals]) => {
                if (!attrCounts[attrName]) attrCounts[attrName] = new Map();
                (vals || []).forEach(v => {
                    attrCounts[attrName].set(v, (attrCounts[attrName].get(v) || 0) + 1);
                });
            });
        });

        // Filtrar grupos con la regla de >= 2 valores distintos
        const filteredOptions = {};
        if (config.showVariants) {
            Object.entries(optCounts).forEach(([k, map]) => {
                if (map.size >= 2) {
                    filteredOptions[k] = Array.from(map.entries());
                }
            });
        }

        const filteredAttributes = {};
        if (config.showAttributes) {
            Object.entries(attrCounts).forEach(([k, map]) => {
                if (map.size >= 2) {
                    filteredAttributes[k] = Array.from(map.entries());
                }
            });
        }

        const categories = config.showCategory && catCounts.size >= 2
            ? Array.from(catCounts.entries()).map(([key, e]) => [e.label, e.count, key]) : [];
        const showPriceBlock = config.showPrice && distinctPrices.size >= 2 && isFinite(minPrice) && isFinite(maxPrice);
        const showAvailabilityBlock = config.showAvailability && (offersCount > 0 || (inStockCount > 0 && inStockCount < items.length));

        const hasAnyFacet = showPriceBlock
            || showAvailabilityBlock
            || categories.length >= 2
            || Object.keys(filteredOptions).length > 0
            || Object.keys(filteredAttributes).length > 0;

        return {
            minPrice: isFinite(minPrice) ? minPrice : 0,
            maxPrice: isFinite(maxPrice) ? maxPrice : 0,
            inStockCount,
            offersCount,
            showPriceBlock,
            showAvailabilityBlock,
            categories,
            options: filteredOptions,
            attributes: filteredAttributes,
            hasAnyFacet
        };
    }

    function restoreStateFromUrl(state, searchInput, sortSelect) {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('q')) {
                state.q = params.get('q');
                if (searchInput) searchInput.value = state.q;
            }
            if (params.get('sort')) {
                state.sort = params.get('sort');
                if (sortSelect) sortSelect.value = state.sort;
            }
            if (params.get('stock') === '1') state.onlyInStock = true;
            if (params.get('offers') === '1') state.onlyOffers = true;
            if (params.get('minPrice')) state.minPrice = Number(params.get('minPrice'));
            if (params.get('maxPrice')) state.maxPrice = Number(params.get('maxPrice'));

            params.forEach((val, key) => {
                if (key.startsWith('opt_') && val) {
                    const optName = key.substring(4);
                    state.options[optName] = new Set(val.split(',').filter(Boolean));
                } else if (key.startsWith('attr_') && val) {
                    const attrName = key.substring(5);
                    state.attributes[attrName] = new Set(val.split(',').filter(Boolean));
                }
            });
        } catch (e) {}
    }

    function syncUrlWithState(state) {
        try {
            const url = new URL(window.location.href);
            const keepCategory = url.searchParams.get('category');
            const keepPreview = url.searchParams.get('preview');
            url.search = '';

            if (keepCategory) url.searchParams.set('category', keepCategory);
            if (keepPreview) url.searchParams.set('preview', keepPreview);
            if (state.q && state.q.trim()) url.searchParams.set('q', state.q.trim());
            if (state.sort && state.sort !== 'default') url.searchParams.set('sort', state.sort);
            if (state.onlyInStock) url.searchParams.set('stock', '1');
            if (state.onlyOffers) url.searchParams.set('offers', '1');
            if (state.minPrice !== null) url.searchParams.set('minPrice', String(state.minPrice));
            if (state.maxPrice !== null) url.searchParams.set('maxPrice', String(state.maxPrice));

            Object.entries(state.options).forEach(([k, set]) => {
                if (set && set.size > 0) url.searchParams.set('opt_' + k, Array.from(set).join(','));
            });
            Object.entries(state.attributes).forEach(([k, set]) => {
                if (set && set.size > 0) url.searchParams.set('attr_' + k, Array.from(set).join(','));
            });

            window.history.replaceState({}, '', url.pathname + url.search);
        } catch (e) {}
    }

    // Publica la altura real del navbar fijo para que la barra lateral sticky no quede debajo de él
    function syncNavOffset() {
        const nav = document.getElementById('storeNavbar');
        if (!nav) return;
        const apply = () => {
            const position = window.getComputedStyle(nav).position;
            const isStuck = position === 'sticky' || position === 'fixed';
            const height = isStuck ? Math.round(nav.getBoundingClientRect().height) : 0;
            document.documentElement.style.setProperty('--sv-nav-h', height + 'px');
        };
        apply();
        if ('ResizeObserver' in window) new ResizeObserver(apply).observe(nav);
        window.addEventListener('resize', apply);
    }

    function boot() {
        syncNavOffset();

        const bridgeData = parseBridgeData();
        const catalogSections = document.querySelectorAll('.storevo-theme-section[data-section-type="catalog_results"]');
        const gridSections = document.querySelectorAll('.storevo-theme-section[data-section-type="product_grid"]');

        // sv-filters-ready revela la barra de búsqueda/orden ya armada (ver store-filters-fixes.css)
        catalogSections.forEach((sec, idx) => {
            try { initFilterableSection(sec, bridgeData, idx === 0); }
            finally { sec.classList.add('sv-filters-ready'); }
        });
        gridSections.forEach(sec => {
            try { initFilterableSection(sec, bridgeData, false); }
            finally { sec.classList.add('sv-filters-ready'); }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();