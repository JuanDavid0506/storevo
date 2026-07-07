window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

// COMPONENTE: Loading Overlay Profesional
Storevo.UI.LoadingOverlay = {
    show: function(title, description) {
        let overlay = document.getElementById('storevo-loading-overlay');
        if (!overlay) {
            const html = `
                <div id="storevo-loading-overlay" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center transition-opacity duration-300 opacity-0 pointer-events-none">
                    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center max-w-sm w-full text-center transform scale-95 transition-transform duration-300">
                        <div class="relative w-20 h-20 mb-8">
                            <svg class="animate-spin w-full h-full text-storevo-500" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="w-5 h-5 bg-storevo-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--color-storevo-500),0.5)]"></div>
                            </div>
                        </div>
                        <h3 class="text-2xl font-black text-white tracking-tight mb-2" id="overlay-title">${title}</h3>
                        <p class="text-slate-400 font-medium text-sm" id="overlay-desc">${description}</p>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
            overlay = document.getElementById('storevo-loading-overlay');
        } else {
            document.getElementById('overlay-title').textContent = title;
            document.getElementById('overlay-desc').textContent = description;
        }

        // Animación de entrada
        overlay.classList.remove('pointer-events-none');
        void overlay.offsetWidth; // Forzar repintado del DOM
        overlay.classList.add('opacity-100');
        overlay.querySelector('div').classList.remove('scale-95');
        overlay.querySelector('div').classList.add('scale-100');
    },
    hide: function() {
        const overlay = document.getElementById('storevo-loading-overlay');
        if (overlay) {
            overlay.classList.remove('opacity-100');
            overlay.querySelector('div').classList.remove('scale-100');
            overlay.querySelector('div').classList.add('scale-95');
            overlay.classList.add('pointer-events-none');
            // Retirar del DOM tras la animación
            setTimeout(() => overlay.remove(), 300);
        }
    }
};

// MÓDULO: Gestión de Imágenes
Storevo.ProductImages = {
    state: {
        newFiles: [],
        existing: [],
        order: [],
        mainRef: null,
        draggedItem: null
    },

    config: {
        maxSize: 10 * 1024 * 1024, // 10MB
        maxCount: 10,              // Max 10 Imágenes
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    },

    init: function() {
        const dropzone = document.getElementById('image-dropzone');
        const fileInput = document.getElementById('file-upload');
        const form = document.getElementById('product-form');

        if (!dropzone || !fileInput || !form) return;

        document.querySelectorAll('.init-existing').forEach(el => this.state.existing.push(el.value));
        document.querySelectorAll('.init-order').forEach(el => this.state.order.push(el.value));
        const initMain = document.getElementById('init-main');
        if (initMain && initMain.value) this.state.mainRef = initMain.value;

        if (!this.state.mainRef && this.state.order.length > 0) {
            this.state.mainRef = this.state.order[0];
        }

        this.render();

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('border-storevo-500', 'bg-slate-900'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('border-storevo-500', 'bg-slate-900'));
        });

        dropzone.addEventListener('drop', (e) => {
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            fileInput.value = '';
        });

        form.addEventListener('submit', (e) => {
            this.syncHiddenInputs();

            // Activar el Overlay de Carga si se están enviando nuevos archivos binarios
            if (this.state.newFiles.length > 0) {
                Storevo.UI.LoadingOverlay.show('Procesando imágenes...', 'Estamos optimizando los archivos. Esto puede tardar unos segundos.');
            }
        });
    },

    handleFiles: function(files) {
        const currentTotal = this.state.existing.length + this.state.newFiles.length;
        const remainingSlots = this.config.maxCount - currentTotal;

        if (remainingSlots <= 0) {
            if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Límite excedido. Máximo ${this.config.maxCount} imágenes.`, 'warning');
            return;
        }

        let addedCount = 0;
        Array.from(files).forEach(file => {
            if (addedCount >= remainingSlots) return;

            // Validación estricta Frontend (MIME y Extensión)
            const ext = file.name.split('.').pop().toLowerCase();
            if (!this.config.allowedMimeTypes.includes(file.type) || !this.config.allowedExtensions.includes(ext)) {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Formato denegado: ${file.name}`, 'error');
                return;
            }
            if (file.size > this.config.maxSize) {
                if (Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(`Archivo muy pesado: ${file.name}`, 'error');
                return;
            }

            if (!this.state.newFiles.some(f => f.name === file.name)) {
                this.state.newFiles.push(file);
                this.state.order.push(file.name);
                if (!this.state.mainRef) this.state.mainRef = file.name;
                addedCount++;
            }
        });

        this.render();
    },

    removeImage: function(ref) {
        this.state.order = this.state.order.filter(r => r !== ref);
        if (this.state.existing.includes(ref)) {
            this.state.existing = this.state.existing.filter(r => r !== ref);
        } else {
            this.state.newFiles = this.state.newFiles.filter(f => f.name !== ref);
        }
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
            let isExisting = this.state.existing.includes(ref);
            let imgSrc = isExisting ? ref : '';

            if (!isExisting) {
                const fileObj = this.state.newFiles.find(f => f.name === ref);
                if (fileObj) imgSrc = URL.createObjectURL(fileObj);
            }

            const isMain = this.state.mainRef === ref;

            const col = document.createElement('div');
            col.className = `relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-move group ${isMain ? 'border-storevo-500 shadow-md shadow-storevo-500/20' : 'border-slate-800 hover:border-slate-600'}`;
            col.draggable = true;
            col.dataset.ref = ref;

            col.addEventListener('dragstart', () => {
                this.state.draggedItem = ref;
                setTimeout(() => col.classList.add('opacity-50'), 0);
            });
            col.addEventListener('dragend', () => col.classList.remove('opacity-50'));
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                col.classList.add('scale-105');
            });
            col.addEventListener('dragleave', () => col.classList.remove('scale-105'));
            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('scale-105');
                this.swapOrder(this.state.draggedItem, ref);
            });

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
        arr[idxA] = refB;
        arr[idxB] = refA;
        this.render();
    },

    syncHiddenInputs: function() {
        const container = document.getElementById('image-hidden-inputs');
        if(!container) return;
        container.innerHTML = '';

        this.state.existing.forEach(url => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'existingImages';
            input.value = url;
            container.appendChild(input);
        });

        this.state.order.forEach(ref => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'imageOrder';
            input.value = ref;
            container.appendChild(input);
        });

        if (this.state.mainRef) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'mainImageRef';
            input.value = this.state.mainRef;
            container.appendChild(input);
        }

        const realInput = document.getElementById('real-file-input');
        if(realInput) {
            const dt = new DataTransfer();
            this.state.newFiles.forEach(file => dt.items.add(file));
            realInput.files = dt.files;
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Storevo.ProductImages.init();
    });
} else {
    Storevo.ProductImages.init();
}