window.Storevo = window.Storevo || {};

// ==========================================
// 1. COMPONENTE: CARRUSEL DE VISTA PREVIA
// ==========================================
window.StorevoPreview = {
    currentIndex: 0,
    totalImages: 0,

    updateGallery: function(imageUrls) {
        const container = document.getElementById('preview-img-container');
        const dotsContainer = document.getElementById('preview-dots');
        const btnPrev = document.getElementById('btn-prev-img');
        const btnNext = document.getElementById('btn-next-img');

        if (!container) return;

        this.totalImages = imageUrls.length;

        if (this.totalImages === 0) {
            container.innerHTML = '<div class="w-full h-full flex-shrink-0 flex items-center justify-center"><svg class="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
            if (btnPrev) btnPrev.classList.add('hidden');
            if (btnNext) btnNext.classList.add('hidden');
            if (dotsContainer) dotsContainer.innerHTML = '';
            this.slideTo(0);
            return;
        }

        // Inyectar TODAS las imágenes como un tren horizontal
        container.innerHTML = imageUrls.map(url =>
            `<img src="${url}" class="w-full h-full object-cover flex-shrink-0 bg-slate-900" />`
        ).join('');

        // Mostrar controles si hay más de 1 foto
        if (this.totalImages > 1) {
            if (btnPrev) btnPrev.classList.remove('hidden');
            if (btnNext) btnNext.classList.remove('hidden');
            if (dotsContainer) {
                dotsContainer.innerHTML = imageUrls.map((_, i) =>
                    `<div class="w-1.5 h-1.5 rounded-full transition-all ${i === 0 ? 'bg-white scale-125' : 'bg-white/40'}"></div>`
                ).join('');
            }
        } else {
            if (btnPrev) btnPrev.classList.add('hidden');
            if (btnNext) btnNext.classList.add('hidden');
            if (dotsContainer) dotsContainer.innerHTML = '';
        }

        this.slideTo(0);
    },

    nextImage: function() {
        if (this.currentIndex < this.totalImages - 1) {
            this.slideTo(this.currentIndex + 1);
        } else {
            this.slideTo(0); // Volver al inicio
        }
    },

    prevImage: function() {
        if (this.currentIndex > 0) {
            this.slideTo(this.currentIndex - 1);
        } else {
            this.slideTo(this.totalImages - 1); // Ir al final
        }
    },

    slideTo: function(index) {
        this.currentIndex = index;
        const container = document.getElementById('preview-img-container');

        if (container) {
            container.style.transform = `translateX(-${index * 100}%)`;
        }

        const dotsContainer = document.getElementById('preview-dots');
        if (dotsContainer && dotsContainer.children.length > 0) {
            Array.from(dotsContainer.children).forEach((dot, i) => {
                if (i === index) {
                    dot.classList.replace('bg-white/40', 'bg-white');
                    dot.classList.add('scale-125');
                } else {
                    dot.classList.replace('bg-white', 'bg-white/40');
                    dot.classList.remove('scale-125');
                }
            });
        }
    }
};

