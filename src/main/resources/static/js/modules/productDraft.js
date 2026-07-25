window.Storevo = window.Storevo || {};

Storevo.ProductDraft = {
    STORAGE_KEY: 'storevo_product_draft_context',

    // Guarda el contexto actual del formulario
    saveContext: function() {
        const context = {
            categoryId: document.getElementById('finalCategoryId')?.value || '',
            isActive: document.getElementById('isActive')?.checked || false,
            // Revisamos el toggle oculto para saber si estaba en modo opciones
            mode: document.getElementById('hasVariantsToggle')?.checked ? 'options' : 'simple'
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(context));
    },

    // Restaura el contexto si venimos de un "Guardar y crear otro"
    restoreContext: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return;

        try {
            const context = JSON.parse(data);

            // 1. Restaurar Estado Activo/Inactivo
            const isActiveToggle = document.getElementById('isActive');
            if (isActiveToggle) isActiveToggle.checked = context.isActive;

            // 2. Restaurar Categoría (Inyectamos el ID antes de que ProductForm.init arranque)
            const finalCatInput = document.getElementById('finalCategoryId');
            if (finalCatInput && context.categoryId) {
                finalCatInput.value = context.categoryId;
            }

            // 3. Restaurar Modo (Simple/Opciones)
            localStorage.setItem('storevo_product_mode', context.mode);

        } catch (e) {
            console.error('Error restaurando el borrador del producto', e);
        }
    },

    // Limpia la memoria para que no contamine sesiones futuras
    clearContext: function() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};