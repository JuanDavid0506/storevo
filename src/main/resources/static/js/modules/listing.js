window.Storevo = window.Storevo || {};

Storevo.Listing = {
    // === MOTOR AJAX TIPO REACT ===
    submitForm: function() {
        const form = document.getElementById('listing-form');
        if (!form) return;

        const formData = new FormData(form);
        const params = new URLSearchParams();

        // Solo metemos en la URL los filtros que tengan valor
        for (const [key, value] of formData.entries()) {
            if (value && value.trim() !== '') {
                params.append(key, value);
            }
        }

        const url = `${window.location.pathname}?${params.toString()}`;
        Storevo.Listing.fetchResults(url);
    },

    goToPage: function(pageNumber) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageNumber);
        Storevo.Listing.fetchResults(url.toString());
    },

    fetchResults: function(url, isPopState = false) {
        const container = document.getElementById('listing-results-container');
        const formContainer = document.getElementById('listing-form'); // <-- Capturamos el formulario entero
        const counter = document.getElementById('total-items-counter');

        // 1. Efecto visual de carga
        if (container) {
            container.style.opacity = '0.4';
            container.style.pointerEvents = 'none';
        }
        if (formContainer) {
            formContainer.style.opacity = '0.7';
            formContainer.style.pointerEvents = 'none';
        }

        // 2. Traer HTML en segundo plano
        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // 3. Reemplazo quirúrgico en el DOM
                const newContainer = doc.getElementById('listing-results-container');
                if (newContainer && container) container.innerHTML = newContainer.innerHTML;

                // <-- REEMPLAZAMOS EL FORMULARIO ENTERO (Para actualizar Pills y Botón Limpiar)
                const newForm = doc.getElementById('listing-form');
                if (newForm && formContainer) formContainer.innerHTML = newForm.innerHTML;

                const newCounter = doc.getElementById('total-items-counter');
                if (newCounter && counter) counter.textContent = newCounter.textContent;

                // 4. Actualizar barra del navegador (History API)
                if (!isPopState) {
                    window.history.pushState({path: url}, '', url);
                }

                // 5. Quitar efecto de carga
                if (container) {
                    container.style.opacity = '1';
                    container.style.pointerEvents = 'auto';
                }
                if (formContainer) {
                    formContainer.style.opacity = '1';
                    formContainer.style.pointerEvents = 'auto';
                }

                // 6. Reiniciar TODOS los componentes en el HTML nuevo
                Storevo.Listing.initListingUX();

                if (window.Storevo.ProductsList) {
                    Storevo.ProductsList.initSelection();
                    Storevo.ProductsList.loadStatistics();
                    const savedView = localStorage.getItem('storevo_admin_products_view') || 'cards';
                    Storevo.ProductsList.setView(savedView);
                }
            })
            .catch(err => {
                console.error("Error cargando listado, recargando de forma nativa...", err);
                // Si falla por seguridad o red, caemos de pie a una recarga normal
                window.location.href = url;
            });
    },

    // --- COMPONENTES ORIGINALES ADAPTADOS ---
    initFilterChips: function() {
        const form = document.getElementById('listing-form');
        const chipsContainer = document.getElementById('active-filters-chips');
        if (!form || !chipsContainer) return;

        const fields = form.querySelectorAll('[data-filter="true"]');
        chipsContainer.innerHTML = '';

        fields.forEach(field => {
            if (!field.value) return;

            let label;
            if (field.dataset.chipLabel) {
                label = field.dataset.chipLabel;
            } else if (field.tagName === 'SELECT') {
                const opt = field.options[field.selectedIndex];
                label = opt ? opt.textContent.trim() : field.value;
            } else {
                label = '"' + field.value + '"';
            }

            const chip = document.createElement('span');
            chip.className = 'inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-storevo-500/10 text-storevo-300 text-xs font-bold rounded-full border border-storevo-500/20';
            chip.innerHTML = '<span></span>';
            chip.querySelector('span').textContent = label;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'hover:text-white transition-colors';
            removeBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>';
            removeBtn.onclick = () => {
                field.value = '';
                Storevo.Listing.submitForm();
            };

            chip.appendChild(removeBtn);
            chipsContainer.appendChild(chip);
        });

        const searchClearBtn = form.querySelector('[data-clear-field="q"]');
        const searchInput = form.querySelector('input[name="q"]');
        if (searchClearBtn && searchInput) {
            searchClearBtn.classList.toggle('hidden', !searchInput.value);
            searchClearBtn.onclick = () => {
                searchInput.value = '';
                Storevo.Listing.submitForm();
            };
        }
    },

    initSearchDebounce: function(delay = 700) {
        const searchInput = document.querySelector('#listing-form input[name="q"]');
        if (!searchInput || searchInput.dataset.debounceInitialized) return;
        searchInput.dataset.debounceInitialized = 'true';

        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                sessionStorage.setItem('storevo:searchFocus', '1');
                Storevo.Listing.submitForm();
            }, delay);
        });
    },

    restoreSearchFocus: function() {
        const searchInput = document.querySelector('#listing-form input[name="q"]');
        if (!searchInput) return;

        if (sessionStorage.getItem('storevo:searchFocus') === '1') {
            sessionStorage.removeItem('storevo:searchFocus');
            searchInput.focus();
            const pos = searchInput.value.length;
            searchInput.setSelectionRange(pos, pos);
        }
    },

    initCategoryCombobox: function() {
        document.querySelectorAll('[data-category-combobox]').forEach(root => {
            if (root.dataset.comboboxInitialized) return;
            root.dataset.comboboxInitialized = 'true';

            let tree = [];
            try { tree = JSON.parse(root.dataset.tree || '[]'); } catch (e) { tree = []; }

            const hiddenInput = root.querySelector('[data-combobox-value]');
            const trigger = root.querySelector('[data-combobox-trigger]');
            const labelEl = root.querySelector('[data-combobox-label]');
            const quickClear = root.querySelector('[data-combobox-quick-clear]');
            const panel = root.querySelector('[data-combobox-panel]');
            const searchInput = root.querySelector('[data-combobox-search]');
            const treeContainer = root.querySelector('[data-combobox-tree]');
            const clearBtn = root.querySelector('[data-combobox-clear]');

            if (!hiddenInput || !trigger || !panel || !treeContainer || !labelEl) return;

            const defaultLabel = labelEl.textContent.trim();

            function findNodePath(nodes, id, path) {
                for (const node of nodes) {
                    const currentPath = path.concat([node]);
                    if (String(node.id) === String(id)) return currentPath;
                    if (node.children && node.children.length) {
                        const found = findNodePath(node.children, id, currentPath);
                        if (found) return found;
                    }
                }
                return null;
            }

            function setSelection(id, displayLabel) {
                hiddenInput.value = id || '';
                hiddenInput.dataset.chipLabel = id ? displayLabel : '';
                labelEl.textContent = id ? displayLabel : defaultLabel;
                if (quickClear) quickClear.classList.toggle('hidden', !id);
            }

            function selectNode(node, isRoot) {
                const displayLabel = isRoot ? ('Todo ' + node.name) : node.name;
                setSelection(node.id, displayLabel);
                closePanel();
                Storevo.Listing.submitForm();
            }

            function nodeMatchesQuery(node, query) {
                if (node.name.toLowerCase().includes(query)) return true;
                if (node.children) return node.children.some(child => nodeMatchesQuery(child, query));
                return false;
            }

            function renderNode(node, isRoot, query, selectedId) {
                const wrapper = document.createElement('div');
                const row = document.createElement('div');
                row.className = 'flex items-center gap-1 rounded-lg hover:bg-slate-800/70';

                const hasChildren = node.children && node.children.length > 0;
                const forceOpen = !!query;

                let chevronBtn = null;
                if (hasChildren) {
                    chevronBtn = document.createElement('button');
                    chevronBtn.type = 'button';
                    chevronBtn.className = 'p-1.5 text-slate-500 hover:text-white transition-transform flex-shrink-0' + (forceOpen ? ' rotate-90' : '');
                    chevronBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
                    row.appendChild(chevronBtn);
                } else {
                    const spacer = document.createElement('span');
                    spacer.className = 'w-6 flex-shrink-0';
                    row.appendChild(spacer);
                }

                const selectBtn = document.createElement('button');
                selectBtn.type = 'button';
                const displayText = isRoot ? ('Todo ' + node.name) : node.name;
                const isSelected = String(node.id) === String(selectedId);
                selectBtn.className = 'flex-1 text-left px-2 py-1.5 text-sm rounded-lg truncate transition-colors ' +
                    (isSelected ? 'text-storevo-400 font-bold bg-storevo-500/10' : 'text-slate-300 hover:text-white');
                selectBtn.textContent = displayText;
                selectBtn.onclick = () => selectNode(node, isRoot);
                row.appendChild(selectBtn);
                wrapper.appendChild(row);

                if (hasChildren) {
                    const childrenContainer = document.createElement('div');
                    childrenContainer.className = 'pl-4 border-l border-slate-800 ml-3' + (forceOpen ? '' : ' hidden');
                    node.children.forEach(child => {
                        if (query && !nodeMatchesQuery(child, query)) return;
                        childrenContainer.appendChild(renderNode(child, false, query, selectedId));
                    });
                    wrapper.appendChild(childrenContainer);
                    chevronBtn.onclick = () => {
                        const nowHidden = childrenContainer.classList.toggle('hidden');
                        chevronBtn.classList.toggle('rotate-90', !nowHidden);
                    };
                }
                return wrapper;
            }

            function renderTree(query) {
                treeContainer.innerHTML = '';
                const selectedId = hiddenInput.value;
                const normalizedQuery = (query || '').trim().toLowerCase();
                const visibleRoots = tree.filter(node => !normalizedQuery || nodeMatchesQuery(node, normalizedQuery));

                if (visibleRoots.length === 0) {
                    const empty = document.createElement('p');
                    empty.className = 'text-center text-xs text-slate-500 py-4';
                    empty.textContent = 'No se encontraron categorías.';
                    treeContainer.appendChild(empty);
                    return;
                }

                visibleRoots.forEach(node => {
                    treeContainer.appendChild(renderNode(node, true, normalizedQuery, selectedId));
                });
            }

            function openPanel() {
                panel.classList.remove('hidden');
                if (searchInput) searchInput.value = '';
                renderTree('');
                if (searchInput) searchInput.focus();
            }

            function closePanel() {
                panel.classList.add('hidden');
            }

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                panel.classList.contains('hidden') ? openPanel() : closePanel();
            });

            if (searchInput) {
                searchInput.addEventListener('input', () => renderTree(searchInput.value));
                searchInput.addEventListener('click', (e) => e.stopPropagation());
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    setSelection('', '');
                    closePanel();
                    Storevo.Listing.submitForm();
                });
            }

            if (quickClear) {
                quickClear.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setSelection('', '');
                    Storevo.Listing.submitForm();
                });
            }

            panel.addEventListener('click', (e) => e.stopPropagation());
            document.addEventListener('click', () => closePanel());
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

            if (hiddenInput.value) {
                const path = findNodePath(tree, hiddenInput.value, []);
                if (path && path.length) {
                    const isRootSelection = path.length === 1;
                    const lastNode = path[path.length - 1];
                    const displayLabel = isRootSelection ? ('Todo ' + lastNode.name) : lastNode.name;
                    setSelection(hiddenInput.value, displayLabel);
                }
            }
        });
    },

    initListingUX: function() {
        Storevo.Listing.initCategoryCombobox();
        Storevo.Listing.initFilterChips();
        Storevo.Listing.initSearchDebounce();
        Storevo.Listing.restoreSearchFocus();

        // Escuchar el Enter natural del formulario
        const form = document.getElementById('listing-form');
        if (form && !form.dataset.ajaxInitialized) {
            form.dataset.ajaxInitialized = 'true';
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                Storevo.Listing.submitForm();
            });
        }
    }
};

// Escuchar el botón de "Atrás" del navegador para navegar sin recargar
window.addEventListener('popstate', function(e) {
    if (e.state && e.state.path) {
        Storevo.Listing.fetchResults(e.state.path, true);
    } else {
        Storevo.Listing.fetchResults(window.location.href, true);
    }
});

// Registrar el estado inicial del History API
if (!window.history.state) {
    window.history.replaceState({path: window.location.href}, '', window.location.href);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Storevo.Listing.initListingUX);
} else {
    Storevo.Listing.initListingUX();
}