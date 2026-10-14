window.Storevo = window.Storevo || {};

if (!Storevo.getTenantKey) {
    Storevo.getTenantKey = function(baseKey) {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        return baseKey + '_' + (match ? match[1] : 'default');
    };
}

Storevo.CustomersList = {
    init: function() {
        this.updateViewUI();
        this.initClientSideFallbackFilter();

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.updateViewUI(), 150);
        });
    },

    updateViewUI: function() {
        const isDesktop = window.innerWidth >= 1024;
        const desktopKey = Storevo.getTenantKey('customers_view_desktop');
        const mobileKey = Storevo.getTenantKey('customers_view_mobile');

        const view = isDesktop
            ? (localStorage.getItem(desktopKey) || 'table')
            : (localStorage.getItem(mobileKey) || 'grid');

        const wrapper = document.getElementById('customers-view-wrapper');
        if (wrapper) {
            wrapper.className = 'view-' + view;
        }

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('bg-slate-700', 'text-white', 'shadow-md', 'border-slate-600');
            btn.classList.add('text-slate-400', 'bg-transparent', 'border-transparent');
        });

        document.querySelectorAll('.view-btn-' + view).forEach(btn => {
            btn.classList.add('bg-slate-700', 'text-white', 'shadow-md', 'border-slate-600');
            btn.classList.remove('text-slate-400', 'bg-transparent', 'border-transparent');
        });
    },

    setView: function(view) {
        const isDesktop = window.innerWidth >= 1024;
        const key = isDesktop
            ? Storevo.getTenantKey('customers_view_desktop')
            : Storevo.getTenantKey('customers_view_mobile');

        localStorage.setItem(key, view);
        this.updateViewUI();
    },

    // Filtro instantáneo en el navegador por si el endpoint actual devuelve List<Customer> sin filtrar en BD
    initClientSideFallbackFilter: function() {
        const form = document.getElementById('listing-form');
        if (!form) return;

        const searchInput = form.querySelector('input[name="q"]');
        const typeSelect = form.querySelector('select[name="type"]');

        const applyDomFilter = () => {
            const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
            const type = typeSelect ? typeSelect.value : '';
            const items = document.querySelectorAll('.customer-item');
            if (!items.length) return;

            items.forEach(item => {
                const searchData = (item.getAttribute('data-search') || '').toLowerCase();
                const ordersCount = parseInt(item.getAttribute('data-orders') || '0', 10);

                const matchesQuery = !query || searchData.includes(query);
                const matchesType = !type
                    || (type === 'recurrent' && ordersCount > 1)
                    || (type === 'single' && ordersCount === 1);

                item.classList.toggle('hidden', !(matchesQuery && matchesType));
            });
        };

        if (searchInput) {
            searchInput.addEventListener('input', applyDomFilter);
        }
        if (typeSelect) {
            typeSelect.addEventListener('change', applyDomFilter);
        }

        applyDomFilter();
    }
};

window.updateCustomersViewUI = function() {
    Storevo.CustomersList.updateViewUI();
    Storevo.CustomersList.initClientSideFallbackFilter();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.CustomersList.init());
} else {
    Storevo.CustomersList.init();
}