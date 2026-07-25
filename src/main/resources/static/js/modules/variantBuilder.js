window.Storevo = window.Storevo || {};

Storevo.VariantBuilder = {
    // --- PLANTILLAS RÁPIDAS ---
    TEMPLATES: {
        ropa:          { label: 'Ropa', icon: '👕', options: [{ name: 'Color', values: [] }, { name: 'Talla', values: ['S', 'M', 'L', 'XL'] }] },
        calzado:       { label: 'Calzado', icon: '👟', options: [{ name: 'Color', values: [] }, { name: 'Número', values: ['36', '37', '38', '39', '40', '41', '42'] }] },
        perfume:       { label: 'Perfumes', icon: '🌸', options: [{ name: 'Presentación', values: ['30 ml', '50 ml', '100 ml'] }] },
        accesorios:    { label: 'Accesorios', icon: '💍', options: [{ name: 'Color', values: [] }] },
        tecnologia:    { label: 'Tecnología', icon: '📱', options: [{ name: 'Color', values: [] }, { name: 'Capacidad', values: ['64GB', '128GB', '256GB'] }] },
        personalizado: { label: 'Personalizado', icon: '✏️', options: [{ name: '', values: [] }] }
    },

    PRESET_VALUES: {
        'talla': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'tallas': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'size': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'color': ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Beige', 'Rosado', 'Café'],
        'colores': ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Beige', 'Rosado', 'Café'],
        'numero': ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
        'número': ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
        'talla calzado': ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44']
    },

    COLOR_HEX: {
        'negro': '#18181b', 'blanco': '#ffffff', 'rojo': '#dc2626', 'azul': '#2563eb',
        'verde': '#16a34a', 'amarillo': '#eab308', 'gris': '#6b7280', 'beige': '#d8c3a5',
        'rosado': '#ec4899', 'rosa': '#ec4899', 'cafe': '#78350f', 'café': '#78350f',
        'naranja': '#f97316', 'morado': '#7c3aed', 'violeta': '#7c3aed', 'dorado': '#ca8a04',
        'plateado': '#94a3b8', 'turquesa': '#06b6d4', 'vinotinto': '#7f1d1d', 'crema': '#fef3c7'
    },

    state: {
        options: [],
        variantsData: {},
        excluded: {},
        collapsedGroups: {}
    },

    init: function() {
        if (window.INITIAL_OPTIONS && window.INITIAL_OPTIONS.length > 0) {
            this.state.options = window.INITIAL_OPTIONS;
        } else {
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

        document.getElementById('vb-btn-add-option').addEventListener('click', () => {
            if (this.state.options.length >= 3) {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Máximo 3 opciones permitidas', 'warning');
                return;
            }
            this.state.options.push({ name: '', values: [] });
            this.renderOptions();
        });

        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', () => this.syncHiddenInputs());
        }

        // Se renderiza, pero el Wizard de ProductWizard es quien decide si lo muestra o no.
        this.renderOptions();
    },

    applyTemplate: function(key) {
        const template = this.TEMPLATES[key];
        if (!template) return;
        this.state.options = template.options.map(o => ({ name: o.name, values: [...o.values] }));
        this.state.collapsedGroups = {};
        this.renderOptions();
        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Plantilla "${template.label}" aplicada.`, 'success');
    },

    generateSignatureFromMap: function(comboMap) {
        return Object.keys(comboMap).sort().map(k => `${k}:${comboMap[k]}`).join('|');
    },

    getCartesianProduct: function() {
        const validOptions = this.state.options.filter(o => o.name.trim() !== '' && o.values.length > 0);
        if (validOptions.length === 0) return [];
        return validOptions.reduce((acc, currOption) => {
            const currentValues = currOption.values;
            if (acc.length === 0) return currentValues.map(val => ({ [currOption.name]: val }));
            const newAcc = [];
            acc.forEach(existingCombo => {
                currentValues.forEach(val => newAcc.push({ ...existingCombo, [currOption.name]: val }));
            });
            return newAcc;
        }, []);
    },

    getValidOptions: function() {
        return this.state.options.filter(o => o.name.trim() !== '' && o.values.length > 0);
    },

    isColorOption: function(name) {
        const key = (name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return key === 'color' || key === 'colores';
    },

    getColorHex: function(valueName) {
        const key = (valueName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (this.COLOR_HEX[key]) return this.COLOR_HEX[key];
        let hash = 0;
        for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${Math.abs(hash) % 360}, 55%, 45%)`;
    },

    colorDotHtml: function(valueName) {
        const hex = this.getColorHex(valueName);
        const borderClass = hex === '#ffffff' ? 'border-slate-500' : 'border-black/20';
        return `<span class="inline-block w-3 h-3 rounded-full border ${borderClass} mr-1.5 align-middle" style="background-color:${hex}"></span>`;
    },

    getPresetSuggestions: function(optionName) {
        const key = (optionName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const matchKey = Object.keys(this.PRESET_VALUES).find(k => k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === key);
        return matchKey ? this.PRESET_VALUES[matchKey] : [];
    },

    addSuggestedValue: function(idx, val) {
        if (!this.state.options[idx].values.includes(val)) {
            this.state.options[idx].values.push(val);
            this.renderOptions();
        }
    },

    renderOptions: function() {
        const container = document.getElementById('vb-options-list');
        if (!container) return;
        container.innerHTML = '';

        this.state.options.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = 'bg-slate-950 p-4 rounded-xl border border-slate-800 relative';
            const isColor = this.isColorOption(opt.name);

            let tagsHtml = opt.values.map((val, vIdx) => `
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-storevo-500/20 text-storevo-400 border border-storevo-500/30 rounded-lg text-sm font-bold animate-fade-in-up">
                    ${isColor ? this.colorDotHtml(val) : ''}${val}
                    <button type="button" onclick="Storevo.VariantBuilder.removeTag(${idx}, ${vIdx})" class="hover:text-red-400 ml-1 transition-colors"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </span>
            `).join('');

            const suggestions = this.getPresetSuggestions(opt.name).filter(v => !opt.values.includes(v));
            const suggestionsHtml = suggestions.length > 0 ? `
                <div class="flex flex-wrap gap-1.5 mt-2">
                    <span class="text-[11px] text-slate-600 font-bold self-center mr-1">Sugeridos:</span>
                    ${suggestions.map(val => `
                        <button type="button" onclick="Storevo.VariantBuilder.addSuggestedValue(${idx}, '${val}')" class="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:border-storevo-500 hover:text-storevo-400 transition-colors">${isColor ? this.colorDotHtml(val) : '+ '}${val}</button>
                    `).join('')}
                </div>
            ` : '';

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
                        ${suggestionsHtml}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

        this.renderTable();
    },

    updateOptionName: function(idx, val) {
        this.state.options[idx].name = val;
        this.renderOptions();
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
        if (!this.state.variantsData[signature]) this.state.variantsData[signature] = { price: '', stock: 0, sku: '', imageRef: '' };
        this.state.variantsData[signature][field] = value;
    },

    applyBulk: function(field) {
        const input = document.getElementById(field === 'price' ? 'vb-bulk-price' : 'vb-bulk-stock');
        if (!input.value) return;
        this.forEachIncludedCombo(combo => this.updateVariantData(this.generateSignatureFromMap(combo), field, input.value));
        this.renderTable();
    },

    applyPercentAdjust: function(pct) {
        const basePrice = parseFloat(document.getElementById('price').value) || 0;
        this.forEachIncludedCombo(combo => {
            const signature = this.generateSignatureFromMap(combo);
            const data = this.state.variantsData[signature] || { price: basePrice, stock: 0, sku: '', imageRef: '' };
            this.updateVariantData(signature, 'price', Math.max(0, Math.round((parseFloat(data.price) || basePrice) * (1 + pct / 100))));
        });
        this.renderTable();
    },

    applyAmountAdjust: function(amount) {
        const basePrice = parseFloat(document.getElementById('price').value) || 0;
        this.forEachIncludedCombo(combo => {
            const signature = this.generateSignatureFromMap(combo);
            const data = this.state.variantsData[signature] || { price: basePrice, stock: 0, sku: '', imageRef: '' };
            this.updateVariantData(signature, 'price', Math.max(0, Math.round((parseFloat(data.price) || basePrice) + amount)));
        });
        this.renderTable();
    },

    forEachIncludedCombo: function(callback) {
        let count = 0;
        this.getCartesianProduct().forEach(combo => {
            if (!this.state.excluded[this.generateSignatureFromMap(combo)]) { callback(combo); count++; }
        });
        return count;
    },

    toggleExclude: function(signature) {
        if (this.state.excluded[signature]) delete this.state.excluded[signature];
        else this.state.excluded[signature] = true;
        this.renderTable();
    },

    groupCopy: function(groupValue, sourceSignature) {
        const validOpts = this.getValidOptions();
        if (validOpts.length < 2) return;
        const sourceData = this.state.variantsData[sourceSignature];
        if (!sourceData) return;
        this.getCartesianProduct().forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            if (signature !== sourceSignature && combo[validOpts[0].name] === groupValue && !this.state.excluded[signature]) {
                this.state.variantsData[signature] = { ...this.state.variantsData[signature], price: sourceData.price, stock: sourceData.stock, sku: sourceData.sku };
            }
        });
        this.renderTable();
    },

    toggleGroup: function(groupValue) {
        this.state.collapsedGroups[groupValue] = !this.state.collapsedGroups[groupValue];
        this.renderTable();
    },

    renderTable: function() {
        const tbody = document.getElementById('vb-table-body');
        const container = document.getElementById('vb-table-container');
        const bulkPanel = document.getElementById('vb-bulk-panel');
        if (!tbody || !container || !bulkPanel) return;

        tbody.innerHTML = '';
        const combinations = this.getCartesianProduct();
        if (combinations.length === 0) {
            container.classList.add('hidden');
            bulkPanel.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        bulkPanel.classList.remove('hidden');

        const validOptions = this.getValidOptions();
        const basePrice = document.getElementById('price').value;
        let activeCount = 0;

        combinations.forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            if (!this.state.variantsData[signature]) this.state.variantsData[signature] = { price: basePrice, stock: 0, sku: '', imageRef: '' };
            if (!this.state.excluded[signature]) activeCount++;
        });

        if (validOptions.length >= 2) this.renderGroupedRows(tbody, combinations, validOptions);
        else combinations.forEach(combo => tbody.appendChild(this.buildRow(this.generateSignatureFromMap(combo), Object.values(combo).join(' • '), null)));

        const summary = document.getElementById('vb-table-summary');
        if (summary) summary.textContent = `${activeCount} combinaciones se guardarán.`;
    },

    renderGroupedRows: function(tbody, combinations, validOptions) {
        const firstOptionName = validOptions[0].name;
        const groups = {};
        validOptions[0].values.forEach(val => { groups[val] = []; });
        combinations.forEach(combo => {
            const groupValue = combo[firstOptionName];
            if (!groups[groupValue]) groups[groupValue] = [];
            groups[groupValue].push(combo);
        });

        Object.keys(groups).forEach(groupValue => {
            const groupCombos = groups[groupValue];
            if (groupCombos.length === 0) return;
            const isCollapsed = !!this.state.collapsedGroups[groupValue];
            const activeInGroup = groupCombos.filter(c => !this.state.excluded[this.generateSignatureFromMap(c)]).length;

            const headerTr = document.createElement('tr');
            headerTr.className = 'bg-slate-900/70';
            headerTr.innerHTML = `
                <td colspan="6" class="px-4 py-2.5">
                    <button type="button" onclick="Storevo.VariantBuilder.toggleGroup('${groupValue}')" class="w-full flex items-center gap-2 text-left">
                        <svg class="w-4 h-4 text-slate-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        ${this.isColorOption(firstOptionName) ? this.colorDotHtml(groupValue) : ''}
                        <span class="font-bold text-white text-sm">${groupValue}</span>
                        <span class="text-xs text-slate-500 font-medium">(${activeInGroup} versiones)</span>
                    </button>
                </td>
            `;
            tbody.appendChild(headerTr);

            if (isCollapsed) return;
            groupCombos.forEach(combo => {
                const restLabel = Object.keys(combo).filter(k => k !== firstOptionName).map(k => combo[k]).join(' • ');
                tbody.appendChild(this.buildRow(this.generateSignatureFromMap(combo), restLabel, groupValue));
            });
        });
    },

    buildRow: function(signature, comboLabel, groupValue) {
        const data = this.state.variantsData[signature] || { price: '', stock: 0, sku: '', imageRef: '' };
        const isExcluded = !!this.state.excluded[signature];
        const dAttr = isExcluded ? 'disabled' : '';

        const imgHtml = data.imageRef ? `<img src="${data.imageRef}" class="w-full h-full object-cover">` : `<svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
        const copyBtn = groupValue ? `<button type="button" ${dAttr} onclick="Storevo.VariantBuilder.groupCopy('${groupValue}', '${signature}')" class="text-slate-500 hover:text-storevo-400 disabled:opacity-30"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>` : '';

        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-800/80 transition-colors ${isExcluded ? 'opacity-40' : ''} ${groupValue ? 'border-l-2 border-slate-800' : ''}`;
        tr.innerHTML = `
            <td class="px-4 py-3 text-center"><input type="checkbox" ${isExcluded ? '' : 'checked'} onchange="Storevo.VariantBuilder.toggleExclude('${signature}')" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-storevo-500 focus:ring-storevo-500"></td>
            <td class="px-4 py-3 text-center"><button type="button" ${dAttr} onclick="Storevo.VariantBuilder.openImageModal('${signature}')" class="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden">${imgHtml}</button></td>
            <td class="px-4 py-3 font-bold text-white text-sm"><div class="flex items-center gap-2">${groupValue ? '<span class="text-slate-600 font-normal">↳</span>' : ''}<span>${comboLabel}</span>${copyBtn}</div></td>
            <td class="px-4 py-3"><input type="number" step="0.01" ${dAttr} value="${data.price}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'price', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-2 py-2 focus:ring-storevo-500"></td>
            <td class="px-4 py-3"><input type="number" ${dAttr} value="${data.stock}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'stock', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 font-mono text-center"></td>
            <td class="px-4 py-3"><input type="text" ${dAttr} value="${data.sku}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'sku', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 font-mono"></td>
        `;
        return tr;
    },

    openImageModal: function(signature) {
        document.getElementById('vi-current-signature').value = signature;
        const grid = document.getElementById('vi-modal-grid');
        grid.innerHTML = '';
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
            grid.innerHTML = '<div class="col-span-3 text-center py-6 text-slate-500 text-sm">Primero sube imágenes al producto.</div>';
        } else {
            availableImages.forEach(img => {
                const div = document.createElement('div');
                div.className = 'aspect-square rounded-xl overflow-hidden border-2 border-slate-800 hover:border-storevo-500 cursor-pointer';
                div.innerHTML = `<img src="${img.url}" class="w-full h-full object-cover pointer-events-none">`;
                div.onclick = () => { this.updateVariantData(signature, 'imageRef', img.ref); this.closeModal(); this.renderTable(); };
                grid.appendChild(div);
            });
        }
        const modal = document.getElementById('variant-image-modal');
        modal.classList.remove('hidden', 'pointer-events-none');
        setTimeout(() => { modal.classList.remove('opacity-0'); document.getElementById('vi-modal-content').classList.remove('scale-95'); }, 10);
    },

    closeModal: function() {
        const modal = document.getElementById('variant-image-modal');
        modal.classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('vi-modal-content').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    syncHiddenInputs: function() {
        const container = document.getElementById('variants-hidden-inputs');
        if (!container) return;
        container.innerHTML = '';

        // El checkbox maestro le dice a Spring Boot si debe procesar o ignorar la data
        if (!document.getElementById('hasVariantsToggle').checked) return;

        const validOptions = this.getValidOptions();
        validOptions.forEach((opt, oIdx) => {
            this.createHidden(container, `options[${oIdx}].name`, opt.name.trim());
            opt.values.forEach((val, vIdx) => this.createHidden(container, `options[${oIdx}].values[${vIdx}]`, val));
        });

        const combinations = this.getCartesianProduct().filter(combo => !this.state.excluded[this.generateSignatureFromMap(combo)]);
        combinations.forEach((combo, vIdx) => {
            const data = this.state.variantsData[this.generateSignatureFromMap(combo)];
            this.createHidden(container, `variants[${vIdx}].sku`, data.sku || '');
            this.createHidden(container, `variants[${vIdx}].price`, data.price || '');
            this.createHidden(container, `variants[${vIdx}].stock`, data.stock || '0');
            this.createHidden(container, `variants[${vIdx}].imageRef`, data.imageRef || '');
            Object.keys(combo).forEach(key => this.createHidden(container, `variants[${vIdx}].combination['${key}']`, combo[key]));
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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Storevo.VariantBuilder.init());
else Storevo.VariantBuilder.init();