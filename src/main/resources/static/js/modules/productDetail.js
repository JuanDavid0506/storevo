window.Storevo = window.Storevo || {};

Storevo.ProductDetail = {
    state: {
        selectedOptions: {}
    },

    init: function() {
        this.initVariantSelectors();
    },

    // Permite cambiar la imagen al hacer clic en las miniaturas
    changeImage: function(btn) {
        const src = btn.getAttribute('data-src');
        const mainImg = document.getElementById('main-product-image');
        if (mainImg) {
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

        groups.forEach(group => {
            const optName = group.getAttribute('data-option-name');
            const btns = group.querySelectorAll('.opt-btn');

            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Resetear el diseño de todos los botones de este grupo
                    btns.forEach(b => {
                        b.classList.remove('border-brand', 'text-brand', 'bg-brand/5', 'ring-2', 'ring-brand/20');
                        b.classList.add('border-slate-200', 'text-slate-600', 'bg-white');
                    });

                    // Activar este botón
                    btn.classList.remove('border-slate-200', 'text-slate-600', 'bg-white');
                    btn.classList.add('border-brand', 'text-brand', 'bg-brand/5', 'ring-2', 'ring-brand/20');

                    this.state.selectedOptions[optName] = btn.getAttribute('data-value');
                    group.querySelector('.option-error').classList.add('hidden');

                    this.checkVariantMatch();
                });
            });
        });

        // Validar envío del carrito
        const form = document.getElementById('add-to-cart-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (window.PRODUCT_HAS_VARIANTS && !document.getElementById('selectedVariantId').value) {
                    e.preventDefault();
                    groups.forEach(g => {
                        const optName = g.getAttribute('data-option-name');
                        if (!this.state.selectedOptions[optName]) {
                            g.querySelector('.option-error').classList.remove('hidden');
                        }
                    });
                    if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Selecciona las opciones que deseas', 'warning');
                }
            });
        }
    },

    checkVariantMatch: function() {
        if (Object.keys(this.state.selectedOptions).length < window.TOTAL_OPTIONS_COUNT) return;

        // Construir la Firma exacta a como la guardó Spring Boot (Ordenada alfabéticamente)
        const sig = Object.keys(this.state.selectedOptions)
            .sort()
            .map(k => `${k}:${this.state.selectedOptions[k]}`)
            .join('|');

        // Buscar en la memoria JSON
        const variant = window.PRODUCT_VARIANTS_DATA.find(v => v.signature === sig);

        const btnCart = document.getElementById('btn-add-cart');
        const stockDisplay = document.getElementById('dynamic-stock');
        const priceDisplay = document.getElementById('dynamic-price');
        const skuDisplay = document.getElementById('dynamic-sku');
        const variantInput = document.getElementById('selectedVariantId');
        const qtyInput = document.querySelector('input[name="quantity"]');
        const mainImg = document.getElementById('main-product-image');

        if (variant) {
            // Actualizar Precio de forma fluida
            priceDisplay.classList.add('opacity-0');
            setTimeout(() => {
                priceDisplay.textContent = '$ ' + variant.price.toLocaleString('es-CO');
                priceDisplay.classList.remove('opacity-0');
            }, 150);

            // Actualizar SKU si existe
            if(skuDisplay) {
                if(variant.sku) {
                    skuDisplay.textContent = 'SKU: ' + variant.sku;
                    skuDisplay.classList.remove('hidden');
                } else {
                    skuDisplay.classList.add('hidden');
                }
            }

            // Actualizar Imagen o usar Fallback a la imagen principal
            if (mainImg) {
                const targetImgUrl = variant.imageRef ? variant.imageRef : (window.PRODUCT_MAIN_IMAGE || '/img/placeholder.jpg');

                mainImg.classList.add('opacity-50');
                setTimeout(() => {
                    mainImg.src = targetImgUrl;
                    mainImg.classList.remove('opacity-50');
                }, 150);

                // Desmarcar miniaturas
                document.querySelectorAll('.product-thumbnail').forEach(el => {
                    el.classList.remove('border-brand', 'shadow-md', 'ring-2', 'ring-brand/20');
                    el.classList.add('border-transparent', 'opacity-70');
                });
            }

            // Gestionar Disponibilidad
            if (variant.stock > 0) {
                variantInput.value = variant.id;
                stockDisplay.textContent = 'Stock disponible: ' + variant.stock;
                stockDisplay.className = 'text-xs text-slate-500 mt-2 font-medium transition-colors';

                qtyInput.max = variant.stock;
                if(parseInt(qtyInput.value) > variant.stock) qtyInput.value = variant.stock;

                btnCart.disabled = false;
                btnCart.classList.remove('bg-slate-300', 'cursor-not-allowed');
                btnCart.classList.add('bg-brand', 'hover:bg-brand/90');
                btnCart.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> <span>Agregar a la Bolsa</span>`;
            } else {
                variantInput.value = '';
                stockDisplay.textContent = 'Agotado para esta combinación';
                stockDisplay.className = 'text-xs text-red-500 mt-2 font-bold transition-colors';

                btnCart.disabled = true;
                btnCart.classList.remove('bg-brand', 'hover:bg-brand/90');
                btnCart.classList.add('bg-slate-300', 'cursor-not-allowed');
                btnCart.innerHTML = `<span>Agotado</span>`;
            }
        } else {
            variantInput.value = '';
            stockDisplay.textContent = 'Combinación no disponible';
            stockDisplay.className = 'text-xs text-orange-500 mt-2 font-bold transition-colors';

            btnCart.disabled = true;
            btnCart.classList.remove('bg-brand', 'hover:bg-brand/90');
            btnCart.classList.add('bg-slate-300', 'cursor-not-allowed');
            btnCart.innerHTML = `<span>No disponible</span>`;
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.ProductDetail.init());
} else {
    Storevo.ProductDetail.init();
}