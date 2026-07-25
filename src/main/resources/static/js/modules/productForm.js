window.Storevo = window.Storevo || {};

Storevo.ProductForm = {
    // Atributos sugeridos de Ficha Técnica según la plantilla elegida en el constructor de opciones.
    // El vendedor solo debe escribir el valor; si lo deja vacío, ProductService ya lo descarta
    // al guardar, así que nunca se muestra en la ficha pública.
    // Atributos sugeridos de Ficha Técnica según la plantilla.
    // Atributos esenciales predeterminados por plantilla (Killer Attributes)
    SPEC_TEMPLATES: {
        ropa: [
            'Marca', 'Material', 'Talla', 'Color', 'Género'
        ],
        calzado: [
            'Marca', 'Material', 'Talla', 'Color', 'Tipo de suela'
        ],
        perfume: [
            'Marca', 'Contenido (ml)', 'Familia olfativa', 'Género'
        ],
        accesorios: [
            'Marca', 'Material', 'Color', 'Dimensiones'
        ],
        tecnologia: [
            'Marca', 'Modelo', 'Estado', 'Garantía'
        ],
        personalizado: []
    },

    init: function() {
        this.initCategories();
    },

    // NUEVA FUNCIÓN: Hace que la caja crezca sola según el texto
    autoResize: function(el) {
        el.style.height = 'auto'; // Resetea la altura
        el.style.height = el.scrollHeight + 'px'; // Ajusta al contenido exacto
    },

    // Precarga los atributos sugeridos de la plantilla
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

            // Usamos textarea con rows="1", resize-none, y el evento oninput para el auto-crecimiento
            row.innerHTML = `
                <textarea name="attrKeys" rows="1" placeholder="Atributo" oninput="Storevo.ProductForm.autoResize(this)" class="w-1/3 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500 text-sm resize-none overflow-hidden min-h-[42px] leading-relaxed">${key}</textarea>
                <textarea name="attrValues" rows="1" placeholder="Escribe el valor..." oninput="Storevo.ProductForm.autoResize(this)" class="flex-1 px-4 py-2 bg-slate-950 border border-storevo-500/40 rounded-lg text-white focus:ring-storevo-500 text-sm resize-none overflow-hidden min-h-[42px] leading-relaxed"></textarea>
                <button type="button" onclick="this.parentElement.remove()" class="p-2 text-slate-500 hover:text-red-500 transition mt-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            container.appendChild(row);

            // Auto-ajustar inmediatamente por si la "key" sugerida es muy larga
            const keyInput = row.querySelector('textarea[name="attrKeys"]');
            this.autoResize(keyInput);

            if (!firstNewValueInput) firstNewValueInput = row.querySelector('textarea[name="attrValues"]');
        });

        if (firstNewValueInput) firstNewValueInput.focus();
    },

    // Agrega una fila vacía manualmente
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

    // Elimina únicamente las filas que dejó una plantilla (nunca las que el vendedor agregó a mano)
    clearTemplateSpecs: function() {
        const container = document.getElementById('specsContainer');
        if (!container) return;
        container.querySelectorAll('[data-template-row="true"]').forEach(row => row.remove());
    },



    initCategories: function() {
        const bridge = document.getElementById('categoryDataBridge');
        const mainSelect = document.getElementById('mainCatSelect');
        const subCatBox = document.getElementById('subCatBox');
        const catSummaryBox = document.getElementById('catSummaryBox');
        const summaryText = document.getElementById('summaryText');
        const finalCatInput = document.getElementById('finalCategoryId');

        if (!bridge || !mainSelect || !subCatBox || !finalCatInput) return;

        // Limpieza por si se llama recursivamente (Creación al vuelo)
        mainSelect.innerHTML = '<option value="">Selecciona la categoría del catálogo...</option>';
        subCatBox.innerHTML = '';

        let categories = [];

        // 1. Extraer toda la jerarquía del DOM
        bridge.querySelectorAll('.cat-data-node').forEach(node => {
            const parentId = node.getAttribute('data-parent-id');
            categories.push({
                id: node.getAttribute('data-id'),
                name: node.getAttribute('data-name'),
                parentId: (parentId && parentId !== 'null' && parentId !== '') ? parentId : null
            });
        });

        // 2. Llenar Select Principal (Categorías Raíz)
        const rootCats = categories.filter(c => !c.parentId);
        rootCats.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            mainSelect.appendChild(option);
        });

        let selectedPath = [];

        // 3. Reconstruir la ruta visual
        const initialCatId = finalCatInput.value;
        if (initialCatId) {
            let currentId = initialCatId;
            while (currentId) {
                const cat = categories.find(c => c.id === currentId);
                if (cat) {
                    selectedPath.unshift({ id: cat.id, name: cat.name });
                    currentId = cat.parentId;
                } else {
                    break;
                }
            }
            if (selectedPath.length > 0) {
                mainSelect.value = selectedPath[0].id;
                updateUI();
            }
        }

        // 4. EVENTO: Cambio en el Select de Categoría Principal
        mainSelect.addEventListener('change', function() {
            const selectedId = this.value;
            if (!selectedId) {
                selectedPath = [];
                updateUI();
                return;
            }
            const selectedName = this.options[this.selectedIndex].text;
            selectedPath = [{ id: selectedId, name: selectedName }];
            updateUI();
        });

        function updateUI() {
            if (selectedPath.length === 0) {
                subCatBox.classList.add('hidden');
                catSummaryBox.classList.add('hidden');
                finalCatInput.value = '';
                subCatBox.innerHTML = '';
                return;
            }

            const deepestCat = selectedPath[selectedPath.length - 1];
            finalCatInput.value = deepestCat.id;

            summaryText.innerHTML = selectedPath.map((cat, index) => {
                if (index === selectedPath.length - 1) return `<span class="text-storevo-400">${cat.name}</span>`;
                return `<span>${cat.name}</span> <svg class="w-4 h-4 mx-1 text-slate-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
            }).join('');
            catSummaryBox.classList.remove('hidden');

            renderLevels();
        }

        function renderLevels() {
            subCatBox.innerHTML = '';
            let hasAnyChildren = false;

            for (let i = 0; i < selectedPath.length; i++) {
                const currentCat = selectedPath[i];
                const children = categories.filter(c => c.parentId === currentCat.id);

                if (children.length > 0) {
                    hasAnyChildren = true;
                    const levelDiv = document.createElement('div');
                    levelDiv.className = i > 0 ? 'mt-4 pt-4 border-t border-slate-800' : '';

                    const label = document.createElement('label');
                    label.className = 'block text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2';
                    label.textContent = `Subcategorías de ${currentCat.name}`;
                    levelDiv.appendChild(label);

                    const chipsDiv = document.createElement('div');
                    chipsDiv.className = 'flex flex-wrap gap-2';

                    children.forEach(child => {
                        const isSelected = selectedPath.length > i + 1 && selectedPath[i + 1].id === child.id;
                        const btn = document.createElement('button');
                        btn.type = 'button';

                        if (isSelected) {
                            btn.className = 'px-4 py-2 text-sm font-bold rounded-lg border border-storevo-500 bg-storevo-500 text-white shadow-md shadow-storevo-500/20 transition-all';
                        } else {
                            btn.className = 'px-4 py-2 text-sm font-bold rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-storevo-500/10 hover:text-storevo-400 hover:border-storevo-500/50 transition-all';
                        }
                        btn.textContent = child.name;

                        btn.addEventListener('click', function() {
                            if (isSelected) selectedPath = selectedPath.slice(0, i + 1);
                            else {
                                selectedPath = selectedPath.slice(0, i + 1);
                                selectedPath.push({ id: child.id, name: child.name });
                            }
                            updateUI();
                        });
                        chipsDiv.appendChild(btn);
                    });
                    levelDiv.appendChild(chipsDiv);
                    subCatBox.appendChild(levelDiv);
                }
            }

            if (hasAnyChildren) subCatBox.classList.remove('hidden');
            else if (subCatBox.innerHTML === '') subCatBox.classList.add('hidden');
        }
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

        // Calculamos la ruta y la PROFUNDIDAD de cada categoría
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

        // Enriquecemos el array y aplicamos la REGLA DE 3 NIVELES:
        // Solo pueden ser padres las categorías de Nivel 1 o Nivel 2.
        // Si eliges Nivel 2, la nueva será Nivel 3 (tu límite).
        let validParents = categories.map(cat => {
            return { ...cat, info: getCategoryInfo(cat) };
        }).filter(cat => cat.info.depth < 3);

        // Ordenamos alfabéticamente por la ruta para mayor claridad visual
        validParents.sort((a, b) => a.info.pathString.localeCompare(b.info.pathString));

        validParents.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.info.pathString;
            parentSelect.appendChild(opt);
        });

        // Autodetección Inteligente y segura
        const currentFinalCat = document.getElementById('finalCategoryId')?.value;
        if (currentFinalCat) {
            // Verificamos si la categoría donde está parado es un padre permitido (Nivel 1 o 2)
            const isValidParent = validParents.find(c => c.id === currentFinalCat);
            if (isValidParent) {
                parentSelect.value = currentFinalCat;
            } else {
                // Si estaba parado en una de Nivel 3, preseleccionamos a su padre (Nivel 2) para proteger la regla
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
            // Extraer slug de la URL para el endpoint
            const slug = window.location.pathname.split('/')[2];

            const response = await fetch(`/dashboard/${slug}/categories/api/quick-add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, parentId: parentId })
            });

            if (!response.ok) throw new Error('Error al guardar');

            const newCat = await response.json();

            // 1. Inyectar la nueva categoría en el DOM oculto (Bridge)
            const bridge = document.getElementById('categoryDataBridge');
            const newNode = document.createElement('div');
            newNode.className = 'cat-data-node';
            newNode.setAttribute('data-id', newCat.id);
            newNode.setAttribute('data-name', newCat.name);
            newNode.setAttribute('data-parent-id', newCat.parentId || '');
            bridge.appendChild(newNode);

            // 2. Definirla como la seleccionada
            document.getElementById('finalCategoryId').value = newCat.id;

            // 3. Reiniciar la lógica visual mágicamente
            Storevo.ProductForm.initCategories();

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

// Permitir guardar al presionar Enter
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