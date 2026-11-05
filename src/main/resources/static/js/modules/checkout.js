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

    let appliedCoupon = null; // { code, discountType, discountValue, discountAmount }

    const couponInput = document.getElementById('checkout-coupon-input');
    const couponHiddenInput = document.getElementById('checkout-coupon-hidden');
    const btnApplyCoupon = document.getElementById('btn-apply-coupon');
    const btnRemoveCoupon = document.getElementById('btn-remove-coupon');
    const couponFeedback = document.getElementById('checkout-coupon-feedback');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountCodeLabel = document.getElementById('checkout-discount-code-label');
    const discountDisplay = document.getElementById('checkout-discount-display');

    function computeCurrentDiscountAmount() {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.discountType === 'PERCENTAGE') {
            const pct = Math.min(100, Math.max(0, parseFloat(appliedCoupon.discountValue || '0')));
            return Math.min(subtotal, Math.round(subtotal * (pct / 100.0)));
        }
        return Math.min(subtotal, Math.round(parseFloat(appliedCoupon.discountValue || '0')));
    }

    function renderCouponSummary() {
        const discAmount = computeCurrentDiscountAmount();
        if (appliedCoupon && discAmount > 0) {
            if (discountRow) discountRow.classList.remove('hidden');
            if (discountCodeLabel) discountCodeLabel.textContent = appliedCoupon.code;
            if (discountDisplay) discountDisplay.textContent = '- ' + formatCop(discAmount);
            if (couponHiddenInput) couponHiddenInput.value = appliedCoupon.code;
        } else {
            if (discountRow) discountRow.classList.add('hidden');
            if (couponHiddenInput) couponHiddenInput.value = '';
        }
        return discAmount;
    }

    function getSelectedDeliveryMethod() {
        const checkedRadio = form.querySelector('input[name="deliveryMethod"]:checked');
        if (checkedRadio) return checkedRadio.value;
        const hiddenInput = form.querySelector('input[name="deliveryMethod"][type="hidden"]');
        return hiddenInput ? hiddenInput.value : 'SHIPPING';
    }

    function recalculateShippingAndTotal() {
        const discountAmount = renderCouponSummary();
        const netSubtotal = Math.max(0, subtotal - discountAmount);

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
                totalDisplayEl.textContent = formatCop(netSubtotal);
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
                if (netSubtotal >= freeThreshold) {
                    freeHintEl.textContent = '¡Felicidades! Tu pedido supera ' + formatCop(freeThreshold) + ' y tienes envío GRATIS.';
                } else {
                    const missing = freeThreshold - netSubtotal;
                    freeHintEl.textContent = 'Agrega ' + formatCop(missing) + ' más para obtener envío GRATIS.';
                }
            } else {
                freeHintEl.classList.add('hidden');
            }
        }

        if (freeThreshold > 0 && netSubtotal >= freeThreshold) {
            if (shippingLabelEl) {
                shippingLabelEl.textContent = '¡Gratis! ($ 0)';
                shippingLabelEl.className = 'text-xs font-bold text-emerald-600';
            }
            if (totalDisplayEl) {
                totalDisplayEl.textContent = formatCop(netSubtotal);
            }
            return;
        }

        if (!hasAnyRateConfigured) {
            if (shippingLabelEl) {
                shippingLabelEl.textContent = 'Según destino / transportadora';
                shippingLabelEl.className = 'text-xs font-medium text-slate-500';
            }
            if (totalDisplayEl) {
                totalDisplayEl.textContent = formatCop(netSubtotal);
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
                totalDisplayEl.textContent = formatCop(netSubtotal);
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
            totalDisplayEl.textContent = formatCop(netSubtotal + shippingCost);
        }
    }

    function applyCouponAjax() {
        if (!couponInput) return;
        const rawCode = couponInput.value.trim();
        if (!rawCode) return;

        const slug = form.getAttribute('data-slug');
        const modeInput = form.querySelector('input[name="mode"]');
        const mode = modeInput ? modeInput.value : '';
        const onlyInStock = isOnlyInStockSelected();

        if (btnApplyCoupon) {
            btnApplyCoupon.disabled = true;
            btnApplyCoupon.textContent = '...';
        }

        const params = new URLSearchParams();
        params.append('code', rawCode);
        if (mode) params.append('mode', mode);
        params.append('onlyInStockItems', onlyInStock ? 'true' : 'false');

        fetch('/s/' + encodeURIComponent(slug) + '/cart/apply-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.valid) {
                    appliedCoupon = {
                        code: data.code,
                        discountType: data.discountType,
                        discountValue: data.discountValue,
                        discountAmount: data.discountAmount
                    };
                    couponInput.value = data.code;
                    couponInput.readOnly = true;
                    if (btnApplyCoupon) btnApplyCoupon.classList.add('hidden');
                    if (btnRemoveCoupon) btnRemoveCoupon.classList.remove('hidden');
                    if (couponFeedback) {
                        couponFeedback.textContent = '✓ ' + data.message + ' (-' + formatCop(data.discountAmount) + ')';
                        couponFeedback.className = 'text-xs font-bold text-emerald-600 mt-1.5 block';
                    }
                } else {
                    appliedCoupon = null;
                    if (couponFeedback) {
                        couponFeedback.textContent = data && data.message ? data.message : 'Cupón no válido.';
                        couponFeedback.className = 'text-xs font-bold text-red-600 mt-1.5 block';
                    }
                }
                recalculateShippingAndTotal();
            })
            .catch(function () {
                if (couponFeedback) {
                    couponFeedback.textContent = 'No se pudo verificar el cupón en este momento.';
                    couponFeedback.className = 'text-xs font-bold text-red-600 mt-1.5 block';
                }
            })
            .finally(function () {
                if (btnApplyCoupon) {
                    btnApplyCoupon.disabled = false;
                    btnApplyCoupon.textContent = 'Aplicar';
                }
            });
    }

    function removeCoupon() {
        appliedCoupon = null;
        if (couponInput) {
            couponInput.value = '';
            couponInput.readOnly = false;
        }
        if (btnApplyCoupon) btnApplyCoupon.classList.remove('hidden');
        if (btnRemoveCoupon) btnRemoveCoupon.classList.add('hidden');
        if (couponFeedback) couponFeedback.classList.add('hidden');
        recalculateShippingAndTotal();
    }

    if (btnApplyCoupon) {
        btnApplyCoupon.addEventListener('click', applyCouponAjax);
    }
    if (btnRemoveCoupon) {
        btnRemoveCoupon.addEventListener('click', removeCoupon);
    }
    if (couponInput) {
        couponInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCouponAjax();
            }
        });
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
            if (appliedCoupon) {
                applyCouponAjax();
            } else {
                recalculateShippingAndTotal();
            }
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
});