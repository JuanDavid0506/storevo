window.Storevo = window.Storevo || {};

Storevo.VariantBuilder = {
    // --- PLANTILLAS RÁPIDAS POR TIPO DE TIENDA ---
    TEMPLATES: {
        ropa:          { label: 'Ropa', icon: '👕', options: [{ name: 'Color', values: [] }, { name: 'Talla', values: ['S', 'M', 'L', 'XL'] }] },
        calzado:       { label: 'Calzado', icon: '👟', options: [{ name: 'Color', values: [] }, { name: 'Número', values: ['36', '37', '38', '39', '40', '41', '42'] }] },
        perfume:       { label: 'Perfumes', icon: '🌸', options: [{ name: 'Presentación', values: ['30 ml', '50 ml', '100 ml'] }] },
        accesorios:    { label: 'Accesorios', icon: '💍', options: [{ name: 'Color', values: [] }] },
        tecnologia:    { label: 'Tecnología', icon: '📱', options: [{ name: 'Color', values: [] }, { name: 'Almacenamiento', values: ['64GB', '128GB', '256GB'] }] },
        personalizado: { label: 'Personalizado', icon: '✏️', options: [{ name: '', values: [] }] }
    },

    // --- VALORES SUGERIDOS (CHIPS) ---
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
        hasVariants: false,
        options: [], // [{ name: 'Color', values: ['Rojo', 'Azul'] }]
        variantsData: {}, // Dictionary => "Color:Rojo|Talla:M": { price, stock, sku, imageRef }
        excluded: {}, // Dictionary => "Color:Rojo|Talla:M": true (combinaciones que NO se guardan)
        collapsedGroups: {} // Dictionary => "Negro": true (grupo colapsado en la tabla)
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
        if (form) {
            form.addEventListener('submit', () => this.syncHiddenInputs());
        }

        this.renderTemplates();

        // Auto-ejecución visual
        this.toggleUI();
    },

    toggleUI: function() {
        const baseContainer = document.getElementById('base-price-stock-container');
        const variantContainer = document.getElementById('variant-builder-container');

        if (this.state.hasVariants) {
            // Ocultar Base (Modo Rápido), Mostrar Variantes
            baseContainer.classList.add('h-0', 'opacity-0', 'pointer-events-none');
            baseContainer.classList.remove('space-y-4');
            variantContainer.classList.remove('hidden');
            this.renderOptions();
        } else {
            // Modo Rápido: Mostrar Base, Ocultar Variantes. Nada de Color/Talla/tablas.
            baseContainer.classList.remove('h-0', 'opacity-0', 'pointer-events-none');
            baseContainer.classList.add('space-y-4');
            variantContainer.classList.add('hidden');
            document.getElementById('variants-hidden-inputs').innerHTML = ''; // Limpiar data para no enviarla al backend
        }
    },

    showTemplates: function() {
        document.getElementById('vb-help-banner').classList.add('hidden');
        document.getElementById('vb-templates-panel').classList.remove('hidden');
    },

    hideTemplates: function() {
        document.getElementById('vb-templates-panel').classList.add('hidden');
        document.getElementById('vb-help-banner').classList.remove('hidden');
    },

    // --- PLANTILLAS ---
    renderTemplates: function() {
        const grid = document.getElementById('vb-templates-grid');
        if (!grid) return;
        grid.innerHTML = Object.keys(this.TEMPLATES).map(key => {
            const t = this.TEMPLATES[key];
            return `
                <button type="button" onclick="Storevo.VariantBuilder.applyTemplate('${key}')" class="flex flex-col items-center justify-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-4 hover:border-storevo-500 hover:bg-slate-800/60 transition-all group">
                    <span class="text-2xl group-hover:scale-110 transition-transform">${t.icon}</span>
                    <span class="text-xs font-bold text-slate-300 group-hover:text-storevo-400 transition-colors">${t.label}</span>
                </button>
            `;
        }).join('');
    },

    applyTemplate: function(key) {
        const template = this.TEMPLATES[key];
        if (!template) return;

        // Clonamos para no mutar la plantilla original
        this.state.options = template.options.map(o => ({ name: o.name, values: [...o.values] }));
        this.state.collapsedGroups = {};
        this.renderOptions();

        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Plantilla "${template.label}" aplicada. Ajusta los valores si hace falta.`, 'success');

        this.hideTemplates();
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

            if (acc.length === 0) {
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

    getValidOptions: function() {
        return this.state.options.filter(o => o.name.trim() !== '' && o.values.length > 0);
    },

    // --- COLORCITOS 🎨 ---
    isColorOption: function(name) {
        const key = (name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return key === 'color' || key === 'colores';
    },

    getColorHex: function(valueName) {
        const key = (valueName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (this.COLOR_HEX[key]) return this.COLOR_HEX[key];

        // Fallback: generamos un color determinístico a partir del texto para que
        // cualquier nombre de color personalizado también tenga su "colorcito".
        let hash = 0;
        for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 55%, 45%)`;
    },

    colorDotHtml: function(valueName) {
        const hex = this.getColorHex(valueName);
        const borderClass = hex === '#ffffff' ? 'border-slate-500' : 'border-black/20';
        return `<span class="inline-block w-3 h-3 rounded-full border ${borderClass} mr-1.5 align-middle" style="background-color:${hex}"></span>`;
    },

    // --- RENDERIZADO VISUAL: OPCIONES ---
    getPresetSuggestions: function(optionName) {
        const key = (optionName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const matchKey = Object.keys(this.PRESET_VALUES).find(k => {
            const kNorm = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return kNorm === key;
        });
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
        container.innerHTML = '';

        this.state.options.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = 'bg-slate-950 p-4 rounded-xl border border-slate-800 relative';
            const isColor = this.isColorOption(opt.name);

            // Chips de valores tipo Tags (con colorcito si la opción es Color)
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
        this.renderOptions(); // Refresca también las sugerencias (Talla/Color) según el nuevo nombre
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

    // --- DATOS DE LAS VARIANTES ---
    updateVariantData: function(signature, field, value) {
        if (!this.state.variantsData[signature]) {
            this.state.variantsData[signature] = { price: '', stock: 0, sku: '', imageRef: '' };
        }
        this.state.variantsData[signature][field] = value;
    },

    applyBulk: function(field) {
        const inputId = field === 'price' ? 'vb-bulk-price' : 'vb-bulk-stock';
        const input = document.getElementById(inputId);
        const rawValue = input.value;

        if (rawValue === '' || rawValue === null) {
            if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Escribe un valor antes de aplicar', 'warning');
            return;
        }

        const appliedCount = this.forEachIncludedCombo(combo => {
            const signature = this.generateSignatureFromMap(combo);
            this.updateVariantData(signature, field, rawValue);
        });

        this.renderTable();
        const label = field === 'price' ? 'Precio' : 'Stock';
        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`${label} aplicado a ${appliedCount} variantes`, 'success');
    },

    applyPercentAdjust: function(pct) {
        const basePrice = parseFloat(document.getElementById('price').value) || 0;
        const appliedCount = this.forEachIncludedCombo(combo => {
            const signature = this.generateSignatureFromMap(combo);
            const data = this.state.variantsData[signature] || { price: basePrice, stock: 0, sku: '', imageRef: '' };
            const currentPrice = parseFloat(data.price) || basePrice;
            const newPrice = Math.max(0, Math.round(currentPrice * (1 + pct / 100)));
            this.updateVariantData(signature, 'price', newPrice);
        });
        this.renderTable();
        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Precio ajustado ${pct > 0 ? '+' : ''}${pct}% en ${appliedCount} variantes`, 'success');
    },

    applyAmountAdjust: function(amount) {
        const basePrice = parseFloat(document.getElementById('price').value) || 0;
        const appliedCount = this.forEachIncludedCombo(combo => {
            const signature = this.generateSignatureFromMap(combo);
            const data = this.state.variantsData[signature] || { price: basePrice, stock: 0, sku: '', imageRef: '' };
            const currentPrice = parseFloat(data.price) || basePrice;
            const newPrice = Math.max(0, Math.round(currentPrice + amount));
            this.updateVariantData(signature, 'price', newPrice);
        });
        this.renderTable();
        const sign = amount > 0 ? '+' : '';
        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Precio ajustado ${sign}$${amount.toLocaleString('es-CO')} en ${appliedCount} variantes`, 'success');
    },

    forEachIncludedCombo: function(callback) {
        const combinations = this.getCartesianProduct();
        let count = 0;
        combinations.forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            if (this.state.excluded[signature]) return; // No tocar las excluidas
            callback(combo);
            count++;
        });
        return count;
    },

    toggleExclude: function(signature) {
        if (this.state.excluded[signature]) {
            delete this.state.excluded[signature];
        } else {
            this.state.excluded[signature] = true;
        }
        this.renderTable();
    },

    // --- COPIAR DENTRO DE UN GRUPO (Ej: copiar precio/stock/SKU de "Negro M" a Negro S, Negro L...) ---
    groupCopy: function(groupValue, sourceSignature) {
        const validOptions = this.getValidOptions();
        if (validOptions.length < 2) return;
        const firstOptionName = validOptions[0].name;

        const sourceData = this.state.variantsData[sourceSignature];
        if (!sourceData) return;

        let count = 0;
        this.getCartesianProduct().forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            if (signature === sourceSignature) return;
            if (combo[firstOptionName] !== groupValue) return;
            if (this.state.excluded[signature]) return;

            this.state.variantsData[signature] = {
                ...this.state.variantsData[signature],
                price: sourceData.price,
                stock: sourceData.stock,
                sku: sourceData.sku
            };
            count++;
        });

        this.renderTable();
        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Precio, stock y SKU copiados a ${count} variantes de "${groupValue}"`, 'success');
    },

    toggleGroup: function(groupValue) {
        this.state.collapsedGroups[groupValue] = !this.state.collapsedGroups[groupValue];
        this.renderTable();
    },

    // --- RENDERIZADO DE LA TABLA (plana o agrupada) ---
    renderTable: function() {
        const tbody = document.getElementById('vb-table-body');
        const container = document.getElementById('vb-table-container');
        const bulkPanel = document.getElementById('vb-bulk-panel');
        tbody.innerHTML = '';

        const combinations = this.getCartesianProduct();
        if (combinations.length === 0) {
            container.classList.add('hidden');
            if (bulkPanel) bulkPanel.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        if (bulkPanel) bulkPanel.classList.remove('hidden');

        const validOptions = this.getValidOptions();
        const basePrice = document.getElementById('price').value;
        let activeCount = 0;

        // Aseguramos que exista data para cada combinación (y contamos activas)
        combinations.forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            if (!this.state.variantsData[signature]) {
                this.state.variantsData[signature] = { price: basePrice, stock: 0, sku: '', imageRef: '' };
            }
            if (!this.state.excluded[signature]) activeCount++;
        });

        if (validOptions.length >= 2) {
            this.renderGroupedRows(tbody, combinations, validOptions);
        } else {
            combinations.forEach(combo => {
                const signature = this.generateSignatureFromMap(combo);
                const comboText = Object.values(combo).join(' <span class="text-slate-600 mx-1">•</span> ');
                tbody.appendChild(this.buildRow(signature, comboText, null));
            });
        }

        const summary = document.getElementById('vb-table-summary');
        if (summary) {
            summary.textContent = combinations.length === activeCount
                ? `${activeCount} variante${activeCount === 1 ? '' : 's'} se guardará${activeCount === 1 ? '' : 'n'}.`
                : `${activeCount} de ${combinations.length} combinaciones posibles se guardarán (las demás están excluidas).`;
        }
    },

    renderGroupedRows: function(tbody, combinations, validOptions) {
        const firstOptionName = validOptions[0].name;
        const isColorGroup = this.isColorOption(firstOptionName);

        // Agrupamos preservando el orden de los valores tal como los escribió el vendedor
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
                        ${isColorGroup ? this.colorDotHtml(groupValue) : ''}
                        <span class="font-bold text-white text-sm">${groupValue}</span>
                        <span class="text-xs text-slate-500 font-medium">(${activeInGroup} de ${groupCombos.length} variantes)</span>
                    </button>
                </td>
            `;
            tbody.appendChild(headerTr);

            if (isCollapsed) return;

            groupCombos.forEach(combo => {
                const signature = this.generateSignatureFromMap(combo);
                // Etiqueta de la fila = valores de las demás opciones (sin repetir la del grupo)
                const restLabel = Object.keys(combo)
                    .filter(k => k !== firstOptionName)
                    .map(k => combo[k])
                    .join(' • ');
                tbody.appendChild(this.buildRow(signature, restLabel, groupValue));
            });
        });
    },

    // Construye una fila <tr> de la tabla de variantes (reutilizable en modo plano y agrupado)
    buildRow: function(signature, comboLabel, groupValue) {
        const data = this.state.variantsData[signature] || { price: '', stock: 0, sku: '', imageRef: '' };
        const isExcluded = !!this.state.excluded[signature];
        const disabledAttr = isExcluded ? 'disabled' : '';

        const imgHtml = data.imageRef ?
            `<img src="${data.imageRef}" class="w-full h-full object-cover">` :
            `<svg class="w-5 h-5 text-slate-500 group-hover:text-storevo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;

        const copyBtnHtml = groupValue ? `
            <button type="button" ${disabledAttr} title="Copiar precio, stock y SKU a las demás variantes de ${groupValue}" onclick="Storevo.VariantBuilder.groupCopy('${groupValue}', '${signature}')" class="text-slate-500 hover:text-storevo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
        ` : '';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/80 transition-colors group' + (isExcluded ? ' opacity-40' : '') + (groupValue ? ' border-l-2 border-slate-800' : '');
        tr.innerHTML = `
            <td class="px-4 py-3 text-center">
                <input type="checkbox" ${isExcluded ? '' : 'checked'} onchange="Storevo.VariantBuilder.toggleExclude('${signature}')" title="Incluir esta variante" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-storevo-500 focus:ring-storevo-500 cursor-pointer">
            </td>
            <td class="px-4 py-3 text-center">
                <button type="button" ${disabledAttr} onclick="Storevo.VariantBuilder.openImageModal('${signature}')" class="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden hover:border-storevo-500 transition-all shadow-sm disabled:cursor-not-allowed disabled:hover:border-slate-700">
                    ${imgHtml}
                </button>
            </td>
            <td class="px-4 py-3 font-bold text-white text-base">
                <div class="flex items-center gap-2">
                    ${groupValue ? '<span class="text-slate-600 font-normal text-sm">↳</span>' : ''}
                    <span>${comboLabel}</span>
                    ${copyBtnHtml}
                </div>
                ${isExcluded ? '<span class="block text-[11px] font-bold text-slate-500 normal-case mt-0.5">No se guardará</span>' : ''}
            </td>
            <td class="px-4 py-3">
                <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-500 font-bold">$</span>
                    <input type="number" step="0.01" ${disabledAttr} value="${data.price}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'price', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm pl-7 pr-2 py-2 focus:ring-storevo-500 transition-colors hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                </div>
            </td>
            <td class="px-4 py-3">
                <input type="number" ${disabledAttr} value="${data.stock}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'stock', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 transition-colors hover:border-slate-600 font-mono text-center disabled:opacity-50 disabled:cursor-not-allowed">
            </td>
            <td class="px-4 py-3">
                <input type="text" ${disabledAttr} value="${data.sku}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'sku', this.value)" placeholder="Opcional" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 transition-colors hover:border-slate-600 font-mono disabled:opacity-50 disabled:cursor-not-allowed">
            </td>
        `;
        return tr;
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

        // 2. Exportar Variantes Generadas a la Lista DTO (sin las excluidas)
        const combinations = this.getCartesianProduct().filter(combo => !this.state.excluded[this.generateSignatureFromMap(combo)]);
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