window.Storevo = window.Storevo || {};

Storevo.Checkout = {
    init: function() {
        const form = document.getElementById('checkout-form');
        if (!form) return;

        const slug = form.getAttribute('data-slug') || 'default';
        const requiresWhatsapp = form.getAttribute('data-requires-whatsapp') === 'true';
        const storageKey = `storevo_customer_checkout_${slug}`;

        const invoiceToggle = document.getElementById('toggle-electronic-invoice');
        const invoicePanel = document.getElementById('electronic-invoice-fields');
        const legalNameInput = document.getElementById('checkout-legal-name');
        const emailInput = document.getElementById('checkout-email');
        const emailReqBadge = document.getElementById('email-req-badge');

        // 1. Autocompletar datos previos del comprador en esta tienda
        try {
            const savedData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const fields = ['customerName', 'customerPhone', 'customerEmail', 'customerDocument', 'city', 'address', 'documentType', 'taxRegime', 'legalName'];
            fields.forEach(fieldName => {
                const input = form.querySelector(`[name="${fieldName}"]`);
                if (input && savedData[fieldName] && !input.value) {
                    input.value = savedData[fieldName];
                }
            });
        } catch (e) {
            console.warn('No se pudo recuperar el perfil local de checkout', e);
        }

        // 2. Obligatoriedad dinámica según el flujo de compra y facturación electrónica
        const syncRequiredFields = () => {
            const needsInvoice = invoiceToggle && invoiceToggle.checked;

            if (invoicePanel) {
                invoicePanel.classList.toggle('hidden', !needsInvoice);
            }
            if (legalNameInput) {
                legalNameInput.required = needsInvoice;
            }
            if (emailInput) {
                const emailRequired = !requiresWhatsapp || needsInvoice;
                emailInput.required = emailRequired;
                if (emailReqBadge) {
                    emailReqBadge.classList.toggle('hidden', !emailRequired);
                }
            }
        };

        if (invoiceToggle) {
            invoiceToggle.addEventListener('change', syncRequiredFields);
            syncRequiredFields();
        }

        // 3. Guardar datos en localStorage al enviar para acelerar futuras compras
        form.addEventListener('submit', () => {
            try {
                const profileToSave = {};
                ['customerName', 'customerPhone', 'customerEmail', 'customerDocument', 'city', 'address', 'documentType', 'taxRegime', 'legalName'].forEach(fieldName => {
                    const input = form.querySelector(`[name="${fieldName}"]`);
                    if (input && input.value) {
                        profileToSave[fieldName] = input.value.trim();
                    }
                });
                localStorage.setItem(storageKey, JSON.stringify(profileToSave));
            } catch (e) {
                console.warn('No se pudo guardar el perfil local de checkout', e);
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.Checkout.init());
} else {
    Storevo.Checkout.init();
}