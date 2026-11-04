document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    const cityInput = document.getElementById('checkout-city');
    const addressInput = document.getElementById('checkout-address');
    const destFieldsWrap = document.getElementById('shipping-destination-fields');
    const pickupInfoBox = document.getElementById('pickup-store-info');
    const shippingLabelEl = document.getElementById('checkout-shipping-label');
    const totalDisplayEl = document.getElementById('checkout-total-display');
    const freeHintEl = document.getElementById('checkout-free-shipping-hint');

    const toggleInvoiceCheckbox = document.getElementById('toggle-electronic-invoice');
    const invoiceFieldsBox = document.getElementById('electronic-invoice-fields');
    const docTypeSelect = document.getElementById('checkout-doc-type');
    const nitDvInput = document.getElementById('checkout-nit-dv');
    const legalNameInput = document.getElementById('checkout-legal-name');

    const hasMixedCart = form.getAttribute('data-has-mixed-cart') === 'true';
    const fullCartSubtotal = parseFloat(form.getAttribute('data-full-cart-subtotal') || form.getAttribute('data-cart-subtotal') || '0') || 0;
    const inStockSubtotal = parseFloat(form.getAttribute('data-in-stock-subtotal') || form.getAttribute('data-cart-subtotal') || '0') || 0;
    let subtotal = parseFloat(form.getAttribute('data-cart-subtotal') || '0') || 0;
    const pickupCityRaw = form.getAttribute('data-pickup-city') || '';
    const localRate = parseFloat(form.getAttribute('data-local-rate') || '-1');
    const nationalRate = parseFloat(form.getAttribute('data-national-rate') || '-1');
    const freeThreshold = parseFloat(form.getAttribute('data-free-threshold') || '0') || 0;
    const allowPickup = form.getAttribute('data-allow-pickup') === 'true';

    const subtotalDisplayEl = document.getElementById('checkout-subtotal-display');
    const btnSubmitOnline = document.getElementById('btn-submit-checkout');
    const btnSubmitWhatsapp = document.getElementById('btn-submit-whatsapp');
    const waNotConfiguredMsg = document.getElementById('whatsapp-not-configured-msg');
    const emailInput = document.getElementById('checkout-email');
    const docInput = document.getElementById('checkout-document');
    const emailReqBadge = document.getElementById('email-req-badge');
    const emailOptBadge = document.getElementById('email-opt-badge');
    const docReqBadge = document.getElementById('doc-req-badge');
    const docOptBadge = document.getElementById('doc-opt-badge');

    function isOnlyInStockSelected() {
        if (!hasMixedCart) return false;
        const checked = form.querySelector('input[name="onlyInStockItems"]:checked');
        return !checked || checked.value === 'true';
    }

    function syncMixedCartModeUI() {
        if (!hasMixedCart) return;
        const onlyInStock = isOnlyInStockSelected();
        subtotal = onlyInStock ? inStockSubtotal : fullCartSubtotal;

        if (subtotalDisplayEl) {
            subtotalDisplayEl.textContent = formatCop(subtotal);
        }

        if (btnSubmitOnline) {
            btnSubmitOnline.classList.toggle('hidden', !onlyInStock);
        }
        if (btnSubmitWhatsapp) {
            btnSubmitWhatsapp.classList.toggle('hidden', onlyInStock);
        }
        if (waNotConfiguredMsg) {
            waNotConfiguredMsg.classList.toggle('hidden', onlyInStock);
        }

        if (emailInput) {
            if (onlyInStock) emailInput.setAttribute('required', 'required');
            else emailInput.removeAttribute('required');
        }
        if (docInput) {
            if (onlyInStock) docInput.setAttribute('required', 'required');
            else docInput.removeAttribute('required');
        }
        if (emailReqBadge) emailReqBadge.classList.toggle('hidden', !onlyInStock);
        if (emailOptBadge) emailOptBadge.classList.toggle('hidden', onlyInStock);
        if (docReqBadge) docReqBadge.classList.toggle('hidden', !onlyInStock);
        if (docOptBadge) docOptBadge.classList.toggle('hidden', onlyInStock);

        document.querySelectorAll('.checkout-summary-item[data-made-to-order="true"]').forEach(function (row) {
            row.classList.toggle('opacity-50', onlyInStock);
            const note = row.querySelector('.checkout-deferred-note');
            if (note) note.classList.toggle('hidden', !onlyInStock);
        });
    }

    function normalizeCity(text) {
        if (!text) return '';
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/d\.?c\.?/g, '')
            .replace(/[^a-z ]/g, '')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function formatCop(amount) {
        const rounded = Math.round(amount || 0);
        return '$ ' + rounded.toLocaleString('es-CO');
    }

    function getSelectedDeliveryMethod() {
        const checkedRadio = form.querySelector('input[name="deliveryMethod"]:checked');
        if (checkedRadio) return checkedRadio.value;
        const hiddenInput = form.querySelector('input[name="deliveryMethod"][type="hidden"]');
        return hiddenInput ? hiddenInput.value : 'SHIPPING';
    }

    function recalculateShippingAndTotal() {
        const deliveryMethod = getSelectedDeliveryMethod();
        const isPickup = allowPickup && deliveryMethod === 'PICKUP';

        if (isPickup) {
            if (destFieldsWrap) destFieldsWrap.classList.add('hidden');
            if (pickupInfoBox) pickupInfoBox.classList.remove('hidden');
            if (cityInput) cityInput.removeAttribute('required');
            if (addressInput) addressInput.removeAttribute('required');
            if (freeHintEl) freeHintEl.classList.add('hidden');

            if (shippingLabelEl) {
                shippingLabelEl.textContent = 'Gratis (Recogida en tienda)';
                shippingLabelEl.className = 'text-xs font-bold text-emerald-600';
            }
            if (totalDisplayEl) {
                totalDisplayEl.textContent = formatCop(subtotal);
            }
            return;
        }

        if (destFieldsWrap) destFieldsWrap.classList.remove('hidden');
        if (pickupInfoBox) pickupInfoBox.classList.add('hidden');
        if (cityInput) cityInput.setAttribute('required', 'required');
        if (addressInput) addressInput.setAttribute('required', 'required');

        const hasLocalRate = !isNaN(localRate) && localRate >= 0;
        const hasNationalRate = !isNaN(nationalRate) && nationalRate >= 0;
        const hasAnyRateConfigured = hasLocalRate || hasNationalRate;

        // Aviso de tope de envío gratis
        if (freeHintEl) {
            if (freeThreshold > 0 && hasAnyRateConfigured) {
                freeHintEl.classList.remove('hidden');
                if (subtotal >= freeThreshold) {
                    freeHintEl.textContent = '¡Felicidades! Tu pedido supera ' + formatCop(freeThreshold) + ' y tienes envío GRATIS.';
                } else {
                    const missing = freeThreshold - subtotal;
                    freeHintEl.textContent = 'Agrega ' + formatCop(missing) + ' más para obtener envío GRATIS.';
                }
            } else {
                freeHintEl.classList.add('hidden');
            }
        }

        if (freeThreshold > 0 && subtotal >= freeThreshold) {
            if (shippingLabelEl) {
                shippingLabelEl.textContent = '¡Gratis! ($ 0)';
                shippingLabelEl.className = 'text-xs font-bold text-emerald-600';
            }
            if (totalDisplayEl) {
                totalDisplayEl.textContent = formatCop(subtotal);
            }
            return;
        }

        if (!hasAnyRateConfigured) {
            if (shippingLabelEl) {
                shippingLabelEl.textContent = 'Según destino / transportadora';
                shippingLabelEl.className = 'text-xs font-medium text-slate-500';
            }
            if (totalDisplayEl) {
                totalDisplayEl.textContent = formatCop(subtotal);
            }
            return;
        }

        const pickupNorm = normalizeCity(pickupCityRaw);
        const destNorm = normalizeCity(cityInput ? cityInput.value : '');

        if (!destNorm && hasLocalRate && hasNationalRate && pickupNorm && localRate !== nationalRate) {
            if (shippingLabelEl) {
                shippingLabelEl.textContent = 'Escribe tu ciudad para calcular';
                shippingLabelEl.className = 'text-xs font-medium text-amber-600';
            }
            if (totalDisplayEl) {
                totalDisplayEl.textContent = formatCop(subtotal);
            }
            return;
        }

        const isLocal = pickupNorm !== '' && destNorm !== '' && pickupNorm === destNorm;
        let shippingCost = 0;

        if (isLocal) {
            shippingCost = hasLocalRate ? localRate : (hasNationalRate ? nationalRate : 0);
        } else {
            shippingCost = hasNationalRate ? nationalRate : (hasLocalRate ? localRate : 0);
        }

        if (shippingLabelEl) {
            if (shippingCost <= 0) {
                shippingLabelEl.textContent = 'Gratis ($ 0)';
                shippingLabelEl.className = 'text-xs font-bold text-emerald-600';
            } else {
                const rateTypeLabel = isLocal ? ' (Local)' : ' (Nacional)';
                shippingLabelEl.textContent = formatCop(shippingCost) + (pickupNorm ? rateTypeLabel : '');
                shippingLabelEl.className = 'text-sm font-bold text-slate-900';
            }
        }

        if (totalDisplayEl) {
            totalDisplayEl.textContent = formatCop(subtotal + shippingCost);
        }
    }

    // Eventos para recalcular el envío en vivo
    if (cityInput) {
        cityInput.addEventListener('input', recalculateShippingAndTotal);
        cityInput.addEventListener('change', recalculateShippingAndTotal);
    }

    const deliveryRadios = form.querySelectorAll('input[name="deliveryMethod"]');
    deliveryRadios.forEach(function (radio) {
        radio.addEventListener('change', recalculateShippingAndTotal);
    });

    const mixedCartRadios = form.querySelectorAll('input[name="onlyInStockItems"]');
    mixedCartRadios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            syncMixedCartModeUI();
            recalculateShippingAndTotal();
        });
    });
    syncMixedCartModeUI();

    // Facturación electrónica DIAN y dígito de verificación NIT
    function updateInvoiceFields() {
        const active = toggleInvoiceCheckbox && toggleInvoiceCheckbox.checked;
        if (invoiceFieldsBox) {
            invoiceFieldsBox.classList.toggle('hidden', !active);
        }
        if (legalNameInput) {
            if (active) {
                legalNameInput.setAttribute('required', 'required');
            } else {
                legalNameInput.removeAttribute('required');
            }
        }
        updateNitDvVisibility();
    }

    function updateNitDvVisibility() {
        const isInvoiceActive = toggleInvoiceCheckbox && toggleInvoiceCheckbox.checked;
        const isNit = docTypeSelect && docTypeSelect.value === 'NIT';
        if (nitDvInput) {
            nitDvInput.classList.toggle('hidden', !(isInvoiceActive && isNit));
        }
    }

    if (toggleInvoiceCheckbox) {
        toggleInvoiceCheckbox.addEventListener('change', updateInvoiceFields);
    }
    if (docTypeSelect) {
        docTypeSelect.addEventListener('change', updateNitDvVisibility);
    }

    updateInvoiceFields();
    recalculateShippingAndTotal();
});w