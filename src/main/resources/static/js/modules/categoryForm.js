window.Storevo = window.Storevo || {};

Storevo.CategoryForm = {
    init: function() {
        // Buscamos cualquier elemento (select o input oculto) que se llame parentId
        const parentInput = document.querySelector('[name="parentId"]');
        const navCheckbox = document.querySelector('input[name="showInNav"]');
        const navContainer = document.getElementById('navbar-setting-container');

        if (navCheckbox && navContainer) {

            const toggleNavbarOption = () => {
                // Verificamos si hay un ID en la URL o si el input tiene valor
                const urlParams = new URLSearchParams(window.location.search);
                const hasParentUrl = urlParams.has('parentId');
                const hasParentInput = parentInput && parentInput.value && parentInput.value.trim() !== "";

                // Si detecta un padre por URL o por valor del input, es una subcategoría
                if (hasParentUrl || hasParentInput) {
                    navContainer.classList.add('hidden');
                    navCheckbox.checked = false;
                } else {
                    navContainer.classList.remove('hidden');
                }
            };

            // 1. Validar inmediatamente al cargar la página (cubre el /new?parentId=1 y la edición)
            toggleNavbarOption();

            // 2. Escuchar los cambios manuales solo si el campo es un <select> editable
            if (parentInput && parentInput.tagName === 'SELECT') {
                parentInput.addEventListener('change', () => {
                    toggleNavbarOption();

                    // Si vuelve a "Categoría Principal", encendemos la opción por defecto
                    if (!parentInput.value || parentInput.value.trim() === "") {
                        navCheckbox.checked = true;
                    }
                });
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Storevo.CategoryForm.init());