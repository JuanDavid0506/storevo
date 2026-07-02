window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Alerts = {
    initUrlToasts: function() {
        const urlParams = new URLSearchParams(window.location.search);
        let message = null;
        let type = 'success';

        // Detectar si hay algún parámetro de alerta antes de procesar
        const alertParams = ['success', 'deleted', 'restored', 'hard_deleted', 'activated', 'deactivated'];
        const hasAlert = alertParams.some(param => urlParams.has(param));

        if (!hasAlert) return;

        // Contexto inteligente según la URL
        let context = 'Registro';
        if (window.location.pathname.includes('/products')) context = 'Producto';
        else if (window.location.pathname.includes('/categories')) context = 'Categoría';
        else if (window.location.pathname.includes('/customers')) context = 'Cliente';

        if (urlParams.has('success')) {
            message = `${context} guardado correctamente.`;
        } else if (urlParams.has('deleted')) {
            message = `${context} enviado a la papelera.`;
            type = 'warning';
        } else if (urlParams.has('restored')) {
            message = `${context} restaurado exitosamente.`;
        } else if (urlParams.has('hard_deleted')) {
            message = `${context} eliminado de forma permanente.`;
            type = 'error';
        } else if (urlParams.has('activated')) {
            message = `${context} activado correctamente.`;
        } else if (urlParams.has('deactivated')) {
            message = `${context} desactivado correctamente.`;
            type = 'warning';
        }

        // Si hay mensaje, lanzamos el Toast Premium
        if (message && Storevo.UI.Toast) {
            Storevo.UI.Toast.show(message, type);

            // Limpiamos la URL silenciosamente
            const url = new URL(window.location.href);
            alertParams.forEach(param => url.searchParams.delete(param));
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }
    }
};

// Auto-inicializar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', Storevo.UI.Alerts.initUrlToasts);