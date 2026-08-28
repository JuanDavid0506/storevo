window.Storevo = window.Storevo || {};

Storevo.Cart = {
    initForms: function() {
        const addToCartForms = document.querySelectorAll('form[action$="/cart/add"]');
        addToCartForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const ajaxAction = form.action.replace('/cart/add', '/cart/add-ajax');
                try {
                    const response = await fetch(ajaxAction, {
                        method: 'POST',
                        body: new URLSearchParams(formData),
                        credentials: 'same-origin', // <-- VITAL para no perder la sesión
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if(data.success) {
                            Storevo.Cart.updateGlobalCounter(data.cartCount, true);
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

    // REEMPLAZA A toggleItem. El catálogo NO debe remover productos del carrito.
    addItem: function(btn, slug, productId) {
        if(btn.classList.contains('pointer-events-none')) return;
        btn.classList.add('pointer-events-none');

        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', 1);

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin' // <-- VITAL
        })
            .then(r => r.json())
            .then(data => {
                if(data.success) {
                    // Actualizamos estado visual (opcional, si quieres que el botón cambie)
                    const emptyIcon = btn.querySelector('.icon-empty');
                    const filledIcon = btn.querySelector('.icon-filled');
                    if(emptyIcon && filledIcon) {
                        emptyIcon.classList.add('hidden');
                        filledIcon.classList.remove('hidden');
                        btn.classList.remove('bg-white/90');
                        btn.classList.add('bg-white', 'border-brand');
                    }
                    Storevo.Cart.updateGlobalCounter(data.cartCount, true);
                    Storevo.UI.Toast.show(data.message, data.isWarning ? 'warning' : 'success');
                } else {
                    Storevo.UI.Toast.show(data.message, 'error');
                }
            }).finally(() => btn.classList.remove('pointer-events-none'));
    },

    // NUEVA LÓGICA DE COMPRA DIRECTA (Respeta las variantes)
    buyNowFast: function(slug, productId, hasVariants, productUrl) {
        if (hasVariants) {
            // Si tiene variantes, lo mandamos a la ficha del producto obligatoriamente
            window.location.href = productUrl;
            return;
        }

        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', 1);

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin' // <-- VITAL
        })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    window.location.href = `/s/${slug}/cart/checkout`;
                } else {
                    Storevo.UI.Toast.show(data.message, 'error');
                }
            });
    },

    updateGlobalCounter: function(value, isAbsolute = false) {
        // Actualiza ambas IDs posibles según los HTML proporcionados
        const badges = [document.getElementById('navCartCounter'), document.getElementById('cart-counter-badge')];
        badges.forEach(badge => {
            if (badge) {
                if (isAbsolute) {
                    badge.textContent = value;
                } else {
                    let current = parseInt(badge.textContent) || 0;
                    let newVal = current + value;
                    badge.textContent = newVal < 0 ? 0 : newVal;
                }
            }
        });
    },

    addWithQty: function(btn, slug, productId) {
        const qty = document.getElementById('qty').value;
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', qty);

        const textSpan = btn.querySelector('.btn-text');
        const originalHTML = textSpan.innerHTML;

        btn.classList.add('opacity-75', 'pointer-events-none');
        textSpan.innerHTML = 'Procesando...';

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin' // <-- VITAL
        })
            .then(res => res.json())
            .then(data => {
                btn.classList.remove('opacity-75', 'pointer-events-none');

                if(data.success) {
                    textSpan.innerHTML = '¡Agregado!';
                    btn.classList.replace('bg-white', 'bg-brand');
                    btn.classList.replace('text-brand', 'text-white');

                    Storevo.Cart.updateGlobalCounter(data.cartCount, true);
                    Storevo.UI.Toast.show(data.message, data.isWarning ? 'warning' : 'success');
                } else {
                    textSpan.innerHTML = 'Sin Stock';
                    Storevo.UI.Toast.show(data.message, 'error');
                }

                setTimeout(() => {
                    textSpan.innerHTML = originalHTML;
                    btn.classList.replace('bg-brand', 'bg-white');
                    btn.classList.replace('text-white', 'text-brand');
                }, 2000);
            });
    },

    buyNowWithQty: function(slug, productId) {
        const qty = document.getElementById('qty').value;
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('quantity', qty);

        fetch(`/s/${slug}/cart/add-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin' // <-- VITAL
        })
            .then(res => res.json())
            .then(data => {
                if(data.success) window.location.href = `/s/${slug}/cart/checkout`; // Corregido: va directo al checkout
                else Storevo.UI.Toast.show(data.message, 'error');
            });
    }
};

document.addEventListener('DOMContentLoaded', Storevo.Cart.initForms);

// Puente de Retrocompatibilidad
window.addItemToCart = Storevo.Cart.addItem; // Actualiza tus vistas HTML de toggleCartItem a addItemToCart
window.buyNowFast = Storevo.Cart.buyNowFast;
window.updateCartGlobalCounter = Storevo.Cart.updateGlobalCounter;
window.addToCartWithQty = Storevo.Cart.addWithQty;
window.buyNowWithQty = Storevo.Cart.buyNowWithQty;