window.Storevo = window.Storevo || {};

Storevo.StoreCatalog = {
    normalizeText: function(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    },

    init: function() {
        const grid = document.getElementById('catalog-products-grid');
        if (!grid) return;

        const searchInput = document.getElementById('catalog-search-input');
        const clearBtn = document.getElementById('catalog-search-clear');
        const resetBtn = document.getElementById('catalog-reset-search');
        const globalSearchBtn = document.getElementById('catalog-search-all-btn');
        const sortSelect = document.getElementById('catalog-sort-select');
        const countEl = document.getElementById('catalog-visible-count');
        const emptyState = document.getElementById('catalog-no-matches');
        const cards = Array.from(grid.querySelectorAll('.catalog-product-card'));

        // Pre-normalizar los textos de cada tarjeta una sola vez para máxima velocidad en móvil
        cards.forEach(card => {
            const rawName = card.getAttribute('data-name') || '';
            const rawCat = card.getAttribute('data-category') || '';
            card.dataset.normalizedSearch = this.normalizeText(rawName + ' ' + rawCat);
        });

        const applyCatalogFilterAndSort = () => {
            const rawQuery = searchInput ? searchInput.value.trim() : '';
            const normalizedQuery = this.normalizeText(rawQuery);
            const sortBy = sortSelect ? sortSelect.value : 'default';

            if (clearBtn) {
                clearBtn.classList.toggle('hidden', !rawQuery);
            }

            // 1. Filtrar ignorando tildes y mayúsculas
            let visibleCount = 0;
            cards.forEach(card => {
                const searchable = card.dataset.normalizedSearch || '';
                const matches = !normalizedQuery || searchable.includes(normalizedQuery);
                card.classList.toggle('hidden', !matches);
                if (matches) visibleCount++;
            });

            // 2. Ordenar tarjetas
            const sorted = [...cards].sort((a, b) => {
                if (sortBy === 'price_asc') {
                    return (parseFloat(a.getAttribute('data-price')) || 0) - (parseFloat(b.getAttribute('data-price')) || 0);
                }
                if (sortBy === 'price_desc') {
                    return (parseFloat(b.getAttribute('data-price')) || 0) - (parseFloat(a.getAttribute('data-price')) || 0);
                }
                if (sortBy === 'name_asc') {
                    return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '');
                }
                return (parseInt(a.getAttribute('data-index'), 10) || 0) - (parseInt(b.getAttribute('data-index'), 10) || 0);
            });

            sorted.forEach(card => grid.appendChild(card));

            if (countEl) countEl.textContent = visibleCount;
            if (emptyState) emptyState.classList.toggle('hidden', visibleCount > 0);
            grid.classList.toggle('hidden', visibleCount === 0);

            // Si está dentro de una categoría y busca algo que no está en ella, actualizar enlace para buscar en todo el catálogo
            if (globalSearchBtn && rawQuery) {
                const baseCatalogUrl = globalSearchBtn.getAttribute('data-base-url');
                if (baseCatalogUrl) {
                    globalSearchBtn.setAttribute('href', `${baseCatalogUrl}?q=${encodeURIComponent(rawQuery)}`);
                }
            }
        };

        if (searchInput) {
            searchInput.addEventListener('input', applyCatalogFilterAndSort);
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    applyCatalogFilterAndSort();
                    searchInput.focus();
                }
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                applyCatalogFilterAndSort();
            });
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', applyCatalogFilterAndSort);
        }

        applyCatalogFilterAndSort();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.StoreCatalog.init());
} else {
    Storevo.StoreCatalog.init();
}