// ==========================================
// 2. MÓDULO: PRODUCT UX
// ==========================================
Storevo.ProductUX = {
    init: function() {
        const iName = document.getElementById('input-name');
        const pName = document.getElementById('preview-name');
        const pPriceContainer = document.getElementById('preview-price-container');
        const pCat = document.getElementById('preview-cat');
        const pctContainer = document.getElementById('discount-percentage-text');
        const pctValue = document.getElementById('discount-pct-val');

        const realPrice = document.getElementById('real-price');
        const visualPrice = document.getElementById('input-price');
        const realDiscount = document.getElementById('real-discount-price');
        const visualDiscount = document.getElementById('input-discount-price');
        const realStock = document.getElementById('real-stock');
        const visualStock = document.getElementById('input-stock');

        // 1. MÁSCARA DE MILES
        const applyMask = (visualInput, realInput) => {
            let value = visualInput.value.replace(/\D/g, "");
            if (value === "") {
                visualInput.value = "";
                realInput.value = "";
            } else {
                const num = parseInt(value, 10);
                visualInput.value = new Intl.NumberFormat('es-CO').format(num);
                realInput.value = num;
            }
        };

        [{v: visualPrice, r: realPrice}, {v: visualDiscount, r: realDiscount}, {v: visualStock, r: realStock}].forEach(item => {
            if (item.r && item.r.value && item.r.value !== "0.0" && item.r.value !== "0") {
                item.v.value = item.r.value.split('.')[0];
                applyMask(item.v, item.r);
            }
            if (item.v) {
                item.v.addEventListener('input', () => {
                    applyMask(item.v, item.r);
                    this.updateUIState();
                });
            }
        });

        // Revisar si ya venía con descuento desde el Backend
        if(realDiscount && parseFloat(realDiscount.value) > 0) this.toggleDiscountField();

        // 2. SCROLLSPY PARA EL MENÚ LATERAL
        const sections = document.querySelectorAll('main section');
        const navLinks = document.querySelectorAll('.nav-link');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.remove('bg-storevo-500/10', 'text-storevo-300', 'font-semibold');
                        link.classList.add('text-slate-500', 'hover:text-slate-200', 'hover:bg-slate-800');
                        link.querySelector('span').classList.replace('bg-storevo-400', 'bg-slate-600');
                        link.querySelector('span').classList.replace('bg-storevo-400', 'bg-slate-700');
                        if(link.getAttribute('href') === '#' + entry.target.id) {
                            link.classList.remove('text-slate-500', 'hover:text-slate-200', 'hover:bg-slate-800');
                            link.classList.add('bg-storevo-500/10', 'text-storevo-300', 'font-semibold');
                            link.querySelector('span').classList.add('bg-storevo-400');
                        }
                    });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(sec => observer.observe(sec));

        // 3. REACTIVIDAD (Preview, Barra de progreso y Checklist)
        this.updateUIState = () => {
            const priceVal = parseFloat(realPrice?.value) || 0;
            const discountVal = parseFloat(realDiscount?.value) || 0;
            const stockVal = parseFloat(realStock?.value) || 0;

            const hasName = iName?.value.trim().length > 0;
            const hasPrice = priceVal > 0;
            const hasDiscount = discountVal > 0 && discountVal < priceVal;
            const hasStock = realStock?.value.trim().length > 0;
            const hasCat = document.getElementById('finalCategoryId')?.value.trim() !== '';
            const hasImg = document.getElementById('image-preview-grid')?.children.length > 0 || (window.Storevo?.ProductImages?.state.existing.length > 0);

            let completed = 0;

            const setCheck = (id, isDone) => {
                const check = document.getElementById(`check-${id}`);
                const text = document.getElementById(`text-${id}`);
                if(!check || !text) return;

                if(isDone) {
                    completed++;
                    check.className = 'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-emerald-500';
                    check.innerHTML = '<svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>';
                    text.className = 'text-xs transition-colors text-slate-400 line-through';
                } else {
                    check.className = 'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-slate-800 border border-slate-700';
                    check.innerHTML = '';
                    text.className = 'text-xs transition-colors text-slate-500';
                }
            };

            setCheck('name', hasName);
            setCheck('price', hasPrice);
            setCheck('stock', hasStock);
            setCheck('category', hasCat);
            setCheck('images', hasImg);

            const progFill = document.getElementById('progress-bar-fill');
            const progText = document.getElementById('progress-text');
            if(progFill) progFill.style.width = `${(completed/5)*100}%`;
            if(progText) progText.textContent = `${completed}/5`;

            const vText = document.getElementById('bottom-validation-text');
            if(vText) {
                if(!hasName) vText.innerHTML = '<span class="text-xs text-slate-500">Escribe el nombre para continuar</span>';
                else if(!hasPrice) vText.innerHTML = '<span class="text-xs text-slate-500">Falta asignar un precio base</span>';
                else if(!hasStock) vText.innerHTML = '<span class="text-xs text-slate-500">Añade la cantidad en stock</span>';
                else vText.innerHTML = '<span class="text-xs text-emerald-400 font-medium flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>Listo para guardar</span>';
            }

            // Cálculo dinámico de descuento
            if (hasPrice && hasDiscount && pctContainer && pctValue) {
                const pct = Math.round(((priceVal - discountVal) / priceVal) * 100);
                pctValue.textContent = pct + '%';
                pctContainer.classList.remove('hidden');
            } else if (pctContainer) {
                pctContainer.classList.add('hidden');
            }

            // Pintar el Preview (Textos)
            if(pName) pName.textContent = hasName ? iName.value : '—';
            if(pCat) pCat.textContent = hasCat ? document.getElementById('summaryText').textContent : 'Sin categoría';

            const fmt = (num) => new Intl.NumberFormat('es-CO').format(num);

            if(pPriceContainer) {
                if (hasPrice && hasDiscount) {
                    pPriceContainer.innerHTML = `
                        <span class="text-sm font-bold text-storevo-400">$${fmt(discountVal)}</span>
                        <span class="text-[11px] font-medium text-slate-600 line-through ml-1">$${fmt(priceVal)}</span>
                    `;
                } else if (hasPrice) {
                    pPriceContainer.innerHTML = `<span class="text-sm font-bold text-storevo-400">$${fmt(priceVal)}</span>`;
                } else {
                    pPriceContainer.innerHTML = `<span class="text-sm font-bold text-slate-600">Sin precio</span>`;
                }
            }
        };

        if(iName) iName.addEventListener('input', this.updateUIState);

        const summaryText = document.getElementById('summaryText');
        if(summaryText) new MutationObserver(this.updateUIState).observe(summaryText, { childList: true, subtree: true });

        // Llamada inicial
        this.updateUIState();
    },

    toggleDiscountField: function() {
        const container = document.getElementById('discount-container');
        const btn = document.getElementById('btn-show-discount');
        const visualDiscount = document.getElementById('input-discount-price');
        const realDiscount = document.getElementById('real-discount-price');

        if(!container) return;

        if(container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            setTimeout(() => {
                container.classList.remove('opacity-0', '-translate-y-2');
                if(visualDiscount) visualDiscount.focus();
            }, 10);
            if(btn) {
                btn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg> Quitar precio de oferta`;
                btn.classList.replace('text-storevo-400', 'text-slate-500');
            }
        } else {
            container.classList.add('opacity-0', '-translate-y-2');
            if(btn) {
                btn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> Agregar precio de oferta`;
                btn.classList.replace('text-slate-500', 'text-storevo-400');
            }
            if(visualDiscount) visualDiscount.value = '';
            if(realDiscount) realDiscount.value = '';

            if(this.updateUIState) this.updateUIState();

            setTimeout(() => container.classList.add('hidden'), 200);
        }
    },

    // LA NUEVA MAGIA: UX de Variantes
    toggleVariantsUX: function(isActive) {
        const overlay = document.getElementById('pricing-overlay');
        const basePrice = document.getElementById('input-price')?.value;
        const baseStock = document.getElementById('input-stock')?.value;

        if (isActive) {
            // Mostrar bloqueo visual en la sección superior
            if (overlay) {
                overlay.classList.remove('hidden');
                overlay.classList.add('flex');
            }

            // Copiar los valores que el usuario ya escribió a los inputs de "Aplicar a todas" (Bulk)
            const bulkPrice = document.getElementById('vb-bulk-price');
            const bulkStock = document.getElementById('vb-bulk-stock');
            if (bulkPrice && basePrice) bulkPrice.value = basePrice;
            if (bulkStock && baseStock) bulkStock.value = baseStock;

            if (Storevo.ProductWizard) Storevo.ProductWizard.startWizard();
        } else {
            // Ocultar bloqueo visual
            if (overlay) {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
            }
            if (Storevo.ProductWizard) Storevo.ProductWizard.cancel();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Storevo.ProductUX.init();
});