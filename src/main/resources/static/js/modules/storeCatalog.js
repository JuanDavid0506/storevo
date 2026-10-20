/**
 * Storevo - Motor Global Unificado de Filtros y Búsqueda (storeCatalog.js)
 * Gestiona una única configuración global compartida por todas las páginas de la tienda.
 */
(function () {
    'use strict';

    window.Storevo = window.Storevo || {};

    // Este archivo se carga en el layout y en home.html / custom-page.html.
    // Una segunda copia crearía instancias duplicadas sobre las mismas barras.
    if (window.Storevo.Catalog) {
        return;
    }

    function normalizeText(str) {
        return String(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatCOP(val) {
        const num = Math.round(Number(val) || 0);
        return '$ ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    /**
     * Lee la configuración global de filtros desde los atributos data-* de <body>
     */
    function getGlobalFilterConfig() {
        const d = document.body ? document.body.dataset : {};
        const boolAttr = (val, def) => {
            if (val === undefined || val === null || val === '') return def;
            return String(val) === 'true';
        };
        return {
            enabled: boolAttr(d.svFilterEnabled, true),
            layout: d.svFilterLayout || 'drawer', // drawer | topbar | sidebar | inline
            showSearch: boolAttr(d.svFilterSearch, true),
            showSort: boolAttr(d.svFilterSort, true),
            showCount: boolAttr(d.svFilterCount, true),
            showCategory: boolAttr(d.svFilterCategory, true),
            showPrice: boolAttr(d.svFilterPrice, true),
            showOffers: boolAttr(d.svFilterOffers, true),
            showAvailability: boolAttr(d.svFilterAvailability, true),
            showBrand: boolAttr(d.svFilterBrand, true),
            showVariants: boolAttr(d.svFilterVariants, true),
            showSpecs: boolAttr(d.svFilterSpecs, false)
        };
    }

    /**
     * Carga los datos desde #storevo-filter-data-json y el puente de categorías del navbar
     */
    function loadCatalogMetadata() {
        const byId = new Map();
        const jsonEl = document.getElementById('storevo-filter-data-json');
        if (jsonEl && jsonEl.textContent) {
            try {
                const parsed = JSON.parse(jsonEl.textContent);
                const list = Array.isArray(parsed) ? parsed : (parsed.products || []);
                list.forEach(item => {
                    if (item && item.id != null) {
                        byId.set(String(item.id), item);
                    }
                });
            } catch (e) {
                console.warn('[Storevo.Catalog] Error leyendo storevo-filter-data-json:', e);
            }
        }

        const catMap = new Map();
        const navBridge = document.getElementById('storevo-navbar-advanced-bridge');
        if (navBridge) {
            navBridge.querySelectorAll('.sv-nav-cat-node').forEach(node => {
                const id = String(node.getAttribute('data-id') || '');
                if (id) {
                    catMap.set(id, {
                        id,
                        name: node.getAttribute('data-name') || '',
                        parentId: String(node.getAttribute('data-parent-id') || '')
                    });
                }
            });
        }
        return { byId, catMap };
    }

    /**
     * Extrae todos los atributos filtrables de una tarjeta de producto
     */
    function extractCardRecord(cardEl, index, metadata) {
        const linkEl = cardEl.querySelector('a[href*="/p/"]');
        let productId = cardEl.getAttribute('data-product-id') || cardEl.getAttribute('data-id') || '';
        if (!productId && linkEl) {
            const m = linkEl.getAttribute('href').match(/\/p\/(\d+)/);
            if (m) productId = m[1];
        }

        const jsonItem = (productId && metadata.byId.get(String(productId))) || {};

        const name = jsonItem.name
            || cardEl.getAttribute('data-name')
            || (cardEl.querySelector('h3, h2, .product-title')?.textContent || '').trim();

        const brand = (jsonItem.brand || cardEl.getAttribute('data-brand') || '').trim();
        const categoryId = String(jsonItem.categoryId || cardEl.getAttribute('data-category-id') || '');
        const categoryObj = metadata.catMap.get(categoryId);
        const categoryName = (jsonItem.categoryName
            || cardEl.getAttribute('data-category')
            || (categoryObj ? categoryObj.name : '')).trim();

        let price = Number(jsonItem.effectivePrice ?? jsonItem.discountPrice ?? jsonItem.price ?? cardEl.getAttribute('data-price') ?? NaN);
        if (isNaN(price)) {
            const priceText = cardEl.textContent.match(/\$\s*([\d.]+)/);
            price = priceText ? Number(priceText[1].replace(/\./g, '')) : 0;
        }

        const originalPrice = Number(jsonItem.price ?? cardEl.getAttribute('data-original-price') ?? price);
        const discountPrice = Number(jsonItem.discountPrice ?? cardEl.getAttribute('data-discount-price') ?? 0);
        const hasDiscountBadge = Boolean(
            (discountPrice > 0 && discountPrice < originalPrice) ||
            jsonItem.hasOffer === true ||
            cardEl.getAttribute('data-has-discount') === 'true' ||
            cardEl.getAttribute('data-offer') === 'true' ||
            Array.from(cardEl.querySelectorAll('span')).some(s => /oferta|-\d+%/i.test(s.textContent))
        );
        const discountPct = (hasDiscountBadge && originalPrice > price && originalPrice > 0)
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : Number(jsonItem.discountPercent || 0);

        const isMadeToOrder = Boolean(
            jsonItem.isMadeToOrder === true ||
            cardEl.getAttribute('data-made-to-order') === 'true' ||
            /bajo pedido/i.test(cardEl.textContent)
        );
        const rawStock = jsonItem.stock !== undefined ? Number(jsonItem.stock) : Number(cardEl.getAttribute('data-stock') ?? 1);
        const isOutOfStock = !isMadeToOrder && (
            jsonItem.inStock === false ||
            cardEl.getAttribute('data-out-of-stock') === 'true' ||
            (!isNaN(rawStock) && rawStock <= 0) ||
            /agotado/i.test(cardEl.textContent)
        );

        const optionsMap = {};
        const rawOptions = jsonItem.options || jsonItem.variantOptions || {};
        if (rawOptions && typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
            Object.entries(rawOptions).forEach(([optName, vals]) => {
                const cleanName = String(optName || '').trim();
                if (!cleanName) return;
                const arr = Array.isArray(vals) ? vals : String(vals).split(',');
                optionsMap[cleanName] = arr.map(v => String(v).trim()).filter(Boolean);
            });
        } else if (Array.isArray(rawOptions)) {
            rawOptions.forEach(opt => {
                if (opt && opt.name && Array.isArray(opt.values)) {
                    optionsMap[opt.name.trim()] = opt.values
                        .map(v => typeof v === 'string' ? v.trim() : String(v.valueName || '').trim())
                        .filter(Boolean);
                }
            });
        }
        const domVariants = cardEl.getAttribute('data-variants') || cardEl.getAttribute('data-options') || '';
        if (domVariants) {
            domVariants.split(';').forEach(pair => {
                const [k, v] = pair.split(':');
                if (k && v) {
                    const key = k.trim();
                    optionsMap[key] = (optionsMap[key] || []).concat(v.split(',').map(s => s.trim()).filter(Boolean));
                }
            });
        }
        cardEl.querySelectorAll('.sv-card-facet-option').forEach(node => {
            const optName = (node.getAttribute('data-opt-name') || '').trim();
            const optVal = (node.getAttribute('data-opt-val') || '').trim();
            if (optName && optVal) {
                if (!optionsMap[optName]) optionsMap[optName] = [];
                if (!optionsMap[optName].includes(optVal)) optionsMap[optName].push(optVal);
            }
        });

        const specsMap = {};
        const rawSpecs = jsonItem.attributes || jsonItem.specs || {};
        if (rawSpecs && typeof rawSpecs === 'object' && !Array.isArray(rawSpecs)) {
            Object.entries(rawSpecs).forEach(([k, v]) => {
                const cleanK = String(k || '').trim();
                const cleanV = String(v || '').trim();
                if (cleanK && cleanV) specsMap[cleanK] = [cleanV];
            });
        } else if (Array.isArray(rawSpecs)) {
            rawSpecs.forEach(attr => {
                if (attr && attr.key && attr.value) {
                    specsMap[String(attr.key).trim()] = [String(attr.value).trim()];
                }
            });
        }
        cardEl.querySelectorAll('.sv-card-facet-spec').forEach(node => {
            const specKey = (node.getAttribute('data-spec-key') || '').trim();
            const specVal = (node.getAttribute('data-spec-val') || '').trim();
            if (specKey && specVal) {
                if (!specsMap[specKey]) specsMap[specKey] = [];
                if (!specsMap[specKey].includes(specVal)) specsMap[specKey].push(specVal);
            }
        });

        const variantTokens = Object.values(optionsMap).flat().join(' ');
        const specTokens = Object.values(specsMap).flat().join(' ');
        const searchBlob = normalizeText([
            name,
            brand,
            categoryName,
            jsonItem.sku || cardEl.getAttribute('data-sku') || '',
            variantTokens,
            specTokens,
            cardEl.getAttribute('data-search') || ''
        ].join(' '));

        return {
            el: cardEl,
            index,
            id: productId || String(index),
            name,
            nameNorm: normalizeText(name),
            brand,
            categoryId,
            categoryName,
            price: isNaN(price) ? 0 : price,
            hasOffer: hasDiscountBadge,
            discountPct,
            isMadeToOrder,
            isOutOfStock,
            inStockImmediate: !isOutOfStock && !isMadeToOrder,
            optionsMap,
            specsMap,
            searchBlob
        };
    }

    function buildAvailableFacets(records) {
        const categories = new Map();
        const brands = new Map();
        const variantGroups = new Map();
        const specGroups = new Map();

        let minPrice = Infinity;
        let maxPrice = 0;
        let offersCount = 0;
        let immediateCount = 0;
        let madeToOrderCount = 0;
        let outOfStockCount = 0;

        records.forEach(r => {
            if (r.price > 0) {
                if (r.price < minPrice) minPrice = r.price;
                if (r.price > maxPrice) maxPrice = r.price;
            }
            if (r.hasOffer) offersCount++;
            if (r.inStockImmediate) immediateCount++;
            if (r.isMadeToOrder) madeToOrderCount++;
            if (r.isOutOfStock) outOfStockCount++;

            if (r.categoryName) {
                categories.set(r.categoryName, (categories.get(r.categoryName) || 0) + 1);
            }
            if (r.brand) {
                brands.set(r.brand, (brands.get(r.brand) || 0) + 1);
            }

            Object.entries(r.optionsMap).forEach(([groupName, values]) => {
                if (!variantGroups.has(groupName)) variantGroups.set(groupName, new Map());
                const vMap = variantGroups.get(groupName);
                new Set(values).forEach(val => {
                    vMap.set(val, (vMap.get(val) || 0) + 1);
                });
            });

            Object.entries(r.specsMap).forEach(([specKey, values]) => {
                if (!specGroups.has(specKey)) specGroups.set(specKey, new Map());
                const sMap = specGroups.get(specKey);
                new Set(values).forEach(val => {
                    sMap.set(val, (sMap.get(val) || 0) + 1);
                });
            });
        });

        if (minPrice === Infinity) minPrice = 0;

        return {
            categories,
            brands,
            variantGroups,
            specGroups,
            minPrice,
            maxPrice,
            offersCount,
            immediateCount,
            madeToOrderCount,
            outOfStockCount
        };
    }

    function initCatalogInstance(toolbarEl, instanceIdx, metadata) {
        const sectionRoot = toolbarEl.closest('.storevo-theme-section, section, .max-w-7xl') || toolbarEl.parentElement;
        if (!sectionRoot) return null;

        const gridEl = sectionRoot.querySelector('#catalog-products-grid, .sv-catalog-grid, .grid');
        if (!gridEl) return null;

        const cardEls = Array.from(gridEl.querySelectorAll('.catalog-product-card, .product-card'));
        if (cardEls.length === 0) return null;

        const records = cardEls.map((el, idx) => extractCardRecord(el, idx, metadata));
        const facets = buildAvailableFacets(records);

        const searchInput = toolbarEl.querySelector('#catalog-search-input, .sv-search-input');
        const searchClear = toolbarEl.querySelector('#catalog-search-clear, .sv-search-clear');
        const sortSelect = toolbarEl.querySelector('#catalog-sort-select, .sv-sort-select');
        const countEl = toolbarEl.querySelector('#catalog-visible-count, .sv-visible-count');
        const noMatchesEl = sectionRoot.querySelector('#catalog-no-matches') || createFallbackEmptyState(gridEl);

        if (sortSelect && !sortSelect.querySelector('option[value="discount_desc"]')) {
            const opt = document.createElement('option');
            opt.value = 'discount_desc';
            opt.textContent = 'Mayor descuento';
            sortSelect.appendChild(opt);
        }

        const state = {
            q: searchInput ? searchInput.value.trim() : '',
            sort: sortSelect ? sortSelect.value : 'default',
            categories: new Set(),
            brands: new Set(),
            onlyOffers: false,
            availability: 'all',
            hideOutOfStock: false,
            minPrice: null,
            maxPrice: null,
            variants: {},
            specs: {}
        };

        let filterTriggerBtn = toolbarEl.querySelector('.sv-filter-open-btn');
        if (!filterTriggerBtn) {
            filterTriggerBtn = document.createElement('button');
            filterTriggerBtn.type = 'button';
            filterTriggerBtn.className = 'sv-filter-open-btn inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-brand text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer';
            const rightControls = toolbarEl.querySelector('.flex.items-center.justify-between, .flex.items-center');
            if (rightControls) {
                rightControls.insertBefore(filterTriggerBtn, rightControls.firstChild);
            } else {
                toolbarEl.appendChild(filterTriggerBtn);
            }
        }

        let dynamicHost = sectionRoot.querySelector('.sv-global-filters-host');
        if (!dynamicHost) {
            dynamicHost = document.createElement('div');
            dynamicHost.className = 'sv-global-filters-host mb-6';
            toolbarEl.insertAdjacentElement('afterend', dynamicHost);
        }

        let activeChipsBar = sectionRoot.querySelector('.sv-active-filters-bar');
        if (!activeChipsBar) {
            activeChipsBar = document.createElement('div');
            activeChipsBar.className = 'sv-active-filters-bar hidden flex-wrap items-center gap-2 mb-6';
            dynamicHost.insertAdjacentElement('afterend', activeChipsBar);
        }

        let drawerBackdrop = document.getElementById(`sv-filter-drawer-${instanceIdx}`);
        if (!drawerBackdrop) {
            drawerBackdrop = document.createElement('div');
            drawerBackdrop.id = `sv-filter-drawer-${instanceIdx}`;
            drawerBackdrop.className = 'sv-filter-drawer-backdrop fixed inset-0 z-50 hidden bg-slate-950/60 backdrop-blur-xs transition-opacity';
            document.body.appendChild(drawerBackdrop);
        }

        function isSectionFilterAllowed() {
            const secAttr = toolbarEl.getAttribute('data-section-show-filters');
            return secAttr === null || secAttr === 'true';
        }

        function resetAllFilters() {
            state.q = '';
            state.sort = 'default';
            state.categories.clear();
            state.brands.clear();
            state.onlyOffers = false;
            state.availability = 'all';
            state.hideOutOfStock = false;
            state.minPrice = null;
            state.maxPrice = null;
            state.variants = {};
            state.specs = {};
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'default';
            renderFilterUI();
            applyFiltersAndSort();
        }

        function countActiveFilters(cfg) {
            let count = 0;
            if (cfg.showCategory) count += state.categories.size;
            if (cfg.showBrand) count += state.brands.size;
            if (cfg.showOffers && state.onlyOffers) count += 1;
            if (cfg.showAvailability && state.availability !== 'all') count += 1;
            if (cfg.showAvailability && state.hideOutOfStock) count += 1;
            if (cfg.showPrice && (state.minPrice != null || state.maxPrice != null)) count += 1;
            if (cfg.showVariants) {
                Object.values(state.variants).forEach(set => { count += set.size; });
            }
            if (cfg.showSpecs) {
                Object.values(state.specs).forEach(set => { count += set.size; });
            }
            return count;
        }

        function recordMatches(r, cfg) {
            if (cfg.showSearch && state.q) {
                const qNorm = normalizeText(state.q);
                if (!r.searchBlob.includes(qNorm)) return false;
            }
            if (cfg.showCategory && state.categories.size > 0) {
                if (!state.categories.has(r.categoryName)) return false;
            }
            if (cfg.showBrand && state.brands.size > 0) {
                if (!state.brands.has(r.brand)) return false;
            }
            if (cfg.showOffers && state.onlyOffers) {
                if (!r.hasOffer) return false;
            }
            if (cfg.showAvailability) {
                if (state.hideOutOfStock && r.isOutOfStock) return false;
                if (state.availability === 'in_stock' && !r.inStockImmediate) return false;
                if (state.availability === 'made_to_order' && !r.isMadeToOrder) return false;
            }
            if (cfg.showPrice) {
                if (state.minPrice != null && r.price < state.minPrice) return false;
                if (state.maxPrice != null && r.price > state.maxPrice) return false;
            }
            if (cfg.showVariants) {
                for (const [optName, selectedSet] of Object.entries(state.variants)) {
                    if (!selectedSet || selectedSet.size === 0) continue;
                    const prodVals = r.optionsMap[optName] || [];
                    const hasAny = prodVals.some(v => selectedSet.has(v));
                    if (!hasAny) return false;
                }
            }
            if (cfg.showSpecs) {
                for (const [specKey, selectedSet] of Object.entries(state.specs)) {
                    if (!selectedSet || selectedSet.size === 0) continue;
                    const prodVals = r.specsMap[specKey] || [];
                    const hasAny = prodVals.some(v => selectedSet.has(v));
                    if (!hasAny) return false;
                }
            }
            return true;
        }

        function applyFiltersAndSort() {
            const cfg = getGlobalFilterConfig();
            if (!cfg.enabled || !isSectionFilterAllowed()) {
                records.forEach(r => r.el.classList.remove('hidden'));
                if (noMatchesEl) noMatchesEl.classList.add('hidden');
                gridEl.classList.remove('hidden');
                return;
            }

            if (searchClear) {
                searchClear.classList.toggle('hidden', !state.q);
            }

            const matched = [];
            records.forEach(r => {
                const ok = recordMatches(r, cfg);
                r.el.classList.toggle('hidden', !ok);
                if (ok) matched.push(r);
            });

            const effectiveSort = cfg.showSort ? state.sort : 'default';
            matched.sort((a, b) => {
                if (effectiveSort === 'price_asc') return a.price - b.price;
                if (effectiveSort === 'price_desc') return b.price - a.price;
                if (effectiveSort === 'name_asc') return a.nameNorm.localeCompare(b.nameNorm, 'es');
                if (effectiveSort === 'discount_desc') return b.discountPct - a.discountPct;
                return a.index - b.index;
            });
            matched.forEach(r => gridEl.appendChild(r.el));

            if (countEl) {
                countEl.textContent = String(matched.length);
            }

            const drawerCountBtn = drawerBackdrop.querySelector('.sv-drawer-apply-count');
            if (drawerCountBtn) {
                drawerCountBtn.textContent = `Ver productos (${matched.length})`;
            }

            const hasResults = matched.length > 0;
            gridEl.classList.toggle('hidden', !hasResults);
            if (noMatchesEl) {
                noMatchesEl.classList.toggle('hidden', hasResults);
            }

            renderActiveChips(cfg);
            updateTriggerBadge(cfg);
        }

        function updateTriggerBadge(cfg) {
            const activeCount = countActiveFilters(cfg);
            filterTriggerBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                <span>Filtros</span>
                ${activeCount > 0 ? `<span class="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-brand text-white">${activeCount}</span>` : ''}
            `;
        }

        function renderActiveChips(cfg) {
            const chips = [];
            if (cfg.showCategory) {
                state.categories.forEach(cat => {
                    chips.push({ label: `Categoría: ${cat}`, onRemove: () => { state.categories.delete(cat); } });
                });
            }
            if (cfg.showOffers && state.onlyOffers) {
                chips.push({ label: 'En Oferta', onRemove: () => { state.onlyOffers = false; } });
            }
            if (cfg.showAvailability && state.availability !== 'all') {
                const label = state.availability === 'in_stock' ? 'Entrega inmediata' : 'Bajo pedido';
                chips.push({ label, onRemove: () => { state.availability = 'all'; } });
            }
            if (cfg.showAvailability && state.hideOutOfStock) {
                chips.push({ label: 'Ocultar agotados', onRemove: () => { state.hideOutOfStock = false; } });
            }
            if (cfg.showPrice && (state.minPrice != null || state.maxPrice != null)) {
                const minTxt = state.minPrice != null ? formatCOP(state.minPrice) : '$ 0';
                const maxTxt = state.maxPrice != null ? formatCOP(state.maxPrice) : 'Máx';
                chips.push({
                    label: `Precio: ${minTxt} - ${maxTxt}`,
                    onRemove: () => { state.minPrice = null; state.maxPrice = null; }
                });
            }
            if (cfg.showBrand) {
                state.brands.forEach(b => {
                    chips.push({ label: `Marca: ${b}`, onRemove: () => { state.brands.delete(b); } });
                });
            }
            if (cfg.showVariants) {
                Object.entries(state.variants).forEach(([optName, set]) => {
                    set.forEach(val => {
                        chips.push({ label: `${optName}: ${val}`, onRemove: () => { set.delete(val); } });
                    });
                });
            }
            if (cfg.showSpecs) {
                Object.entries(state.specs).forEach(([specKey, set]) => {
                    set.forEach(val => {
                        chips.push({ label: `${specKey}: ${val}`, onRemove: () => { set.delete(val); } });
                    });
                });
            }

            if (chips.length === 0) {
                activeChipsBar.classList.add('hidden');
                activeChipsBar.innerHTML = '';
                return;
            }

            activeChipsBar.classList.remove('hidden');
            activeChipsBar.classList.add('flex');
            activeChipsBar.innerHTML = `
                <span class="text-xs font-bold text-slate-500 mr-1">Filtros activos:</span>
                ${chips.map((c, i) => `
                    <button type="button" data-chip-idx="${i}" class="sv-active-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:border-red-400 hover:text-red-600 shadow-2xs transition">
                        <span>${escapeHtml(c.label)}</span>
                        <span class="text-slate-400 font-black">×</span>
                    </button>
                `).join('')}
                <button type="button" class="sv-clear-all-chips text-xs font-bold text-brand hover:underline ml-2">
                    Limpiar todos
                </button>
            `;

            activeChipsBar.querySelectorAll('.sv-active-chip').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.getAttribute('data-chip-idx'));
                    if (chips[idx]) {
                        chips[idx].onRemove();
                        renderFilterUI();
                        applyFiltersAndSort();
                    }
                });
            });

            const clearAllBtn = activeChipsBar.querySelector('.sv-clear-all-chips');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', resetAllFilters);
            }
        }

        function buildFacetsSectionsHtml(cfg, isCompactHorizontal) {
            const blocks = [];
            const countBadge = (n) => cfg.showCount ? `<span class="text-[11px] text-slate-400 font-semibold ml-auto">(${n})</span>` : '';

            if (cfg.showOffers || cfg.showAvailability) {
                const itemsHtml = [];
                if (cfg.showOffers && facets.offersCount > 0) {
                    itemsHtml.push(`
                        <label class="flex items-center gap-2.5 py-1.5 cursor-pointer select-none text-sm text-slate-700 hover:text-slate-900">
                            <input type="checkbox" data-filter-type="offers" ${state.onlyOffers ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand">
                            <span class="font-semibold flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                                Solo productos en oferta
                            </span>
                            ${countBadge(facets.offersCount)}
                        </label>
                    `);
                }
                if (cfg.showAvailability) {
                    itemsHtml.push(`
                        <label class="flex items-center gap-2.5 py-1.5 cursor-pointer select-none text-sm text-slate-700 hover:text-slate-900">
                            <input type="checkbox" data-filter-type="hide-oos" ${state.hideOutOfStock ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand">
                            <span>Ocultar agotados</span>
                        </label>
                    `);
                    if (facets.immediateCount > 0 && facets.madeToOrderCount > 0) {
                        itemsHtml.push(`
                            <div class="pt-2 mt-1 border-t border-slate-100 flex flex-wrap gap-1.5">
                                <button type="button" data-avail-val="all" class="px-2.5 py-1 rounded-lg text-xs font-bold border transition ${state.availability === 'all' ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-700 border-slate-200'}">Todos</button>
                                <button type="button" data-avail-val="in_stock" class="px-2.5 py-1 rounded-lg text-xs font-bold border transition ${state.availability === 'in_stock' ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-700 border-slate-200'}">Stock inmediato (${facets.immediateCount})</button>
                                <button type="button" data-avail-val="made_to_order" class="px-2.5 py-1 rounded-lg text-xs font-bold border transition ${state.availability === 'made_to_order' ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-700 border-slate-200'}">Bajo pedido (${facets.madeToOrderCount})</button>
                            </div>
                        `);
                    }
                }
                if (itemsHtml.length > 0) {
                    blocks.push({ title: 'Destacados y Disponibilidad', html: itemsHtml.join('') });
                }
            }

            if (cfg.showCategory && facets.categories.size >= 1) {
                const catHtml = Array.from(facets.categories.entries()).map(([catName, cnt]) => `
                    <label class="flex items-center gap-2.5 py-1.5 cursor-pointer select-none text-sm text-slate-700 hover:text-slate-900">
                        <input type="checkbox" data-filter-type="category" value="${escapeHtml(catName)}" ${state.categories.has(catName) ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand">
                        <span class="truncate">${escapeHtml(catName)}</span>
                        ${countBadge(cnt)}
                    </label>
                `).join('');
                blocks.push({ title: 'Categorías', html: `<div class="max-h-48 overflow-y-auto pr-1 space-y-0.5">${catHtml}</div>` });
            }

            if (cfg.showPrice && facets.maxPrice > facets.minPrice) {
                const minVal = state.minPrice != null ? state.minPrice : '';
                const maxVal = state.maxPrice != null ? state.maxPrice : '';
                const mid1 = Math.round((facets.minPrice + (facets.maxPrice - facets.minPrice) * 0.33) / 1000) * 1000;
                const mid2 = Math.round((facets.minPrice + (facets.maxPrice - facets.minPrice) * 0.66) / 1000) * 1000;

                const priceHtml = `
                    <div class="space-y-3">
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mínimo</label>
                                <input type="number" data-filter-type="price-min" placeholder="${facets.minPrice}" value="${minVal}"
                                       class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Máximo</label>
                                <input type="number" data-filter-type="price-max" placeholder="${facets.maxPrice}" value="${maxVal}"
                                       class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                            </div>
                        </div>
                        ${mid1 > facets.minPrice ? `
                        <div class="flex flex-wrap gap-1.5">
                            <button type="button" data-price-range="0:${mid1}" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-brand hover:text-white text-slate-700 transition">Hasta ${formatCOP(mid1)}</button>
                            <button type="button" data-price-range="${mid1}:${mid2}" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-brand hover:text-white text-slate-700 transition">${formatCOP(mid1)} -${formatCOP(mid2)}</button>
                            <button type="button" data-price-range="${mid2}:" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-brand hover:text-white text-slate-700 transition">Más de ${formatCOP(mid2)}</button>
                        </div>` : ''}
                    </div>
                `;
                blocks.push({ title: 'Precio', html: priceHtml });
            }

            if (cfg.showBrand && facets.brands.size > 0) {
                const brandHtml = Array.from(facets.brands.entries()).map(([bName, cnt]) => `
                    <label class="flex items-center gap-2.5 py-1.5 cursor-pointer select-none text-sm text-slate-700 hover:text-slate-900">
                        <input type="checkbox" data-filter-type="brand" value="${escapeHtml(bName)}" ${state.brands.has(bName) ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand">
                        <span class="truncate">${escapeHtml(bName)}</span>
                        ${countBadge(cnt)}
                    </label>
                `).join('');
                blocks.push({ title: 'Marca', html: `<div class="max-h-44 overflow-y-auto pr-1 space-y-0.5">${brandHtml}</div>` });
            }

            if (cfg.showVariants && facets.variantGroups.size > 0) {
                facets.variantGroups.forEach((valMap, groupName) => {
                    if (valMap.size === 0) return;
                    const selectedSet = state.variants[groupName] || new Set();
                    const pillsHtml = Array.from(valMap.entries()).map(([val, cnt]) => {
                        const active = selectedSet.has(val);
                        return `
                            <button type="button" data-filter-type="variant" data-group="${escapeHtml(groupName)}" data-val="${escapeHtml(val)}"
                                    class="px-3 py-1.5 rounded-xl text-xs font-bold border transition ${active ? 'bg-brand text-white border-brand shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-brand'}">
                                <span>${escapeHtml(val)}</span>
                                ${cfg.showCount ? `<span class="opacity-65 text-[10px] ml-0.5">(${cnt})</span>` : ''}
                            </button>
                        `;
                    }).join('');
                    blocks.push({ title: groupName, html: `<div class="flex flex-wrap gap-1.5">${pillsHtml}</div>` });
                });
            }

            if (cfg.showSpecs && facets.specGroups.size > 0) {
                facets.specGroups.forEach((valMap, specKey) => {
                    if (valMap.size === 0) return;
                    const selectedSet = state.specs[specKey] || new Set();
                    const specHtml = Array.from(valMap.entries()).map(([val, cnt]) => `
                        <label class="flex items-center gap-2.5 py-1 cursor-pointer select-none text-sm text-slate-700 hover:text-slate-900">
                            <input type="checkbox" data-filter-type="spec" data-group="${escapeHtml(specKey)}" value="${escapeHtml(val)}"
                                   ${selectedSet.has(val) ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand">
                            <span class="truncate">${escapeHtml(val)}</span>
                            ${countBadge(cnt)}
                        </label>
                    `).join('');
                    blocks.push({ title: specKey, html: `<div class="max-h-40 overflow-y-auto pr-1 space-y-0.5">${specHtml}</div>` });
                });
            }

            if (blocks.length === 0) {
                return `<p class="text-xs text-slate-400 py-2">No hay filtros adicionales para los productos en esta vista.</p>`;
            }

            if (isCompactHorizontal) {
                return `
                    <div class="flex items-center gap-2.5 flex-wrap">
                        ${blocks.map(b => `
                            <details class="sv-topbar-popover relative group">
                                <summary class="list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-brand text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition">
                                    <span>${escapeHtml(b.title)}</span>
                                    <svg class="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div class="sv-topbar-popover__panel absolute left-0 mt-2 w-72 bg-white text-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 z-30">
                                    <p class="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">${escapeHtml(b.title)}</p>${b.html}
                                </div>
                            </details>
                        `).join('')}
                    </div>
                `;
            }

            return blocks.map(b => `
                <div class="py-4 border-b border-slate-100 last:border-b-0">
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">${escapeHtml(b.title)}</h4>
                    ${b.html}
                </div>
            `).join('');
        }

        function bindFacetEvents(containerEl) {
            if (!containerEl) return;

            containerEl.querySelectorAll('input[data-filter-type="offers"]').forEach(chk => {
                chk.addEventListener('change', () => {
                    state.onlyOffers = chk.checked;
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });

            containerEl.querySelectorAll('input[data-filter-type="hide-oos"]').forEach(chk => {
                chk.addEventListener('change', () => {
                    state.hideOutOfStock = chk.checked;
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });

            containerEl.querySelectorAll('button[data-avail-val]').forEach(btn => {
                btn.addEventListener('click', () => {
                    state.availability = btn.getAttribute('data-avail-val') || 'all';
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });

            containerEl.querySelectorAll('input[data-filter-type="category"]').forEach(chk => {
                chk.addEventListener('change', () => {
                    if (chk.checked) state.categories.add(chk.value);
                    else state.categories.delete(chk.value);
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });

            containerEl.querySelectorAll('input[data-filter-type="brand"]').forEach(chk => {
                chk.addEventListener('change', () => {
                    if (chk.checked) state.brands.add(chk.value);
                    else state.brands.delete(chk.value);
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });

            containerEl.querySelectorAll('button[data-filter-type="variant"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const grp = btn.getAttribute('data-group');
                    const val = btn.getAttribute('data-val');
                    if (!state.variants[grp]) state.variants[grp] = new Set();
                    if (state.variants[grp].has(val)) state.variants[grp].delete(val);
                    else state.variants[grp].add(val);
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });

            containerEl.querySelectorAll('input[data-filter-type="spec"]').forEach(chk => {
                chk.addEventListener('change', () => {
                    const grp = chk.getAttribute('data-group');
                    const val = chk.value;
                    if (!state.specs[grp]) state.specs[grp] = new Set();
                    if (chk.checked) state.specs[grp].add(val);
                    else state.specs[grp].delete(val);
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });

            const minInput = containerEl.querySelector('input[data-filter-type="price-min"]');
            const maxInput = containerEl.querySelector('input[data-filter-type="price-max"]');
            const handlePriceInput = () => {
                state.minPrice = (minInput && minInput.value !== '') ? Number(minInput.value) : null;
                state.maxPrice = (maxInput && maxInput.value !== '') ? Number(maxInput.value) : null;
                applyFiltersAndSort();
            };
            if (minInput) minInput.addEventListener('change', handlePriceInput);
            if (maxInput) maxInput.addEventListener('change', handlePriceInput);

            containerEl.querySelectorAll('button[data-price-range]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const [minStr, maxStr] = (btn.getAttribute('data-price-range') || '').split(':');
                    state.minPrice = minStr ? Number(minStr) : null;
                    state.maxPrice = maxStr ? Number(maxStr) : null;
                    renderFilterUI();
                    applyFiltersAndSort();
                });
            });
        }

        let lastRenderedLayout = null;

        function openDrawer() {
            drawerBackdrop.classList.remove('hidden');
            drawerBackdrop.classList.add('is-open');
            document.body.classList.add('overflow-hidden');
        }

        function closeDrawer() {
            drawerBackdrop.classList.remove('is-open');
            drawerBackdrop.classList.add('hidden');
            if (!document.querySelector('.sv-filter-drawer-backdrop.is-open')) {
                document.body.classList.remove('overflow-hidden');
            }
        }

        function renderFilterUI(fromLiveEditorUpdate) {
            const cfg = getGlobalFilterConfig();
            const effectiveEnabled = cfg.enabled && isSectionFilterAllowed();
            const layoutChangedInLiveEditor = Boolean(
                fromLiveEditorUpdate && lastRenderedLayout !== null && lastRenderedLayout !== cfg.layout
            );
            lastRenderedLayout = cfg.layout;

            toolbarEl.classList.toggle('hidden', !effectiveEnabled);
            if (!effectiveEnabled) {
                dynamicHost.classList.add('hidden');
                activeChipsBar.classList.add('hidden');
                closeDrawer();
                resetSidebarWrapper();
                return;
            }

            if (searchInput && searchInput.parentElement) {
                searchInput.parentElement.classList.toggle('hidden', !cfg.showSearch);
            }
            if (sortSelect) {
                const sortWrap = sortSelect.closest('.sv-sort-wrap') || sortSelect;
                sortWrap.classList.toggle('hidden', !cfg.showSort);
            }
            if (countEl && countEl.parentElement) {
                countEl.parentElement.classList.toggle('hidden', !cfg.showCount);
            }

            const headerCategoryPills = sectionRoot.querySelector('.border-b .flex.items-center.justify-center.gap-2.flex-wrap');
            if (headerCategoryPills) {
                headerCategoryPills.classList.toggle('hidden', !cfg.showCategory);
            }

            const hasAnyFacetEnabled = cfg.showCategory || cfg.showPrice || cfg.showOffers || cfg.showAvailability || cfg.showBrand || cfg.showVariants || cfg.showSpecs;
            filterTriggerBtn.classList.toggle('hidden', !hasAnyFacetEnabled || cfg.layout === 'topbar');

            if (!drawerBackdrop.querySelector('.sv-filter-drawer')) {
                drawerBackdrop.innerHTML = `
                    <aside class="sv-filter-drawer ml-auto w-full max-w-sm h-full bg-white text-slate-900 shadow-2xl flex flex-col">
                        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 class="text-base font-black text-slate-900">Filtrar Productos</h3>
                                <p class="text-xs text-slate-500">Refina tu búsqueda en segundos</p>
                            </div>
                            <button type="button" class="sv-drawer-close p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div class="sv-filter-drawer-body p-5 overflow-y-auto flex-1"></div>
                        <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
                            <button type="button" class="sv-drawer-reset px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
                                Limpiar
                            </button>
                            <button type="button" class="sv-drawer-apply sv-drawer-apply-count flex-1 py-2.5 px-4 rounded-xl bg-brand text-white text-xs font-bold shadow-md hover-bg-brand transition">
                                Ver productos
                            </button>
                        </div>
                    </aside>
                `;
                drawerBackdrop.querySelector('.sv-drawer-close')?.addEventListener('click', closeDrawer);
                drawerBackdrop.querySelector('.sv-drawer-apply')?.addEventListener('click', closeDrawer);
                drawerBackdrop.querySelector('.sv-drawer-reset')?.addEventListener('click', resetAllFilters);
                drawerBackdrop.addEventListener('click', (e) => {
                    if (e.target === drawerBackdrop) closeDrawer();
                });
            }

            const drawerBodyEl = drawerBackdrop.querySelector('.sv-filter-drawer-body');
            if (drawerBodyEl) {
                const prevScrollTop = drawerBodyEl.scrollTop;
                drawerBodyEl.innerHTML = buildFacetsSectionsHtml(cfg, false);
                bindFacetEvents(drawerBodyEl);
                drawerBodyEl.scrollTop = prevScrollTop;
            }

            if (!hasAnyFacetEnabled) {
                closeDrawer();
                resetSidebarWrapper();
                dynamicHost.innerHTML = '';
                dynamicHost.classList.add('hidden');
                return;
            }

            if (cfg.layout !== 'drawer') {
                closeDrawer();
            } else if (layoutChangedInLiveEditor && instanceIdx === 0) {
                openDrawer();
            }

            resetSidebarWrapper();
            dynamicHost.innerHTML = '';

            if (cfg.layout === 'topbar') {
                dynamicHost.classList.remove('hidden');
                dynamicHost.innerHTML = buildFacetsSectionsHtml(cfg, true);
                bindFacetEvents(dynamicHost);
            } else if (cfg.layout === 'inline') {
                dynamicHost.classList.remove('hidden');
                if (layoutChangedInLiveEditor || (fromLiveEditorUpdate && dynamicHost.dataset.inlineOpen === undefined)) {
                    dynamicHost.dataset.inlineOpen = 'true';
                }
                const isOpen = dynamicHost.dataset.inlineOpen === 'true';
                dynamicHost.innerHTML = isOpen ? `
                    <div class="block sv-inline-filter-panel bg-white text-slate-900 p-5 store-radius border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${buildFacetsSectionsHtml(cfg, false)}
                    </div>
                ` : '';
                if (!isOpen) dynamicHost.classList.add('hidden');
                bindFacetEvents(dynamicHost);
            } else if (cfg.layout === 'sidebar') {
                dynamicHost.classList.add('hidden');
                mountDesktopSidebar(cfg);
            } else {
                dynamicHost.classList.add('hidden');
            }

            updateTriggerBadge(cfg);
        }

        function mountDesktopSidebar(cfg) {
            let layoutWrap = sectionRoot.querySelector('.sv-sidebar-layout-wrapper');
            if (!layoutWrap) {
                layoutWrap = document.createElement('div');
                layoutWrap.className = 'sv-sidebar-layout-wrapper flex flex-col lg:flex-row gap-8 items-start';
                gridEl.parentNode.insertBefore(layoutWrap, gridEl);
                const sidebarAside = document.createElement('aside');
                sidebarAside.className = 'sv-catalog-sidebar hidden lg:block w-64 flex-shrink-0 bg-white text-slate-900 p-5 store-radius border border-slate-200/80 shadow-xs sticky top-24';
                const gridContainer = document.createElement('div');
                gridContainer.className = 'flex-1 w-full min-w-0';
                layoutWrap.appendChild(sidebarAside);
                layoutWrap.appendChild(gridContainer);
                gridContainer.appendChild(gridEl);
                if (noMatchesEl) gridContainer.appendChild(noMatchesEl);
            }
            const sidebarEl = layoutWrap.querySelector('.sv-catalog-sidebar');
            if (sidebarEl) {
                sidebarEl.innerHTML = `
                    <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                        <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">Filtros</h3>
                        <button type="button" class="sv-sidebar-reset text-xs font-bold text-brand hover:underline">Limpiar</button>
                    </div>
                    ${buildFacetsSectionsHtml(cfg, false)}
                `;
                bindFacetEvents(sidebarEl);
                sidebarEl.querySelector('.sv-sidebar-reset')?.addEventListener('click', resetAllFilters);
            }
        }

        function resetSidebarWrapper() {
            const layoutWrap = sectionRoot.querySelector('.sv-sidebar-layout-wrapper');
            if (layoutWrap && layoutWrap.parentNode) {
                layoutWrap.parentNode.insertBefore(gridEl, layoutWrap);
                if (noMatchesEl) layoutWrap.parentNode.insertBefore(noMatchesEl, layoutWrap);
                layoutWrap.remove();
            }
        }

        filterTriggerBtn.onclick = () => {
            const cfg = getGlobalFilterConfig();
            if (cfg.layout === 'inline') {
                const isOpen = dynamicHost.dataset.inlineOpen === 'true';
                dynamicHost.dataset.inlineOpen = isOpen ? 'false' : 'true';
                renderFilterUI(false);
            } else {
                if (drawerBackdrop.classList.contains('is-open')) {
                    closeDrawer();
                } else {
                    openDrawer();
                }
            }
        };

        if (searchInput && !searchInput.dataset.svBound) {
            searchInput.dataset.svBound = 'true';
            searchInput.addEventListener('input', () => {
                state.q = searchInput.value.trim();
                applyFiltersAndSort();
            });
        }

        if (searchClear && !searchClear.dataset.svBound) {
            searchClear.dataset.svBound = 'true';
            searchClear.addEventListener('click', () => {
                state.q = '';
                if (searchInput) searchInput.value = '';
                applyFiltersAndSort();
            });
        }

        if (sortSelect && !sortSelect.dataset.svBound) {
            sortSelect.dataset.svBound = 'true';
            sortSelect.addEventListener('change', () => {
                state.sort = sortSelect.value;
                applyFiltersAndSort();
            });
        }

        const resetSearchBtn = sectionRoot.querySelector('#catalog-reset-search, .sv-reset-filters-btn');
        if (resetSearchBtn) {
            resetSearchBtn.onclick = resetAllFilters;
        }

        renderFilterUI(false);
        applyFiltersAndSort();
        sectionRoot.classList.add('sv-filters-ready');

        return {
            refreshConfig: (fromLiveEditorUpdate) => {
                renderFilterUI(Boolean(fromLiveEditorUpdate));
                applyFiltersAndSort();
                sectionRoot.classList.add('sv-filters-ready');
            }
        };
    }

    function createFallbackEmptyState(gridEl) {
        const div = document.createElement('div');
        div.className = 'hidden text-center py-12 bg-white text-slate-900 store-radius border border-slate-200/80 px-4 shadow-xs my-4';
        div.innerHTML = `
            <p class="text-base font-bold text-slate-800">No encontramos productos con esos filtros</p>
            <p class="text-xs text-slate-500 mt-1 mb-4">Prueba combinando otros criterios o limpia la selección actual.</p>
            <button type="button" class="sv-reset-filters-btn bg-brand text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm hover-bg-brand transition">
                Limpiar filtros
            </button>
        `;
        gridEl.insertAdjacentElement('afterend', div);
        return div;
    }

    let activeInstances = [];

    function initAllCatalogs() {
        document.querySelectorAll('.sv-filter-drawer-backdrop').forEach(el => el.remove());
        activeInstances = [];

        const metadata = loadCatalogMetadata();
        const toolbars = Array.from(document.querySelectorAll('.sv-grid-toolbar'));
        toolbars.forEach((tb, idx) => {
            const inst = initCatalogInstance(tb, idx, metadata);
            if (inst) activeInstances.push(inst);
        });
    }

    document.addEventListener('click', (e) => {
        document.querySelectorAll('details.sv-topbar-popover[open]').forEach(det => {
            if (!det.contains(e.target)) det.removeAttribute('open');
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.sv-filter-drawer-backdrop.is-open').forEach(el => {
                el.classList.remove('is-open');
                el.classList.add('hidden');
            });
            document.body.classList.remove('overflow-hidden');
        }
    });

    document.addEventListener('DOMContentLoaded', initAllCatalogs);
    document.addEventListener('storevo:filter-config-updated', () => {
        activeInstances.forEach(inst => inst.refreshConfig(true));
    });

    Storevo.Catalog = {
        init: initAllCatalogs,
        refresh: () => activeInstances.forEach(inst => inst.refreshConfig(true))
    };
})();