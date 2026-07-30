window.Storevo = window.Storevo || {};

Storevo.ProductDraft = {
    init: function() {
        this.form = document.getElementById('product-form');
        if (!this.form) return;

        this.saveTimeout = null;
        this.statusTimeout = null; // Nuevo: Para controlar que los textos no se pisen
        this.isSaving = false;

        // Añadimos el evento 'e' y la regla anti-bucles (isTrusted)
        this.form.addEventListener('input', (e) => {
            if (!e.isTrusted) return; // Si fue el Javascript, ignorar
            this.scheduleSave();
        });

        this.form.addEventListener('change', (e) => {
            if (!e.isTrusted) return; // Si fue el Javascript, ignorar
            this.scheduleSave();
        });
    },

    scheduleSave: function() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);

        // Si el usuario vuelve a escribir, regresamos a "Editando" silenciosamente
        this.updateIndicator('<span class="text-slate-500">Editando</span>');

        this.saveTimeout = setTimeout(() => this.saveToDatabase(), 2000);
    },

    saveToDatabase: async function() {
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
            const currentUrl = window.location.pathname;
            const autoSaveUrl = currentUrl.replace('/edit', '/auto-save');

            const response = await fetch(autoSaveUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Error en el servidor');

            this.updateIndicator('<span class="text-emerald-400 font-medium">✓ Guardado</span>');

            // Limpiamos cualquier temporizador anterior para que no borre el "✓ Guardado" antes de tiempo
            if (this.statusTimeout) clearTimeout(this.statusTimeout);

            // Volver al estado de reposo después de 2.5 segundos
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