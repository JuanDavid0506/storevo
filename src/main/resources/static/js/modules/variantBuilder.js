window.Storevo = window.Storevo || {};

Storevo.VariantBuilder = {

    // --- CEREBRO BASE (DICCIONARIO ESTÁTICO) ---
    PRESET_VALUES: {
        'talla': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
        'tallas': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'size': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'color': ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Beige', 'Rosado', 'Café', 'Dorado', 'Plateado'],
        'colores': ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Beige', 'Rosado', 'Café'],
        'presentacion': ['30 ml', '50 ml', '100 ml'],
        'capacidad': ['64 GB', '128 GB', '256 GB', '512 GB'],
        'material': ['Acero', 'Plata', 'Oro', 'Cuero']
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
        collapsedGroups: {},
        imageModalTarget: null,
        tempSelectedImages: [],
        suggestionsCache: {} // Cerebro Vivo (Caché asíncrono)
    },

    init: function() {
        if (this.state.options && this.state.options.length > 0) {
            // Ya inicializado
        } else if (window.INITIAL_HAS_VARIANTS && window.INITIAL_OPTIONS && window.INITIAL_OPTIONS.length > 0) {

            this.state.options = window.INITIAL_OPTIONS;

            if (window.INITIAL_VARIANTS && window.INITIAL_VARIANTS.length > 0) {
                window.INITIAL_VARIANTS.forEach(v => {
                    const sig = this.generateSignatureFromMap(v.combination || {});
                    this.state.variantsData[sig] = {
                        price: v.price || '',
                        stock: v.stock || 0,
                        sku: v.sku || '',
                        imageRef: v.imageUrl || v.imageRef || ''
                    };
                });
            }

            setTimeout(() => {
                const toggleUI = document.getElementById('hasVariantsToggleUI');
                if (toggleUI) toggleUI.checked = true;
                const toggle = document.getElementById('hasVariantsToggle');
                if (toggle) toggle.checked = true;

                const emptyState = document.getElementById('options-empty-state');
                if (emptyState) emptyState.classList.add('hidden');

                const builder = document.getElementById('variant-builder-container');
                if (builder) builder.classList.remove('hidden', 'opacity-0');

                this.state.options.forEach(opt => {
                    if (opt.name.trim()) this.fetchSuggestions(opt.name);
                });

                this.renderOptions();
            }, 50);

        } else {
            const savedTemplate = localStorage.getItem('storevo_product_template');
            const lastMode = localStorage.getItem('storevo_product_mode');
            const isNewProduct = typeof window.IS_NEW_PRODUCT !== 'undefined' ? window.IS_NEW_PRODUCT : true;

            if (isNewProduct && savedTemplate && lastMode === 'options' && Storevo.ProductWizard.templates.find(t => t.id === savedTemplate)) {
                // Dejamos vacío, el Wizard se encargará si es necesario
            } else {
                this.state.options = [{ name: 'Talla', values: [] }];
            }
        }

        const btnAdd = document.getElementById('vb-btn-add-option');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                if (this.state.options.length >= 3) {
                    if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Máximo 3 opciones permitidas', 'warning');
                    return;
                }
                this.state.options.push({ name: '', values: [] });
                this.renderOptions();
            });
        }

        const form = document.getElementById('product-form');
        if (form) form.addEventListener('submit', () => this.syncHiddenInputs());

        const toggleUI = document.getElementById('hasVariantsToggleUI');
        if (toggleUI) {
            toggleUI.addEventListener('change', (e) => {
                this.toggleMainFields(e.target.checked);
            });
            this.toggleMainFields(toggleUI.checked);
        }

        if(this.state.options.length > 0 && this.state.options[0].name.trim()) {
            this.fetchSuggestions(this.state.options[0].name);
        } else {
            this.renderOptions();
        }
    },

    toggleMainFields: function(isVariantsActive) {
        const inputPrice = document.getElementById('input-price');
        const inputStock = document.getElementById('input-stock');
        const helpTextContainer = document.getElementById('pricing');

        if (isVariantsActive) {
            if (inputPrice) {
                inputPrice.disabled = true;
                inputPrice.classList.add('opacity-50', 'cursor-not-allowed', 'bg-slate-900');
            }
            if (inputStock) {
                inputStock.disabled = true;
                inputStock.classList.add('opacity-50', 'cursor-not-allowed', 'bg-slate-900');
            }

            let warning = document.getElementById('variants-lock-warning');
            if (!warning && helpTextContainer) {
                const msg = document.createElement('div');
                msg.id = 'variants-lock-warning';
                msg.className = 'mt-4 bg-storevo-500/10 border border-storevo-500/20 text-storevo-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in-up';
                msg.innerHTML = '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> <span>El precio base y el stock total se <b>auto-calculan</b> desde tus variantes activas.</span>';
                helpTextContainer.appendChild(msg);
            }
        } else {
            if (inputPrice) {
                inputPrice.disabled = false;
                inputPrice.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-slate-900');
            }
            if (inputStock) {
                inputStock.disabled = false;
                inputStock.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-slate-900');
            }
            const warning = document.getElementById('variants-lock-warning');
            if (warning) warning.remove();
        }
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
        return `<span class="inline-block w-3 h-3 rounded-full border ${borderClass} mr-1.5 align-middle shrink-0" style="background-color:${hex}"></span>`;
    },

    generateSignatureFromMap: function(comboMap) {
        return Object.keys(comboMap).sort().map(k => `${k}:${comboMap[k]}`).join('|');
    },

    getCartesianProduct: function() {
        const validOptions = this.getValidOptions();
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

    fetchSuggestions: async function(optionName) {
        const catIdInput = document.getElementById('finalCategoryId');
        const catId = catIdInput ? catIdInput.value : null;
        const key = (optionName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (!catId || !key) return;
        if (this.state.suggestionsCache[key]) return;

        try {
            const slug = window.location.pathname.split('/')[2];
            const response = await fetch(`/dashboard/${slug}/products/api/categories/${catId}/options/${encodeURIComponent(optionName.trim())}/suggestions`);

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    this.state.suggestionsCache[key] = data;
                    this.renderOptions();
                }
            }
        } catch (error) {
            console.error("Fallo silencioso al buscar sugerencias dinámicas:", error);
        }
    },

    getPresetSuggestions: function(optionName) {
        const key = (optionName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const matchKey = Object.keys(this.PRESET_VALUES).find(k => k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === key);
        const baseSuggestions = matchKey ? this.PRESET_VALUES[matchKey] : [];
        const liveSuggestions = this.state.suggestionsCache[key] || [];

        const merged = [];
        const seen = new Set();

        [...liveSuggestions, ...baseSuggestions].forEach(val => {
            const valKey = val.toLowerCase().trim();
            if (!seen.has(valKey)) {
                seen.add(valKey);
                merged.push(val);
            }
        });

        return merged;
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
                        <input type="text" value="${opt.name}" placeholder="Ej: Color" onblur="Storevo.VariantBuilder.updateOptionName(${idx}, this.value)" class="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-storevo-500 font-bold transition-colors">
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
        if (this.state.options[idx].name !== val) {
            this.state.options[idx].name = val;
            this.fetchSuggestions(val);
            this.renderOptions();
        }
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
        this.syncHiddenInputs();
    },

    applyBulk: function(field) {
        const input = document.getElementById(field === 'price' ? 'vb-bulk-price' : 'vb-bulk-stock');
        if (!input || !input.value) return;
        this.forEachIncludedCombo(combo => this.updateVariantData(this.generateSignatureFromMap(combo), field, input.value));
        input.value = '';
        this.renderTable();
        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Aplicado a la selección', 'success');
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

        const colorOption = validOpts.find(opt => this.isColorOption(opt.name));
        const groupOptionName = colorOption ? colorOption.name : validOpts[0].name;

        const sourceData = this.state.variantsData[sourceSignature];
        if (!sourceData) return;

        this.getCartesianProduct().forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            if (signature !== sourceSignature && combo[groupOptionName] === groupValue && !this.state.excluded[signature]) {
                this.state.variantsData[signature] = { ...this.state.variantsData[signature], price: sourceData.price, stock: sourceData.stock, sku: sourceData.sku };
            }
        });
        this.renderTable();
        if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Copiado al grupo', 'success');
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
        const basePrice = document.getElementById('real-price')?.value || 0;
        let activeCount = 0;

        combinations.forEach(combo => {
            const signature = this.generateSignatureFromMap(combo);
            if (!this.state.variantsData[signature]) this.state.variantsData[signature] = { price: basePrice, stock: 0, sku: '', imageRef: '' };
            if (!this.state.excluded[signature]) activeCount++;
        });

        const colorOption = validOptions.find(opt => this.isColorOption(opt.name));
        const hasColor = !!colorOption;

        const thead = container.querySelector('thead tr');
        if (thead) {
            thead.innerHTML = `
                <th class="px-4 py-3 font-bold w-12 text-center">✓</th>
                ${hasColor ? '<th class="px-4 py-3 font-bold w-16 text-center">Img</th>' : ''}
                <th class="px-4 py-3 font-bold">Versión</th>
                <th class="px-4 py-3 font-bold w-32">Precio ($)</th>
                <th class="px-4 py-3 font-bold w-24">Stock</th>
                <th class="px-4 py-3 font-bold w-32">SKU</th>
            `;
        }

        const isGrouped = validOptions.length >= 2;

        if (isGrouped) {
            this.renderGroupedRows(tbody, combinations, validOptions, hasColor, colorOption ? colorOption.name : null);
        } else {
            combinations.forEach(combo => {
                const signature = this.generateSignatureFromMap(combo);
                const comboLabel = Object.values(combo).join(' • ');
                tbody.appendChild(this.buildRow(signature, comboLabel, null, hasColor, false));
            });
        }

        const summary = document.getElementById('vb-table-summary');
        if (summary) summary.textContent = `${activeCount} combinaciones se guardarán.`;

        this.syncHiddenInputs();
    },

    renderGroupedRows: function(tbody, combinations, validOptions, hasColor, colorOptionName) {
        const groupOptionName = colorOptionName || validOptions[0].name;
        const groupOption = validOptions.find(o => o.name === groupOptionName);

        const groups = {};
        groupOption.values.forEach(val => { groups[val] = []; });

        combinations.forEach(combo => {
            const groupValue = combo[groupOptionName];
            if (!groups[groupValue]) groups[groupValue] = [];
            groups[groupValue].push(combo);
        });

        Object.keys(groups).forEach(groupValue => {
            const groupCombos = groups[groupValue];
            if (groupCombos.length === 0) return;
            const isCollapsed = !!this.state.collapsedGroups[groupValue];
            const activeInGroup = groupCombos.filter(c => !this.state.excluded[this.generateSignatureFromMap(c)]).length;

            const headerTr = document.createElement('tr');
            headerTr.className = 'bg-slate-900/70 border-b border-slate-800/50';

            let imgBtnHtml = '';
            if (hasColor && colorOptionName === groupOptionName) {
                const firstSig = this.generateSignatureFromMap(groupCombos[0]);
                const currentImgRef = (this.state.variantsData[firstSig] || {}).imageRef || '';
                imgBtnHtml = this.renderImageButtonHtml(currentImgRef, `Storevo.VariantBuilder.openImageModal({type:'group', value:'${groupValue}'})`);
            }

            const colSpan = hasColor ? '6' : '5';

            headerTr.innerHTML = `
                <td colspan="${colSpan}" class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <button type="button" onclick="Storevo.VariantBuilder.toggleGroup('${groupValue}')" class="flex items-center gap-2 text-left hover:text-white transition-colors text-slate-300">
                            <svg class="w-4 h-4 text-slate-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            ${this.isColorOption(groupOptionName) ? this.colorDotHtml(groupValue) : ''}
                            <span class="font-bold text-sm">${groupValue}</span>
                            <span class="text-xs text-slate-500 font-medium">(${activeInGroup} versiones)</span>
                        </button>
                        ${imgBtnHtml ? `<div class="ml-2">${imgBtnHtml}</div>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(headerTr);

            if (isCollapsed) return;
            groupCombos.forEach(combo => {
                const restLabel = Object.keys(combo).filter(k => k !== groupOptionName).map(k => combo[k]).join(' • ');
                const signature = this.generateSignatureFromMap(combo);
                const isGroupedByColor = hasColor && (colorOptionName === groupOptionName);
                tbody.appendChild(this.buildRow(signature, restLabel, groupValue, hasColor, isGroupedByColor));
            });
        });
    },

    buildRow: function(signature, comboLabel, groupValue, hasColor, isGroupedByColor) {
        const data = this.state.variantsData[signature] || { price: '', stock: 0, sku: '', imageRef: '' };
        const isExcluded = !!this.state.excluded[signature];
        const dAttr = isExcluded ? 'disabled' : '';

        let imgColHtml = '';
        if (hasColor) {
            if (isGroupedByColor && groupValue) {
                imgColHtml = `<td class="px-4 py-3 text-center"></td>`;
            } else {
                imgColHtml = `<td class="px-4 py-3 text-center">${this.renderImageButtonHtml(data.imageRef, `Storevo.VariantBuilder.openImageModal({type:'signature', value:'${signature}'})`, dAttr)}</td>`;
            }
        }

        const copyBtn = groupValue ? `<button type="button" ${dAttr} onclick="Storevo.VariantBuilder.groupCopy('${groupValue}', '${signature}')" class="text-slate-500 hover:text-storevo-400 disabled:opacity-30"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>` : '';

        const tr = document.createElement('tr');
        tr.className = `hover:bg-slate-800/80 transition-colors ${isExcluded ? 'opacity-40' : ''} ${groupValue ? 'border-l-2 border-slate-800' : ''}`;
        tr.innerHTML = `
            <td class="px-4 py-3 text-center"><input type="checkbox" ${isExcluded ? '' : 'checked'} onchange="Storevo.VariantBuilder.toggleExclude('${signature}')" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-storevo-500 focus:ring-storevo-500"></td>
            ${imgColHtml}
            <td class="px-4 py-3 font-bold text-white text-sm"><div class="flex items-center gap-2">${groupValue ? '<span class="text-slate-600 font-normal">↳</span>' : ''}<span>${comboLabel}</span>${copyBtn}</div></td>
            <td class="px-4 py-3"><input type="number" step="0.01" ${dAttr} value="${data.price}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'price', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-2 py-2 focus:ring-storevo-500"></td>
            <td class="px-4 py-3"><input type="number" ${dAttr} value="${data.stock}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'stock', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 font-mono text-center"></td>
            <td class="px-4 py-3"><input type="text" ${dAttr} value="${data.sku}" onchange="Storevo.VariantBuilder.updateVariantData('${signature}', 'sku', this.value)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg text-sm px-3 py-2 focus:ring-storevo-500 font-mono"></td>
        `;
        return tr;
    },

    renderImageButtonHtml: function(imageRefStr, onclickStr, dAttr = '') {
        if (!imageRefStr) {
            return `<button type="button" ${dAttr} onclick="${onclickStr}" class="w-9 h-9 bg-slate-900 border border-slate-700 hover:border-storevo-500 rounded-lg flex items-center justify-center text-slate-500 transition-colors disabled:opacity-50 disabled:hover:border-slate-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></button>`;
        }
        const refs = imageRefStr.split(',');
        const firstImg = this.getImageUrlByRef(refs[0]);
        const badge = refs.length > 1 ? `<span class="absolute -top-1.5 -right-1.5 bg-storevo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900 leading-none shadow-sm">+${refs.length - 1}</span>` : '';
        return `<button type="button" ${dAttr} onclick="${onclickStr}" class="relative w-9 h-9 bg-slate-900 border border-slate-700 hover:border-storevo-500 rounded-lg flex items-center justify-center overflow-visible transition-colors disabled:opacity-50 disabled:hover:border-slate-700"><img src="${firstImg}" class="w-full h-full object-cover rounded-lg">${badge}</button>`;
    },

    getImageUrlByRef: function(ref) {
        if (!ref) return '';
        if (Storevo.ProductImages && Storevo.ProductImages.state) {
            if (Storevo.ProductImages.state.existing.includes(ref)) return ref;
            const fileObj = Storevo.ProductImages.state.newFiles.find(f => f.name === ref);
            if (fileObj) return URL.createObjectURL(fileObj);
        }
        return '';
    },

    openImageModal: function(targetObj) {
        this.state.imageModalTarget = targetObj;

        let currentRefsStr = '';
        if (targetObj.type === 'signature') {
            currentRefsStr = (this.state.variantsData[targetObj.value] || {}).imageRef || '';
        } else {
            const colorOptName = this.getValidOptions().find(o => this.isColorOption(o.name)).name;
            const firstMatchingCombo = this.getCartesianProduct().find(c => c[colorOptName] === targetObj.value);
            if (firstMatchingCombo) {
                currentRefsStr = (this.state.variantsData[this.generateSignatureFromMap(firstMatchingCombo)] || {}).imageRef || '';
            }
        }

        this.state.tempSelectedImages = currentRefsStr ? currentRefsStr.split(',') : [];

        const modalContent = document.getElementById('vi-modal-content');
        let footer = document.getElementById('vi-modal-footer');
        if (!footer && modalContent) {
            footer = document.createElement('div');
            footer.id = 'vi-modal-footer';
            footer.className = 'mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800';
            footer.innerHTML = `
                <button type="button" onclick="Storevo.VariantBuilder.clearImageSelection()" class="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition bg-slate-900 rounded-xl border border-slate-700 hover:bg-slate-800">Quitar imágenes</button>
                <button type="button" onclick="Storevo.VariantBuilder.applyImageSelection()" class="px-6 py-2 text-sm font-bold bg-storevo-500 hover:bg-storevo-600 text-white rounded-xl shadow-lg shadow-storevo-500/20 transition">Guardar galería</button>
            `;
            modalContent.appendChild(footer);

            const title = modalContent.querySelector('h3');
            if (title) title.innerText = 'Galería de la variante';
            const p = modalContent.querySelector('p');
            if (p) p.innerText = 'Selecciona una o varias fotos en el orden que quieras.';
        }

        this.renderImageModalGrid();

        const modal = document.getElementById('variant-image-modal');
        modal.classList.remove('hidden', 'pointer-events-none');
        modal.classList.add('flex');
        setTimeout(() => { modal.classList.remove('opacity-0'); document.getElementById('vi-modal-content').classList.remove('scale-95'); }, 10);
    },

    renderImageModalGrid: function() {
        const grid = document.getElementById('vi-modal-grid');
        if (!grid) return;
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
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500 text-sm">Aún no has subido imágenes. Sube imágenes en la sección 4 primero.</div>';
        } else {
            availableImages.forEach(img => {
                const isSelected = this.state.tempSelectedImages.includes(img.ref);
                const orderIdx = isSelected ? this.state.tempSelectedImages.indexOf(img.ref) + 1 : '';

                const div = document.createElement('div');
                div.className = `aspect-square rounded-xl overflow-hidden border-2 cursor-pointer relative transition-all duration-200 ${isSelected ? 'border-storevo-500 scale-95 shadow-[0_0_15px_rgba(var(--color-storevo-500),0.3)]' : 'border-transparent hover:border-slate-600'}`;

                const checkOverlay = isSelected ? `
                    <div class="absolute inset-0 bg-storevo-500/20 flex items-center justify-center">
                        <div class="bg-storevo-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg">
                            ${orderIdx}
                        </div>
                    </div>
                ` : '';

                div.innerHTML = `<img src="${img.url}" class="w-full h-full object-cover pointer-events-none">${checkOverlay}`;
                div.onclick = () => this.toggleImageSelection(img.ref);
                grid.appendChild(div);
            });
        }
    },

    toggleImageSelection: function(ref) {
        const idx = this.state.tempSelectedImages.indexOf(ref);
        if (idx > -1) {
            this.state.tempSelectedImages.splice(idx, 1);
        } else {
            this.state.tempSelectedImages.push(ref);
        }
        this.renderImageModalGrid();
    },

    applyImageSelection: function() {
        const target = this.state.imageModalTarget;
        const imgStr = this.state.tempSelectedImages.join(',');

        if (target.type === 'signature') {
            this.updateVariantData(target.value, 'imageRef', imgStr);
        } else if (target.type === 'group') {
            const validOpts = this.getValidOptions();
            const colorOptName = validOpts.find(o => this.isColorOption(o.name)).name;

            this.getCartesianProduct().forEach(combo => {
                if (combo[colorOptName] === target.value) {
                    this.updateVariantData(this.generateSignatureFromMap(combo), 'imageRef', imgStr);
                }
            });
        }
        this.closeModal();
        this.renderTable();
    },

    clearImageSelection: function() {
        this.state.tempSelectedImages = [];
        this.applyImageSelection();
    },

    closeModal: function() {
        const modal = document.getElementById('variant-image-modal');
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.classList.add('flex');
        document.getElementById('vi-modal-content').classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); this.state.imageModalTarget = null; }, 300);
    },

    syncHiddenInputs: function() {
        const container = document.getElementById('variants-hidden-inputs');
        if (!container) return;
        container.innerHTML = '';

        if (!document.getElementById('hasVariantsToggle').checked) return;

        // EL ARREGLO: Extraemos TODAS las opciones que tengan un nombre (incluso las plantillas vacías)
        const allNamedOptions = this.state.options.filter(o => o.name.trim() !== '');

        allNamedOptions.forEach((opt, oIdx) => {
            this.createHidden(container, `options[${oIdx}].name`, opt.name.trim());
            opt.values.forEach((val, vIdx) => this.createHidden(container, `options[${oIdx}].values[${vIdx}]`, val));
        });

        let totalStock = 0;
        let minPrice = Infinity;

        // Las combinaciones finales sí siguen requiriendo valores válidos
        const combinations = this.getCartesianProduct().filter(combo => !this.state.excluded[this.generateSignatureFromMap(combo)]);
        combinations.forEach((combo, vIdx) => {
            const data = this.state.variantsData[this.generateSignatureFromMap(combo)];

            totalStock += parseInt(data.stock) || 0;
            const p = parseFloat(data.price);
            if (p && p < minPrice) minPrice = p;

            this.createHidden(container, `variants[${vIdx}].sku`, data.sku || '');
            this.createHidden(container, `variants[${vIdx}].price`, data.price || '');
            this.createHidden(container, `variants[${vIdx}].stock`, data.stock || '0');
            this.createHidden(container, `variants[${vIdx}].imageRef`, data.imageRef || '');
            this.createHidden(container, `variants[${vIdx}].imageUrl`, data.imageRef || '');
            Object.keys(combo).forEach(key => this.createHidden(container, `variants[${vIdx}].combination['${key}']`, combo[key]));
        });

        const inputStock = document.getElementById('input-stock');
        const realStock = document.getElementById('real-stock');
        const inputPrice = document.getElementById('input-price');
        const realPrice = document.getElementById('real-price');

        if (inputStock && realStock) {
            inputStock.value = totalStock;
            realStock.value = totalStock;
        }

        if (minPrice !== Infinity && inputPrice && realPrice) {
            realPrice.value = minPrice;
            inputPrice.value = minPrice;
            inputPrice.dispatchEvent(new Event('input', { bubbles: true }));
        }

        container.dispatchEvent(new Event('input', { bubbles: true }));
    },

    createHidden: function(container, name, value) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        container.appendChild(input);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.VariantBuilder.init());
} else {
    Storevo.VariantBuilder.init();
}