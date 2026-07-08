window.Storevo = window.Storevo || {};

Storevo.VariantBuilder = {
    state: {
        hasVariants: false,
        options: [], // [{ name: 'Color', values: ['Rojo', 'Azul'] }]
        variantsData: {} // Dictionary => "Color:Rojo|Talla:M": { price, stock, sku, imageRef }
    },

    init: function() {
        // 1. Cargar estado inicial (Edición)
        this.state.hasVariants = window.INITIAL_HAS_VARIANTS || false;

        if (window.INITIAL_OPTIONS && window.INITIAL_OPTIONS.length > 0) {
            this.state.options = window.INITIAL_OPTIONS;
        } else {
            // Estado base si es nuevo
            this.state.options = [{ name: 'Talla', values: [] }];
        }

        if (window.INITIAL_VARIANTS && window.INITIAL_VARIANTS.length > 0) {
            window.INITIAL_VARIANTS.forEach(v => {
                const sig = this.generateSignatureFromMap(v.combination);
                this.state.variantsData[sig] = {
                    price: v.price || '',
                    stock: v.stock || 0,
                    sku: v.sku || '',
                    imageRef: v.imageRef || ''
                };
            });
        }

        // 2. Bindings del DOM
        const toggle = document.getElementById('hasVariantsToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.state.hasVariants = e.target.checked;
                this.toggleUI();
            });
        }

        document.getElementById('vb-btn-add-option').addEventListener('click', () => {
            if (this.state.options.length >= 3) {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Máximo 3 opciones permitidas', 'warning');
                return;
            }
            this.state.options.push({ name: '', values: [] });
            this.renderOptions();
        });

        const form = document.getElementById('product-form');
        if(form) {
            form.addEventListener('submit', () => this.syncHiddenInputs());
        }

        // Auto-ejecución visual
        this.toggleUI();
    },

    toggleUI: function() {
        const baseContainer = document.getElementById('base-price-stock-container');
        const variantContainer = document.getElementById('variant-builder-container');

        if (this.state.hasVariants) {
            // Ocultar Base, Mostrar Variantes
            baseContainer.classList.add('h-0', 'opacity-0', 'pointer-events-none');
            baseContainer.classList.remove('space-y-4');
            variantContainer.classList.remove('hidden');
            this.renderOptions();
        } else {
            // Mostrar Base, Ocultar Variantes
            baseContainer.classList.remove('h-0', 'opacity-0', 'pointer-events-none');
            baseContainer.classList.add('space-y-4');
            variantContainer.classList.add('hidden');
            document.getElementById('variants-hidden-inputs').innerHTML = ''; // Limpiar data para no enviarla al backend
        }
    },

    // --- ALGORITMOS CORE ---
    generateSignatureFromMap: function(comboMap) {
        // Ordena las llaves para garantizar que la firma siempre sea consistente
        return Object.keys(comboMap).sort().map(k => `${k}:${comboMap[k]}`).join('|');
    },

    getCartesianProduct: function() {
        // Filtra opciones vacías
        const validOptions = this.state.options.filter(o => o.name.trim() !== '' && o.values.length > 0);
        if (validOptions.length === 0) return [];

        // Reduce para generar combinaciones matemáticas (Producto Cartesiano)
        const cartesian = validOptions.reduce((acc, currOption) => {
            const currentValues = currOption.values;

            if(acc.length === 0) {
                return currentValues.map(val => ({ [currOption.name]: val }));
            }

            const newAcc = [];
            acc.forEach(existingCombo => {
                currentValues.forEach(val => {
                    newAcc.push({ ...existingCombo, [currOption.name]: val });
                });
            });
            return newAcc;
        }, []);

        return cartesian;
    },

    // --- RENDERIZADO VISUAL ---
    renderOptions: function() {
        const container = document.getElementById('vb-options-list');
        container.innerHTML = '';

        this.state.options.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = 'bg-slate-950 p-4 rounded-xl border border-slate-800 relative';

            // Chips de valores tipo Tags
            let tagsHtml = opt.values.map((val, vIdx) => `
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-storevo-500/20 text-storevo-400 border border-storevo-500/30 rounded-lg text-sm font-bold animate-fade-in-up">
                    ${val}
                    <button type="button" onclick="Storevo.VariantBuilder.removeTag(${idx}, ${vIdx})" class="hover:text-red-400 ml-1 transition-colors"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </span>
            `).join('');

            div.innerHTML = `
                ${idx > 0 ? `<button type="button" onclick="Storevo.VariantBuilder.removeOption(${idx})" class="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>` : ''}
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div class="md:col-span-1">
                        <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Opción</label>
                        <input type="text" value="${opt.name}" placeholder="Ej: Color" onchange="Storevo.VariantBuilder.updateOptionName(${idx}, this.value)" class="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-storevo-500 font-bold transition-colors">
                    </div>
                    <div class="md:col-span-3">
                        <label class="text-xs font-bold text-slate-500 uppercase mb-1 block">Valores</label>
                        <div class="flex flex-wrap gap-2 items-center bg-slate-900 border border-slate-800 rounded-lg p-2 min-h-[46px] focus-within:border-storevo-500 transition-colors">
                            ${tagsHtml}
                            <input type="text" placeholder="Escribe y presiona Enter..." onkeydown="Storevo.VariantBuilder.handleTagKey(event, ${idx})" class="bg-transparent text-white text-sm outline-none w-48 flex-grow ml-1">
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

        this.renderTable();
    },

    updateOptionName: function(idx, val) {
        this.state.options[idx].name = val;
        this.renderTable();
    },

    handleTagKey: function(e, idx) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (val && !this.state.options[idx].values.includes(val)) {
                this.state.options[idx].values.push(val);
                e.target.value = '';
                this.renderOptions();
            }
        }
    },

    removeTag: function(optIdx, valIdx) {
        this.state.options[optIdx].values.splice(valIdx, 1);
        this.renderOptions();
    },

    removeOption: function(idx) {
        this.state.options.splice(idx, 1);
        this.renderOptions();
    },

    updateVariantData: function(signature, field, value) {
        if (!this.state.variantsData[signature]) {
            this.state.variantsData[signature] = { price: '', stock: 0, sku: '', imageRef: '' };
        }
        this.state.variantsData[signature][field] = value;
    },

    renderTable: function() {
        const tbody = document.getElementById('vb-table-body');
        const container = document.getElementById('vb-table-container');
        tbody.innerHTML = '';

        const combinations = this.getCartesianProduct();
        if (combinations.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        // Heredar precio del input base para acelerar el llenado
        const basePrice = document.getElementById('price').value;

        combinations.forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            // 🧠 MAGIA DE RETENCIÓN DE ESTADO: Recuperamos si ya existía en memoria
            const data = this.state.variantsData[signature] || { price: basePrice, stock: 0, sku: '', imageRef: '' };
            this.state.variantsData[signature] = data;

            // Textos legibles (Ej: "Negro • M")
            const comboText = Object.values(combo).join(' <span class="text-slate-600 mx-1">•</span> ');

            // Thumbnail
            const imgHtml = data.imageRef ?
                `<img src="${data.imageRef}" class="w-full h-full object-cover">` :
                `<svg class="w-5 h-5 text-slate-500 group-hover:text-storevo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-800/80 transition-colors group';
            tr.innerHTML = `
                <td class="px-4 py-3 text-center">
                    <button type="button" onclick="Storevo.VariantBuilder.openImageModal('${signature}')" class="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden hover:border-storevo-500 transition-all shadow-sm">
                        ${imgHtml}
                    </button>
                </td>
                <td class="px-4 py-3 font-bold text-white text-base">${comboText}</td>
                <td class="px-4 py-3">
                    <div class="relative">
                        <span class="absolute left-3 top-2 text-slate-500 font-bold">$</span>
                        <input type="number" step="0.01" value="${data.price}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'price', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm pl-7 pr-2 py-2 focus:ring-storevo-500 transition-colors hover:border-slate-600">
                    </div>
                </td>
                <td class="px-4 py-3">
                    <input type="number" value="${data.stock}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'stock', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 transition-colors hover:border-slate-600 font-mono text-center">
                </td>
                <td class="px-4 py-3">
                    <input type="text" value="${data.sku}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'sku', this.value)" placeholder="Opcional" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 transition-colors hover:border-slate-600 font-mono">
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // --- INTEGRACIÓN FLUIDA CON IMÁGENES ---
    openImageModal: function(signature) {
        document.getElementById('vi-current-signature').value = signature;
        const grid = document.getElementById('vi-modal-grid');
        grid.innerHTML = '';

        // Buscar imágenes del módulo global Storevo.ProductImages
        let availableImages = [];
        if (Storevo.ProductImages && Storevo.ProductImages.state) {
            availableImages = Storevo.ProductImages.state.order.map(ref => {
                const isExisting = Storevo.ProductImages.state.existing.includes(ref);
                if (isExisting) return { ref: ref, url: ref };

                const fileObj = Storevo.ProductImages.state.newFiles.find(f => f.name === ref);
                return { ref: ref, url: fileObj ? URL.createObjectURL(fileObj) : '' };
            });
        }

        if (availableImages.length === 0) {
            grid.innerHTML = '<div class="col-span-3 sm:col-span-4 text-center py-10 bg-slate-950 rounded-xl border border-slate-800"><svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-slate-400 font-medium text-sm">Primero sube imágenes al producto<br>en la sección de arriba.</p></div>';
        } else {
            availableImages.forEach(img => {
                const div = document.createElement('div');
                div.className = 'aspect-square rounded-xl overflow-hidden border-2 border-slate-800 hover:border-storevo-500 cursor-pointer transition-all hover:scale-105 hover:shadow-lg shadow-storevo-500/20';
                div.innerHTML = `<img src="${img.url}" class="w-full h-full object-cover pointer-events-none">`;
                div.onclick = () => {
                    this.updateVariantData(signature, 'imageRef', img.ref);
                    this.closeModal();
                    this.renderTable(); // Redibuja la tabla para mostrar la foto elegida
                };
                grid.appendChild(div);
            });
        }

        const modal = document.getElementById('variant-image-modal');
        const content = document.getElementById('vi-modal-content');
        modal.classList.remove('hidden');
        modal.classList.remove('pointer-events-none');
        // Animación fluida Tailwind
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    },

    closeModal: function() {
        const modal = document.getElementById('variant-image-modal');
        const content = document.getElementById('vi-modal-content');
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        modal.classList.add('pointer-events-none');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    // --- SINCRONIZACIÓN SPRING BOOT (Magia DTO) ---
    syncHiddenInputs: function() {
        const container = document.getElementById('variants-hidden-inputs');
        container.innerHTML = '';
        if (!this.state.hasVariants) return;

        // 1. Exportar Opciones (Color, Talla)
        const validOptions = this.state.options.filter(o => o.name.trim() !== '' && o.values.length > 0);
        validOptions.forEach((opt, oIdx) => {
            this.createHidden(container, `options[${oIdx}].name`, opt.name.trim());
            opt.values.forEach((val, vIdx) => {
                this.createHidden(container, `options[${oIdx}].values[${vIdx}]`, val);
            });
        });

        // 2. Exportar Variantes Generadas a la Lista DTO
        const combinations = this.getCartesianProduct();
        combinations.forEach((combo, vIdx) => {
            const sig = this.generateSignatureFromMap(combo);
            const data = this.state.variantsData[sig];

            this.createHidden(container, `variants[${vIdx}].sku`, data.sku || '');
            this.createHidden(container, `variants[${vIdx}].price`, data.price || '');
            this.createHidden(container, `variants[${vIdx}].stock`, data.stock || '0');
            this.createHidden(container, `variants[${vIdx}].imageRef`, data.imageRef || '');

            // Generar el Map (Diccionario) para Spring Boot
            Object.keys(combo).forEach(key => {
                // Spring parsea textualmente objects tipo map con ['llave']
                this.createHidden(container, `variants[${vIdx}].combination['${key}']`, combo[key]);
            });
        });
    },

    createHidden: function(container, name, value) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        container.appendChild(input);
    }
};

// Autoejecución
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.VariantBuilder.init());
} else {
    Storevo.VariantBuilder.init();
}