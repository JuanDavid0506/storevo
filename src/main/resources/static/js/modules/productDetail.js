window.Storevo = window.Storevo || {};

Storevo.ProductDetail = {
    state: {
        selectedOptions: {}
    },

    init: function() {
        this.loadDataFromBridge();
        this.initQuantityControls();
        this.initAccordions();
        this.initVariantSelectors();
    },

    loadDataFromBridge: function() {
        const bridge = document.getElementById('product-detail-bridge');
        if (!bridge) return;

        window.PRODUCT_HAS_VARIANTS = bridge.getAttribute('data-has-variants') === 'true';
        window.PRODUCT_MAIN_IMAGE = bridge.getAttribute('data-main-image') || '/img/placeholder.jpg';
        window.PRODUCT_IS_MADE_TO_ORDER = bridge.getAttribute('data-made-to-order') === 'true';
        window.PRODUCT_BASE_PRICE = parseFloat(bridge.getAttribute('data-base-price')) || 0;
        window.PRODUCT_ORIGINAL_PRICE = parseFloat(bridge.getAttribute('data-original-price')) || 0;

        const nodes = bridge.querySelectorAll('.variant-data-node');
        window.PRODUCT_VARIANTS_DATA = Array.from(nodes).map(n => ({
            id: n.getAttribute('data-id'),
            signature: n.getAttribute('data-signature') || '',
            price: parseFloat(n.getAttribute('data-price')) || 0,
            stock: parseInt(n.getAttribute('data-stock'), 10) || 0,
            sku: n.getAttribute('data-sku') || '',
            imageRef: n.getAttribute('data-image-ref') || ''
        }));
    },

    initQuantityControls: function() {
        const qtyInput = document.getElementById('detail-quantity-input') || document.querySelector('input[name="quantity"]');
        if (!qtyInput) return;

        const sanitizeQty = () => {
            let val = parseInt(qtyInput.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            const maxAttr = qtyInput.getAttribute('max');
            if (maxAttr !== null && maxAttr !== '') {
                const maxVal = parseInt(maxAttr, 10);
                if (!isNaN(maxVal) && maxVal > 0 && val > maxVal) {
                    val = maxVal;
                }
            }
            qtyInput.value = val;
        };

        document.querySelectorAll('[data-qty-step]').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = parseInt(btn.getAttribute('data-qty-step'), 10) || 0;
                const current = parseInt(qtyInput.value, 10) || 1;
                qtyInput.value = current + step;
                sanitizeQty();
            });
        });

        qtyInput.addEventListener('change', sanitizeQty);
        qtyInput.addEventListener('blur', sanitizeQty);
    },

    initAccordions: function() {
        document.querySelectorAll('[data-accordion-target]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-accordion-target');
                const iconId = btn.getAttribute('data-accordion-icon');
                const content = document.getElementById(targetId);
                const icon = document.getElementById(iconId);
                if (content) content.classList.toggle('hidden');
                if (icon) icon.classList.toggle('rotate-180');
            });
        });
    },

    changeImage: function(btn) {
        const src = btn.getAttribute('data-src');
        const mainImg = document.getElementById('main-product-image');
        if (mainImg && src) {
            mainImg.classList.add('opacity-50');
            setTimeout(() => {
                mainImg.src = src;
                mainImg.classList.remove('opacity-50');
            }, 150);
        }

        document.querySelectorAll('.product-thumbnail').forEach(el => {
            el.classList.remove('border-brand', 'shadow-md', 'ring-2', 'ring-brand/20');
            el.classList.add('border-transparent', 'opacity-70');
        });
        btn.classList.remove('border-transparent', 'opacity-70');
        btn.classList.add('border-brand', 'shadow-md', 'ring-2', 'ring-brand/20');
    },

    initVariantSelectors: function() {
        if (!window.PRODUCT_HAS_VARIANTS) return;

        const groups = document.querySelectorAll('.variant-option-group');
        window.TOTAL_OPTIONS_COUNT = groups.length;

        // Marcar visualmente opciones agotadas desde el inicio
        this.refreshOptionButtonsAvailability();

        groups.forEach(group => {
            const optName = group.getAttribute('data-option-name');
            const btns = group.querySelectorAll('.opt-btn');

            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => {
                        b.classList.remove('border-brand', 'text-brand', 'bg-brand/5', 'ring-2', 'ring-brand/20');
                        b.classList.add('border-slate-200', 'text-slate-600', 'bg-white');
                    });

                    btn.classList.remove('border-slate-200', 'text-slate-600', 'bg-white');
                    btn.classList.add('border-brand', 'text-brand', 'bg-brand/5', 'ring-2', 'ring-brand/20');

                    this.state.selectedOptions[optName] = btn.getAttribute('data-value');
                    const errEl = group.querySelector('.option-error');
                    if (errEl) errEl.classList.add('hidden');

                    this.refreshOptionButtonsAvailability();
                    this.checkVariantMatch();
                });
            });
        });

        const form = document.getElementById('add-to-cart-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (window.PRODUCT_HAS_VARIANTS && !document.getElementById('selectedVariantId').value) {
                    e.preventDefault();
                    groups.forEach(g => {
                        const optName = g.getAttribute('data-option-name');
                        if (!this.state.selectedOptions[optName]) {
                            const errEl = g.querySelector('.option-error');
                            if (errEl) errEl.classList.remove('hidden');
                        }
                    });
                    if (Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show('Selecciona las opciones que deseas', 'warning');
                    }
                }
            });
        }
    },

    refreshOptionButtonsAvailability: function() {
        if (window.PRODUCT_IS_MADE_TO_ORDER || !Array.isArray(window.PRODUCT_VARIANTS_DATA)) return;

        const groups = document.querySelectorAll('.variant-option-group');
        groups.forEach(group => {
            const groupName = group.getAttribute('data-option-name');
            group.querySelectorAll('.opt-btn').forEach(btn => {
                const candidateVal = btn.getAttribute('data-value');

                // Verificar si existe al menos una combinación con stock > 0 compatible con las demás opciones ya elegidas
                const hasStock = window.PRODUCT_VARIANTS_DATA.some(v => {
                    if (v.stock <= 0) return false;
                    const parts = (v.signature || '').split('|');
                    const map = {};
                    parts.forEach(p => {
                        const idx = p.indexOf(':');
                        if (idx > -1) map[p.substring(0, idx)] = p.substring(idx + 1);
                    });
                    if (map[groupName] !== candidateVal) return false;

                    for (const [selKey, selVal] of Object.entries(this.state.selectedOptions)) {
                        if (selKey !== groupName && map[selKey] && map[selKey] !== selVal) {
                            return false;
                        }
                    }
                    return true;
                });

                btn.classList.toggle('opacity-50', !hasStock);
                btn.classList.toggle('line-through', !hasStock);
            });
        });
    },

    checkVariantMatch: function() {
        if (Object.keys(this.state.selectedOptions).length < window.TOTAL_OPTIONS_COUNT) return;

        const sig = Object.keys(this.state.selectedOptions)
            .sort()
            .map(k => `${k}:${this.state.selectedOptions[k]}`)
            .join('|');

        const variant = (window.PRODUCT_VARIANTS_DATA || []).find(v => v.signature === sig);

        const btnCart = document.getElementById('btn-add-cart');
        const btnBuyNow = document.getElementById('btn-buy-now');
        const stockDisplay = document.getElementById('dynamic-stock');
        const priceDisplay = document.getElementById('dynamic-price');
        const pricePrefix = document.getElementById('dynamic-price-prefix');
        const oldPriceDisplay = document.getElementById('dynamic-old-price');
        const skuDisplay = document.getElementById('dynamic-sku');
        const variantInput = document.getElementById('selectedVariantId');
        const qtyInput = document.querySelector('input[name="quantity"]');
        const mainImg = document.getElementById('main-product-image');

        this.updateTechnicalSheet(this.state.selectedOptions, variant);

        if (variant) {
            const displayPrice = (variant.price && variant.price > 0) ? variant.price : window.PRODUCT_BASE_PRICE;
            if (pricePrefix) pricePrefix.classList.add('hidden');

            priceDisplay.classList.add('opacity-0');
            setTimeout(() => {
                priceDisplay.textContent = '$ ' + displayPrice.toLocaleString('es-CO');
                priceDisplay.classList.remove('opacity-0');
            }, 150);

            // Si la variante cuesta igual o más que el precio original tachado, ocultar el precio tachado
            if (oldPriceDisplay) {
                const shouldHideOld = window.PRODUCT_ORIGINAL_PRICE > 0 && displayPrice >= window.PRODUCT_ORIGINAL_PRICE;
                oldPriceDisplay.classList.toggle('hidden', shouldHideOld);
            }

            if (skuDisplay) {
                if (variant.sku) {
                    skuDisplay.textContent = 'SKU: ' + variant.sku;
                    skuDisplay.classList.remove('hidden');
                } else {
                    skuDisplay.classList.add('hidden');
                }
            }

            if (mainImg) {
                const targetImgUrl = variant.imageRef ? variant.imageRef : (window.PRODUCT_MAIN_IMAGE || '/img/placeholder.jpg');
                mainImg.classList.add('opacity-50');
                setTimeout(() => {
                    mainImg.src = targetImgUrl;
                    mainImg.classList.remove('opacity-50');
                }, 150);

                document.querySelectorAll('.product-thumbnail').forEach(el => {
                    el.classList.remove('border-brand', 'shadow-md', 'ring-2', 'ring-brand/20');
                    el.classList.add('border-transparent', 'opacity-70');
                });
            }

            const isMadeToOrder = window.PRODUCT_IS_MADE_TO_ORDER === true;

            if (isMadeToOrder || variant.stock > 0) {
                variantInput.value = variant.id;
                stockDisplay.textContent = isMadeToOrder ? 'Bajo pedido' : ('Stock disponible: ' + variant.stock);
                stockDisplay.className = 'text-xs text-slate-500 mt-2 font-medium transition-colors';

                if (!isMadeToOrder && qtyInput) {
                    qtyInput.max = variant.stock;
                    if (parseInt(qtyInput.value, 10) > variant.stock) qtyInput.value = variant.stock;
                } else if (qtyInput) {
                    qtyInput.removeAttribute('max');
                }

                if (btnCart) {
                    btnCart.disabled = false;
                    btnCart.classList.remove('bg-slate-100', 'text-slate-400', 'border-slate-200', 'cursor-not-allowed');
                    btnCart.classList.add('bg-white', 'text-brand', 'border-brand', 'hover:bg-brand', 'hover:text-white');
                    btnCart.innerHTML = `<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> <span>Agregar a la Bolsa</span>`;
                }
                if (btnBuyNow) {
                    btnBuyNow.disabled = false;
                    btnBuyNow.className = 'h-14 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg';
                    btnBuyNow.innerHTML = '<span>Comprar ahora</span>';
                }
            } else {
                variantInput.value = '';
                stockDisplay.textContent = 'Agotado para esta combinación';
                stockDisplay.className = 'text-xs text-red-500 mt-2 font-bold transition-colors';

                if (btnCart) {
                    btnCart.disabled = true;
                    btnCart.classList.remove('bg-white', 'text-brand', 'border-brand', 'hover:bg-brand', 'hover:text-white');
                    btnCart.classList.add('bg-slate-100', 'text-slate-400', 'border-slate-200', 'cursor-not-allowed');
                    btnCart.innerHTML = `<span>Agotado</span>`;
                }
                if (btnBuyNow) {
                    btnBuyNow.disabled = true;
                    btnBuyNow.className = 'h-14 w-full bg-slate-300 text-white font-bold rounded-xl cursor-not-allowed text-lg';
                    btnBuyNow.innerHTML = '<span>Agotado</span>';
                }
            }
        } else {
            variantInput.value = '';
            stockDisplay.textContent = 'Combinación no disponible';
            stockDisplay.className = 'text-xs text-orange-500 mt-2 font-bold transition-colors';

            if (btnCart) {
                btnCart.disabled = true;
                btnCart.classList.remove('bg-white', 'text-brand', 'border-brand', 'hover:bg-brand', 'hover:text-white');
                btnCart.classList.add('bg-slate-100', 'text-slate-400', 'border-slate-200', 'cursor-not-allowed');
                btnCart.innerHTML = `<span>No disponible</span>`;
            }
            if (btnBuyNow) {
                btnBuyNow.disabled = true;
                btnBuyNow.className = 'h-14 w-full bg-slate-300 text-white font-bold rounded-xl cursor-not-allowed text-lg';
                btnBuyNow.innerHTML = '<span>No disponible</span>';
            }
        }
    },

    updateTechnicalSheet: function(selectedOptions, variant) {
        const specsList = document.getElementById('specs-list');
        if (!specsList) return;

        document.querySelectorAll('.dynamic-spec').forEach(el => el.remove());

        Object.entries(selectedOptions).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'flex justify-between py-2 border-b border-slate-200/60 dynamic-spec opacity-0 transition-opacity duration-300';
            row.innerHTML = `
                <span class="text-slate-500 font-medium text-sm">${key}</span>
                <span class="text-slate-900 font-bold text-sm text-right">${value}</span>
            `;
            specsList.appendChild(row);
            setTimeout(() => row.classList.remove('opacity-0'), 10);
        });

        if (variant && variant.sku) {
            const skuRow = document.createElement('div');
            skuRow.className = 'flex justify-between py-2 border-b border-slate-200/60 dynamic-spec opacity-0 transition-opacity duration-300';
            skuRow.innerHTML = `
                <span class="text-slate-500 font-medium text-sm">SKU</span>
                <span class="text-slate-900 font-mono font-bold text-sm text-right">${variant.sku}</span>
            `;
            specsList.appendChild(skuRow);
            setTimeout(() => skuRow.classList.remove('opacity-0'), 10);
        }
    },

    buyNow: function(btn, slug) {
        const form = document.getElementById('add-to-cart-form');
        if (!form) return;
        const formData = new FormData(form);

        if (window.PRODUCT_HAS_VARIANTS && !formData.get('variantId')) {
            if (Storevo.UI && Storevo.UI.Toast) {
                Storevo.UI.Toast.show('Por favor selecciona las opciones del producto.', 'warning');
            }
            document.querySelectorAll('.option-error').forEach(el => el.classList.remove('hidden'));
            return;
        }

        const originalText = btn.innerHTML;
        btn.classList.add('opacity-75', 'pointer-events-none');
        btn.innerHTML = '<span class="animate-pulse">Procesando...</span>';

        fetch(form.action.replace('/add', '/add-ajax'), {
            method: 'POST',
            body: new URLSearchParams(formData),
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = `/s/${slug}/cart/checkout`;
                } else {
                    if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(data.message, 'error');
                    btn.classList.remove('opacity-75', 'pointer-events-none');
                    btn.innerHTML = originalText;
                }
            })
            .catch(() => {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Ocurrió un error de red.', 'error');
                btn.classList.remove('opacity-75', 'pointer-events-none');
                btn.innerHTML = originalText;
            });
    }
};

// Puente de retrocompatibilidad global
window.buyNowDetail = function(btn, slug) {
    Storevo.ProductDetail.buyNow(btn, slug);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.ProductDetail.init());
} else {
    Storevo.ProductDetail.init();
}