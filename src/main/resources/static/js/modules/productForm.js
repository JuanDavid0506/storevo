window.Storevo = window.Storevo || {};

Storevo.ProductForm = {
    // --- FICHA TÉCNICA ---
    SPEC_TEMPLATES: {
        ropa: ['Marca', 'Material', 'Talla', 'Color', 'Género'],
        calzado: ['Marca', 'Material', 'Talla', 'Color', 'Tipo de suela'],
        perfume: ['Marca', 'Contenido (ml)', 'Familia olfativa', 'Género'],
        accesorios: ['Marca', 'Material', 'Color', 'Dimensiones'],
        tecnologia: ['Marca', 'Modelo', 'Estado', 'Garantía'],
        personalizado: []
    },

    // --- ESTADO DE CATEGORÍAS ---
    categories: [],
    selectedPath: [],

    init: function() {
        const inputCategoria = document.getElementById('finalCategoryId');
        const existingId = inputCategoria ? inputCategoria.value : null;

        this.loadCategories();
        this.renderLevel(1, null);

        if (existingId && existingId.trim() !== '') {
            setTimeout(() => {
                this.preselectCategory(existingId.trim());
                // Forzamos a que el valor sobreviva
                if (document.getElementById('finalCategoryId')) {
                    document.getElementById('finalCategoryId').value = existingId.trim();
                }
            }, 150);
        }
    },

    // ==========================================
    // LÓGICA DE FICHA TÉCNICA
    // ==========================================
    autoResize: function(el) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    },

    prefillSpecs: function(templateKey) {
        this.clearTemplateSpecs();

        const suggestedKeys = this.SPEC_TEMPLATES[templateKey];
        if (!suggestedKeys || suggestedKeys.length === 0) return;

        const container = document.getElementById('specsContainer');
        if (!container) return;

        const existingKeys = Array.from(container.querySelectorAll('textarea[name="attrKeys"], input[name="attrKeys"]'))
            .map(input => input.value.trim().toLowerCase());

        let firstNewValueInput = null;

        suggestedKeys.forEach(key => {
            if (existingKeys.includes(key.toLowerCase())) return;

            const row = document.createElement('div');
            row.className = 'flex gap-3 mb-3 items-start';
            row.dataset.templateRow = 'true';

            row.innerHTML = `
                <textarea name="attrKeys" rows="1" placeholder="Atributo" oninput="Storevo.ProductForm.autoResize(this)" class="w-1/3 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500 text-sm resize-none overflow-hidden min-h-[42px] leading-relaxed">${key}</textarea>
                <textarea name="attrValues" rows="1" placeholder="Escribe el valor..." oninput="Storevo.ProductForm.autoResize(this)" class="flex-1 px-4 py-2 bg-slate-950 border border-storevo-500/40 rounded-lg text-white focus:ring-storevo-500 text-sm resize-none overflow-hidden min-h-[42px] leading-relaxed"></textarea>
                <button type="button" onclick="this.parentElement.remove()" class="p-2 text-slate-500 hover:text-red-500 transition mt-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            container.appendChild(row);

            const keyInput = row.querySelector('textarea[name="attrKeys"]');
            this.autoResize(keyInput);

            if (!firstNewValueInput) firstNewValueInput = row.querySelector('textarea[name="attrValues"]');
        });

        if (firstNewValueInput) firstNewValueInput.focus();
    },

    addSpecRow: function() {
        const container = document.getElementById('specsContainer');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'flex gap-3 mb-3 items-start';

        row.innerHTML = `
            <textarea name="attrKeys" rows="1" placeholder="Atributo" oninput="Storevo.ProductForm.autoResize(this)" class="w-1/3 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500 text-sm resize-none overflow-hidden min-h-[42px] leading-relaxed"></textarea>
            <textarea name="attrValues" rows="1" placeholder="Valor" oninput="Storevo.ProductForm.autoResize(this)" class="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500 text-sm resize-none overflow-hidden min-h-[42px] leading-relaxed"></textarea>
            <button type="button" onclick="this.parentElement.remove()" class="p-2 text-slate-500 hover:text-red-500 transition mt-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        container.appendChild(row);
    },

    clearTemplateSpecs: function() {
        const container = document.getElementById('specsContainer');
        if (!container) return;
        container.querySelectorAll('[data-template-row="true"]').forEach(row => row.remove());
    },

    // ==========================================
    // LÓGICA DE CATEGORÍAS (SISTEMA DE CHIPS)
    // ==========================================
    loadCategories: function() {
        this.categories = [];
        document.querySelectorAll('#categoryDataBridge .cat-data-node').forEach(node => {
            const pId = node.getAttribute('data-parent-id');
            this.categories.push({
                id: node.getAttribute('data-id'),
                name: node.getAttribute('data-name'),
                parentId: (pId && pId !== 'null' && pId !== '') ? pId : null
            });
        });
    },

    renderLevel: function(level, parentId) {
        const container = document.getElementById(`level-${level}-container`);
        const wrapper = document.getElementById(`level-${level}-wrapper`);
        const label = document.getElementById(`level-${level}-label`);

        if (!container) return;

        // Limpiar subniveles
        if (level === 1) {
            this.clearLevel(2);
            this.clearLevel(3);
            this.selectedPath = [];
        } else if (level === 2) {
            this.clearLevel(3);
            this.selectedPath = [this.selectedPath[0]];
        }

        const children = this.categories.filter(c => c.parentId === parentId);

        if (children.length === 0) {
            if (wrapper) wrapper.classList.add('hidden');
            this.updateFinalSelection();
            return;
        }

        if (wrapper) wrapper.classList.remove('hidden');
        if (label && parentId) {
            const parentCat = this.categories.find(c => c.id === parentId);
            label.innerHTML = `Subcategoría dentro de <span class="text-white font-bold">${parentCat ? parentCat.name : ''}</span>`;
        }

        container.innerHTML = '';
        children.forEach(cat => {
            const btn = document.createElement('button');
            btn.type = 'button';
            // Estilo por defecto (Inactivo)
            btn.className = 'px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-storevo-500/10 hover:border-storevo-500/50';
            btn.textContent = cat.name;
            btn.onclick = () => this.selectCategory(level, cat);
            container.appendChild(btn);
        });

        this.updateFinalSelection();
    },

    clearLevel: function(level) {
        const container = document.getElementById(`level-${level}-container`);
        const wrapper = document.getElementById(`level-${level}-wrapper`);
        if (container) container.innerHTML = '';
        if (wrapper) wrapper.classList.add('hidden');
    },

    selectCategory: function(level, cat) {
        this.selectedPath[level - 1] = cat;

        // Pitar el botón activo y apagar los demás
        const container = document.getElementById(`level-${level}-container`);
        Array.from(container.children).forEach(btn => {
            if (btn.textContent === cat.name) {
                // ACTIVO (Morado)
                btn.className = 'px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-200 bg-storevo-500/10 border-storevo-500/60 text-white ring-1 ring-storevo-500/20';
            } else {
                // INACTIVO
                btn.className = 'px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-storevo-500/10 hover:border-storevo-500/50';
            }
        });

        // Intentar abrir el siguiente nivel
        if (level < 3) {
            this.renderLevel(level + 1, cat.id);
        } else {
            this.updateFinalSelection();
        }
    },

    updateFinalSelection: function() {
        const summaryBox = document.getElementById('catSummaryBox');
        const summaryText = document.getElementById('summaryText');
        const finalIdInput = document.getElementById('finalCategoryId');

        if (this.selectedPath.length > 0) {
            const lastSelected = this.selectedPath[this.selectedPath.length - 1];
            finalIdInput.value = lastSelected.id;

            // Construir la ruta visual
            summaryText.innerHTML = this.selectedPath.map((c, index) => {
                const isLast = index === this.selectedPath.length - 1;
                return `<span class="${isLast ? 'text-white font-bold' : 'text-slate-400'}">${c.name}</span>`;
            }).join('<span class="text-slate-600 font-bold mx-1">›</span>');

            summaryBox.classList.remove('hidden');
        } else {
            finalIdInput.value = '';
            summaryText.textContent = '';
            summaryBox.classList.add('hidden');
        }

        // Disparar evento para productUX
        finalIdInput.dispatchEvent(new Event('change'));
    },

    preselectCategory: function(targetId) {
        let path = [];
        let current = this.categories.find(c => c.id === targetId);
        while (current) {
            path.unshift(current);
            current = this.categories.find(c => c.id === current.parentId);
        }
        if (path.length > 0) {
            this.selectCategory(1, path[0]);
            if (path.length > 1) this.selectCategory(2, path[1]);
            if (path.length > 2) this.selectCategory(3, path[2]);
        }
    },

    // ==========================================
    // LÓGICA DE PUBLICACIÓN (SUBMIT)
    // ==========================================
    publish: function() {
        // 1. Quitar el estado de borrador
        const isDraftInput = document.getElementById('isDraft');
        if (isDraftInput) isDraftInput.value = 'false';

        // 2. Forzar a que el producto esté activo (visible en tienda)
        const isActiveToggle = document.getElementById('isActive');
        if (isActiveToggle && !isActiveToggle.checked) {
            isActiveToggle.checked = true;
            isActiveToggle.dispatchEvent(new Event('change'));
        }

        // NUEVO: Limpiamos la memoria del paso para que el próximo producto inicie en 1
        sessionStorage.removeItem('storevo_current_step');

        if (window.Storevo && window.Storevo.VariantBuilder) {
            window.Storevo.VariantBuilder.syncHiddenInputs();
        }

        return true;
    }
};


// ==========================================
// MÓDULO: Creación de Categorías al Vuelo
// ==========================================
Storevo.CategoryModal = {
    open: function() {
        const parentSelect = document.getElementById('new-cat-parent');
        parentSelect.innerHTML = '<option value="">Ninguna (Será una categoría principal)</option>';

        let categories = [];
        document.querySelectorAll('#categoryDataBridge .cat-data-node').forEach(node => {
            const pId = node.getAttribute('data-parent-id');
            categories.push({
                id: node.getAttribute('data-id'),
                name: node.getAttribute('data-name'),
                parentId: (pId && pId !== 'null' && pId !== '') ? pId : null
            });
        });

        const getCategoryInfo = (cat) => {
            let path = [cat.name];
            let current = cat;
            while (current.parentId) {
                current = categories.find(c => c.id === current.parentId);
                if (current) {
                    path.unshift(current.name);
                } else {
                    break;
                }
            }
            return { pathString: path.join(' > '), depth: path.length };
        };

        let validParents = categories.map(cat => {
            return { ...cat, info: getCategoryInfo(cat) };
        }).filter(cat => cat.info.depth < 3);

        validParents.sort((a, b) => a.info.pathString.localeCompare(b.info.pathString));

        validParents.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.info.pathString;
            parentSelect.appendChild(opt);
        });

        const currentFinalCat = document.getElementById('finalCategoryId')?.value;
        if (currentFinalCat) {
            const isValidParent = validParents.find(c => c.id === currentFinalCat);
            if (isValidParent) {
                parentSelect.value = currentFinalCat;
            } else {
                const deepCat = categories.find(c => c.id === currentFinalCat);
                if (deepCat && deepCat.parentId) {
                    parentSelect.value = deepCat.parentId;
                }
            }
        }

        document.getElementById('new-cat-name').value = '';
        const modal = document.getElementById('category-quick-modal');
        const content = document.getElementById('category-quick-content');

        modal.classList.remove('hidden', 'pointer-events-none');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            document.getElementById('new-cat-name').focus();
        }, 10);
    },

    close: function() {
        const modal = document.getElementById('category-quick-modal');
        const content = document.getElementById('category-quick-content');
        modal.classList.add('opacity-0', 'pointer-events-none');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    save: async function() {
        const nameInput = document.getElementById('new-cat-name');
        const parentId = document.getElementById('new-cat-parent').value;
        const name = nameInput.value.trim();

        if (!name) {
            nameInput.classList.add('border-red-500');
            setTimeout(() => nameInput.classList.remove('border-red-500'), 2000);
            return;
        }

        const btn = document.getElementById('btn-save-cat');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Guardando...';
        btn.disabled = true;

        try {
            const slug = window.location.pathname.split('/')[2];

            const response = await fetch(`/dashboard/${slug}/categories/api/quick-add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, parentId: parentId })
            });

            if (!response.ok) throw new Error('Error al guardar');

            const newCat = await response.json();

            // 1. Inyectar en el Bridge
            const bridge = document.getElementById('categoryDataBridge');
            const newNode = document.createElement('div');
            newNode.className = 'cat-data-node';
            newNode.setAttribute('data-id', newCat.id);
            newNode.setAttribute('data-name', newCat.name);
            newNode.setAttribute('data-parent-id', newCat.parentId || '');
            bridge.appendChild(newNode);

            // 2. Refrescar categorías en la UI
            Storevo.ProductForm.loadCategories();

            // 3. Autoseleccionar la nueva categoría con los chips
            Storevo.ProductForm.preselectCategory(newCat.id.toString());

            if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Categoría "${newCat.name}" creada`, 'success');
            this.close();

        } catch (error) {
            if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('No se pudo crear la categoría', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Storevo.ProductForm.init();

    const catInput = document.getElementById('new-cat-name');
    if(catInput) {
        catInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                Storevo.CategoryModal.save();
            }
        });
    }
});