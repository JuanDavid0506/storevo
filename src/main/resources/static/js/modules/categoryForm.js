window.Storevo = window.Storevo || {};

Storevo.CategoryForm = {
    init: function() {
        const parentSelect = document.querySelector('select[name="parentId"]');
        const navCheckbox = document.querySelector('input[name="showInNav"]');

        // Ahora apuntamos exactamente a la caja correcta
        const navContainer = document.getElementById('navbar-setting-container');

        if (parentSelect && navCheckbox && navContainer) {

            const toggleNavbarOption = () => {
                if (parentSelect.value && parentSelect.value.trim() !== "") {
                    // Tiene padre -> Es subcategoría -> Ocultar y apagar
                    navContainer.classList.add('hidden');
                    navCheckbox.checked = false;
                } else {
                    // Sin padre -> Es principal -> Mostrar
                    navContainer.classList.remove('hidden');
                }
            };

            // 1. Ejecutar al cargar la página (vital para cuando entras a "Editar")
            toggleNavbarOption();

            // 2. Ejecutar cada vez que el usuario cambie el selector
            parentSelect.addEventListener('change', () => {
                toggleNavbarOption();

                // Si vuelve a "Categoría Principal", encendemos la opción
                if (!parentSelect.value || parentSelect.value.trim() === "") {
                    navCheckbox.checked = true;
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Storevo.CategoryForm.init());