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
        const docInput = document.getElementById('checkout-document');
        const nitDvInput = document.getElementById('checkout-nit-dv');
        const legalNameInput = document.getElementById('checkout-legal-name');
        const emailInput = document.getElementById('checkout-email');

        const emailReqBadge = document.getElementById('email-req-badge');
        const emailOptBadge = document.getElementById('email-opt-badge');
        const docReqBadge = document.getElementById('doc-req-badge');
        const docOptBadge = document.getElementById('doc-opt-badge');

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

        // 2. Obligatoriedad dinámica según el flujo (WhatsApp vs Pago Online) y Facturación DIAN
        const syncRequiredFields = () => {
            const needsInvoice = Boolean(invoiceToggle && invoiceToggle.checked);
            const isNit = needsInvoice && docTypeSelect && docTypeSelect.value === 'NIT';

            if (invoicePanel) {
                invoicePanel.classList.toggle('hidden', !needsInvoice);
            }
            if (legalNameInput) {
                legalNameInput.required = needsInvoice;
            }

            // Mostrar y exigir Dígito de Verificación (DV) cuando elige NIT
            if (nitDvInput) {
                nitDvInput.classList.toggle('hidden', !isNit);
                nitDvInput.required = isNit;
                if (!isNit) nitDvInput.value = '';
            }

            // Correo y Documento son obligatorios si paga con Wompi (!requiresWhatsapp) o si pide Factura Electrónica
            const mustRequireDocAndEmail = !requiresWhatsapp || needsInvoice;

            if (emailInput) {
                emailInput.required = mustRequireDocAndEmail;
            }
            if (emailReqBadge) emailReqBadge.classList.toggle('hidden', !mustRequireDocAndEmail);
            if (emailOptBadge) emailOptBadge.classList.toggle('hidden', mustRequireDocAndEmail);

            if (docInput) {
                docInput.required = mustRequireDocAndEmail;
            }
            if (docReqBadge) docReqBadge.classList.toggle('hidden', !mustRequireDocAndEmail);
            if (docOptBadge) docOptBadge.classList.toggle('hidden', mustRequireDocAndEmail);
        };

        if (invoiceToggle) {
            invoiceToggle.addEventListener('change', syncRequiredFields);
        }
        if (docTypeSelect) {
            docTypeSelect.addEventListener('change', syncRequiredFields);
        }
        syncRequiredFields();

        // 3. Guardar datos en localStorage y bloquear doble clic al enviar
        form.addEventListener('submit', () => {
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
            } catch (e) {
                console.warn('No se pudo guardar el perfil local de checkout', e);
            }

            const submitBtn = document.getElementById('btn-submit-checkout') || document.getElementById('btn-submit-whatsapp');
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
                }, 10);
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.Checkout.init());
} else {
    Storevo.Checkout.init();
}