// Namespace global de Storevo
window.Storevo = window.Storevo || {};

// Namespacing por tenant para aislar datos entre distintas tiendas en el mismo navegador
if (!Storevo.getTenantKey) {
    Storevo.getTenantKey = function(baseKey) {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        return baseKey + '_' + (match ? match[1] : 'default');
    };
}

Storevo.Navigation = {
    sections: ['products', 'orders', 'customers'],

    getStateKey: function(section) {
        return Storevo.getTenantKey('storevo_listing_state_' + section);
    },

    // Inyecta los filtros recordados SOLO en botones de retorno limpios (sin sobrescribir enlaces con ?categoryId=...)
    syncReturnLinks: function() {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        if (!match) return;
        const slug = match[1];

        Storevo.Navigation.sections.forEach(section => {
            const basePath = `/dashboard/${slug}/${section}`;
            const savedQuery = sessionStorage.getItem(Storevo.Navigation.getStateKey(section));

            document.querySelectorAll(`a[href^="${basePath}"]`).forEach(link => {
                if (link.hasAttribute('data-clear-all-filters')
                    || link.hasAttribute('data-direct-filter')
                    || link.getAttribute('title') === 'Borrar todos los filtros') {
                    return;
                }

                const url = new URL(link.href, window.location.origin);

                if (url.pathname === basePath && (!url.search || link.dataset.hydratedReturn === 'true')) {
                    link.dataset.hydratedReturn = 'true';
                    link.setAttribute('href', savedQuery ? `${basePath}?${savedQuery}` : basePath);
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', Storevo.Navigation.syncReturnLinks);

/**
 * Storevo.AdminUI - Gestión de Modo Claro/Oscuro y Menú Lateral Contraíble del Dashboard
 */
Storevo.AdminUI = (function() {
    const THEME_KEY = 'storevo_admin_theme';
    const SIDEBAR_KEY = 'storevo_admin_sidebar_collapsed';
    let tooltipEl = null;

    function getTheme() {
        return document.documentElement.getAttribute('data-admin-theme') === 'light' ? 'light' : 'dark';
    }

    function applyTheme(theme, persist = true) {
        const normalized = theme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-admin-theme', normalized);
        if (persist) {
            try { localStorage.setItem(THEME_KEY, normalized); } catch (e) {}
        }
        syncControlStates();
    }

    function toggleTheme() {
        const next = getTheme() === 'light' ? 'dark' : 'light';
        applyTheme(next, true);
    }

    function isCollapsed() {
        return document.documentElement.getAttribute('data-sidebar-collapsed') === 'true';
    }

    function setSidebarCollapsed(collapsed, persist = true) {
        const val = Boolean(collapsed);
        document.documentElement.setAttribute('data-sidebar-collapsed', val ? 'true' : 'false');
        if (persist) {
            try { localStorage.setItem(SIDEBAR_KEY, val ? 'true' : 'false'); } catch (e) {}
        }
        hideTooltip();
        syncControlStates();
    }

    function toggleSidebar() {
        setSidebarCollapsed(!isCollapsed(), true);
    }

    function openMobileSidebar() {
        document.documentElement.setAttribute('data-sidebar-mobile-open', 'true');
        document.body.classList.add('overflow-hidden');
        syncControlStates();
    }

    function closeMobileSidebar() {
        document.documentElement.removeAttribute('data-sidebar-mobile-open');
        document.body.classList.remove('overflow-hidden');
        syncControlStates();
    }

    function handleTopbarSidebarBtn() {
        if (window.innerWidth < 768) {
            const isOpen = document.documentElement.getAttribute('data-sidebar-mobile-open') === 'true';
            if (isOpen) closeMobileSidebar();
            else openMobileSidebar();
        } else {
            toggleSidebar();
        }
    }

    function syncControlStates() {
        const currentTheme = getTheme();
        const themeBtn = document.getElementById('admin-theme-toggle');
        const themeLabel = document.getElementById('admin-theme-label');
        if (themeBtn) {
            const labelText = currentTheme === 'light' ? 'Modo oscuro' : 'Modo claro';
            themeBtn.setAttribute('aria-pressed', currentTheme === 'light' ? 'true' : 'false');
            themeBtn.setAttribute('title', `Cambiar a ${labelText.toLowerCase()}`);
            if (themeLabel) themeLabel.textContent = labelText;
        }

        const collapsed = isCollapsed();
        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        const topbarBtn = document.getElementById('topbar-sidebar-toggle');
        if (collapseBtn) {
            collapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            collapseBtn.setAttribute('data-tooltip', collapsed ? 'Expandir menú' : 'Contraer menú');
        }
        if (topbarBtn) {
            const isMobile = window.innerWidth < 768;
            const expanded = isMobile
                ? document.documentElement.getAttribute('data-sidebar-mobile-open') === 'true'
                : !collapsed;
            topbarBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
    }

    function ensureTooltip() {
        if (tooltipEl && document.body.contains(tooltipEl)) return tooltipEl;
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'adm-sidebar-tooltip';
        tooltipEl.setAttribute('role', 'tooltip');
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    }

    function showTooltipFor(targetEl) {
        if (window.innerWidth < 768 || !isCollapsed()) return;
        const text = targetEl.getAttribute('data-tooltip');
        if (!text) return;

        const tip = ensureTooltip();
        tip.textContent = text;
        const rect = targetEl.getBoundingClientRect();
        const top = Math.round(rect.top + (rect.height / 2) - 14);
        const left = Math.round(rect.right + 10);
        tip.style.top = `${Math.max(8, top)}px`;
        tip.style.left = `${left}px`;
        tip.classList.add('is-visible');
    }

    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.classList.remove('is-visible');
        }
    }

    function init() {
        const sidebar = document.getElementById('dashboard-sidebar');
        if (!sidebar) return;

        syncControlStates();

        sidebar.querySelectorAll('.adm-nav-link').forEach(link => {
            link.addEventListener('mouseenter', () => showTooltipFor(link));
            link.addEventListener('mouseleave', hideTooltip);
            link.addEventListener('focus', () => showTooltipFor(link));
            link.addEventListener('blur', hideTooltip);
            link.addEventListener('click', () => {
                hideTooltip();
                if (window.innerWidth < 768 && link.tagName === 'A') {
                    closeMobileSidebar();
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.documentElement.getAttribute('data-sidebar-mobile-open') === 'true') {
                closeMobileSidebar();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && document.documentElement.hasAttribute('data-sidebar-mobile-open')) {
                closeMobileSidebar();
            }
            hideTooltip();
        });
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        toggleTheme,
        applyTheme,
        toggleSidebar,
        setSidebarCollapsed,
        openMobileSidebar,
        closeMobileSidebar,
        handleTopbarSidebarBtn
    };
})();

/**
 * Storevo.Router - Motor SPA con Caché Persistente (Stale-While-Revalidate),
 * Pre-carga Proactiva de Navbar e Hidratación Síncrona en 1 solo frame (Cero Parpadeos).
 */
Storevo.Router = (function() {
    // Tiempo en que una página en memoria se considera fresca sin revalidar (90s)
    const CACHE_FRESH_TTL_MS = 90000;
    // Tiempo máximo en que se sirve al instante desde memoria mientras se revalida en segundo plano (5 min)
    const CACHE_MAX_STALE_MS = 300000;
    const CACHE_MAX_ENTRIES = 40;
    // La barra superior solo aparece si una petición de red real tarda más de 180ms
    const PROGRESS_DELAY_MS = 180;

    let initialized = false;
    let sandboxInstalled = false;
    let activeController = null;
    let progressBar = null;
    let progressTimer = null;
    let isCollectingPageResources = false;

    // Caché persistente de documentos HTML y deduplicación de peticiones en vuelo
    const pageCache = new Map();
    const inFlightRequests = new Map();
    const scrollPositions = new Map();
    const loadedExternalScripts = new Set();

    // Módulos conocidos que se re-hidratan sincrónicamente en memoria (0ms) sin re-descargar por red
    const IN_MEMORY_REINIT_MODULES = [
        '/js/storevo.js',
        '/js/ui/navbar.js',
        '/js/ui/navbarStyle.js',
        '/js/ui/toast.js',
        '/js/ui/modal.js',
        '/js/ui/form.js',
        '/js/modules/gallery.js',
        '/js/modules/cart.js',
        '/js/modules/wishlist.js',
        '/js/modules/storeCatalog.js',
        '/js/modules/productDetail.js'
    ];

    let pageIntervals = [];
    let pageTimeouts = [];
    let pageListeners = [];

    const nativeSetInterval = window.setInterval.bind(window);
    const nativeClearInterval = window.clearInterval.bind(window);
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeDocAddEvent = document.addEventListener.bind(document);
    const nativeDocRemoveEvent = document.removeEventListener.bind(document);
    const nativeWinAddEvent = window.addEventListener.bind(window);
    const nativeWinRemoveEvent = window.removeEventListener.bind(window);

    function getStoreSlug() {
        const bridge = document.getElementById('storevo-navbar-advanced-bridge');
        if (bridge && bridge.getAttribute('data-slug')) {
            return bridge.getAttribute('data-slug');
        }
        const m = window.location.pathname.match(/^\/s\/([^/?#]+)/);
        return m ? m[1] : '';
    }

    function isPreviewMode() {
        const bridge = document.getElementById('storevo-navbar-advanced-bridge');
        if (bridge && bridge.getAttribute('data-is-preview') === 'true') return true;
        const params = new URLSearchParams(window.location.search);
        return params.has('preview');
    }

    function normalizeUrl(rawUrl) {
        try {
            const u = new URL(rawUrl, window.location.origin);
            if (isPreviewMode() && u.pathname.startsWith('/s/') && !u.searchParams.has('preview')) {
                const currentPreview = new URLSearchParams(window.location.search).get('preview') || 'draft';
                u.searchParams.set('preview', currentPreview);
            }
            return u;
        } catch (e) {
            return null;
        }
    }

    // Clave canónica de caché (ignora el hash #ancla)
    function getCacheKey(urlInput) {
        try {
            const u = (urlInput instanceof URL) ? urlInput : new URL(urlInput, window.location.origin);
            return u.origin + u.pathname.replace(/\/+$/, '') + u.search;
        } catch (e) {
            return String(urlInput || '');
        }
    }

    function isEligibleStoreUrl(urlObj) {
        if (!urlObj || urlObj.origin !== window.location.origin) return false;
        const slug = getStoreSlug();
        if (!slug) return false;

        const basePrefix = `/s/${slug}`;
        const path = urlObj.pathname;
        if (path !== basePrefix && !path.startsWith(basePrefix + '/')) return false;

        const subPath = path.slice(basePrefix.length);
        if (
            subPath.startsWith('/checkout') ||
            subPath.startsWith('/cart/checkout') ||
            subPath.startsWith('/order-result') ||
            subPath.startsWith('/order-success') ||
            subPath.startsWith('/order-failed') ||
            subPath.startsWith('/order-whatsapp') ||
            subPath.startsWith('/api/')
        ) {
            return false;
        }
        return true;
    }

    function isCacheableUrl(urlObj) {
        if (!isEligibleStoreUrl(urlObj)) return false;
        // En el Editor Visual no cacheamos para reflejar siempre los cambios del borrador al instante
        if (isPreviewMode()) return false;
        const slug = getStoreSlug();
        const subPath = urlObj.pathname.slice(`/s/${slug}`.length);
        if (subPath.startsWith('/cart') || subPath.startsWith('/wishlist')) {
            return false;
        }
        return true;
    }

    function storeInCache(urlObj, html) {
        if (!html || !isCacheableUrl(urlObj)) return;
        const key = getCacheKey(urlObj);

        if (pageCache.has(key)) {
            pageCache.delete(key);
        } else if (pageCache.size >= CACHE_MAX_ENTRIES) {
            const oldestKey = pageCache.keys().next().value;
            if (oldestKey) pageCache.delete(oldestKey);
        }

        pageCache.set(key, {
            html: html,
            timestamp: Date.now()
        });
    }

    function ensureProgressBar() {
        if (progressBar && document.body.contains(progressBar)) return progressBar;
        progressBar = document.createElement('div');
        progressBar.className = 'sv-route-progress';
        document.body.appendChild(progressBar);
        return progressBar;
    }

    function startProgress() {
        clearTimeout(progressTimer);
        progressTimer = nativeSetTimeout(() => {
            const bar = ensureProgressBar();
            bar.classList.add('is-active');
            bar.style.transform = 'scaleX(0.35)';
            nativeSetTimeout(() => {
                if (bar.classList.contains('is-active')) {
                    bar.style.transform = 'scaleX(0.78)';
                }
            }, 150);
        }, PROGRESS_DELAY_MS);
    }

    function finishProgress() {
        clearTimeout(progressTimer);
        if (!progressBar || !progressBar.classList.contains('is-active')) return;
        progressBar.style.transform = 'scaleX(1)';
        nativeSetTimeout(() => {
            if (!progressBar) return;
            progressBar.classList.remove('is-active');
            nativeSetTimeout(() => {
                if (progressBar && !progressBar.classList.contains('is-active')) {
                    progressBar.style.transform = 'scaleX(0)';
                }
            }, 180);
        }, 100);
    }
    // Scripts del layout que viven toda la sesión (puente del editor, motor del navbar,
    // storeCatalog.js) se marcan con data-sv-persistent. Sus listeners NO deben ser
    // recolectados como "recursos de página", o se borran en la primera navegación SPA.
    function isPersistentScriptRunning() {
        const cs = document.currentScript;
        return Boolean(cs && cs.hasAttribute && cs.hasAttribute('data-sv-persistent'));
    }

    function installResourceSandbox() {
        if (sandboxInstalled) return;
        sandboxInstalled = true;

        window.setInterval = function(fn, delay, ...args) {
            const id = nativeSetInterval(fn, delay, ...args);
            if (isCollectingPageResources) {
                pageIntervals.push(id);
            }
            return id;
        };

        window.setTimeout = function(fn, delay, ...args) {
            const id = nativeSetTimeout(fn, delay, ...args);
            if (isCollectingPageResources && Number(delay) > 1000) {
                pageTimeouts.push(id);
            }
            return id;
        };

        document.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded' && document.readyState !== 'loading') {
                if (typeof listener === 'function') {
                    const wasCollecting = isCollectingPageResources;
                    isCollectingPageResources = true;
                    try {
                        listener(new Event('DOMContentLoaded'));
                    } catch (err) {
                        console.error('[Storevo.Router] Error en callback DOMContentLoaded:', err);
                    } finally {
                        isCollectingPageResources = wasCollecting;
                    }
                }
                return;
            }
            if (isCollectingPageResources && typeof listener === 'function' && !isPersistentScriptRunning()) {
                pageListeners.push({ target: 'document', type, listener, options });
            }
            return nativeDocAddEvent(type, listener, options);
        };

        window.addEventListener = function(type, listener, options) {
            if (isCollectingPageResources && typeof listener === 'function' && !isPersistentScriptRunning()) {
                pageListeners.push({ target: 'window', type, listener, options });
            }
            return nativeWinAddEvent(type, listener, options);
        };
    }

    function cleanupCurrentPageResources() {
        pageIntervals.forEach(id => nativeClearInterval(id));
        pageIntervals = [];

        pageTimeouts.forEach(id => clearTimeout(id));
        pageTimeouts = [];

        pageListeners.forEach(item => {
            try {
                if (item.target === 'document') {
                    nativeDocRemoveEvent(item.type, item.listener, item.options);
                } else {
                    nativeWinRemoveEvent(item.type, item.listener, item.options);
                }
            } catch (e) {}
        });
        pageListeners = [];
    }

    function closeOpenMenusAndDrawers() {
        const navRoot = document.getElementById('storeNavbar');
        if (navRoot) {
            navRoot.querySelectorAll('.is-open, .sv-catalog-menu-open, .is-flyout-open').forEach(el => {
                el.classList.remove('is-open', 'sv-catalog-menu-open', 'is-flyout-open');
            });
        }
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileBackdrop = document.getElementById('mobile-menu-backdrop');
        if (mobileMenu && !mobileMenu.classList.contains('-translate-x-full')) {
            mobileMenu.classList.add('-translate-x-full');
        }
        if (mobileBackdrop && !mobileBackdrop.classList.contains('hidden')) {
            mobileBackdrop.classList.add('opacity-0', 'hidden');
        }
        document.querySelectorAll('.sv-nav-drawer-backdrop.is-open, .sv-filter-drawer-backdrop.is-open').forEach(el => {
            el.classList.remove('is-open');
        });
        document.body.classList.remove('overflow-hidden');
    }

    function syncNavbarActiveState(targetUrlObj) {
        if (window.Storevo && Storevo.UI && Storevo.UI.NavbarStyle && typeof Storevo.UI.NavbarStyle.syncActiveLinks === 'function') {
            Storevo.UI.NavbarStyle.syncActiveLinks(targetUrlObj);
        }

        const navRoot = document.getElementById('storeNavbar');
        if (!navRoot) return;
        const currentUrl = targetUrlObj || new URL(window.location.href);
        const currentQuery = currentUrl.searchParams.get('q') || '';
        navRoot.querySelectorAll('input[name="q"]').forEach(input => {
            if (document.activeElement !== input) {
                input.value = currentQuery;
            }
        });
    }

    function syncCountersAndBridgeFromDoc(doc, fromCache) {
        if (!doc) return;

        // Solo sobrescribir contadores del navbar si el HTML acaba de llegar fresco desde el servidor
        if (!fromCache) {
            ['navWishlistCounter', 'navCartCounter'].forEach(id => {
                const currentEl = document.getElementById(id);
                const nextEl = doc.getElementById(id);
                if (currentEl && nextEl) {
                    currentEl.textContent = nextEl.textContent;
                }
            });
        }

        const nextBridge = doc.getElementById('storevo-navbar-advanced-bridge');
        if (nextBridge) {
            const slug = getStoreSlug() || 'default';
            const catImgCacheKey = `storevo_cat_imgs_${slug}`;
            try {
                const cached = JSON.parse(sessionStorage.getItem(catImgCacheKey) || '{}');
                let updated = false;
                nextBridge.querySelectorAll('.sv-nav-cat-node').forEach(n => {
                    const id = n.getAttribute('data-id');
                    const img = n.getAttribute('data-img');
                    if (id && img && !cached[id]) {
                        cached[id] = img;
                        updated = true;
                    }
                });
                if (updated) {
                    sessionStorage.setItem(catImgCacheKey, JSON.stringify(cached));
                }
            } catch (e) {}
        }
    }

    function syncPreviewLinksInScope(scopeEl) {
        if (!isPreviewMode() || !scopeEl) return;
        const currentPreview = new URLSearchParams(window.location.search).get('preview') || 'draft';
        scopeEl.querySelectorAll('a[href^="/s/"]').forEach(link => {
            try {
                const u = new URL(link.getAttribute('href'), window.location.origin);
                u.searchParams.set('preview', currentPreview);
                link.setAttribute('href', u.pathname + u.search + u.hash);
            } catch (e) {}
        });
    }

    function notifyVisualEditorPageLoaded() {
        if (!isPreviewMode() || !window.parent || window.parent === window) return;

        const path = window.location.pathname || '';
        const params = new URLSearchParams(window.location.search);
        const explicitKey = document.body.getAttribute('data-editor-page-key');
        let detectedPage = 'home';

        const pageMatch = path.match(/\/page\/([^/?#]+)/);
        if (pageMatch && pageMatch[1]) {
            detectedPage = 'page:' + decodeURIComponent(pageMatch[1]);
        } else if (path.includes('/catalog')) {
            const catParam = params.get('category');
            detectedPage = (catParam && /^\d+$/.test(catParam.trim()))
                ? ('category:' + catParam.trim())
                : 'catalog';
        } else if (path.includes('/p/') || path.includes('/product-preview')) {
            detectedPage = 'product';
        } else if (/\/s\/[^/]+\/?$/.test(path)) {
            detectedPage = 'home';
        } else if (explicitKey && explicitKey.trim()) {
            detectedPage = explicitKey.trim();
        }

        document.body.setAttribute('data-editor-page-key', detectedPage);

        window.parent.postMessage({
            type: 'storevo:page-loaded',
            pageKey: detectedPage,
            url: window.location.pathname + window.location.search
        }, window.location.origin);
    }

    // Ejecución síncrona de scripts en el mismo frame (solo retorna Promise si aparece un script externo nuevo)
    function executeScriptsInContainerSyncOrAsync(container) {
        if (!container) return null;
        const scripts = Array.from(container.querySelectorAll('script'));
        const pendingExternalPromises = [];

        for (const oldScript of scripts) {
            const src = oldScript.getAttribute('src');
            const type = oldScript.getAttribute('type') || '';
            if (type && type !== 'text/javascript' && type !== 'application/javascript' && type !== 'module') {
                continue;
            }

            if (src) {
                const absUrl = new URL(src, window.location.origin);
                const cleanAbsHref = absUrl.origin + absUrl.pathname;

                const isKnownModule = IN_MEMORY_REINIT_MODULES.some(m => absUrl.pathname.endsWith(m));
                if (loadedExternalScripts.has(cleanAbsHref) && isKnownModule) {
                    continue;
                }

                pendingExternalPromises.push(new Promise((resolve) => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    loadedExternalScripts.add(cleanAbsHref);
                    isCollectingPageResources = true;
                    newScript.onload = () => {
                        isCollectingPageResources = false;
                        resolve();
                    };
                    newScript.onerror = () => {
                        isCollectingPageResources = false;
                        resolve();
                    };
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                }));
            } else {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                isCollectingPageResources = true;
                try {
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                } catch (err) {
                    console.error('[Storevo.Router] Error ejecutando script inline:', err);
                } finally {
                    isCollectingPageResources = false;
                }
            }
        }

        return pendingExternalPromises.length > 0 ? Promise.all(pendingExternalPromises) : null;
    }

    function reinitGlobalModules() {
        isCollectingPageResources = true;
        try {
            if (window.Storevo) {
                if (Storevo.UI) {
                    if (Storevo.UI.Gallery && typeof Storevo.UI.Gallery.init === 'function') Storevo.UI.Gallery.init();
                    if (Storevo.UI.Form && typeof Storevo.UI.Form.init === 'function') Storevo.UI.Form.init();
                    if (Storevo.UI.Modal && typeof Storevo.UI.Modal.init === 'function') Storevo.UI.Modal.init();
                }
                if (Storevo.Catalog && typeof Storevo.Catalog.init === 'function') Storevo.Catalog.init();
                if (Storevo.ProductDetail && typeof Storevo.ProductDetail.init === 'function') Storevo.ProductDetail.init();
                if (Storevo.Cart && typeof Storevo.Cart.init === 'function') Storevo.Cart.init();
                if (Storevo.Wishlist && typeof Storevo.Wishlist.init === 'function') Storevo.Wishlist.init();
            }
        } catch (e) {
            console.warn('[Storevo.Router] Aviso al re-hidratar módulos:', e);
        } finally {
            isCollectingPageResources = false;
        }
    }

    // Descarga desde red deduplicando peticiones simultáneas a la misma URL
    function fetchNetworkHtml(targetUrlObj, signal, isBackgroundPrefetch) {
        const key = getCacheKey(targetUrlObj);

        if (!signal && inFlightRequests.has(key)) {
            return inFlightRequests.get(key);
        }

        const reqPromise = fetch(targetUrlObj.href, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'X-Storevo-Navigation': isBackgroundPrefetch ? 'prefetch' : 'partial'
            },
            signal: signal
        }).then(async (response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            if (response.redirected && response.url) {
                const redirectedUrl = new URL(response.url, window.location.origin);
                if (!isEligibleStoreUrl(redirectedUrl)) {
                    if (!isBackgroundPrefetch) {
                        window.location.href = response.url;
                    }
                    return null;
                }
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/html')) {
                throw new Error('Respuesta no es HTML');
            }

            const html = await response.text();
            storeInCache(targetUrlObj, html);
            return html;
        }).finally(() => {
            inFlightRequests.delete(key);
        });

        if (!signal) {
            inFlightRequests.set(key, reqPromise);
        }

        return reqPromise;
    }

    // Obtiene el HTML desde caché persistente (0ms) o desde red
    async function resolvePageHtml(targetUrlObj, signal) {
        const key = getCacheKey(targetUrlObj);

        if (isCacheableUrl(targetUrlObj) && pageCache.has(key)) {
            const entry = pageCache.get(key);
            const age = Date.now() - entry.timestamp;

            if (age < CACHE_FRESH_TTL_MS) {
                return { html: entry.html, fromCache: true };
            }

            if (age < CACHE_MAX_STALE_MS) {
                // Stale-While-Revalidate: entregamos al instante y refrescamos en segundo plano
                fetchNetworkHtml(targetUrlObj, null, true).catch(() => {});
                return { html: entry.html, fromCache: true };
            }

            pageCache.delete(key);
        }

        startProgress();
        const html = await fetchNetworkHtml(targetUrlObj, signal, false);
        return { html: html, fromCache: false };
    }

    // Realiza el intercambio de DOM y la hidratación de filtros/variantes en un único frame síncrono
    function performSynchronousSwap(currentMain, nextDoc, targetUrl, options, fromCache) {
        const nextMain = nextDoc.getElementById('storevoMainContent') || nextDoc.querySelector('main');
        if (!nextMain) return false;

        // 1. Limpiar timers y listeners de la página saliente
        document.dispatchEvent(new CustomEvent('storevo:before-swap', { detail: { targetUrl: targetUrl.href } }));
        cleanupCurrentPageResources();

        // 2. Actualizar historial del navegador
        if (!options.popstate) {
            if (options.replace) {
                window.history.replaceState({ storevoSpa: true, url: targetUrl.href }, '', targetUrl.href);
            } else {
                window.history.pushState({ storevoSpa: true, url: targetUrl.href }, '', targetUrl.href);
            }
        }

        // 3. Actualizar título y metadatos básicos
        if (nextDoc.title) {
            document.title = nextDoc.title;
        }
        const nextBodyKey = nextDoc.body ? nextDoc.body.getAttribute('data-editor-page-key') : '';
        document.body.setAttribute('data-editor-page-key', nextBodyKey || '');

        // 4. Reemplazar el contenido de <main> y el contenedor de scripts de vista
        currentMain.innerHTML = nextMain.innerHTML;

        const currentScriptsBox = document.getElementById('storevo-page-scripts');
        const nextScriptsBox = nextDoc.getElementById('storevo-page-scripts');
        if (currentScriptsBox) {
            currentScriptsBox.innerHTML = nextScriptsBox ? nextScriptsBox.innerHTML : '';
        }

        // 5. Sincronizar contadores del navbar, enlaces activos y modo preview
        syncCountersAndBridgeFromDoc(nextDoc, fromCache);
        syncNavbarActiveState(targetUrl);
        syncPreviewLinksInScope(currentMain);

        // 6. Ejecutar scripts inline y re-hidratar módulos (Catálogo, Ficha, Carrito) SINCRÓNICAMENTE antes del pintado
        const p1 = executeScriptsInContainerSyncOrAsync(currentMain);
        const p2 = currentScriptsBox ? executeScriptsInContainerSyncOrAsync(currentScriptsBox) : null;

        const finalizeHydration = () => {
            reinitGlobalModules();
            notifyVisualEditorPageLoaded();

            // 7. Restaurar o posicionar scroll en el mismo frame ya hidratado
            if (options.popstate && scrollPositions.has(targetUrl.href)) {
                window.scrollTo({ top: scrollPositions.get(targetUrl.href), behavior: 'instant' });
            } else if (targetUrl.hash) {
                const hashTarget = document.getElementById(targetUrl.hash.slice(1)) || document.querySelector(targetUrl.hash);
                if (hashTarget) {
                    hashTarget.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'instant' });
            }

            document.dispatchEvent(new CustomEvent('storevo:page-load', {
                detail: { url: targetUrl.href, isPreview: isPreviewMode() }
            }));
        };

        if (p1 || p2) {
            Promise.all([p1, p2].filter(Boolean)).then(finalizeHydration);
        } else {
            finalizeHydration();
        }

        return true;
    }

    async function navigateTo(rawUrl, options = {}) {
        const targetUrl = normalizeUrl(rawUrl);
        if (!targetUrl || !isEligibleStoreUrl(targetUrl)) {
            window.location.href = rawUrl;
            return;
        }

        const targetHref = targetUrl.href;
        const currentMain = document.getElementById('storevoMainContent') || document.querySelector('main');
        if (!currentMain) {
            window.location.href = targetHref;
            return;
        }

        // Si el usuario hace clic en exactamente la misma URL actual (sin hash nuevo) y está en caché, solo hacer scroll arriba
        if (!options.popstate && ! options.replace && targetHref === window.location.href && !targetUrl.hash) {
            closeOpenMenusAndDrawers();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Actualizar la instantánea de la página actual en caché antes de salir (si aún no estaba)
        const currentUrlObj = normalizeUrl(window.location.href);
        if (currentUrlObj && isCacheableUrl(currentUrlObj) && !pageCache.has(getCacheKey(currentUrlObj))) {
            storeInCache(currentUrlObj, document.documentElement.outerHTML);
        }

        scrollPositions.set(window.location.href, window.scrollY || 0);

        if (activeController) {
            activeController.abort();
        }
        activeController = new AbortController();
        const signal = activeController.signal;

        closeOpenMenusAndDrawers();
        // Actualizamos de inmediato el indicador activo del Navbar para respuesta visual en 0ms
        syncNavbarActiveState(targetUrl);

        try {
            const { html, fromCache } = await resolvePageHtml(targetUrl, signal);
            if (html === null || signal.aborted) return;

            const parser = new DOMParser();
            const nextDoc = parser.parseFromString(html, 'text/html');

            const swapped = performSynchronousSwap(currentMain, nextDoc, targetUrl, options, fromCache);
            if (!swapped) {
                window.location.href = targetHref;
            }
        } catch (err) {
            if (err && err.name === 'AbortError') {
                return;
            }
            console.warn('[Storevo.Router] Fallback a navegación tradicional:', err);
            window.location.href = targetHref;
        } finally {
            if (!signal.aborted) {
                finishProgress();
            }
        }
    }

    function prefetchUrl(rawUrl) {
        const urlObj = normalizeUrl(rawUrl);
        if (!urlObj || !isCacheableUrl(urlObj)) return;

        const key = getCacheKey(urlObj);
        if (key === getCacheKey(new URL(window.location.href))) return;

        const existing = pageCache.get(key);
        if (existing && (Date.now() - existing.timestamp < CACHE_FRESH_TTL_MS)) return;

        fetchNetworkHtml(urlObj, null, true).catch(() => {});
    }

    // Pre-carga escalonada de los enlaces principales del Navbar cuando el navegador está libre
    function warmupNavbarRoutes() {
        if (isPreviewMode()) return;
        const navRoot = document.getElementById('storeNavbar');
        if (!navRoot) return;

        const priorityLinks = Array.from(
            navRoot.querySelectorAll('.sv-nav__menu > a.sv-nav__link, .sv-nav__menu > .nav-parent > a.sv-nav__link')
        );

        const urlsToWarm = [];
        const seenKeys = new Set([getCacheKey(new URL(window.location.href))]);

        priorityLinks.forEach(a => {
            const href = a.getAttribute('href');
            const u = normalizeUrl(href);
            if (!u || !isCacheableUrl(u)) return;
            const k = getCacheKey(u);
            if (!seenKeys.has(k)) {
                seenKeys.add(k);
                urlsToWarm.push(u.href);
            }
        });

        // Pre-cargar máximo las 8 rutas principales del menú superior, espaciadas cada 140ms
        urlsToWarm.slice(0, 8).forEach((href, idx) => {
            nativeSetTimeout(() => {
                prefetchUrl(href);
            }, 180 + (idx * 140));
        });
    }

    function invalidatePrefetchCache() {
        pageCache.clear();
    }

    if (/^\/s\/[^/]+/.test(window.location.pathname)) {
        installResourceSandbox();
        isCollectingPageResources = true;
        nativeWinAddEvent('load', function() {
            isCollectingPageResources = false;
        }, { once: true });
    }

    function init() {
        if (initialized) return;
        if (!/^\/s\/[^/]+/.test(window.location.pathname)) return;
        initialized = true;

        document.querySelectorAll('script[src]').forEach(s => {
            try {
                const u = new URL(s.getAttribute('src'), window.location.origin);
                loadedExternalScripts.add(u.origin + u.pathname);
            } catch (e) {}
        });

        installResourceSandbox();
        syncNavbarActiveState(new URL(window.location.href));

        // 1. Guardar la página inicial en caché y programar el warm-up de las rutas del Navbar
        const scheduleWarmup = () => {
            const initialUrl = normalizeUrl(window.location.href);
            if (initialUrl && isCacheableUrl(initialUrl)) {
                storeInCache(initialUrl, document.documentElement.outerHTML);
            }
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => warmupNavbarRoutes(), { timeout: 1200 });
            } else {
                nativeSetTimeout(warmupNavbarRoutes, 300);
            }
        };

        if (document.readyState === 'complete') {
            scheduleWarmup();
        } else {
            nativeWinAddEvent('load', scheduleWarmup, { once: true });
        }

        // 2. Interceptar clics en enlaces internos
        nativeWinAddEvent('click', function(e) {
            if (e.defaultPrevented) return;
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!anchor) return;

            if (
                anchor.hasAttribute('download') ||
                anchor.hasAttribute('data-no-spa') ||
                (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self')
            ) {
                return;
            }

            const rawHref = anchor.getAttribute('href') || '';
            if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
                return;
            }

            if (rawHref.startsWith('#')) {
                if (rawHref.length > 1) {
                    const hashId = rawHref.slice(1);
                    const hashTarget = document.getElementById(hashId);
                    if (hashTarget) {
                        e.preventDefault();
                        closeOpenMenusAndDrawers();
                        window.history.pushState(
                            { storevoSpa: true, url: window.location.pathname + window.location.search + rawHref },
                            '',
                            window.location.pathname + window.location.search + rawHref
                        );
                        hashTarget.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                return;
            }

            const targetUrl = normalizeUrl(rawHref);
            if (!targetUrl || !isEligibleStoreUrl(targetUrl)) return;

            const sameCleanPath = targetUrl.pathname.replace(/\/+$/, '') === window.location.pathname.replace(/\/+$/, '');
            if (sameCleanPath && targetUrl.search === window.location.search && targetUrl.hash) {
                const hashId = targetUrl.hash.slice(1);
                const hashTarget = hashId ? document.getElementById(hashId) : null;
                if (hashTarget) {
                    e.preventDefault();
                    closeOpenMenusAndDrawers();
                    const cleanHashUrl = window.location.pathname + window.location.search + targetUrl.hash;
                    window.history.pushState({ storevoSpa: true, url: cleanHashUrl }, '', cleanHashUrl);
                    hashTarget.scrollIntoView({ behavior: 'smooth' });
                }
                return;
            }

            e.preventDefault();
            navigateTo(targetUrl.href);
        });

        // 3. Interceptar formularios GET de búsqueda/filtrado
        nativeWinAddEvent('submit', function(e) {
            if (e.defaultPrevented) return;
            const form = e.target;
            if (!form || form.tagName !== 'FORM') return;

            const method = (form.getAttribute('method') || 'GET').toUpperCase();
            if (method !== 'GET' || form.hasAttribute('data-no-spa')) return;

            const actionAttr = form.getAttribute('action') || window.location.pathname;
            const targetUrl = normalizeUrl(actionAttr);
            if (!targetUrl || !isEligibleStoreUrl(targetUrl)) return;

            const formData = new FormData(form);
            targetUrl.search = '';
            for (const [key, value] of formData.entries()) {
                if (typeof value === 'string' && value.trim() !== '') {
                    targetUrl.searchParams.append(key, value.trim());
                }
            }
            if (isPreviewMode() && !targetUrl.searchParams.has('preview')) {
                const currentPreview = new URLSearchParams(window.location.search).get('preview') || 'draft';
                targetUrl.searchParams.set('preview', currentPreview);
            }

            e.preventDefault();
            navigateTo(targetUrl.href);
        });

        // 4. Botones Atrás / Adelante del navegador
        nativeWinAddEvent('popstate', function() {
            const targetUrl = new URL(window.location.href);
            if (isEligibleStoreUrl(targetUrl)) {
                navigateTo(targetUrl.href, { popstate: true });
            } else {
                window.location.reload();
            }
        });

        // 5. Prefetching instantáneo al presionar (pointerdown) y en hover (35ms)
        nativeDocAddEvent('pointerdown', function(e) {
            const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!anchor || anchor.hasAttribute('data-no-spa')) return;
            prefetchUrl(anchor.getAttribute('href'));
        }, { passive: true });

        if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
            let hoverTimer = null;
            nativeDocAddEvent('mouseover', function(e) {
                const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
                if (!anchor || anchor.hasAttribute('data-no-spa')) return;
                clearTimeout(hoverTimer);
                hoverTimer = nativeSetTimeout(() => {
                    prefetchUrl(anchor.getAttribute('href'));
                }, 35);
            }, { passive: true });
        }

        // 6. Invalidar caché si ocurre una mutación en carrito o favoritos
        const origFetch = window.fetch;
        if (typeof origFetch === 'function') {
            window.fetch = function(input, initOpts) {
                const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
                const method = (initOpts && initOpts.method ? initOpts.method : 'GET').toUpperCase();
                if (method !== 'GET' || urlStr.includes('/cart') || urlStr.includes('/wishlist')) {
                    invalidatePrefetchCache();
                }
                return origFetch.apply(this, arguments);
            };
        }
    }

    return {
        init: init,
        navigate: navigateTo,
        prefetch: prefetchUrl,
        invalidateCache: invalidatePrefetchCache,
        syncActiveLinks: syncNavbarActiveState
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.Router.init());
} else {
    Storevo.Router.init();
}