window.Storevo = window.Storevo || {};

if (!Storevo.getTenantKey) {
    Storevo.getTenantKey = function(baseKey) {
        const match = window.location.pathname.match(/^\/dashboard\/([^/]+)/);
        return baseKey + '_' + (match ? match[1] : 'default');
    };
}

Storevo.Listing = {
    alertParams: ['success', 'deleted', 'restored', 'hard_deleted', 'activated', 'deactivated'],

    getCurrentSection: function() {
        const sectionMatch = window.location.pathname.match(/^\/dashboard\/[^/]+\/([^/?#]+)/);
        return sectionMatch ? sectionMatch[1] : 'general';
    },

    getPageSizeKey: function() {
        return Storevo.getTenantKey('storevo_page_size_' + Storevo.Listing.getCurrentSection());
    },

    getListingStateKey: function() {
        return Storevo.getTenantKey('storevo_listing_state_' + Storevo.Listing.getCurrentSection());
    },

    saveListingState: function(params) {
        const cleanParams = new URLSearchParams(params.toString());
        Storevo.Listing.alertParams.forEach(p => cleanParams.delete(p));

        const queryStr = cleanParams.toString();
        const stateKey = Storevo.Listing.getListingStateKey();

        if (queryStr) {
            sessionStorage.setItem(stateKey, queryStr);
        } else {
            sessionStorage.removeItem(stateKey);
        }

        if (Storevo.Navigation && typeof Storevo.Navigation.syncReturnLinks === 'function') {
            Storevo.Navigation.syncReturnLinks();
        }
    },

    clearSavedState: function() {
        sessionStorage.removeItem(Storevo.Listing.getListingStateKey());
        if (Storevo.Navigation && typeof Storevo.Navigation.syncReturnLinks === 'function') {
            Storevo.Navigation.syncReturnLinks();
        }
    },

    // === MOTOR AJAX TIPO REACT ===
    submitForm: function() {
        const form = document.getElementById('listing-form');
        if (!form) return;

        const sizeSelect = form.querySelector('select[name="size"]');
        if (sizeSelect && sizeSelect.value) {
            localStorage.setItem(Storevo.Listing.getPageSizeKey(), sizeSelect.value);
        }

        const formData = new FormData(form);
        const params = new URLSearchParams();

        for (const [key, value] of formData.entries()) {
            if (value && value.trim() !== '') {
                params.append(key, value);
            }
        }

        // Si el preset no es "custom", no arrastrar fechas manuales en la URL
        if (params.get('datePreset') !== 'custom') {
            params.delete('fromDate');
            params.delete('toDate');
        }

        const savedSize = localStorage.getItem(Storevo.Listing.getPageSizeKey());
        if (!params.has('size') && savedSize) {
            params.set('size', savedSize);
        }

        // Guardamos el estado actual de filtros (si eligió "Todos", status viene vacío y limpia el filtro anterior)
        Storevo.Listing.saveListingState(params);

        const url = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;

        Storevo.Listing.fetchResults(url);
    },

    goToPage: function(pageNumber) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageNumber);

        const savedSize = localStorage.getItem(Storevo.Listing.getPageSizeKey());
        if (!url.searchParams.has('size') && savedSize) {
            url.searchParams.set('size', savedSize);
        }

        Storevo.Listing.saveListingState(url.searchParams);
        Storevo.Listing.fetchResults(url.toString());
    },

    fetchResults: function(url, isPopState = false) {
        const container = document.getElementById('listing-results-container');
        const formContainer = document.getElementById('listing-form');
        const counter = document.getElementById('total-items-counter');

        if (container) {
            container.style.opacity = '0.4';
            container.style.pointerEvents = 'none';
        }
        if (formContainer) {
            formContainer.style.opacity = '0.7';
            formContainer.style.pointerEvents = 'none';
        }

        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const newContainer = doc.getElementById('listing-results-container');
                if (newContainer && container) container.innerHTML = newContainer.innerHTML;

                const newForm = doc.getElementById('listing-form');
                if (newForm && formContainer) formContainer.innerHTML = newForm.innerHTML;

                const newCounter = doc.getElementById('total-items-counter');
                if (newCounter && counter) counter.textContent = newCounter.textContent;

                if (!isPopState) {
                    window.history.pushState({path: url}, '', url);
                }

                if (container) {
                    container.style.opacity = '1';
                    container.style.pointerEvents = 'auto';
                }
                if (formContainer) {
                    formContainer.style.opacity = '1';
                    formContainer.style.pointerEvents = 'auto';
                }

                Storevo.Listing.initListingUX(true);

                if (window.Storevo.ProductsList) {
                    Storevo.ProductsList.initSelection();
                    Storevo.ProductsList.loadStatistics();
                    const savedView = localStorage.getItem(Storevo.getTenantKey('storevo_admin_products_view')) || 'cards';
                    Storevo.ProductsList.setView(savedView);
                }
                if (typeof window.updateOrdersViewUI === 'function') {
                    window.updateOrdersViewUI();
                }
                if (typeof window.updateCustomersViewUI === 'function') {
                    window.updateCustomersViewUI();
                }
            })
            .catch(err => {
                console.error("Error cargando listado, recargando de forma nativa...", err);
                window.location.href = url;
            });
    },

    // --- PERSISTENCIA DE FILTROS Y TAMAÑO DE PÁGINA AL VOLVER ---
    initStatePersistence: function() {
        const form = document.getElementById('listing-form');
        if (!form) return;

        const sizeSelect = form.querySelector('select[name="size"]');
        const sizeStorageKey = Storevo.Listing.getPageSizeKey();
        const stateStorageKey = Storevo.Listing.getListingStateKey();

        if (sizeSelect && !sizeSelect.dataset.persistenceInitialized) {
            sizeSelect.dataset.persistenceInitialized = 'true';
            sizeSelect.addEventListener('change', () => {
                if (sizeSelect.value) {
                    localStorage.setItem(sizeStorageKey, sizeSelect.value);
                }
            });
        }

        const currentUrlParams = new URLSearchParams(window.location.search);
        // Ignorar parámetros de alertas Toast (?success, ?activated, etc.)
        Storevo.Listing.alertParams.forEach(p => currentUrlParams.delete(p));

        const hasUrlFilters = Array.from(currentUrlParams.keys()).length > 0;
        const savedStateQuery = sessionStorage.getItem(stateStorageKey);
        const savedSize = localStorage.getItem(sizeStorageKey);

        // Caso 1: La URL ya trae filtros activos -> sincronizar memoria con la URL actual
        if (hasUrlFilters) {
            if (currentUrlParams.has('size')) {
                const urlSize = currentUrlParams.get('size');
                localStorage.setItem(sizeStorageKey, urlSize);
                if (sizeSelect && sizeSelect.value !== urlSize) {
                    sizeSelect.value = urlSize;
                }
            }
            Storevo.Listing.saveListingState(currentUrlParams);
            return;
        }

        // Caso 2: Llegó a la URL limpia (ej. tras editar/guardar/ocultar un producto) pero había filtros guardados
        if (savedStateQuery) {
            const restoredParams = new URLSearchParams(savedStateQuery);
            if (!restoredParams.has('size') && savedSize) {
                restoredParams.set('size', savedSize);
            }
            const restoredUrl = `${window.location.pathname}?${restoredParams.toString()}`;
            window.history.replaceState({path: restoredUrl}, '', restoredUrl);
            Storevo.Listing.fetchResults(restoredUrl, true);
            return;
        }

        // Caso 3: No había filtros guardados, pero sí preferencia de cantidad por página
        if (savedSize && sizeSelect) {
            const optionExists = Array.from(sizeSelect.options).some(opt => opt.value === savedSize);
            if (optionExists && sizeSelect.value !== savedSize) {
                sizeSelect.value = savedSize;
                Storevo.Listing.submitForm();
            }
        }
    },

    // --- INTERCEPTAR EL BOTÓN "LIMPIAR" PARA BORRAR LA MEMORIA DE FILTROS ---
    initClearFiltersButtons: function() {
        const basePath = window.location.pathname;
        const selectors = '[data-clear-all-filters="true"], a[title="Borrar todos los filtros"], #listing-results-container a';

        document.querySelectorAll(selectors).forEach(link => {
            if (link.dataset.clearInitialized) return;

            const linkUrl = new URL(link.href, window.location.origin);
            const isClearLink = link.hasAttribute('data-clear-all-filters')
                || link.getAttribute('title') === 'Borrar todos los filtros'
                || (linkUrl.pathname === basePath && linkUrl.search === '');

            if (!isClearLink) return;
            link.dataset.clearInitialized = 'true';

            link.addEventListener('click', (e) => {
                e.preventDefault();
                Storevo.Listing.clearSavedState();

                const savedSize = localStorage.getItem(Storevo.Listing.getPageSizeKey());
                const cleanUrl = savedSize ? `${basePath}?size=${savedSize}` : basePath;

                window.history.pushState({path: cleanUrl}, '', cleanUrl);
                Storevo.Listing.fetchResults(cleanUrl, true);
            });
        });
    },

    // --- GESTIÓN DEL FILTRO DE FECHAS Y AUTO-SUBMIT AJAX ---
    initDateAndSelectFilters: function() {
        const form = document.getElementById('listing-form');
        if (!form) return;

        const presetSelect = form.querySelector('select[name="datePreset"]');
        const customContainer = document.getElementById('custom-date-range');
        const fromInput = form.querySelector('input[name="fromDate"]');
        const toInput = form.querySelector('input[name="toDate"]');

        form.querySelectorAll('[data-date-picker-box]').forEach(box => {
            if (box.dataset.pickerBoxInitialized) return;
            box.dataset.pickerBoxInitialized = 'true';

            box.addEventListener('click', () => {
                const input = box.querySelector('input[type="date"]');
                if (input && typeof input.showPicker === 'function') {
                    try {
                        input.showPicker();
                    } catch (err) {
                        input.focus();
                    }
                }
            });
        });

        form.querySelectorAll('[data-auto-submit="true"]').forEach(selectEl => {
            if (selectEl.dataset.ajaxSelectInitialized) return;
            selectEl.dataset.ajaxSelectInitialized = 'true';

            selectEl.addEventListener('change', (e) => {
                e.stopImmediatePropagation();

                if (selectEl.name === 'datePreset') {
                    if (selectEl.value === 'custom') {
                        if (customContainer) {
                            customContainer.classList.remove('hidden');
                            customContainer.classList.add('flex');
                        }
                        if (fromInput && !fromInput.value) {
                            fromInput.focus();
                            if (typeof fromInput.showPicker === 'function') {
                                try { fromInput.showPicker(); } catch (err) {}
                            }
                            return;
                        }
                    } else {
                        if (fromInput) fromInput.value = '';
                        if (toInput) toInput.value = '';
                        if (customContainer) {
                            customContainer.classList.add('hidden');
                            customContainer.classList.remove('flex');
                        }
                    }
                }

                Storevo.Listing.submitForm();
            });
        });

        [fromInput, toInput].forEach(dateInput => {
            if (!dateInput || dateInput.dataset.dateInitialized) return;
            dateInput.dataset.dateInitialized = 'true';

            dateInput.addEventListener('change', () => {
                if (presetSelect && presetSelect.value !== 'custom') {
                    presetSelect.value = 'custom';
                }
                Storevo.Listing.submitForm();
            });
        });
    },

    initFilterChips: function() {
        const form = document.getElementById('listing-form');
        const chipsContainer = document.getElementById('active-filters-chips');
        if (!form || !chipsContainer) return;

        const fields = form.querySelectorAll('[data-filter="true"]');
        const fromInput = form.querySelector('input[name="fromDate"]');
        const toInput = form.querySelector('input[name="toDate"]');
        const presetSelect = form.querySelector('select[name="datePreset"]');
        chipsContainer.innerHTML = '';

        fields.forEach(field => {
            if (!field.value) return;

            if (field.name === 'datePreset' && field.value === 'custom' && ((fromInput && fromInput.value) || (toInput && toInput.value))) {
                return;
            }

            let label;
            if (field.dataset.chipLabel) {
                label = field.dataset.chipLabel;
            } else if (field.dataset.chipPrefix) {
                label = field.dataset.chipPrefix + field.value;
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
                if (field.name === 'datePreset') {
                    if (fromInput) fromInput.value = '';
                    if (toInput) toInput.value = '';
                } else if ((field.name === 'fromDate' || field.name === 'toDate') && presetSelect && presetSelect.value === 'custom') {
                    const remainingFrom = fromInput ? fromInput.value : '';
                    const remainingTo = toInput ? toInput.value : '';
                    if (!remainingFrom && !remainingTo) {
                        presetSelect.value = '';
                    }
                }
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

    initListingUX: function(skipInitialRestore = false) {
        if (!skipInitialRestore) {
            Storevo.Listing.initStatePersistence();
        }
        Storevo.Listing.initDateAndSelectFilters();
        Storevo.Listing.initCategoryCombobox();
        Storevo.Listing.initFilterChips();
        Storevo.Listing.initClearFiltersButtons();
        Storevo.Listing.initSearchDebounce();
        Storevo.Listing.restoreSearchFocus();

        if (Storevo.Navigation && typeof Storevo.Navigation.syncReturnLinks === 'function') {
            Storevo.Navigation.syncReturnLinks();
        }

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

window.addEventListener('popstate', function(e) {
    if (e.state && e.state.path) {
        Storevo.Listing.fetchResults(e.state.path, true);
    } else {
        Storevo.Listing.fetchResults(window.location.href, true);
    }
});

if (!window.history.state) {
    window.history.replaceState({path: window.location.href}, '', window.location.href);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.Listing.initListingUX(false));
} else {
    Storevo.Listing.initListingUX(false);
}