window.Storevo = window.Storevo || {};

Storevo.ProductImages = {
    state: {
        newFiles: [],      // Objetos File (físicos)
        existing: [],      // URLs de BD (String)
        order: [],         // Mix de File names y URLs para mantener el orden exacto
        mainRef: null,     // Referencia de la imagen marcada como Principal
        draggedItem: null  // Referencia temporal para el Drag & Drop visual
    },

    config: {
        maxSize: 10 * 1024 * 1024, // 10MB (Sincronizado con backend)
        maxCount: 10,              // 10 Imágenes máximo (Sincronizado con backend)
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    },

    init: function() {
        const dropzone = document.getElementById('image-dropzone');
        const fileInput = document.getElementById('file-upload');
        const form = document.getElementById('product-form');

        if (!dropzone || !fileInput || !form) return;

        // 1. Cargar datos iniciales (Si estamos en Modo Edición)
        document.querySelectorAll('.init-existing').forEach(el => this.state.existing.push(el.value));
        document.querySelectorAll('.init-order').forEach(el => this.state.order.push(el.value));
        const initMain = document.getElementById('init-main');
        if (initMain && initMain.value) this.state.mainRef = initMain.value;

        // Limpieza de estados corruptos: Si hay imágenes pero no hay principal, asignar la primera
        if (!this.state.mainRef && this.state.order.length > 0) {
            this.state.mainRef = this.state.order[0];
        }

        this.render();

        // 2. Eventos Drag & Drop nativos de la zona de subida
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Efectos visuales de la zona de subida
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('border-storevo-500', 'bg-slate-900'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('border-storevo-500', 'bg-slate-900'));
        });

        // Capturar archivos al soltar
        dropzone.addEventListener('drop', (e) => {
            this.handleFiles(e.dataTransfer.files);
        });

        // Capturar archivos al hacer clic y seleccionar
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            fileInput.value = ''; // Resetear para permitir subir el mismo archivo si se borró y volvió a subir
        });

        // 3. Interceptar Submit del formulario para sincronizar el estado final
        form.addEventListener('submit', (e) => {
            this.syncHiddenInputs();

            const btn = document.getElementById('btn-save-product');
            if (btn) {
                btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span class="ml-2">Procesando...</span>`;
                btn.classList.add('opacity-75', 'cursor-not-allowed');
                // Se retrasa la desactivación unos milisegundos para asegurar que el navegador envíe el formulario
                setTimeout(() => btn.disabled = true, 10);
            }
        });
    },

    handleFiles: function(files) {
        const currentTotal = this.state.existing.length + this.state.newFiles.length;
        const remainingSlots = this.config.maxCount - currentTotal;

        if (remainingSlots <= 0) {
            if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Máximo ${this.config.maxCount} imágenes permitidas.`, 'warning');
            return;
        }

        let addedCount = 0;
        Array.from(files).forEach(file => {
            if (addedCount >= remainingSlots) return;

            if (!this.config.allowedTypes.includes(file.type)) {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Formato no permitido: ${file.name}`, 'error');
                return;
            }
            if (file.size > this.config.maxSize) {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Archivo muy pesado (Max 10MB): ${file.name}`, 'error');
                return;
            }

            // Evitar duplicados por nombre
            if (!this.state.newFiles.some(f => f.name === file.name)) {
                this.state.newFiles.push(file);
                this.state.order.push(file.name);
                if (!this.state.mainRef) this.state.mainRef = file.name; // Si es la primera, es la principal
                addedCount++;
            }
        });

        this.render();
    },

    removeImage: function(ref) {
        // Remover del orden maestro
        this.state.order = this.state.order.filter(r => r !== ref);

        // Remover de los arrays de estado
        if (this.state.existing.includes(ref)) {
            this.state.existing = this.state.existing.filter(r => r !== ref);
        } else {
            this.state.newFiles = this.state.newFiles.filter(f => f.name !== ref);
        }

        // Reasignar la imagen principal si la actual fue eliminada
        if (this.state.mainRef === ref) {
            this.state.mainRef = this.state.order.length > 0 ? this.state.order[0] : null;
        }

        this.render();
    },

    setMainImage: function(ref) {
        this.state.mainRef = ref;
        this.render();
    },

    render: function() {
        const grid = document.getElementById('image-preview-grid');
        const countBadge = document.getElementById('img-count');
        if(!grid) return;

        grid.innerHTML = '';

        const total = this.state.order.length;
        if(countBadge) countBadge.textContent = total;

        this.state.order.forEach((ref) => {
            // Determinar si la imagen es antigua (URL) o recién subida (File)
            let isExisting = this.state.existing.includes(ref);
            let imgSrc = isExisting ? ref : '';

            if (!isExisting) {
                const fileObj = this.state.newFiles.find(f => f.name === ref);
                if (fileObj) imgSrc = URL.createObjectURL(fileObj);
            }

            const isMain = this.state.mainRef === ref;

            // Construir la tarjeta (Thumbnail)
            const col = document.createElement('div');
            col.className = `relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-move group ${isMain ? 'border-storevo-500 shadow-md shadow-storevo-500/20' : 'border-slate-800 hover:border-slate-600'}`;
            col.draggable = true;
            col.dataset.ref = ref;

            // Eventos para Reordenamiento Visual (Drag & Drop de miniaturas)
            col.addEventListener('dragstart', () => {
                this.state.draggedItem = ref;
                setTimeout(() => col.classList.add('opacity-50'), 0);
            });
            col.addEventListener('dragend', () => col.classList.remove('opacity-50'));
            col.addEventListener('dragover', (e) => {
                e.preventDefault(); // Necesario para permitir el "drop"
                col.classList.add('scale-105');
            });
            col.addEventListener('dragleave', () => col.classList.remove('scale-105'));
            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('scale-105');
                this.swapOrder(this.state.draggedItem, ref);
            });

            // Contenido HTML de la miniatura
            col.innerHTML = `
                <img src="${imgSrc}" class="w-full h-full object-cover select-none">
                <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    ${!isMain ? `<button type="button" class="text-xs font-bold bg-slate-800 text-white px-2 py-1 rounded-md hover:bg-storevo-500 transition-colors" onclick="Storevo.ProductImages.setMainImage('${ref}')">⭐ Principal</button>` : `<span class="text-xs font-bold bg-storevo-500 text-white px-2 py-1 rounded-md">⭐ Principal</span>`}
                    <button type="button" class="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors" onclick="Storevo.ProductImages.removeImage('${ref}')">Eliminar</button>
                </div>
            `;
            grid.appendChild(col);
        });
    },

    swapOrder: function(refA, refB) {
        if (!refA || !refB || refA === refB) return;
        const arr = this.state.order;
        const idxA = arr.indexOf(refA);
        const idxB = arr.indexOf(refB);
        // Intercambiar posiciones en el array maestro
        arr[idxA] = refB;
        arr[idxB] = refA;
        this.render();
    },

    syncHiddenInputs: function() {
        const container = document.getElementById('image-hidden-inputs');
        if(!container) return;
        container.innerHTML = ''; // Limpiar entradas anteriores

        // 1. Inyectar URLs de imágenes que ya existían y no fueron borradas
        this.state.existing.forEach(url => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'existingImages';
            input.value = url;
            container.appendChild(input);
        });

        // 2. Inyectar el orden exacto resultante (Mezcla de nuevas y viejas)
        this.state.order.forEach(ref => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'imageOrder';
            input.value = ref;
            container.appendChild(input);
        });

        // 3. Inyectar la referencia de la imagen marcada con la estrella
        if (this.state.mainRef) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'mainImageRef';
            input.value = this.state.mainRef;
            container.appendChild(input);
        }

        // 4. Inyectar archivos físicos reales usando DataTransfer al input nativo
        const realInput = document.getElementById('real-file-input');
        if(realInput) {
            const dt = new DataTransfer();
            this.state.newFiles.forEach(file => dt.items.add(file));
            realInput.files = dt.files;
        }
    }
};

// ==========================================
// LANZADOR AUTOMÁTICO (Auto-Inicialización)
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Storevo.ProductImages.init();
    });
} else {
    Storevo.ProductImages.init();
}