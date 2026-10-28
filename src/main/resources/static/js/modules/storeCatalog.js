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
     * Lee la configuración global del buscador desde los atributos data-sv-search-* de <body>
     */
    function getGlobalSearchConfig() {
        const d = document.body ? document.body.dataset : {};
        const boolAttr = (val, def) => {
            if (val === undefined || val === null || val === '') return def;
            return String(val) === 'true';
        };
        const intAttr = (val, def, min, max) => {
            const n = parseInt(val, 10);
            if (isNaN(n)) return def;
            return Math.max(min, Math.min(max, n));
        };
        return {
            enabled: boolAttr(d.svSearchEnabled, true),
            mode: d.svSearchMode || 'predictive', // traditional | instant | predictive | fullscreen
            navbarVariant: d.svSearchNavbarVariant || 'auto', // auto | inline_bar | expandable_icon | modal_trigger | hidden
            mobileMode: d.svSearchMobileMode || 'fullscreen', // fullscreen | same
            inputStyle: d.svSearchInputStyle || 'sync',
            inputSize: d.svSearchInputSize || 'normal',
            buttonMode: d.svSearchButtonMode || 'icon',
            anim: d.svSearchAnim || 'slide_up',
            placeholder: d.svSearchPlaceholder || 'Buscar productos...',
            buttonLabel: d.svSearchButtonLabel || 'Buscar',
            emptyMessage: d.svSearchEmptyMessage || 'No encontramos productos para tu búsqueda',
            minChars: intAttr(d.svSearchMinChars, 2, 1, 5),
            debounceMs: intAttr(d.svSearchDebounceMs, 250, 0, 1000),
            maxSuggestions: intAttr(d.svSearchMaxSuggestions, 6, 2, 12),
            showProductImg: boolAttr(d.svSearchShowProductImg, true),
            showProductPrice: boolAttr(d.svSearchShowProductPrice, true),
            showProductDiscount: boolAttr(d.svSearchShowProductDiscount, true),
            showProductCategory: boolAttr(d.svSearchShowProductCategory, true),
            showProductBrand: boolAttr(d.svSearchShowProductBrand, false),
            suggestCategories: boolAttr(d.svSearchSuggestCategories, true),
            suggestBrands: boolAttr(d.svSearchSuggestBrands, true),
            showRecent: boolAttr(d.svSearchShowRecent, true),
            popularTerms: d.svSearchPopularTerms || '',
            categoryScope: d.svSearchCategoryScope || 'none', // none | select_left | pills_top
            advancedEnabled: boolAttr(d.svSearchAdvancedEnabled, false),
            matchVariants: boolAttr(d.svSearchMatchVariants, true),
            matchSpecs: boolAttr(d.svSearchMatchSpecs, true),
            advCategory: boolAttr(d.svSearchAdvCategory, true),
            advBrand: boolAttr(d.svSearchAdvBrand, true),
            advPrice: boolAttr(d.svSearchAdvPrice, true),
            advAvailability: boolAttr(d.svSearchAdvAvailability, true),
            advVariants: boolAttr(d.svSearchAdvVariants, true),
            advSpecs: boolAttr(d.svSearchAdvSpecs, false)
        };
    }

    function getStoreContext() {
        const bridge = document.getElementById('storevo-navbar-advanced-bridge');
        const slug = (bridge && bridge.getAttribute('data-slug'))
            || (window.location.pathname.match(/^\/s\/([^/?#]+)/) || [])[1]
            || 'default';
        const isPreview = Boolean(
            (bridge && bridge.getAttribute('data-is-preview') === 'true') ||
            new URLSearchParams(window.location.search).get('preview') === 'draft'
        );
        return { slug, isPreview };
    }

    /**
     * Carga los datos desde #storevo-filter-data-json, sincroniza con sessionStorage validado por catalogHash
     * y lee el puente de categorías del navbar
     */
    function loadCatalogMetadata() {
        const { slug, isPreview } = getStoreContext();
        const storageKey = `storevo_search_index_${slug}`;
        const byId = new Map();
        let catalogHash = '';

        const populateMapFromList = (list) => {
            if (!Array.isArray(list)) return;
            list.forEach(item => {
                if (item && item.id != null) {
                    byId.set(String(item.id), item);
                }
            });
        };

        const jsonEl = document.getElementById('storevo-filter-data-json');
        if (jsonEl && jsonEl.textContent) {
            try {
                const parsed = JSON.parse(jsonEl.textContent);
                catalogHash = parsed && parsed.catalogHash ? String(parsed.catalogHash) : '';
                const rawProducts = Array.isArray(parsed) ? parsed : (parsed && parsed.products ? parsed.products : []);
                const list = Array.isArray(rawProducts) ? rawProducts : Object.values(rawProducts);
                populateMapFromList(list);

                if (byId.size > 0 && !isPreview) {
                    try {
                        sessionStorage.setItem(storageKey, JSON.stringify({
                            catalogHash,
                            products: Array.from(byId.values())
                        }));
                    } catch (err) {}
                }
            } catch (e) {
                console.warn('[Storevo.Catalog] Error leyendo storevo-filter-data-json:', e);
            }
        }

        if (byId.size === 0 && !isPreview) {
            try {
                const cachedRaw = sessionStorage.getItem(storageKey);
                if (cachedRaw) {
                    const cached = JSON.parse(cachedRaw);
                    if (cached && Array.isArray(cached.products)) {
                        catalogHash = cached.catalogHash || '';
                        populateMapFromList(cached.products);
                    }
                }
            } catch (e) {}
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
                        parentId: String(node.getAttribute('data-parent-id') || ''),
                        url: node.getAttribute('data-url') || `/s/${slug}/catalog?category=${encodeURIComponent(id)}`
                    });
                }
            });
        }
        return { byId, catMap, catalogHash };
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

        const tabMatch = (cardEl.className || '').match(/\bsv-tab-card-(tab\d+)\b/);
        const tabId = cardEl.getAttribute('data-sv-tab-id') || (tabMatch ? tabMatch[1] : '');

        return {
            el: cardEl,
            index,
            tabId,
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

        const initialDefaultSort = gridEl.getAttribute('data-default-sort') || (sortSelect ? sortSelect.value : 'default') || 'default';
        const initialActiveTabBtn = sectionRoot.querySelector('.sv-pg-tab-btn.is-active');
        const state = {
            activeTab: initialActiveTabBtn ? (initialActiveTabBtn.getAttribute('data-pg-tab-btn') || '') : '',
            q: searchInput ? searchInput.value.trim() : '',
            sort: sortSelect ? sortSelect.value : initialDefaultSort,
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
            if (state.activeTab && r.tabId && r.tabId !== state.activeTab) {
                return false;
            }
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
                records.forEach(r => {
                    const visibleInTab = !state.activeTab || !r.tabId || r.tabId === state.activeTab;
                    r.el.classList.toggle('hidden', !visibleInTab);
                });
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

        let toolbarDebounceTimer = null;

        function syncToolbarSearchAppearance() {
            const sCfg = getGlobalSearchConfig();
            const fCfg = getGlobalFilterConfig();
            if (!searchInput) return;

            const wrap = searchInput.parentElement;
            if (wrap) {
                wrap.classList.add('sv-toolbar-search-box', 'sv-toolbar-search-wrap');
                wrap.classList.toggle('hidden', !fCfg.showSearch || !sCfg.enabled);
            }
            searchInput.placeholder = sCfg.placeholder || 'Buscar productos...';
            const emptyTitleEl = noMatchesEl ? noMatchesEl.querySelector('h3, p.text-base') : null;
            if (emptyTitleEl && sCfg.emptyMessage) {
                emptyTitleEl.textContent = sCfg.emptyMessage;
            }
        }

        // Si la URL actual trae ?q=..., sincronizar el buscador principal del catálogo
        if (searchInput && searchInput.id === 'catalog-search-input') {
            const urlQ = new URLSearchParams(window.location.search).get('q');
            if (urlQ !== null && searchInput.value !== urlQ) {
                searchInput.value = urlQ;
                state.q = urlQ.trim();
            }
        }

        if (searchInput && !searchInput.dataset.svBound) {
            searchInput.dataset.svBound = 'true';

            searchInput.addEventListener('input', () => {
                clearTimeout(toolbarDebounceTimer);
                const sCfg = getGlobalSearchConfig();
                const rawVal = searchInput.value.trim();

                if (searchClear) {
                    searchClear.classList.toggle('hidden', !rawVal);
                }

                // En modo tradicional solo se filtra al presionar Enter o limpiar el campo
                if (sCfg.mode === 'traditional') {
                    if (rawVal === '') {
                        state.q = '';
                        applyFiltersAndSort();
                    }
                    return;
                }

                if (rawVal.length > 0 && rawVal.length < sCfg.minChars) {
                    return;
                }

                const delay = sCfg.debounceMs || 0;
                if (delay <= 0) {
                    state.q = rawVal;
                    applyFiltersAndSort();
                } else {
                    toolbarDebounceTimer = setTimeout(() => {
                        state.q = rawVal;
                        applyFiltersAndSort();
                    }, delay);
                }
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(toolbarDebounceTimer);
                    state.q = searchInput.value.trim();
                    applyFiltersAndSort();
                }
            });
        }

        if (searchClear && !searchClear.dataset.svBound) {
            searchClear.dataset.svBound = 'true';
            searchClear.addEventListener('click', () => {
                clearTimeout(toolbarDebounceTimer);
                state.q = '';
                if (searchInput) searchInput.value = '';
                applyFiltersAndSort();
            });
        }

        syncToolbarSearchAppearance();

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

        const instanceApi = {
            setActiveTab: (tabId) => {
                state.activeTab = tabId || '';
                applyFiltersAndSort();
            },
            refreshConfig: (fromLiveEditorUpdate) => {
                syncToolbarSearchAppearance();
                renderFilterUI(Boolean(fromLiveEditorUpdate));
                applyFiltersAndSort();
                sectionRoot.classList.add('sv-filters-ready');
            }
        };
        sectionRoot._svCatalogInstance = instanceApi;
        return instanceApi;
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

    // =========================================================================
    // MOTOR UNIFICADO DE BÚSQUEDA (Storevo.Search)
    // Modalidades 1 a 7: Tradicional, Instantánea, Predictiva, Pantalla Completa,
    // Categorías, Avanzada Combinada y Atributos/Variantes
    // =========================================================================
    const SearchEngine = (function () {
        let currentMetadata = { byId: new Map(), catMap: new Map(), catalogHash: '' };
        let indexedProducts = [];
        let catalogFacetsMeta = { brands: [], variantGroups: new Map(), specGroups: new Map(), minPrice: 0, maxPrice: 0 };
        let fetchIndexController = null;
        let latestSearchReqId = 0;
        let searchModalBackdrop = null;
        let lastSearchMode = null;
        let lastNavbarVariant = null;

        function createEmptyAdvState() {
            return {
                open: false,
                brand: '',
                availability: 'all', // all | in_stock | offers
                minPrice: null,
                maxPrice: null,
                variantVal: '',
                specVal: ''
            };
        }

        function hasActiveAdvCriteria(adv) {
            if (!adv) return false;
            return Boolean(
                adv.brand ||
                adv.availability !== 'all' ||
                adv.minPrice != null ||
                adv.maxPrice != null ||
                adv.variantVal ||
                adv.specVal
            );
        }

        function getRecentKey() {
            const { slug } = getStoreContext();
            return `storevo_recent_searches_${slug}`;
        }

        function getRecentSearches() {
            try {
                const list = JSON.parse(localStorage.getItem(getRecentKey()) || '[]');
                return Array.isArray(list) ? list.slice(0, 6) : [];
            } catch (e) {
                return [];
            }
        }

        function saveRecentSearch(term) {
            const clean = String(term || '').trim();
            if (clean.length < 2) return;
            try {
                const current = getRecentSearches().filter(item => normalizeText(item) !== normalizeText(clean));
                current.unshift(clean.substring(0, 60));
                localStorage.setItem(getRecentKey(), JSON.stringify(current.slice(0, 6)));
            } catch (e) {}
        }

        function clearRecentSearches() {
            try {
                localStorage.removeItem(getRecentKey());
            } catch (e) {}
        }

        function buildIndexedProducts(metadata) {
            const { slug, isPreview } = getStoreContext();
            const previewQuery = isPreview ? '?preview=draft' : '';
            const items = [];
            const brandsSet = new Set();
            const variantGroups = new Map();
            const specGroups = new Map();
            let minPrice = Infinity;
            let maxPrice = 0;

            metadata.byId.forEach(raw => {
                if (!raw || raw.id == null) return;
                const id = String(raw.id);
                const name = String(raw.name || '').trim();
                if (!name) return;

                const brand = String(raw.brand || '').trim();
                if (brand) brandsSet.add(brand);

                const sku = String(raw.sku || '').trim();
                const categoryId = String(raw.categoryId || '');
                const catObj = metadata.catMap.get(categoryId);
                const categoryName = String(raw.categoryName || (catObj ? catObj.name : '') || '').trim();

                const price = Number(raw.effectivePrice ?? raw.price ?? 0);
                const originalPrice = Number(raw.originalPrice ?? raw.price ?? price);
                if (price > 0) {
                    if (price < minPrice) minPrice = price;
                    if (price > maxPrice) maxPrice = price;
                }
                const hasOffer = Boolean(raw.hasOffer || raw.hasDiscount || (originalPrice > price && price > 0));
                const discountPct = Number(raw.discountPercent || (hasOffer && originalPrice > 0 ? Math.round(((originalPrice - price) * 100) / originalPrice) : 0));
                const inStock = raw.inStock !== false;
                const isMadeToOrder = Boolean(raw.isMadeToOrder || raw.madeToOrder);
                const imageUrl = raw.imageUrl || '/img/placeholder.jpg';

                const options = raw.options && typeof raw.options === 'object' ? raw.options : {};
                const attributes = raw.attributes && typeof raw.attributes === 'object' ? raw.attributes : {};

                const variantValuesFlat = [];
                Object.entries(options).forEach(([optName, vals]) => {
                    const arr = Array.isArray(vals) ? vals : [vals];
                    if (!variantGroups.has(optName)) variantGroups.set(optName, new Set());
                    const set = variantGroups.get(optName);
                    arr.forEach(v => {
                        const cleanV = String(v || '').trim();
                        if (cleanV) {
                            set.add(cleanV);
                            variantValuesFlat.push(`${optName}: ${cleanV}`);
                        }
                    });
                });

                const specValuesFlat = [];
                Object.entries(attributes).forEach(([specKey, vals]) => {
                    if (normalizeText(specKey) === 'marca') return;
                    const arr = Array.isArray(vals) ? vals : [vals];
                    if (!specGroups.has(specKey)) specGroups.set(specKey, new Set());
                    const set = specGroups.get(specKey);
                    arr.forEach(v => {
                        const cleanV = String(v || '').trim();
                        if (cleanV) {
                            set.add(cleanV);
                            specValuesFlat.push(`${specKey}: ${cleanV}`);
                        }
                    });
                });

                const variantTokens = normalizeText(variantValuesFlat.join(' '));
                const specTokens = normalizeText(specValuesFlat.join(' '));

                items.push({
                    id,
                    name,
                    nameNorm: normalizeText(name),
                    brand,
                    brandNorm: normalizeText(brand),
                    sku,
                    skuNorm: normalizeText(sku),
                    categoryId,
                    categoryName,
                    categoryNorm: normalizeText(categoryName),
                    price,
                    originalPrice,
                    hasOffer,
                    discountPct,
                    inStock,
                    isMadeToOrder,
                    imageUrl,
                    url: `/s/${slug}/p/${encodeURIComponent(id)}${previewQuery}`,
                    options,
                    attributes,
                    variantValuesFlat,
                    specValuesFlat,
                    variantTokens,
                    specTokens
                });
            });

            catalogFacetsMeta = {
                brands: Array.from(brandsSet).sort((a, b) => a.localeCompare(b, 'es')),
                variantGroups,
                specGroups,
                minPrice: minPrice === Infinity ? 0 : minPrice,
                maxPrice
            };

            return items;
        }

        function ensureIndexHydrated() {
            if (indexedProducts.length > 0) {
                return Promise.resolve(indexedProducts);
            }
            const { slug, isPreview } = getStoreContext();
            if (fetchIndexController) {
                fetchIndexController.abort();
            }
            fetchIndexController = new AbortController();
            const signal = fetchIndexController.signal;
            const reqId = ++latestSearchReqId;
            const url = `/s/${slug}/catalog${isPreview ? '?preview=draft' : ''}`;

            return fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'text/html', 'X-Storevo-Navigation': 'prefetch' },
                signal
            })
                .then(r => r.ok ? r.text() : '')
                .then(html => {
                    if (reqId !== latestSearchReqId || !html) return indexedProducts;
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const jsonNode = doc.getElementById('storevo-filter-data-json');
                    if (jsonNode && jsonNode.textContent) {
                        const parsed = JSON.parse(jsonNode.textContent);
                        const rawProducts = parsed && parsed.products ? Object.values(parsed.products) : [];
                        rawProducts.forEach(item => {
                            if (item && item.id != null) {
                                currentMetadata.byId.set(String(item.id), item);
                            }
                        });
                        indexedProducts = buildIndexedProducts(currentMetadata);
                    }
                    return indexedProducts;
                })
                .catch(() => indexedProducts);
        }

        function queryIndex(rawQuery, categoryFilterId, cfg, advState) {
            const qNorm = normalizeText(rawQuery);
            const tokens = qNorm.split(/\s+/).filter(Boolean);
            const catIdFilter = String(categoryFilterId || '').trim();
            const adv = advState || createEmptyAdvState();

            // Filtrar por categoría seleccionada (incluyendo subcategorías hijas)
            const allowedCatIds = new Set();
            if (catIdFilter) {
                allowedCatIds.add(catIdFilter);
                currentMetadata.catMap.forEach(c => {
                    if (c.parentId === catIdFilter) allowedCatIds.add(c.id);
                });
                currentMetadata.catMap.forEach(c => {
                    if (allowedCatIds.has(c.parentId)) allowedCatIds.add(c.id);
                });
            }

            const matchedProducts = [];
            indexedProducts.forEach(p => {
                if (catIdFilter && !allowedCatIds.has(p.categoryId)) return;

                // Criterios de Búsqueda Avanzada (Modalidades 6 y 7)
                if (cfg.advancedEnabled) {
                    if (cfg.advBrand && adv.brand && p.brand !== adv.brand) return;
                    if (cfg.advAvailability) {
                        if (adv.availability === 'in_stock' && !p.inStock) return;
                        if (adv.availability === 'offers' && !p.hasOffer) return;
                    }
                    if (cfg.advPrice) {
                        if (adv.minPrice != null && p.price < adv.minPrice) return;
                        if (adv.maxPrice != null && p.price > adv.maxPrice) return;
                    }
                    if (cfg.advVariants && adv.variantVal) {
                        if (!p.variantValuesFlat.includes(adv.variantVal)) return;
                    }
                    if (cfg.advSpecs && adv.specVal) {
                        if (!p.specValuesFlat.includes(adv.specVal)) return;
                    }
                }

                let matchedBadge = '';
                if (tokens.length === 0) {
                    if (adv.variantVal) matchedBadge = adv.variantVal;
                    else if (adv.specVal) matchedBadge = adv.specVal;
                    matchedProducts.push({ product: p, score: 1, matchedBadge });
                    return;
                }

                let totalScore = 0;
                for (const tk of tokens) {
                    let tokenScore = 0;
                    if (p.skuNorm && p.skuNorm === tk) tokenScore = 120;
                    else if (p.nameNorm.startsWith(tk)) tokenScore = 90;
                    else if (p.nameNorm.includes(' ' + tk)) tokenScore = 75;
                    else if (p.nameNorm.includes(tk)) tokenScore = 55;
                    else if (p.brandNorm.includes(tk)) tokenScore = 45;
                    else if (p.categoryNorm.includes(tk)) tokenScore = 38;
                    else if (cfg.matchVariants && p.variantTokens.includes(tk)) {
                        tokenScore = 32;
                        const hitVar = p.variantValuesFlat.find(v => normalizeText(v).includes(tk));
                        if (hitVar) matchedBadge = hitVar;
                    } else if (cfg.matchSpecs && p.specTokens.includes(tk)) {
                        tokenScore = 26;
                        const hitSpec = p.specValuesFlat.find(s => normalizeText(s).includes(tk));
                        if (hitSpec) matchedBadge = hitSpec;
                    } else if (/^(oferta|ofertas|descuento|descuentos|promo|promocion|rebaja|rebajas)$/.test(tk) && p.hasOffer) {
                        tokenScore = 65;
                    } else if (/^(nuevo|nuevos|nueva|nuevas|novedad|novedades)$/.test(tk)) {
                        tokenScore = 40;
                    }

                    if (tokenScore === 0) return;
                    totalScore += tokenScore;
                }

                if (p.inStock) totalScore += 5;
                matchedProducts.push({ product: p, score: totalScore, matchedBadge });
            });

            matchedProducts.sort((a, b) => b.score - a.score);

            const matchedCategories = [];
            if (cfg.suggestCategories && qNorm) {
                currentMetadata.catMap.forEach(cat => {
                    if (normalizeText(cat.name).includes(qNorm)) {
                        matchedCategories.push(cat);
                    }
                });
            }

            const matchedBrands = [];
            if (cfg.suggestBrands && qNorm) {
                const seenBrands = new Set();
                indexedProducts.forEach(p => {
                    if (p.brand && !seenBrands.has(p.brandNorm) && p.brandNorm.includes(qNorm)) {
                        seenBrands.add(p.brandNorm);
                        matchedBrands.push(p.brand);
                    }
                });
            }

            return {
                totalMatches: matchedProducts.length,
                products: matchedProducts.slice(0, cfg.maxSuggestions).map(m => {
                    return Object.assign({}, m.product, { matchedBadge: m.matchedBadge });
                }),
                categories: matchedCategories.slice(0, 4),
                brands: matchedBrands.slice(0, 4)
            };
        }

        function navigateToCatalogExplicit(query, categoryId) {
            const { slug, isPreview } = getStoreContext();
            const cleanQ = String(query || '').trim();
            if (cleanQ) saveRecentSearch(cleanQ);

            const url = new URL(`/s/${slug}/catalog`, window.location.origin);
            if (categoryId) url.searchParams.set('category', String(categoryId));
            if (cleanQ) url.searchParams.set('q', cleanQ);
            if (isPreview) url.searchParams.set('preview', 'draft');

            closeAllSearchPanels();
            if (window.Storevo && Storevo.Router && typeof Storevo.Router.navigate === 'function') {
                Storevo.Router.navigate(url.pathname + url.search);
            } else {
                window.location.href = url.pathname + url.search;
            }
        }

        function populateCategorySelects() {
            const rootCats = Array.from(currentMetadata.catMap.values()).filter(c => !c.parentId || !currentMetadata.catMap.has(c.parentId));
            const currentCatParam = new URLSearchParams(window.location.search).get('category') || '';

            document.querySelectorAll('.sv-search-cat-select').forEach(sel => {
                const prevVal = sel.value || currentCatParam;
                sel.innerHTML = `<option value="">Todas</option>` + rootCats.map(c =>
                    `<option value="${escapeHtml(c.id)}" ${String(c.id) === String(prevVal) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
                ).join('');
            });
        }

        function renderAdvancedControlsHtml(cfg, selectedCatId, adv) {
            if (!cfg.advancedEnabled) return '';
            const rootCats = Array.from(currentMetadata.catMap.values()).filter(c => !c.parentId || !currentMetadata.catMap.has(c.parentId));
            const isOpen = adv.open || hasActiveAdvCriteria(adv);

            const allVariantPairs = [];
            if (cfg.advVariants) {
                catalogFacetsMeta.variantGroups.forEach((valSet, optName) => {
                    valSet.forEach(v => allVariantPairs.push(`${optName}: ${v}`));
                });
            }
            const allSpecPairs = [];
            if (cfg.advSpecs) {
                catalogFacetsMeta.specGroups.forEach((valSet, specKey) => {
                    valSet.forEach(v => allSpecPairs.push(`${specKey}: ${v}`));
                });
            }

            return `
              <div>
                  <div class="flex items-center justify-between">
                      <button type="button" class="sv-search-adv-toggle inline-flex items-center gap-1.5 text-xs font-extrabold text-brand hover:underline">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                          <span>${isOpen ? 'Ocultar criterios avanzados' : 'Búsqueda avanzada y atributos'}</span>
                      </button>
                      ${hasActiveAdvCriteria(adv) ? `<button type="button" class="sv-search-adv-reset text-[11px] font-bold text-red-500 hover:underline">Limpiar criterios</button>` : ''}
                  </div>
                  <div class="sv-search-adv-box mt-2 ${isOpen ? '' : 'hidden'}">
                      <div class="sv-search-adv-grid">
                          ${cfg.advCategory && rootCats.length > 0 ? `
                              <div>
                                  <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Categoría</label>
                                  <select data-adv-field="category" class="sv-search-adv-select">
                                      <option value="">Todas las categorías</option>
                                      ${rootCats.map(c => `<option value="${escapeHtml(c.id)}" ${String(selectedCatId) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
                                  </select>
                              </div>
                          ` : ''}
                          ${cfg.advBrand && catalogFacetsMeta.brands.length > 0 ? `
                              <div>
                                  <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Marca</label>
                                  <select data-adv-field="brand" class="sv-search-adv-select">
                                      <option value="">Todas las marcas</option>
                                      ${catalogFacetsMeta.brands.map(b => `<option value="${escapeHtml(b)}" ${adv.brand === b ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}
                                  </select>
                              </div>
                          ` : ''}
                          ${cfg.advAvailability ? `
                              <div>
                                  <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Disponibilidad / Ofertas</label>
                                  <select data-adv-field="availability" class="sv-search-adv-select">
                                      <option value="all" ${adv.availability === 'all' ? 'selected' : ''}>Todos los productos</option>
                                      <option value="in_stock" ${adv.availability === 'in_stock' ? 'selected' : ''}>Solo con stock disponible</option>
                                      <option value="offers" ${adv.availability === 'offers' ? 'selected' : ''}>Solo productos en oferta</option>
                                  </select>
                              </div>
                          ` : ''}
                          ${cfg.advPrice && catalogFacetsMeta.maxPrice > 0 ? `
                              <div class="grid grid-cols-2 gap-1.5">
                                  <div>
                                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Precio mín.</label>
                                      <input type="number" data-adv-field="minPrice" placeholder="${catalogFacetsMeta.minPrice}" value="${adv.minPrice != null ? adv.minPrice : ''}" class="sv-search-adv-input">
                                  </div>
                                  <div>
                                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Precio máx.</label>
                                      <input type="number" data-adv-field="maxPrice" placeholder="${catalogFacetsMeta.maxPrice}" value="${adv.maxPrice != null ? adv.maxPrice : ''}" class="sv-search-adv-input">
                                  </div>
                              </div>
                          ` : ''}
                      </div>
                      ${allVariantPairs.length > 0 ? `
                          <div>
                              <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Variantes (Talla, Color, Opción)</label>
                              <div class="sv-search-adv-pills">
                                  ${allVariantPairs.slice(0, 14).map(vp => `
                                      <button type="button" data-adv-variant="${escapeHtml(vp)}" class="sv-search-adv-pill ${adv.variantVal === vp ? 'is-active' : ''}">${escapeHtml(vp)}</button>
                                  `).join('')}
                              </div>
                          </div>
                      ` : ''}
                      ${allSpecPairs.length > 0 ? `
                          <div>
                              <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Atributos de Ficha Técnica</label>
                              <div class="sv-search-adv-pills">
                                  ${allSpecPairs.slice(0, 12).map(sp => `
                                      <button type="button" data-adv-spec="${escapeHtml(sp)}" class="sv-search-adv-pill ${adv.specVal === sp ? 'is-active' : ''}">${escapeHtml(sp)}</button>
                                  `).join('')}
                              </div>
                          </div>
                      ` : ''}
                  </div>
              </div>
          `;
        }

        function renderInitialSuggestionsHtml(cfg, selectedCatId, adv, isModalView) {
            const recent = cfg.showRecent ? getRecentSearches() : [];
            const customPopular = String(cfg.popularTerms || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            const rootCats = Array.from(currentMetadata.catMap.values())
                .filter(c => !c.parentId || !currentMetadata.catMap.has(c.parentId))
                .slice(0, 8);

            const sections = [];

            if (cfg.categoryScope === 'pills_top' && rootCats.length > 0) {
                sections.push(`
                  <div>
                      <div class="sv-search-panel__section-title"><span>Filtrar por categoría</span></div>
                      <div class="sv-search-cat-pills">
                          <button type="button" data-search-cat-pill="" class="sv-search-cat-pill ${!selectedCatId ? 'is-active' : ''}">Todas</button>
                          ${rootCats.map(c => `
                              <button type="button" data-search-cat-pill="${escapeHtml(c.id)}" class="sv-search-cat-pill ${String(selectedCatId) === String(c.id) ? 'is-active' : ''}">${escapeHtml(c.name)}</button>
                          `).join('')}
                      </div>
                  </div>
              `);
            }

            const advHtml = renderAdvancedControlsHtml(cfg, selectedCatId, adv || createEmptyAdvState());
            if (advHtml) sections.push(advHtml);

            if (recent.length > 0) {
                sections.push(`
                  <div>
                      <div class="sv-search-panel__section-title">
                          <span>Búsquedas recientes</span>
                          <button type="button" class="sv-clear-recent-btn text-[11px] font-bold text-brand hover:underline">Borrar</button>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                          ${recent.map(term => `
                              <button type="button" data-search-term="${escapeHtml(term)}" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand hover:text-white text-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5">
                                  <span>🕒</span>
                                  <span>${escapeHtml(term)}</span>
                              </button>
                          `).join('')}
                      </div>
                  </div>
              `);
            }

            if (customPopular.length > 0) {
                sections.push(`
                  <div>
                      <div class="sv-search-panel__section-title"><span>Búsquedas populares</span></div>
                      <div class="flex flex-wrap gap-1.5">
                          ${customPopular.map(term => `
                              <button type="button" data-search-term="${escapeHtml(term)}" class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand hover:text-brand text-slate-700 text-xs font-bold transition">
                                  <span>🔥 ${escapeHtml(term)}</span>
                              </button>
                          `).join('')}
                      </div>
                  </div>
              `);
            } else if (rootCats.length > 0 && cfg.categoryScope !== 'pills_top') {
                sections.push(`
                  <div>
                      <div class="sv-search-panel__section-title"><span>Categorías principales</span></div>
                      <div class="flex flex-wrap gap-1.5">
                          ${rootCats.map(cat => `
                              <a href="${escapeHtml(cat.url)}" class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand hover:text-brand text-slate-700 text-xs font-bold transition">
                                  ${escapeHtml(cat.name)}
                              </a>
                          `).join('')}
                      </div>
                  </div>
              `);
            }

            if (sections.length === 0) return '';
            if (isModalView) return sections.join('');
            return `<div class="sv-search-panel"><div class="sv-search-panel__body">${sections.join('')}</div></div>`;
        }

        function renderResultsPanelHtml(query, selectedCatId, results, cfg, adv, isModalView) {
            const rootCats = Array.from(currentMetadata.catMap.values())
                .filter(c => !c.parentId || !currentMetadata.catMap.has(c.parentId))
                .slice(0, 8);

            const bodyParts = [];

            if (cfg.categoryScope === 'pills_top' && rootCats.length > 0) {
                bodyParts.push(`
                  <div class="sv-search-cat-pills">
                      <button type="button" data-search-cat-pill="" class="sv-search-cat-pill ${!selectedCatId ? 'is-active' : ''}">Todas</button>
                      ${rootCats.map(c => `
                          <button type="button" data-search-cat-pill="${escapeHtml(c.id)}" class="sv-search-cat-pill ${String(selectedCatId) === String(c.id) ? 'is-active' : ''}">${escapeHtml(c.name)}</button>
                      `).join('')}
                  </div>
              `);
            }

            const advHtml = renderAdvancedControlsHtml(cfg, selectedCatId, adv || createEmptyAdvState());
            if (advHtml) bodyParts.push(advHtml);

            if ((cfg.mode === 'predictive' || isModalView) && (results.categories.length > 0 || results.brands.length > 0)) {
                const pills = [];
                results.categories.forEach(cat => {
                    pills.push(`
                      <a href="${escapeHtml(cat.url)}" class="px-3 py-1 rounded-full bg-slate-100 hover:bg-brand hover:text-white text-slate-700 text-xs font-bold transition">
                          Categoría: ${escapeHtml(cat.name)}
                      </a>
                  `);
                });
                results.brands.forEach(brand => {
                    pills.push(`
                      <button type="button" data-search-term="${escapeHtml(brand)}" class="px-3 py-1 rounded-full bg-slate-100 hover:bg-brand hover:text-white text-slate-700 text-xs font-bold transition">
                          Marca: ${escapeHtml(brand)}
                      </button>
                  `);
                });
                bodyParts.push(`
                  <div>
                      <div class="sv-search-panel__section-title"><span>Sugerencias relacionadas</span></div>
                      <div class="flex flex-wrap gap-1.5">${pills.join('')}</div>
                  </div>
              `);
            }

            if (results.products.length === 0) {
                bodyParts.push(`
                  <div class="py-8 text-center">
                      <p class="text-sm font-bold text-slate-800">${escapeHtml(cfg.emptyMessage)}</p>
                      <p class="text-xs text-slate-500 mt-1">Intenta con otro término o ajusta los criterios seleccionados.</p>
                  </div>
              `);
            } else {
                const itemsHtml = results.products.map(p => {
                    const metaTags = [];
                    if (cfg.showProductBrand && p.brand) metaTags.push(escapeHtml(p.brand));
                    if (cfg.showProductCategory && p.categoryName) metaTags.push(escapeHtml(p.categoryName));

                    const imgHtml = cfg.showProductImg
                        ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" class="sv-search-item__thumb" loading="lazy">`
                        : '';

                    const badgeHtml = (cfg.showProductDiscount && p.hasOffer)
                        ? `<span class="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-black uppercase flex-shrink-0">${p.discountPct > 0 ? '-' + p.discountPct + '%' : 'Oferta'}</span>`
                        : '';

                    const matchedAttrHtml = p.matchedBadge
                        ? `<span class="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">${escapeHtml(p.matchedBadge)}</span>`
                        : '';

                    const priceHtml = cfg.showProductPrice
                        ? `<div class="text-right flex-shrink-0">
                             <span class="block text-xs sm:text-sm font-black text-slate-900">${formatCOP(p.price)}</span>
                             ${p.hasOffer && p.originalPrice > p.price ? `<span class="block text-[11px] text-slate-400 line-through">${formatCOP(p.originalPrice)}</span>` : ''}
                         </div>`
                        : '';

                    return `
                      <a href="${escapeHtml(p.url)}" class="sv-search-item ${isModalView ? 'border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand/40 shadow-2xs' : ''}" data-search-product-id="${escapeHtml(p.id)}">
                          ${imgHtml}
                          <div class="min-w-0 flex-1">
                              ${metaTags.length > 0 ? `<p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">${metaTags.join(' • ')}</p>` : ''}
                              <div class="flex items-center gap-1.5">
                                  <p class="text-xs sm:text-sm font-bold text-slate-900 truncate">${escapeHtml(p.name)}</p>
                                  ${badgeHtml}
                              </div>
                              ${matchedAttrHtml}
                          </div>
                          ${priceHtml}
                      </a>
                  `;
                }).join('');

                bodyParts.push(`
                  <div>
                      <div class="sv-search-panel__section-title">
                          <span>${cfg.mode === 'instant' ? 'Resultados instantáneos' : 'Productos encontrados'}</span>
                          <span class="text-[11px] font-bold text-slate-400">${results.totalMatches} coincidencias</span>
                      </div>
                      <div class="${isModalView ? 'sv-search-modal__grid' : 'divide-y divide-slate-100'}">${itemsHtml}</div>
                  </div>
              `);
            }

            const footerHtml = results.totalMatches > 0 ? `
              <div class="sv-search-panel__footer">
                  <span class="text-xs text-slate-500 truncate">${query ? `Búsqueda: <strong class="text-slate-800">${escapeHtml(query)}</strong>` : 'Filtrado avanzado activo'}</span>
                  <button type="button" class="sv-search-view-all-btn text-xs font-black text-brand hover:underline flex-shrink-0">
                      Ver en el catálogo (${results.totalMatches}) →
                  </button>
              </div>
          ` : '';

            if (isModalView) {
                return bodyParts.join('') + footerHtml;
            }

            return `
              <div class="sv-search-panel">
                  <div class="sv-search-panel__body">${bodyParts.join('')}</div>
                  ${footerHtml}
              </div>
          `;
        }

        let modalOpenedAt = 0;

        function bindContainerPanelEvents(containerEl, inputEl, catSelect, stateRef, refreshCallback) {
            if (!containerEl) return;

            // Seleccionar un término sugerido (reciente, popular o marca): ejecuta la búsqueda de inmediato
            containerEl.querySelectorAll('[data-search-term]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const term = (btn.getAttribute('data-search-term') || '').trim();
                    if (!term) return;
                    inputEl.value = term;
                    saveRecentSearch(term);
                    try { inputEl.focus({ preventScroll: true }); } catch (err) { inputEl.focus(); }
                    refreshCallback(true, true);
                });
            });

            // Seleccionar una píldora de categoría: filtra y muestra los resultados de esa categoría de inmediato
            containerEl.querySelectorAll('[data-search-cat-pill]').forEach(pill => {
                pill.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    stateRef.catId = pill.getAttribute('data-search-cat-pill') || '';
                    if (catSelect) catSelect.value = stateRef.catId;
                    try { inputEl.focus({ preventScroll: true }); } catch (err) {}
                    refreshCallback(true, Boolean(stateRef.catId));
                });
            });

            const advToggle = containerEl.querySelector('.sv-search-adv-toggle');
            if (advToggle) {
                advToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    stateRef.adv.open = !stateRef.adv.open;
                    refreshCallback(true, false);
                });
            }

            const advReset = containerEl.querySelector('.sv-search-adv-reset');
            if (advReset) {
                advReset.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    stateRef.adv = createEmptyAdvState();
                    stateRef.adv.open = true;
                    refreshCallback(true, false);
                });
            }

            const advCat = containerEl.querySelector('select[data-adv-field="category"]');
            if (advCat) {
                advCat.addEventListener('click', (e) => e.stopPropagation());
                advCat.addEventListener('change', (e) => {
                    e.stopPropagation();
                    stateRef.catId = advCat.value || '';
                    if (catSelect) catSelect.value = stateRef.catId;
                    refreshCallback(true, Boolean(stateRef.catId));
                });
            }

            const advBrand = containerEl.querySelector('select[data-adv-field="brand"]');
            if (advBrand) {
                advBrand.addEventListener('click', (e) => e.stopPropagation());
                advBrand.addEventListener('change', (e) => {
                    e.stopPropagation();
                    stateRef.adv.brand = advBrand.value || '';
                    stateRef.adv.open = true;
                    refreshCallback(true, true);
                });
            }

            const advAvail = containerEl.querySelector('select[data-adv-field="availability"]');
            if (advAvail) {
                advAvail.addEventListener('click', (e) => e.stopPropagation());
                advAvail.addEventListener('change', (e) => {
                    e.stopPropagation();
                    stateRef.adv.availability = advAvail.value || 'all';
                    stateRef.adv.open = true;
                    refreshCallback(true, true);
                });
            }

            const advMin = containerEl.querySelector('input[data-adv-field="minPrice"]');
            const advMax = containerEl.querySelector('input[data-adv-field="maxPrice"]');
            const onPriceChange = (e) => {
                if (e) e.stopPropagation();
                stateRef.adv.minPrice = (advMin && advMin.value !== '') ? Number(advMin.value) : null;
                stateRef.adv.maxPrice = (advMax && advMax.value !== '') ? Number(advMax.value) : null;
                stateRef.adv.open = true;
                refreshCallback(true, true);
            };
            if (advMin) {
                advMin.addEventListener('click', (e) => e.stopPropagation());
                advMin.addEventListener('change', onPriceChange);
            }
            if (advMax) {
                advMax.addEventListener('click', (e) => e.stopPropagation());
                advMax.addEventListener('change', onPriceChange);
            }

            containerEl.querySelectorAll('[data-adv-variant]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const v = btn.getAttribute('data-adv-variant') || '';
                    stateRef.adv.variantVal = (stateRef.adv.variantVal === v) ? '' : v;
                    stateRef.adv.open = true;
                    refreshCallback(true, true);
                });
            });

            containerEl.querySelectorAll('[data-adv-spec]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const s = btn.getAttribute('data-adv-spec') || '';
                    stateRef.adv.specVal = (stateRef.adv.specVal === s) ? '' : s;
                    stateRef.adv.open = true;
                    refreshCallback(true, true);
                });
            });

            const clearRecentBtn = containerEl.querySelector('.sv-clear-recent-btn');
            if (clearRecentBtn) {
                clearRecentBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearRecentSearches();
                    refreshCallback(true, false);
                });
            }

            const viewAllBtn = containerEl.querySelector('.sv-search-view-all-btn');
            if (viewAllBtn) {
                viewAllBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateToCatalogExplicit(inputEl.value.trim(), stateRef.catId);
                });
            }

            // Enlaces a productos y categorías sugeridas: navegar sin destruir el nodo antes de que el router lo procese
            containerEl.querySelectorAll('a[href]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const href = link.getAttribute('href');
                    if (!href) return;
                    if (inputEl.value.trim()) {
                        saveRecentSearch(inputEl.value.trim());
                    }
                    e.preventDefault();
                    closeAllSearchPanels();
                    if (window.Storevo && Storevo.Router && typeof Storevo.Router.navigate === 'function') {
                        Storevo.Router.navigate(href);
                    } else {
                        window.location.href = href;
                    }
                });
            });
        }

        function ensureFullscreenModalMounted() {
            if (searchModalBackdrop && document.body.contains(searchModalBackdrop)) {
                return searchModalBackdrop;
            }
            searchModalBackdrop = document.createElement('div');
            searchModalBackdrop.id = 'sv-search-fullscreen-backdrop';
            searchModalBackdrop.className = 'sv-search-modal-backdrop';
            searchModalBackdrop.innerHTML = `
              <div class="sv-search-modal" role="dialog" aria-modal="true" aria-label="Buscador de productos">
                  <div class="sv-search-modal__header">
                      <form class="sv-search-modal__form flex-1" autocomplete="off">
                          <div class="sv-toolbar-search-box">
                              <select name="category" class="sv-search-cat-select hidden" aria-label="Categoría">
                                  <option value="">Todas</option>
                              </select>
                              <div class="sv-search-input-wrap">
                                  <svg class="w-4 h-4 text-slate-400 ml-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                  <input type="search" name="q" class="w-full px-3 py-2.5 bg-transparent text-sm sm:text-base font-semibold text-slate-900 focus:outline-none" placeholder="Buscar productos..." autocomplete="off">
                                  <button type="button" class="sv-search-clear-btn hidden" title="Limpiar">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                  </button>
                                  <button type="submit" class="sv-search-submit-btn">
                                      <svg class="sv-search-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                      <span class="sv-search-submit-label">Buscar</span>
                                  </button>
                              </div>
                          </div>
                      </form>
                      <button type="button" class="sv-search-modal__close" title="Cerrar buscador" aria-label="Cerrar buscador">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>
                  <div class="sv-search-modal__body"></div>
              </div>
          `;
            document.body.appendChild(searchModalBackdrop);

            const modalDialog = searchModalBackdrop.querySelector('.sv-search-modal');
            const modalForm = searchModalBackdrop.querySelector('.sv-search-modal__form');
            const modalInput = modalForm.querySelector('input[name="q"]');
            const modalCatSelect = modalForm.querySelector('.sv-search-cat-select');
            const modalClearBtn = modalForm.querySelector('.sv-search-clear-btn');
            const modalBody = searchModalBackdrop.querySelector('.sv-search-modal__body');
            const closeBtn = searchModalBackdrop.querySelector('.sv-search-modal__close');

            if (modalDialog) {
                modalDialog.addEventListener('click', (e) => e.stopPropagation());
            }

            let modalDebounce = null;
            const modalState = { catId: '', adv: createEmptyAdvState() };

            const updateModalContent = (immediate, forceExecute) => {
                clearTimeout(modalDebounce);
                const cfg = getGlobalSearchConfig();
                const q = modalInput.value.trim();
                modalClearBtn.classList.toggle('hidden', !q);

                const renderNow = () => {
                    ensureIndexHydrated().then(() => {
                        const shouldShowResults = forceExecute
                            || q.length >= cfg.minChars
                            || Boolean(modalState.catId)
                            || hasActiveAdvCriteria(modalState.adv);

                        if (!shouldShowResults) {
                            modalBody.innerHTML = renderInitialSuggestionsHtml(cfg, modalState.catId, modalState.adv, true);
                        } else {
                            const results = queryIndex(q, modalState.catId, cfg, modalState.adv);
                            modalBody.innerHTML = renderResultsPanelHtml(q, modalState.catId, results, cfg, modalState.adv, true);
                        }
                        bindContainerPanelEvents(modalBody, modalInput, modalCatSelect, modalState, updateModalContent);
                    });
                };

                if (immediate || cfg.debounceMs <= 0) {
                    renderNow();
                } else {
                    modalDebounce = setTimeout(renderNow, cfg.debounceMs);
                }
            };

            modalInput.addEventListener('input', () => updateModalContent(false, false));
            modalCatSelect.addEventListener('change', () => {
                modalState.catId = modalCatSelect.value || '';
                updateModalContent(true, Boolean(modalState.catId));
            });
            modalClearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                modalInput.value = '';
                modalInput.focus();
                updateModalContent(true, false);
            });
            modalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearTimeout(modalDebounce);
                navigateToCatalogExplicit(modalInput.value.trim(), modalState.catId);
            });
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeAllSearchPanels();
            });
            searchModalBackdrop.addEventListener('click', (e) => {
                if (e.target === searchModalBackdrop && (Date.now() - modalOpenedAt > 220)) {
                    closeAllSearchPanels();
                }
            });

            searchModalBackdrop._openWithQuery = (initialQ, initialCatId) => {
                modalOpenedAt = Date.now();
                populateCategorySelects();
                const cfg = getGlobalSearchConfig();
                modalInput.placeholder = cfg.placeholder || 'Buscar productos...';
                const submitLbl = modalForm.querySelector('.sv-search-submit-label');
                if (submitLbl) submitLbl.textContent = cfg.buttonLabel || 'Buscar';
                modalCatSelect.classList.toggle('hidden', cfg.categoryScope !== 'select_left');

                if (initialQ !== undefined) modalInput.value = initialQ;
                if (initialCatId !== undefined) {
                    modalState.catId = initialCatId;
                    modalCatSelect.value = initialCatId;
                }
                searchModalBackdrop.classList.add('is-open');
                document.body.classList.add('overflow-hidden');
                updateModalContent(true, Boolean(modalInput.value.trim()));
                setTimeout(() => {
                    try { modalInput.focus({ preventScroll: true }); } catch (err) { modalInput.focus(); }
                }, 40);
            };

            searchModalBackdrop._refreshLive = () => {
                if (searchModalBackdrop.classList.contains('is-open')) {
                    updateModalContent(true, Boolean(modalInput.value.trim()));
                }
            };

            return searchModalBackdrop;
        }

        function shouldUseFullscreenModal(cfg) {
            if (cfg.mode === 'fullscreen' || cfg.navbarVariant === 'modal_trigger') {
                return true;
            }
            const isMobileViewport = window.innerWidth < 768;
            if (isMobileViewport && cfg.mobileMode === 'fullscreen' && cfg.mode !== 'traditional') {
                return true;
            }
            return false;
        }

        function openFullscreenModal(initialQ, initialCatId) {
            const modal = ensureFullscreenModalMounted();
            if (modal && typeof modal._openWithQuery === 'function') {
                modal._openWithQuery(initialQ, initialCatId);
            }
        }

        function closeAllSearchPanels() {
            document.querySelectorAll('.sv-search-panel-host').forEach(h => {
                h.innerHTML = '';
            });
            const expandBar = document.getElementById('sv-nav-search-expand');
            if (expandBar) expandBar.classList.add('hidden');
            const triggerBtn = document.getElementById('sv-nav-search-trigger');
            if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
            if (searchModalBackdrop && searchModalBackdrop.classList.contains('is-open')) {
                searchModalBackdrop.classList.remove('is-open');
                if (!document.querySelector('.sv-filter-drawer-backdrop.is-open')) {
                    document.body.classList.remove('overflow-hidden');
                }
            }
        }

        function bindFormInstance(formEl) {
            if (!formEl || formEl.dataset.svSearchBound === 'true') return;
            formEl.dataset.svSearchBound = 'true';

            const inputEl = formEl.querySelector('input[name="q"]');
            const catSelect = formEl.querySelector('.sv-search-cat-select');
            const clearBtn = formEl.querySelector('.sv-search-clear-btn');
            const hostEl = formEl.querySelector('.sv-search-panel-host');
            if (!inputEl) return;

            let debounceTimer = null;
            const formState = {
                catId: catSelect ? catSelect.value : '',
                adv: createEmptyAdvState()
            };

            const updateClearVisibility = () => {
                if (clearBtn) {
                    clearBtn.classList.toggle('hidden', !inputEl.value.trim());
                }
            };

            const runPanelQuery = (immediate, forceExecute) => {
                clearTimeout(debounceTimer);
                const cfg = getGlobalSearchConfig();
                updateClearVisibility();
                if (!cfg.enabled || !hostEl) return;

                if (cfg.mode === 'traditional') {
                    hostEl.innerHTML = '';
                    return;
                }

                const q = inputEl.value.trim();
                const shouldShowResults = forceExecute
                    || q.length >= cfg.minChars
                    || Boolean(formState.catId)
                    || hasActiveAdvCriteria(formState.adv);

                if (!shouldShowResults) {
                    const isPanelAlreadyOpen = hostEl.innerHTML.trim() !== '';
                    if ((cfg.mode === 'predictive' || cfg.advancedEnabled) && (document.activeElement === inputEl || isPanelAlreadyOpen)) {
                        hostEl.innerHTML = renderInitialSuggestionsHtml(cfg, formState.catId, formState.adv, false);
                        bindContainerPanelEvents(hostEl, inputEl, catSelect, formState, runPanelQuery);
                    } else if (formState.adv.open) {
                        hostEl.innerHTML = renderInitialSuggestionsHtml(cfg, formState.catId, formState.adv, false);
                        bindContainerPanelEvents(hostEl, inputEl, catSelect, formState, runPanelQuery);
                    } else {
                        hostEl.innerHTML = '';
                    }
                    return;
                }

                const exec = () => {
                    ensureIndexHydrated().then(() => {
                        const results = queryIndex(q, formState.catId, cfg, formState.adv);
                        hostEl.innerHTML = renderResultsPanelHtml(q, formState.catId, results, cfg, formState.adv, false);
                        bindContainerPanelEvents(hostEl, inputEl, catSelect, formState, runPanelQuery);
                    });
                };

                if (immediate || cfg.debounceMs <= 0) {
                    exec();
                } else {
                    debounceTimer = setTimeout(exec, cfg.debounceMs);
                }
            };

            // Abrir el modal de pantalla completa en el evento click (después de mouseup) para que no se cierre al soltar el botón
            inputEl.addEventListener('click', (e) => {
                const cfg = getGlobalSearchConfig();
                if (!cfg.enabled || !shouldUseFullscreenModal(cfg)) return;
                e.preventDefault();
                e.stopPropagation();
                inputEl.blur();
                openFullscreenModal(inputEl.value.trim(), formState.catId);
            });

            inputEl.addEventListener('focus', () => {
                const cfg = getGlobalSearchConfig();
                if (shouldUseFullscreenModal(cfg)) {
                    return;
                }
                ensureIndexHydrated().then(() => {
                    if (cfg.mode === 'predictive' || cfg.advancedEnabled || (cfg.mode === 'instant' && inputEl.value.trim().length >= cfg.minChars)) {
                        runPanelQuery(true, false);
                    }
                });
            });

            inputEl.addEventListener('input', () => {
                updateClearVisibility();
                runPanelQuery(false);
            });

            if (catSelect) {
                catSelect.addEventListener('change', () => {
                    formState.catId = catSelect.value || '';
                    if (inputEl.value.trim().length >= getGlobalSearchConfig().minChars || hasActiveAdvCriteria(formState.adv)) {
                        runPanelQuery(true);
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputEl.value = '';
                    updateClearVisibility();
                    if (!shouldUseFullscreenModal(getGlobalSearchConfig())) {
                        inputEl.focus();
                        runPanelQuery(true);
                    }
                });
            }

            formEl.addEventListener('submit', (e) => {
                e.preventDefault();
                clearTimeout(debounceTimer);
                const cfg = getGlobalSearchConfig();
                if (shouldUseFullscreenModal(cfg) && !inputEl.value.trim()) {
                    openFullscreenModal('', formState.catId);
                    return;
                }
                navigateToCatalogExplicit(inputEl.value.trim(), formState.catId);
            });

            updateClearVisibility();
        }

        function syncAllSearchFormsConfig() {
            const cfg = getGlobalSearchConfig();
            populateCategorySelects();

            document.querySelectorAll('#storeNavbar form.sv-nav__search, #mobile-menu form').forEach(form => {
                const input = form.querySelector('input[name="q"]');
                if (input) {
                    input.placeholder = cfg.placeholder || 'Buscar productos...';
                }
                const btnLabel = form.querySelector('.sv-search-submit-label');
                if (btnLabel) {
                    btnLabel.textContent = cfg.buttonLabel || 'Buscar';
                }
                const catSelect = form.querySelector('.sv-search-cat-select');
                if (catSelect) {
                    catSelect.classList.toggle('hidden', cfg.categoryScope !== 'select_left');
                }
                const clearBtn = form.querySelector('.sv-search-clear-btn');
                if (clearBtn && input) {
                    clearBtn.classList.toggle('hidden', !input.value.trim());
                }
            });

            if (searchModalBackdrop) {
                const modalInput = searchModalBackdrop.querySelector('input[name="q"]');
                const modalClear = searchModalBackdrop.querySelector('.sv-search-clear-btn');
                const modalCat = searchModalBackdrop.querySelector('.sv-search-cat-select');
                const modalBtnLbl = searchModalBackdrop.querySelector('.sv-search-submit-label');
                if (modalInput) modalInput.placeholder = cfg.placeholder || 'Buscar productos...';
                if (modalBtnLbl) modalBtnLbl.textContent = cfg.buttonLabel || 'Buscar';
                if (modalCat) modalCat.classList.toggle('hidden', cfg.categoryScope !== 'select_left');
                if (modalClear && modalInput) modalClear.classList.toggle('hidden', !modalInput.value.trim());
            }

            const triggerLabel = document.querySelector('#sv-nav-search-trigger .sv-nav__search-trigger-label');
            if (triggerLabel) {
                triggerLabel.textContent = cfg.placeholder || 'Buscar...';
            }
        }

        function initNavbarSearchTriggers() {
            const triggerBtn = document.getElementById('sv-nav-search-trigger');
            const expandBar = document.getElementById('sv-nav-search-expand');
            if (!triggerBtn || triggerBtn.dataset.svTriggerBound === 'true') return;
            triggerBtn.dataset.svTriggerBound = 'true';

            triggerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const cfg = getGlobalSearchConfig();
                if (shouldUseFullscreenModal(cfg)) {
                    openFullscreenModal('', '');
                    return;
                }
                if (!expandBar) return;
                const willOpen = expandBar.classList.contains('hidden');
                expandBar.classList.toggle('hidden', !willOpen);
                triggerBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                if (willOpen) {
                    const expInput = expandBar.querySelector('input[name="q"]');
                    if (expInput) {
                        setTimeout(() => expInput.focus(), 30);
                    }
                }
            });

            const closeExpandBtn = expandBar ? expandBar.querySelector('.sv-search-expand-close') : null;
            if (closeExpandBtn) {
                closeExpandBtn.addEventListener('click', () => {
                    closeAllSearchPanels();
                });
            }
        }

        function init(metadata) {
            currentMetadata = metadata || loadCatalogMetadata();
            indexedProducts = buildIndexedProducts(currentMetadata);
            const cfg = getGlobalSearchConfig();
            lastSearchMode = cfg.mode;
            lastNavbarVariant = cfg.navbarVariant;

            ensureFullscreenModalMounted();
            syncAllSearchFormsConfig();
            initNavbarSearchTriggers();

            document.querySelectorAll('#storeNavbar form.sv-nav__search, #mobile-menu form').forEach(bindFormInstance);
        }

        function refreshFromEditor() {
            const cfg = getGlobalSearchConfig();
            const modeJustChanged = lastSearchMode !== null && lastSearchMode !== cfg.mode;
            const variantJustChanged = lastNavbarVariant !== null && lastNavbarVariant !== cfg.navbarVariant;
            lastSearchMode = cfg.mode;
            lastNavbarVariant = cfg.navbarVariant;

            syncAllSearchFormsConfig();

            if (!cfg.enabled) {
                closeAllSearchPanels();
                return;
            }

            // Si el vendedor acaba de elegir "Pantalla Completa" o "Botón / Lupa que abre buscador amplio" en el editor,
            // mostrar inmediatamente el overlay para que vea y personalice el resultado sin tener que forzarlo
            if ((modeJustChanged && cfg.mode === 'fullscreen') || (variantJustChanged && cfg.navbarVariant === 'modal_trigger')) {
                document.querySelectorAll('.sv-search-panel-host').forEach(h => { h.innerHTML = ''; });
                openFullscreenModal('', '');
                return;
            }

            // Si cambió desde Pantalla Completa hacia otra modalidad, cerrar el modal de pantalla completa
            if (modeJustChanged && cfg.mode !== 'fullscreen' && searchModalBackdrop && searchModalBackdrop.classList.contains('is-open')) {
                closeAllSearchPanels();
            }

            if (searchModalBackdrop && searchModalBackdrop.classList.contains('is-open')) {
                if (cfg.mode === 'traditional') {
                    closeAllSearchPanels();
                } else if (typeof searchModalBackdrop._refreshLive === 'function') {
                    searchModalBackdrop._refreshLive();
                }
                return;
            }

            const openHost = Array.from(document.querySelectorAll('.sv-search-panel-host')).find(h => h.innerHTML.trim() !== '');
            if (openHost) {
                const form = openHost.closest('form');
                const input = form ? form.querySelector('input[name="q"]') : null;
                if (input) {
                    input.dispatchEvent(new Event('input'));
                }
            }
        }

        return {
            init,
            refresh: refreshFromEditor,
            openModal: openFullscreenModal,
            closeAll: closeAllSearchPanels
        };
    })();

    let activeInstances = [];

    function initAllCatalogs() {
        document.querySelectorAll('.sv-filter-drawer-backdrop').forEach(el => el.remove());
        activeInstances = [];

        const metadata = loadCatalogMetadata();
        SearchEngine.init(metadata);

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
        // Si el elemento clicado fue re-renderizado dentro del panel o el modal de pantalla completa está activo, no cerrar desde aquí
        if (!e.target || !document.body.contains(e.target)) return;
        const modalEl = document.getElementById('sv-search-fullscreen-backdrop');
        if (modalEl && modalEl.classList.contains('is-open')) return;

        if (!e.target.closest('.sv-nav__search, .sv-nav__search-expand, .sv-nav__search-trigger, .sv-search-modal')) {
            SearchEngine.closeAll();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.sv-filter-drawer-backdrop.is-open').forEach(el => {
                el.classList.remove('is-open');
                el.classList.add('hidden');
            });
            document.body.classList.remove('overflow-hidden');
            SearchEngine.closeAll();
        }
    });

    document.addEventListener('DOMContentLoaded', initAllCatalogs);
    document.addEventListener('storevo:filter-config-updated', () => {
        activeInstances.forEach(inst => inst.refreshConfig(true));
        SearchEngine.refresh();
    });
    document.addEventListener('storevo:search-config-updated', () => {
        activeInstances.forEach(inst => inst.refreshConfig(true));
        SearchEngine.refresh();
    });

    const ProductGridController = {
        stepCarousel: function (btn, dir) {
            const shell = btn ? btn.closest('.sv-pg-carousel-shell') : null;
            const track = shell ? shell.querySelector('.sv-catalog-grid[data-display-mode="carousel"]') : null;
            if (!track) return;
            const stepPx = Math.max(260, Math.round(track.clientWidth * 0.82));
            track.scrollBy({ left: dir * stepPx, behavior: 'smooth' });
        },
        switchTab: function (btn) {
            if (!btn) return;
            const tabId = btn.getAttribute('data-pg-tab-btn') || '';
            const sectionEl = btn.closest('.storevo-theme-section, section') || document;
            const navEl = btn.closest('.sv-pg-tabs-nav');
            if (navEl) {
                navEl.querySelectorAll('.sv-pg-tab-btn').forEach(b => {
                    const active = b === btn;
                    b.classList.toggle('is-active', active);
                    b.setAttribute('aria-selected', active ? 'true' : 'false');
                });
            }
            const viewAllLink = sectionEl.querySelector('.sv-pg-view-all-link');
            const tabHref = btn.getAttribute('data-view-all-href');
            if (viewAllLink && tabHref) {
                viewAllLink.setAttribute('href', tabHref);
            }
            const gridEl = sectionEl.querySelector('.sv-catalog-grid');
            if (gridEl && gridEl.getAttribute('data-display-mode') === 'carousel') {
                gridEl.scrollTo({ left: 0, behavior: 'smooth' });
            }
            if (sectionEl._svCatalogInstance && typeof sectionEl._svCatalogInstance.setActiveTab === 'function') {
                sectionEl._svCatalogInstance.setActiveTab(tabId);
                return;
            }
            if (!gridEl) return;
            let visibleCount = 0;
            const cards = Array.from(gridEl.querySelectorAll('.product-card'));
            cards.forEach(card => {
                const match = card.classList.contains('sv-tab-card-' + tabId);
                card.classList.toggle('hidden', !match);
                if (match) visibleCount++;
            });
            const quickSortSel = sectionEl.querySelector('.sv-pg-quick-sort');
            if (quickSortSel && quickSortSel.value) {
                this.quickSort(quickSortSel);
            }
            const emptyTabEl = sectionEl.querySelector('.sv-pg-tab-empty');
            if (emptyTabEl) {
                emptyTabEl.classList.toggle('hidden', visibleCount > 0);
            }
        },
        quickSort: function (selectEl) {
            if (!selectEl) return;
            const gridId = selectEl.getAttribute('data-target-grid');
            const sectionEl = selectEl.closest('.storevo-theme-section, section') || document;
            const gridEl = (gridId && document.getElementById(gridId)) || sectionEl.querySelector('.sv-catalog-grid');
            if (!gridEl) return;
            const sortVal = selectEl.value || 'default';
            const cards = Array.from(gridEl.querySelectorAll('.product-card'));
            cards.sort((a, b) => {
                const priceA = parseFloat(a.getAttribute('data-price') || '0') || 0;
                const priceB = parseFloat(b.getAttribute('data-price') || '0') || 0;
                if (sortVal === 'price_asc') return priceA - priceB;
                if (sortVal === 'price_desc') return priceB - priceA;
                if (sortVal === 'discount_desc') {
                    const origA = parseFloat(a.getAttribute('data-original-price') || '0') || 0;
                    const origB = parseFloat(b.getAttribute('data-original-price') || '0') || 0;
                    const pctA = (origA > priceA && origA > 0) ? ((origA - priceA) / origA) : 0;
                    const pctB = (origB > priceB && origB > 0) ? ((origB - priceB) / origB) : 0;
                    return pctB - pctA;
                }
                if (sortVal === 'name_asc') {
                    const nameA = (a.getAttribute('data-name') || '').toLowerCase();
                    const nameB = (b.getAttribute('data-name') || '').toLowerCase();
                    return nameA.localeCompare(nameB, 'es');
                }
                const idxA = parseInt(a.getAttribute('data-index') || '0', 10) || 0;
                const idxB = parseInt(b.getAttribute('data-index') || '0', 10) || 0;
                return idxA - idxB;
            });
            cards.forEach(c => gridEl.appendChild(c));
        }
    };

    window.StorevoProductGrid = ProductGridController;

    Storevo.Catalog = {
        init: initAllCatalogs,
        refresh: () => {
            activeInstances.forEach(inst => inst.refreshConfig(true));
            SearchEngine.refresh();
        }
    };
    Storevo.Search = SearchEngine;
})();