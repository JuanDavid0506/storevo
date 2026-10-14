window.Storevo = window.Storevo || {};

if (!Storevo.getTenantKey) {
    Storevo.getTenantKey = function(baseKey) {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        return baseKey + '_' + (match ? match[1] : 'default');
    };
}

window.updateOrdersViewUI = function() {
    const isDesktop = window.innerWidth >= 640; // sm breakpoint igual que en Productos
    const desktopKey = Storevo.getTenantKey('orders_view_desktop');
    const mobileKey = Storevo.getTenantKey('orders_view_mobile');

    const view = isDesktop
        ? (localStorage.getItem(desktopKey) || 'table')
        : (localStorage.getItem(mobileKey) || 'grid');

    const wrapper = document.getElementById('orders-view-wrapper');
    if (wrapper) {
        wrapper.className = 'view-' + view;
    }

    // Resetear botones al estilo inactivo de Productos
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-white', 'shadow-sm');
        btn.classList.add('text-slate-500', 'hover:text-slate-300');
    });

    // Activar botón seleccionado con el mismo estilo de Productos
    document.querySelectorAll('.view-btn-' + view).forEach(btn => {
        btn.classList.remove('text-slate-500', 'hover:text-slate-300');
        btn.classList.add('bg-slate-800', 'text-white', 'shadow-sm');
    });
};

window.setOrdersView = function(view) {
    const isDesktop = window.innerWidth >= 640;
    const key = isDesktop
        ? Storevo.getTenantKey('orders_view_desktop')
        : Storevo.getTenantKey('orders_view_mobile');

    localStorage.setItem(key, view);
    window.updateOrdersViewUI();
};

window.updateOrdersViewUI();

document.addEventListener('DOMContentLoaded', () => {
    window.updateOrdersViewUI();
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(window.updateOrdersViewUI, 150);
    });
});