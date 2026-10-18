window.Storevo = window.Storevo || {};

Storevo.Cart = {
    init: function() {
        this.initForms();
    },

    initForms: function() {
        const addToCartForms = document.querySelectorAll('form[action$="/cart/add"]');
        addToCartForms.forEach(form => {
            if (form.dataset.cartBound === 'true') return;
            form.dataset.cartBound = 'true';

            form.addEventListener('submit', async (e) => {
                if (e.defaultPrevented) return;

                // Si estamos en una ficha con variantes, exigir variante seleccionada antes de enviar
                const detailBridge = document.getElementById('product-detail-bridge');
                const hasVariants = detailBridge && detailBridge.getAttribute('data-has-variants') === 'true';
                const variantInput = document.getElementById('selectedVariantId');
                if (hasVariants && (!variantInput || !variantInput.value)) {
                    e.preventDefault();
                    document.querySelectorAll('.variant-option-group').forEach(g => {
                        const optName = g.getAttribute('data-option-name');
                        const selected = Storevo.ProductDetail && Storevo.ProductDetail.state && Storevo.ProductDetail.state.selectedOptions
                            ? Storevo.ProductDetail.state.selectedOptions[optName]
                            : null;
                        if (!selected) {
                            const errEl = g.querySelector('.option-error');
                            if (errEl) errEl.classList.remove('hidden');
                        }
                    });
                    if (Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show('Selecciona las opciones que deseas', 'warning');
                    }
                    return;
                }

                e.preventDefault();
                const formData = new FormData(form);
                const ajaxAction = form.action.replace('/cart/add', '/cart/add-ajax');
                try {
                    const response = await fetch(ajaxAction, {
                        method: 'POST',
                        body: new URLSearchParams(formData),
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            Storevo.Cart.updateGlobalCounter(data.cartCount, true);
                            if (Storevo.Router && typeof Storevo.Router.invalidateCache === 'function') {
                                Storevo.Router.invalidateCache();
                            }
                            Storevo.UI.Toast.show(data.message, data.isWarning ? 'warning' : 'success');
                        } else {
                            Storevo.UI.Toast.show(data.message, 'error');
                        }
                    }
                } catch (error) {
                    console.error('Error al agregar a la bolsa:', error);
                    Storevo.UI.Toast.show('No se pudo agregar el producto.', 'error');
                }
            });
        });
    },

    addItem: function(btn, slug, productId) {
        if (btn.classList.contains('pointer-events-none')) return;
        btn.classList.add('pointer-events-none');

        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', 1);

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    const emptyIcon = btn.querySelector('.icon-empty');
                    const filledIcon = btn.querySelector('.icon-filled');
                    if (emptyIcon && filledIcon) {
                        emptyIcon.classList.add('hidden');
                        filledIcon.classList.remove('hidden');
                        btn.classList.remove('bg-white/90');
                        btn.classList.add('bg-white', 'border-brand');
                    }
                    Storevo.Cart.updateGlobalCounter(data.cartCount, true);
                    if (Storevo.Router && typeof Storevo.Router.invalidateCache === 'function') {
                        Storevo.Router.invalidateCache();
                    }
                    Storevo.UI.Toast.show(data.message, data.isWarning ? 'warning' : 'success');
                } else {
                    Storevo.UI.Toast.show(data.message, 'error');
                }
            }).finally(() => btn.classList.remove('pointer-events-none'));
    },

    buyNowFast: function(slug, productId, hasVariants, productUrl) {
        if (hasVariants) {
            if (window.Storevo && Storevo.Router && typeof Storevo.Router.navigate === 'function') {
                Storevo.Router.navigate(productUrl);
            } else {
                window.location.href = productUrl;
            }
            return;
        }

        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', 1);

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = `/s/${slug}/cart/checkout`;
                } else {
                    Storevo.UI.Toast.show(data.message, 'error');
                }
            });
    },

    updateGlobalCounter: function(value, isAbsolute = false) {
        const badges = [document.getElementById('navCartCounter'), document.getElementById('cart-counter-badge')];
        badges.forEach(badge => {
            if (badge) {
                if (isAbsolute) {
                    badge.textContent = value;
                } else {
                    let current = parseInt(badge.textContent, 10) || 0;
                    let newVal = current + value;
                    badge.textContent = newVal < 0 ? 0 : newVal;
                }
            }
        });
    },

    addWithQty: function(btn, slug, productId) {
        const qtyEl = document.getElementById('qty');
        const qty = qtyEl ? qtyEl.value : 1;
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', qty);

        const textSpan = btn.querySelector('.btn-text');
        const originalHTML = textSpan ? textSpan.innerHTML : btn.innerHTML;

        btn.classList.add('opacity-75', 'pointer-events-none');
        if (textSpan) textSpan.innerHTML = 'Procesando...';

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
            .then(res => res.json())
            .then(data => {
                btn.classList.remove('opacity-75', 'pointer-events-none');

                if (data.success) {
                    if (textSpan) textSpan.innerHTML = '¡Agregado!';
                    btn.classList.replace('bg-white', 'bg-brand');
                    btn.classList.replace('text-brand', 'text-white');

                    Storevo.Cart.updateGlobalCounter(data.cartCount, true);
                    if (Storevo.Router && typeof Storevo.Router.invalidateCache === 'function') {
                        Storevo.Router.invalidateCache();
                    }
                    Storevo.UI.Toast.show(data.message, data.isWarning ? 'warning' : 'success');
                } else {
                    if (textSpan) textSpan.innerHTML = 'Sin Stock';
                    Storevo.UI.Toast.show(data.message, 'error');
                }

                setTimeout(() => {
                    if (textSpan) textSpan.innerHTML = originalHTML;
                    btn.classList.replace('bg-brand', 'bg-white');
                    btn.classList.replace('text-white', 'text-brand');
                }, 2000);
            });
    },

    buyNowWithQty: function(slug, productId) {
        const qtyEl = document.getElementById('qty');
        const qty = qtyEl ? qtyEl.value : 1;
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', qty);

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) window.location.href = `/s/${slug}/cart/checkout`;
                else Storevo.UI.Toast.show(data.message, 'error');
            });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.Cart.init());
} else {
    Storevo.Cart.init();
}

window.addItemToCart = Storevo.Cart.addItem;
window.buyNowFast = Storevo.Cart.buyNowFast;
window.updateCartGlobalCounter = Storevo.Cart.updateGlobalCounter;
window.addToCartWithQty = Storevo.Cart.addWithQty;
window.buyNowWithQty = Storevo.Cart.buyNowWithQty;