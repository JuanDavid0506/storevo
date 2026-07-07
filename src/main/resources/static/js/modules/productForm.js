window.Storevo = window.Storevo || {};

Storevo.ProductForm = {
    init: function() {
        this.initCategories();
    },

    // Función global llamada desde el HTML para agregar atributos dinámicos
    addSpecRow: function() {
        const container = document.getElementById('specsContainer');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'flex gap-3 mb-3';
        row.innerHTML = `
            <input type="text" name="attrKeys" placeholder="Atributo" class="w-1/2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500">
            <input type="text" name="attrValues" placeholder="Valor" class="w-1/2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500">
            <button type="button" onclick="this.parentElement.remove()" class="p-2 text-slate-500 hover:text-red-500 transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        container.appendChild(row);
    },

    initCategories: function() {
        const bridge = document.getElementById('categoryDataBridge');
        const mainSelect = document.getElementById('mainCatSelect');
        const subCatBox = document.getElementById('subCatBox');
        const catSummaryBox = document.getElementById('catSummaryBox');
        const summaryText = document.getElementById('summaryText');
        const finalCatInput = document.getElementById('finalCategoryId');

        if (!bridge || !mainSelect || !subCatBox || !finalCatInput) return;

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

        // El 'Path' guardará la ruta completa elegida
        let selectedPath = [];

        // 3. MODO EDICIÓN: Reconstruir la ruta visual si el producto ya tiene categoría
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

        // FUNCIÓN A: Actualiza Inputs, Resumen y renderizado
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
                if (index === selectedPath.length - 1) {
                    return `<span class="text-storevo-400">${cat.name}</span>`;
                }
                return `<span>${cat.name}</span> <svg class="w-4 h-4 mx-1 text-slate-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
            }).join('');
            catSummaryBox.classList.remove('hidden');

            renderLevels();
        }

        // FUNCIÓN B: Genera dinámicamente capas (filas) de botones
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

                        // NUEVA LÓGICA TIPO "TOGGLE" (INTERRUPTOR)
                        btn.addEventListener('click', function() {
                            if (isSelected) {
                                // Si estaba seleccionado, lo deseleccionamos cortando la ruta hasta el nivel actual
                                selectedPath = selectedPath.slice(0, i + 1);
                            } else {
                                // Si NO estaba seleccionado, cortamos hasta el nivel actual y agregamos el nuevo hijo
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

            if (hasAnyChildren) {
                subCatBox.classList.remove('hidden');
            } else {
                if (subCatBox.innerHTML === '') subCatBox.classList.add('hidden');
            }
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.ProductForm.init());
} else {
    Storevo.ProductForm.init();
}