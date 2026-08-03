window.Storevo = window.Storevo || {};

if (!Storevo.getTenantKey) {
    // Namespacing por tenant: evita que un dato de sessionStorage/localStorage de una tienda
    // se filtre a otra si el mismo usuario administra varias tiendas desde el mismo navegador.
    // Autodefensivo: se define una sola vez, sin importar qué archivo cargue primero.
    Storevo.getTenantKey = function(baseKey) {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        return baseKey + '_' + (match ? match[1] : 'default');
    };
}

Storevo.ProductsList = {
    state: {
        selectedIds: []
    },

    init: function() {
        const savedView = localStorage.getItem(Storevo.getTenantKey('storevo_admin_products_view')) || 'cards';
        this.setView(savedView);
        this.initSelection();
        this.loadStatistics();
        // NUEVO: Escuchar el cambio en el selector de paginación
        const sizeSelect = document.querySelector('select[name="size"]');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', () => document.getElementById('listing-form').submit());
        }
    },

    // --- GESTIÓN DE VISTAS (Layout Toggle) ---
    setView: function(viewName) {
        document.querySelectorAll('.view-container').forEach(el => {
            el.classList.add('hidden');
        });

        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) targetView.classList.remove('hidden');

        const buttons = {
            'table': document.getElementById('btn-view-table'),
            'cards': document.getElementById('btn-view-cards'),
            'compact': document.getElementById('btn-view-compact')
        };

        Object.values(buttons).forEach(btn => {
            if(!btn) return;
            btn.classList.remove('bg-slate-800', 'text-white', 'shadow-sm');
            btn.classList.add('text-slate-500', 'hover:text-slate-300');
        });

        if (buttons[viewName]) {
            buttons[viewName].classList.remove('text-slate-500', 'hover:text-slate-300');
            buttons[viewName].classList.add('bg-slate-800', 'text-white', 'shadow-sm');
        }

        localStorage.setItem(Storevo.getTenantKey('storevo_admin_products_view'), viewName);
    },

    // --- CONTROL REMOTO DE FILTROS NATIVOS (Pills) ---
    setStatusFilter: function(statusValue) {
        const select = document.querySelector('select[name="status"]');
        if (select) {
            select.value = statusValue;
            Storevo.Listing.submitForm(); // Magia AJAX 🔥
        }
    },

    // --- GESTIÓN DE ACCIONES MASIVAS Y CHECKBOXES ---
    initSelection: function() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        const selectAllCb = document.getElementById('select-all-checkbox');

        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                // Sincronizar el mismo producto en las vistas ocultas (magia UX)
                const id = e.target.value;
                const isChecked = e.target.checked;
                document.querySelectorAll(`.product-checkbox[value="${id}"]`).forEach(sibling => {
                    sibling.checked = isChecked;
                });
                this.handleSelectionChange(e.target);
            });
        });

        if (selectAllCb) {
            selectAllCb.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                checkboxes.forEach(cb => cb.checked = isChecked);

                // Limpiamos y reconstruimos la lista exacta de IDs únicos
                this.state.selectedIds = [];
                if (isChecked) {
                    const uniqueIds = new Set();
                    checkboxes.forEach(cb => uniqueIds.add(parseInt(cb.value)));
                    this.state.selectedIds = Array.from(uniqueIds);
                }
                this.syncTopPanel();
            });
        }
    },

    handleSelectionChange: function(checkbox, skipRender = false) {
        const id = parseInt(checkbox.value);
        if (checkbox.checked) {
            if (!this.state.selectedIds.includes(id)) this.state.selectedIds.push(id);
        } else {
            this.state.selectedIds = this.state.selectedIds.filter(itemId => itemId !== id);
        }

        const selectAllCb = document.getElementById('select-all-checkbox');
        // Solución matemática: contamos solo los productos únicos usando una sola vista (la tabla)
        const totalUniqueProducts = document.querySelectorAll('#view-table .product-checkbox').length;

        if (selectAllCb) {
            selectAllCb.checked = (this.state.selectedIds.length === totalUniqueProducts && totalUniqueProducts > 0);
        }

        if (!skipRender) this.syncTopPanel();
    },
    syncTopPanel: function() {
        const count = this.state.selectedIds.length;
        const massHeader = document.getElementById('mass-action-header');
        const counterElement = document.getElementById('selected-count');

        if (count > 0) {
            counterElement.textContent = count;
            massHeader.classList.remove('hidden');
            setTimeout(() => massHeader.classList.remove('opacity-0', 'translate-y-10'), 10);
        } else {
            massHeader.classList.add('opacity-0', 'translate-y-10');
            setTimeout(() => {
                massHeader.classList.add('hidden');
            }, 300);
        }
    },

    clearSelection: function() {
        document.querySelectorAll('.product-checkbox, #select-all-checkbox').forEach(cb => {
            cb.checked = false;
        });
        this.state.selectedIds = [];
        this.syncTopPanel();
    },

    executeMassAction: function(action) {
        if (this.state.selectedIds.length === 0) return;

        const pathParts = window.location.pathname.split('/');
        const slug = pathParts[2];
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');

        const massHeader = document.getElementById('mass-action-header');
        massHeader.classList.add('opacity-50', 'pointer-events-none');

        fetch(`/dashboard/${slug}/products/api/mass-action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ action: action, ids: this.state.selectedIds })
        })
            .then(response => {
                if (!response.ok) throw new Error('Error en el servidor');
                window.location.reload();
            })
            .catch(error => {
                massHeader.classList.remove('opacity-50', 'pointer-events-none');
                if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Error al procesar la acción', 'error');
                }
            });
    },

    // --- EDICIÓN RÁPIDA (Inline Stock) ---
    quickUpdateStock: function(btnElement, changeAmount) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        const inputContainer = btnElement.parentElement;
        const input = inputContainer.querySelector('input[type="number"]');

        let currentValue = parseInt(input.value) || 0;
        let newValue = currentValue + changeAmount;
        if (newValue < 0) newValue = 0;

        this.sendStockUpdate(input, newValue, currentValue);
    },

    directUpdateStock: function(inputElement) {
        let currentValue = parseInt(inputElement.getAttribute('data-last-valid-value')) || 0;
        let newValue = parseInt(inputElement.value);

        if (isNaN(newValue) || newValue < 0) {
            inputElement.value = currentValue;
            return;
        }

        this.sendStockUpdate(inputElement, newValue, currentValue);
    },

    sendStockUpdate: function(inputElement, newValue, oldValue) {
        const productId = inputElement.getAttribute('data-id');
        const pathParts = window.location.pathname.split('/');
        const slug = pathParts[2];
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');

        inputElement.value = newValue;
        inputElement.setAttribute('data-last-valid-value', newValue);

        const container = inputElement.parentElement;
        container.classList.add('opacity-50', 'pointer-events-none');

        fetch(`/dashboard/${slug}/products/${productId}/quick-stock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ stock: newValue })
        })
            .then(response => {
                if (!response.ok) throw new Error('Error en el servidor');
                if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Stock actualizado', 'success');
                }
            })
            .catch(error => {
                inputElement.value = oldValue;
                inputElement.setAttribute('data-last-valid-value', oldValue);
                if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Error al guardar el stock', 'error');
                }
            })
            .finally(() => {
                container.classList.remove('opacity-50', 'pointer-events-none');
            });
    },

    // --- CARGA DE ESTADÍSTICAS ASÍNCRONAS ---
    loadStatistics: function() {
        const statContainers = document.querySelectorAll('.product-stats-container');
        if (statContainers.length === 0) return;

        const productIds = Array.from(statContainers).map(el => parseInt(el.getAttribute('data-stat-id')));
        const pathParts = window.location.pathname.split('/');
        const slug = pathParts[2];
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');

        fetch(`/dashboard/${slug}/products/api/stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify(productIds)
        })
            .then(res => res.json())
            .then(data => {
                statContainers.forEach(container => {
                    const id = container.getAttribute('data-stat-id');
                    const stats = data[id];
                    if(stats) {
                        const soldEl = container.querySelector('.stats-sold');
                        const dateEl = container.querySelector('.stats-date');

                        if(soldEl) soldEl.textContent = `${stats.sold} vendidos`;
                        if(dateEl) dateEl.textContent = stats.lastSale;
                    }
                });
            })
            .catch(err => console.error("No se pudieron cargar las estadísticas"));
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.ProductsList.init());
} else {
    Storevo.ProductsList.init();
}