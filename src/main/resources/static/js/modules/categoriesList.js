window.Storevo = window.Storevo || {};

if (!Storevo.getTenantKey) {
    Storevo.getTenantKey = function(baseKey) {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        return baseKey + '_' + (match ? match[1] : 'default');
    };
}

Storevo.CategoriesList = {
    currentStatusFilter: 'all',

    getOpenStateKey: function() {
        return Storevo.getTenantKey('storevo_categories_open_ids');
    },

    getScrollStateKey: function() {
        return Storevo.getTenantKey('storevo_categories_scroll_top');
    },

    getFilterStateKey: function() {
        return Storevo.getTenantKey('storevo_categories_filter_state');
    },

    init: function() {
        this.roots = Array.from(document.querySelectorAll('details.cat-root'));
        if (!this.roots.length) return;

        this.searchInput = document.getElementById('categorySearchInput');
        this.clearSearchBtn = document.getElementById('clearCategorySearchBtn');
        this.noResultsBox = document.getElementById('noSearchResults');
        this.resetFiltersBtn = document.getElementById('btnResetCategoryFilters');
        this.expandAllBtn = document.getElementById('btnExpandAllCategories');
        this.collapseAllBtn = document.getElementById('btnCollapseAllCategories');
        this.statusBtns = Array.from(document.querySelectorAll('[data-cat-status-btn]'));

        // 1. Restaurar ramas abiertas, búsqueda/filtro y scroll previo
        this.restoreOpenBranches();
        this.restoreFilterState();
        this.restoreScrollPosition();

        // 2. Eventos de búsqueda profunda
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.applyFilters();
                this.saveFilterState();
            });
        }

        if (this.clearSearchBtn && this.searchInput) {
            this.clearSearchBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.applyFilters();
                this.saveFilterState();
                this.searchInput.focus();
            });
        }

        // 3. Píldoras de estado (Todas / Activas / Ocultas)
        this.statusBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentStatusFilter = btn.getAttribute('data-cat-status-btn') || 'all';
                this.updateStatusPillsUI();
                this.applyFilters();
                this.saveFilterState();
            });
        });

        if (this.resetFiltersBtn) {
            this.resetFiltersBtn.addEventListener('click', () => {
                if (this.searchInput) this.searchInput.value = '';
                this.currentStatusFilter = 'all';
                this.updateStatusPillsUI();
                this.applyFilters();
                this.saveFilterState();
            });
        }

        // 4. Botones Expandir todo / Contraer todo
        if (this.expandAllBtn) {
            this.expandAllBtn.addEventListener('click', () => {
                this.roots.forEach(d => d.setAttribute('open', ''));
                this.saveOpenBranches();
            });
        }

        if (this.collapseAllBtn) {
            this.collapseAllBtn.addEventListener('click', () => {
                this.roots.forEach(d => d.removeAttribute('open'));
                this.saveOpenBranches();
            });
        }

        // 5. Guardar estado cuando el usuario abre/cierra manualmente una categoría
        this.roots.forEach(details => {
            details.addEventListener('toggle', () => {
                const isFiltering = (this.searchInput && this.searchInput.value.trim() !== '') || this.currentStatusFilter !== 'all';
                if (!isFiltering) {
                    this.saveOpenBranches();
                }
            });
        });

        // 6. Guardar posición del scroll antes de enviar formularios de reordenar o activar/ocultar
        document.querySelectorAll('form.cat-state-form').forEach(form => {
            form.addEventListener('submit', () => {
                this.saveOpenBranches();
                this.saveScrollPosition();
            });
        });
    },

    updateStatusPillsUI: function() {
        this.statusBtns.forEach(btn => {
            const val = btn.getAttribute('data-cat-status-btn');
            if (val === this.currentStatusFilter) {
                btn.classList.add('bg-slate-800', 'text-white', 'shadow-sm', 'font-bold');
                btn.classList.remove('text-slate-400', 'font-medium');
            } else {
                btn.classList.remove('bg-slate-800', 'text-white', 'shadow-sm', 'font-bold');
                btn.classList.add('text-slate-400', 'font-medium');
            }
        });
    },

    matchesStatus: function(el) {
        if (this.currentStatusFilter === 'all') return true;
        const isActive = el.getAttribute('data-active') === 'true';
        return this.currentStatusFilter === 'active' ? isActive : !isActive;
    },

    matchesText: function(el, query) {
        if (!query) return true;
        const text = (el.getAttribute('data-cat-name') || '').toLowerCase();
        return text.includes(query);
    },

    // Buscador profundo: filtra Nivel 1, Nivel 2 y Nivel 3 ocultando ramas que no coincidan
    applyFilters: function() {
        const query = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        const isFiltering = query.length > 0 || this.currentStatusFilter !== 'all';

        if (this.clearSearchBtn) {
            this.clearSearchBtn.classList.toggle('hidden', query.length === 0);
        }

        let visibleRootCount = 0;

        this.roots.forEach(rootEl => {
            const rootMatchesText = this.matchesText(rootEl, query);
            const rootMatchesStatus = this.matchesStatus(rootEl);

            const subEls = Array.from(rootEl.querySelectorAll('.cat-sub'));
            let visibleSubCount = 0;

            subEls.forEach(subEl => {
                const subMatchesText = this.matchesText(subEl, query);
                const subMatchesStatus = this.matchesStatus(subEl);

                const subSubEls = Array.from(subEl.querySelectorAll('.cat-subsub'));
                let visibleSubSubCount = 0;

                subSubEls.forEach(subSubEl => {
                    const subSubMatchesText = this.matchesText(subSubEl, query);
                    const subSubMatchesStatus = this.matchesStatus(subSubEl);

                    // Nivel 3 es visible si coincide directamente, o si su padre (Nivel 2 o 1) coincidió por nombre y el Nivel 3 cumple el estado
                    const textOk = subSubMatchesText || subMatchesText || rootMatchesText;
                    const showSubSub = textOk && subSubMatchesStatus;

                    subSubEl.classList.toggle('hidden', !showSubSub);
                    if (showSubSub) visibleSubSubCount++;
                });

                // Nivel 2 es visible si tiene hijos Nivel 3 visibles, o si él mismo (o su raíz) coincide con texto y estado
                const subTextOk = subMatchesText || rootMatchesText;
                const showSub = visibleSubSubCount > 0 || (subTextOk && subMatchesStatus);

                subEl.classList.toggle('hidden', !showSub);
                if (showSub) visibleSubCount++;
            });

            const showRoot = visibleSubCount > 0 || (rootMatchesText && rootMatchesStatus);
            rootEl.classList.toggle('hidden', !showRoot);

            if (showRoot) {
                visibleRootCount++;
                if (isFiltering && visibleSubCount > 0) {
                    rootEl.setAttribute('open', '');
                }
            }
        });

        if (!isFiltering) {
            this.restoreOpenBranches();
        }

        if (this.noResultsBox) {
            this.noResultsBox.classList.toggle('hidden', !(isFiltering && visibleRootCount === 0));
        }
    },

    saveOpenBranches: function() {
        try {
            const openIds = this.roots
                .filter(d => d.hasAttribute('open'))
                .map(d => d.getAttribute('data-cat-id'));
            sessionStorage.setItem(this.getOpenStateKey(), JSON.stringify(openIds));
        } catch (e) {}
    },

    restoreOpenBranches: function() {
        try {
            const raw = sessionStorage.getItem(this.getOpenStateKey());
            if (!raw) return;
            const openIds = JSON.parse(raw);
            if (!Array.isArray(openIds)) return;

            this.roots.forEach(d => {
                const id = d.getAttribute('data-cat-id');
                if (openIds.includes(id)) {
                    d.setAttribute('open', '');
                } else {
                    d.removeAttribute('open');
                }
            });
        } catch (e) {}
    },

    saveFilterState: function() {
        try {
            const state = {
                q: this.searchInput ? this.searchInput.value : '',
                status: this.currentStatusFilter
            };
            sessionStorage.setItem(this.getFilterStateKey(), JSON.stringify(state));
        } catch (e) {}
    },

    restoreFilterState: function() {
        try {
            const raw = sessionStorage.getItem(this.getFilterStateKey());
            if (!raw) return;
            const state = JSON.parse(raw);
            if (this.searchInput && state.q) {
                this.searchInput.value = state.q;
            }
            if (state.status) {
                this.currentStatusFilter = state.status;
                this.updateStatusPillsUI();
            }
            if (state.q || (state.status && state.status !== 'all')) {
                this.applyFilters();
            }
        } catch (e) {}
    },

    saveScrollPosition: function() {
        try {
            const mainEl = document.querySelector('main');
            const scrollPos = mainEl ? mainEl.scrollTop : window.scrollY;
            sessionStorage.setItem(this.getScrollStateKey(), String(scrollPos));
        } catch (e) {}
    },

    restoreScrollPosition: function() {
        try {
            const savedScroll = sessionStorage.getItem(this.getScrollStateKey());
            if (savedScroll === null) return;
            sessionStorage.removeItem(this.getScrollStateKey());

            const pos = parseInt(savedScroll, 10);
            if (isNaN(pos)) return;

            requestAnimationFrame(() => {
                const mainEl = document.querySelector('main');
                if (mainEl) {
                    mainEl.scrollTop = pos;
                } else {
                    window.scrollTo(0, pos);
                }
            });
        } catch (e) {}
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.CategoriesList.init());
} else {
    Storevo.CategoriesList.init();
}