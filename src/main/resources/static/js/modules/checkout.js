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
        const docTypeSelect = document.getElementById('checkout-doc-type');
        const nitDvInput = document.getElementById('checkout-nit-dv');
        const legalNameInput = document.getElementById('checkout-legal-name');
        const emailInput = document.getElementById('checkout-email');
        const emailReqBadge = document.getElementById('email-req-badge');

        // 1. Autocompletar datos previos del comprador en esta tienda
        try {
            const savedData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const fields = [
                'customerName', 'customerPhone', 'customerEmail',
                'customerDocument', 'verificationDigit', 'city',
                'address', 'documentType', 'taxRegime', 'legalName'
            ];
            fields.forEach(fieldName => {
                const input = form.querySelector(`[name="${fieldName}"]`);
                if (input && savedData[fieldName] && !input.value) {
                    input.value = savedData[fieldName];
                }
            });
        } catch (e) {
            console.warn('No se pudo recuperar el perfil local de checkout', e);
        }

        // 2. Obligatoriedad dinámica según el flujo de compra y facturación electrónica (incluyendo DV para NIT)
        const syncRequiredFields = () => {
            const needsInvoice = invoiceToggle && invoiceToggle.checked;
            const isNit = needsInvoice && docTypeSelect && docTypeSelect.value === 'NIT';

            if (invoicePanel) {
                invoicePanel.classList.toggle('hidden', !needsInvoice);
            }
            if (legalNameInput) {
                legalNameInput.required = needsInvoice;
            }
            if (nitDvInput) {
                nitDvInput.classList.toggle('hidden', !isNit);
                nitDvInput.required = isNit;
                if (!isNit) nitDvInput.value = '';
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
        }
        if (docTypeSelect) {
            docTypeSelect.addEventListener('change', syncRequiredFields);
        }
        syncRequiredFields();

        // 3. Guardar datos en localStorage al enviar y prevenir doble envío
        form.addEventListener('submit', (e) => {
            if (form.dataset.submitting === 'true') {
                e.preventDefault();
                return;
            }
            form.dataset.submitting = 'true';

            try {
                const profileToSave = {};
                [
                    'customerName', 'customerPhone', 'customerEmail',
                    'customerDocument', 'verificationDigit', 'city',
                    'address', 'documentType', 'taxRegime', 'legalName'
                ].forEach(fieldName => {
                    const input = form.querySelector(`[name="${fieldName}"]`);
                    if (input && input.value) {
                        profileToSave[fieldName] = input.value.trim();
                    }
                });
                localStorage.setItem(storageKey, JSON.stringify(profileToSave));
            } catch (err) {
                console.warn('No se pudo guardar el perfil local de checkout', err);
            }

            const submitBtn = document.getElementById('btn-submit-checkout') || document.getElementById('btn-submit-whatsapp');
            if (submitBtn) {
                submitBtn.classList.add('opacity-75', 'pointer-events-none');
                const span = submitBtn.querySelector('span');
                if (span) span.textContent = 'Procesando tu pedido...';
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.Checkout.init());
} else {
    Storevo.Checkout.init();
}