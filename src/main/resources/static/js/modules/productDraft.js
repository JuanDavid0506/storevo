window.Storevo = window.Storevo || {};

Storevo.ProductDraft = {
    init: function() {
        this.form = document.getElementById('product-form');
        if (!this.form) return;

        this.saveTimeout = null;
        this.statusTimeout = null;
        this.isSaving = false;

        this.form.addEventListener('input', (e) => {
            if (!e.isTrusted) return;
            this.scheduleSave();
        });

        this.form.addEventListener('change', (e) => {
            if (!e.isTrusted) return;
            this.scheduleSave();
        });
    },

    scheduleSave: function() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);

        this.updateIndicator('<span class="text-slate-500">Editando</span>');
        this.saveTimeout = setTimeout(() => this.saveToDatabase(), 2000);
    },

    saveToDatabase: async function() {
        const nombreInput = document.getElementById('input-name');

        if (!nombreInput || nombreInput.value.trim().length < 2) {
            this.updateIndicator('<span class="text-slate-500" title="Escribe un nombre para guardar">Borrador sin guardar</span>');
            return;
        }

        if (this.isSaving) return;
        this.isSaving = true;

        this.updateIndicator('<span class="text-slate-400 animate-pulse">Guardando...</span>');

        try {
            if (window.Storevo.VariantBuilder) {
                Storevo.VariantBuilder.syncHiddenInputs();
            }
            if (window.Storevo.ProductImages) {
                Storevo.ProductImages.syncHiddenInputs();
            }

            const formData = new FormData(this.form);

            // --- EL SALVAVIDAS DE SPRING BOOT ---
            // Forzamos un '0' a los números vacíos para evitar el Error 400 (Bad Request)
            ['price', 'stock', 'discountPrice', 'weight'].forEach(field => {
                if (formData.has(field) && formData.get(field).trim() === '') {
                    formData.set(field, '0');
                }
            });
            // Si la categoría está vacía, la eliminamos para que pase como null
            if (formData.has('categoryId') && formData.get('categoryId').trim() === '') {
                formData.delete('categoryId');
            }

            const currentUrl = window.location.pathname;

            let autoSaveUrl = currentUrl;
            if (currentUrl.endsWith('/new')) {
                autoSaveUrl = currentUrl.replace('/new', '/auto-save');
            } else {
                const basePath = currentUrl.split('/products/')[0] + '/products';
                autoSaveUrl = basePath + '/auto-save';
            }

            const response = await fetch(autoSaveUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Error en el servidor al guardar el borrador');

            const data = await response.json();

            // --- LA MAGIA DE LA URL ---
            if (data && data.id) {
                const idInput = document.getElementById('id');
                if (idInput) idInput.value = data.id;

                if (window.location.pathname.endsWith('/new')) {
                    const basePath = window.location.pathname.replace('/new', '');
                    const newUrl = `${basePath}/${data.id}/edit`;

                    window.history.replaceState(null, '', newUrl);
                    window.IS_NEW_PRODUCT = false;
                }
            }

            this.updateIndicator('<span class="text-emerald-400 font-medium">✓ Guardado</span>');

            if (this.statusTimeout) clearTimeout(this.statusTimeout);

            this.statusTimeout = setTimeout(() => {
                this.updateIndicator('<span class="text-slate-500">Editando</span>');
            }, 2500);

        } catch (error) {
            console.error("Error en auto-guardado:", error);
            this.updateIndicator('<span class="text-red-400 font-medium">Error al guardar</span>');
        } finally {
            this.isSaving = false;
        }
    },

    updateIndicator: function(htmlContent) {
        const indicator = document.querySelector('header span.bg-slate-800');
        if (indicator) {
            indicator.innerHTML = htmlContent;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Storevo.ProductDraft.init();
});