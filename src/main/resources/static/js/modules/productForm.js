window.Storevo = window.Storevo || {};

Storevo.ProductForm = {
    initCategories: function() {
        const catNodes = document.querySelectorAll('.cat-data-node');
        if (catNodes.length === 0) return;

        const catMap = new Map();
        const rootCats = [];

        catNodes.forEach(node => {
            const id = parseInt(node.dataset.id);
            const name = node.dataset.name;
            const parentId = node.dataset.parentId ? parseInt(node.dataset.parentId) : null;
            catMap.set(id, { id: id, name: name, parentId: parentId, subs: [] });
        });

        catMap.forEach((cat) => {
            if (cat.parentId && catMap.has(cat.parentId)) {
                catMap.get(cat.parentId).subs.push(cat);
            } else if (!cat.parentId) {
                rootCats.push(cat);
            }
        });

        const mainCatSelect = document.getElementById("mainCatSelect");
        const subCatBox = document.getElementById("subCatBox");
        const subCatChips = document.getElementById("subCatChips");
        const catSummaryBox = document.getElementById("catSummaryBox");
        const summaryText = document.getElementById("summaryText");
        const finalCategoryId = document.getElementById("finalCategoryId");

        if (!mainCatSelect) return;

        rootCats.forEach(root => {
            const opt = document.createElement("option");
            opt.value = root.id;
            opt.textContent = root.name;
            mainCatSelect.appendChild(opt);
        });

        function updateSummary(rootName, subName, finalId) {
            finalCategoryId.value = finalId;
            catSummaryBox.classList.remove('hidden');
            if (subName) {
                summaryText.innerHTML = `${rootName} <span class="text-slate-500 font-normal mx-1">/</span> ${subName}`;
            } else {
                summaryText.textContent = rootName;
            }
        }

        function renderChips(rootNode, activeChipId = null) {
            subCatChips.innerHTML = '';
            if (rootNode.subs.length > 0) {
                subCatBox.classList.remove('hidden');
                rootNode.subs.forEach(sub => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.dataset.id = sub.id;
                    const inactiveClass = "px-4 py-2 rounded-xl text-sm font-bold border bg-slate-900 border-slate-700 text-slate-300 hover:border-storevo-500 hover:text-storevo-400";
                    const activeClass = "px-4 py-2 rounded-xl text-sm font-bold border-transparent bg-storevo-500 text-white shadow-lg shadow-storevo-500/30";

                    btn.className = activeChipId == sub.id ? activeClass : inactiveClass;
                    btn.textContent = sub.name;

                    btn.addEventListener("click", () => {
                        Array.from(subCatChips.children).forEach(b => b.className = inactiveClass);
                        btn.className = activeClass;
                        updateSummary(rootNode.name, sub.name, sub.id);
                    });
                    subCatChips.appendChild(btn);
                });
            } else {
                subCatBox.classList.add('hidden');
            }
        }

        mainCatSelect.addEventListener("change", (e) => {
            const rootId = parseInt(e.target.value);
            if (!rootId) {
                subCatBox.classList.add('hidden');
                catSummaryBox.classList.add('hidden');
                finalCategoryId.value = "";
                return;
            }
            const rootNode = catMap.get(rootId);
            renderChips(rootNode);
            updateSummary(rootNode.name, null, rootNode.id);
        });

        const initialId = finalCategoryId.value;
        if (initialId && initialId !== "") {
            const node = catMap.get(parseInt(initialId));
            if (node) {
                if (node.parentId) {
                    mainCatSelect.value = node.parentId;
                    const parentNode = catMap.get(node.parentId);
                    renderChips(parentNode, node.id);
                    updateSummary(parentNode.name, node.name, node.id);
                } else {
                    mainCatSelect.value = node.id;
                    renderChips(node, null);
                    updateSummary(node.name, null, node.id);
                }
            }
        }
    },

    addSpecRow: function() {
        const container = document.getElementById('specsContainer');
        const row = document.createElement('div');
        row.className = 'flex gap-3 mb-3';
        row.innerHTML = `
            <input type="text" name="attrKeys" placeholder="Atributo (Ej: Material)" class="w-1/2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500">
            <input type="text" name="attrValues" placeholder="Valor (Ej: Algodón)" class="w-1/2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-storevo-500">
            <button type="button" onclick="this.parentElement.remove()" class="p-2 text-slate-500 hover:text-red-500 transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        container.appendChild(row);
    },

    initImagePreview: function() {
        const inputUrl = document.getElementById('mainImageUrl');
        const previewImg = document.getElementById('mainImagePreview');
        if (!inputUrl || !previewImg) return;

        let timeout;
        inputUrl.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const newUrl = this.value.trim();
                previewImg.src = newUrl !== '' ? newUrl : 'https://placehold.co/400x400/0f172a/94a3b8?text=Sin+Imagen';
            }, 500);
        });
    },

    initValidation: function() {
        // EL FIX CLAVE: Apuntamos exactamente al ID del formulario de productos
        const form = document.getElementById('product-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            const stockInput = document.getElementById('stock');
            if (stockInput) {
                const stockVal = parseInt(stockInput.value);
                if (isNaN(stockVal) || stockVal <= 0) {
                    e.preventDefault(); // Detiene el envío
                    Storevo.UI.Toast.show('No se puede publicar un producto sin stock.', 'error');

                    stockInput.focus();
                    stockInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
                    setTimeout(() => stockInput.classList.remove('border-red-500', 'ring-1', 'ring-red-500'), 3000);
                }
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    Storevo.ProductForm.initCategories();
    Storevo.ProductForm.initImagePreview();
    Storevo.ProductForm.initValidation();
});

window.addSpecRow = Storevo.ProductForm.addSpecRow;