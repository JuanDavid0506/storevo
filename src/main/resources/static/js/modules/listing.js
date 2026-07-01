window.Storevo = window.Storevo || {};

Storevo.Listing = {
    goToPage: function(pageNumber) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageNumber);
        window.location.href = url.toString();
    },

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
            removeBtn.title = 'Quitar este filtro';
            removeBtn.className = 'hover:text-white transition-colors';
            removeBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>';
            removeBtn.onclick = () => {
                field.value = '';
                form.submit();
            };

            chip.appendChild(removeBtn);
            chipsContainer.appendChild(chip);
        });

        // Muestra/oculta la "x" dentro del buscador
        const searchClearBtn = form.querySelector('[data-clear-field="q"]');
        const searchInput = form.querySelector('input[name="q"]');
        if (searchClearBtn && searchInput) {
            searchClearBtn.classList.toggle('hidden', !searchInput.value);
            searchClearBtn.onclick = () => { searchInput.value = ''; form.submit(); };
        }
    },

    initSearchDebounce: function(delay = 700) {
        const searchInput = document.querySelector('#listing-form input[name="q"]');
        if (!searchInput) return;

        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                sessionStorage.setItem('storevo:searchFocus', '1');
                searchInput.form.submit();
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
            const form = hiddenInput.form;

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
                if (form) form.submit();
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
                    if (form) form.submit();
                });
            }

            if (quickClear) {
                quickClear.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setSelection('', '');
                    if (form) form.submit();
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
    }
};

document.addEventListener('DOMContentLoaded', Storevo.Listing.initListingUX);