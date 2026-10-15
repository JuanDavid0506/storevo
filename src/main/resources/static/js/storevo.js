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
                // No modificar el botón de "Limpiar filtros" ni enlaces directos a filtro de categoría
                if (link.hasAttribute('data-clear-all-filters')
                    || link.hasAttribute('data-direct-filter')
                    || link.getAttribute('title') === 'Borrar todos los filtros') {
                    return;
                }

                const url = new URL(link.href, window.location.origin);

                // Solo hidratar si el enlace apunta a la raíz limpia (sin parámetros propios como ?categoryId=...)
                if (url.pathname === basePath && (!url.search || link.dataset.hydratedReturn === 'true')) {
                    link.dataset.hydratedReturn = 'true';
                    link.setAttribute('href', savedQuery ? `${basePath}?${savedQuery}` : basePath);
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', Storevo.Navigation.syncReturnLinks);