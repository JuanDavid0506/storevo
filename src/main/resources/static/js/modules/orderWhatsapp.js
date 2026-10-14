window.Storevo = window.Storevo || {};

Storevo.OrderWhatsapp = {
    init: function() {
        const link = document.getElementById('whatsappRedirectLink');
        if (link && link.href) {
            window.location.href = link.href;
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.OrderWhatsapp.init());
} else {
    Storevo.OrderWhatsapp.init();
}