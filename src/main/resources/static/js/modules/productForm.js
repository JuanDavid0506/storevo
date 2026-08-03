window.Storevo = window.Storevo || {};

if (!Storevo.getTenantKey) {
    // Namespacing por tenant: evita que un dato de sessionStorage/localStorage de una tienda
    // se filtre a otra si el mismo usuario administra varias tiendas desde el mismo navegador.
    // Autodefensivo: se define una sola vez, sin importar qué archivo cargue primero.
    Storevo.getTenantKey = function(baseKey) {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        return baseKey + '_' + (match ? match[1] : 'default');
    };
}

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

        const existingKeys = Array.from(container.querySelectorAll('input[name="attrKeys"]'))
            .map(input => input.value.trim().toLowerCase());

        suggestedKeys.forEach(key => {
            if (existingKeys.includes(key.toLowerCase())) return;
            this.addSpecRow(key, '');
        });
    },

    // 1. Creador Universal de Filas
    addSpecRow: function(key = '', value = '') {
        const container = document.getElementById('specsContainer');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 spec-row animate-fade-in-up';
        row.innerHTML = `
            <input type="text" name="attrKeys" value="${key}" placeholder="Ej: Material" class="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-700 focus:ring-1 focus:ring-storevo-500/40 focus:border-storevo-500/60 transition">
            <span class="text-slate-700 select-none">:</span>
            <input type="text" name="attrValues" value="${value}" placeholder="Ej: 100% Algodón" class="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-700 focus:ring-1 focus:ring-storevo-500/40 focus:border-storevo-500/60 transition">
            <button type="button" onclick="Storevo.ProductForm.removeSpecRow(this)" class="text-slate-600 hover:text-red-400 transition p-1 flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        container.appendChild(row);
    },

    // 2. Eliminador seguro de filas
    removeSpecRow: function(button) {
        const row = button.parentElement;
        row.remove();

        const container = document.getElementById('specsContainer');
        if (container && container.children.length === 0) {
            Storevo.ProductForm.addSpecRow(); // Si borra todo, crea una fila limpia
        }
        if (window.Storevo.ProductDraft && typeof window.Storevo.ProductDraft.scheduleSave === 'function') {
            Storevo.ProductDraft.scheduleSave();
        }
    },

    // 3. El Vigilante Silencioso (Efecto Formulario Infinito)
    initSpecObserver: function() {
        const container = document.getElementById('specsContainer');
        if (!container) return;

        // SOLUCIÓN 1: Asegurarnos de que siempre haya una fila vacía al final (incluso al editar)
        const allRows = container.querySelectorAll('.spec-row');
        if (allRows.length === 0) {
            this.addSpecRow();
        } else {
            const lastRow = allRows[allRows.length - 1];
            const inputs = lastRow.querySelectorAll('input');
            const hasText = Array.from(inputs).some(input => input.value.trim() !== '');
            // Si la última fila cargada desde la BD tiene texto, agregamos una extra en blanco
            if (hasText) {
                this.addSpecRow();
            }
        }

        container.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT') {
                const currentRows = container.querySelectorAll('.spec-row');
                if (currentRows.length === 0) return;

                const lastRow = currentRows[currentRows.length - 1];
                const currentRow = e.target.closest('.spec-row');

                if (lastRow === currentRow) {
                    const inputs = lastRow.querySelectorAll('input');
                    const hasText = Array.from(inputs).some(input => input.value.trim() !== '');

                    if (hasText) {
                        Storevo.ProductForm.addSpecRow();
                    }
                }
            }
        });
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

        const container = document.getElementById(`level-${level}-container`);
        Array.from(container.children).forEach(btn => {
            if (btn.textContent === cat.name) {
                btn.className = 'px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-200 bg-storevo-500/10 border-storevo-500/60 text-white ring-1 ring-storevo-500/20';
            } else {
                btn.className = 'px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-storevo-500/10 hover:border-storevo-500/50';
            }
        });

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
        const isDraftInput = document.getElementById('isDraft');
        if (isDraftInput) isDraftInput.value = 'false';

        const isActiveToggle = document.getElementById('isActive');
        if (isActiveToggle && !isActiveToggle.checked) {
            isActiveToggle.checked = true;
            isActiveToggle.dispatchEvent(new Event('change'));
        }

        sessionStorage.removeItem(Storevo.getTenantKey('storevo_current_step'));
        sessionStorage.removeItem(Storevo.getTenantKey('storevo_product_template'));

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

            // 3. Autoseleccionar la nueva categoría
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

    // Iniciar el vigilante silencioso
    if (Storevo.ProductForm.initSpecObserver) {
        Storevo.ProductForm.initSpecObserver();
    }

    const catInput = document.getElementById('new-cat-name');
    if(catInput) {
        catInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                Storevo.CategoryModal.save();
            }
        });
    }

    // SOLUCIÓN 2: Prevenir que 'Enter' envíe el formulario principal accidentalmente
    const mainForm = document.getElementById('product-form');
    if (mainForm) {
        mainForm.addEventListener('keydown', function(e) {
            // Evitamos el submit automático solo si presionan Enter
            // Y si NO están en un textarea (para dejarles hacer saltos de línea donde se requiera)
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    }
});