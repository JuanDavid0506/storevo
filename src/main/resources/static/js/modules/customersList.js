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
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.updateViewUI(), 150);
        });
    },

    updateViewUI: function() {
        const isDesktop = window.innerWidth >= 640; // sm breakpoint igual que en Productos y Pedidos
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
            btn.classList.remove('bg-slate-800', 'text-white', 'shadow-sm');
            btn.classList.add('text-slate-500', 'hover:text-slate-300');
        });

        document.querySelectorAll('.view-btn-' + view).forEach(btn => {
            btn.classList.remove('text-slate-500', 'hover:text-slate-300');
            btn.classList.add('bg-slate-800', 'text-white', 'shadow-sm');
        });
    },

    setView: function(view) {
        const isDesktop = window.innerWidth >= 640;
        const key = isDesktop
            ? Storevo.getTenantKey('customers_view_desktop')
            : Storevo.getTenantKey('customers_view_mobile');

        localStorage.setItem(key, view);
        this.updateViewUI();
    }
};

window.updateCustomersViewUI = function() {
    Storevo.CustomersList.updateViewUI();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.CustomersList.init());
} else {
    Storevo.CustomersList.init();
}