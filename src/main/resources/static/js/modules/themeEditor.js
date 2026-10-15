window.Storevo = window.Storevo || {};

Storevo.ThemeEditor = {
    slug: '',
    storeName: 'Nuestra Tienda',
    previewUrl: '',
    theme: { globalStyles: {}, sections: [] },
    categories: [],
    activeSectionId: null,
    autoSaveTimer: null,
    hasUnpublishedChanges: false,

    catalogDefinitions: {
        announcement_bar: {
            label: 'Barra de Anuncio Superior',
            description: 'Cintillo superior para promociones, envíos gratis o avisos clave.',
            defaultSettings: {
                text: '🚚 ¡Envío gratis en compras superiores a $150.000!',
                bgColor: '#0f172a',
                textColor: '#ffffff',
                linkUrl: '/catalog'
            }
        },
        hero_banner: {
            label: 'Banner Principal (Hero)',
            description: 'Portada de gran impacto con imagen subida, título y hasta 2 botones.',
            defaultSettings: {
                badgeText: 'Nueva Colección',
                title: 'Descubre lo mejor de nuestra tienda',
                subtitle: 'Calidad garantizada con envíos a toda Colombia.',
                buttonText: 'Ver Catálogo',
                buttonUrl: '/catalog',
                secondaryButtonText: '',
                secondaryButtonUrl: '',
                imageUrl: '',
                overlayOpacity: 50,
                bgColor: '#6366f1',
                textColor: '#ffffff',
                alignment: 'center'
            }
        },
        product_grid: {
            label: 'Vitrina de Productos',
            description: 'Muestra tus novedades, productos en oferta o una categoría específica.',
            defaultSettings: {
                title: 'Productos Destacados',
                subtitle: 'Seleccionados especialmente para ti',
                source: 'NEWEST',
                categoryId: '',
                limit: 8,
                showViewAll: true
            }
        },
        featured_categories: {
            label: 'Categorías Destacadas',
            description: 'Tarjetas interactivas hacia las categorías principales de tu tienda.',
            defaultSettings: {
                title: 'Explora por Categoría',
                subtitle: 'Encuentra rápidamente lo que estás buscando'
            }
        },
        multi_banners: {
            label: 'Mosaico Doble de Banners',
            description: '2 tarjetas visuales lado a lado para destacar colecciones o rebajas.',
            defaultSettings: {
                card1Badge: 'Nuevo',
                card1Title: 'Colección Principal',
                card1Subtitle: 'Conoce nuestros últimos lanzamientos',
                card1ButtonText: 'Explorar',
                card1ButtonUrl: '/catalog',
                card1ImageUrl: '',
                card1BgColor: '#1e293b',
                card2Badge: 'Ofertas',
                card2Title: 'Descuentos Especiales',
                card2Subtitle: 'Referencias seleccionadas a precios únicos',
                card2ButtonText: 'Ver ofertas',
                card2ButtonUrl: '/catalog',
                card2ImageUrl: '',
                card2BgColor: '#4f46e5'
            }
        },
        promo_banner: {
            label: 'Banner Dividido (Imagen + Texto)',
            description: 'Bloque mitad texto y mitad foto para destacar una promoción o producto estrella.',
            defaultSettings: {
                badgeText: 'Oferta Especial',
                title: 'Temporada de Descuentos',
                subtitle: 'Aprovecha precios especiales por tiempo limitado.',
                buttonText: 'Comprar ahora',
                buttonUrl: '/catalog',
                imageUrl: '',
                bgColor: '#0f172a',
                textColor: '#ffffff'
            }
        },
        trust_badges: {
            label: 'Franja de Confianza y Beneficios',
            description: '3 bloques con íconos para transmitir seguridad, envíos y atención.',
            defaultSettings: {
                item1Title: 'Compra 100% Segura',
                item1Text: 'Tus datos y pedidos están protegidos en todo momento.',
                item2Title: 'Envíos a Todo el País',
                item2Text: 'Despachamos tu pedido rápido con transportadoras aliadas.',
                item3Title: 'Atención Personalizada',
                item3Text: 'Resolvemos tus dudas directamente por WhatsApp.'
            }
        },
        faq_accordion: {
            label: 'Preguntas Frecuentes (Acordeón)',
            description: 'Desplegable interactivo para responder dudas de envíos, pagos y garantías.',
            defaultSettings: {
                title: 'Preguntas Frecuentes',
                subtitle: 'Resolvemos tus dudas antes de comprar',
                q1: '¿Cuáles son los métodos de pago disponibles?',
                a1: 'Puedes realizar tu pedido con pago seguro en línea o coordinar directamente con nosotros por WhatsApp.',
                q2: '¿Cuánto tarda en llegar mi pedido?',
                a2: 'Despachamos a todo el país. El tiempo estimado de entrega es de 2 a 5 días hábiles según tu ciudad.',
                q3: '¿Tienen cambios o garantías?',
                a3: 'Sí, todos nuestros productos cuentan con garantía y soporte directo.'
            }
        },
        whatsapp_cta: {
            label: 'Banner de Asesoría por WhatsApp',
            description: 'Invita a tus clientes a escribirte por WhatsApp con un solo clic.',
            defaultSettings: {
                title: '¿Tienes dudas con tu talla o pedido?',
                subtitle: 'Escríbenos por WhatsApp y te asesoramos en minutos para elegir el producto ideal.',
                buttonText: 'Hablar con un asesor en WhatsApp'
            }
        },
        rich_text: {
            label: 'Texto Libre / Sobre Nosotros',
            description: 'Sección limpia para contar la historia de tu marca o información clave.',
            defaultSettings: {
                title: 'Sobre Nuestra Marca',
                content: 'Somos una tienda comprometida con ofrecerte la mejor calidad y atención personalizada en cada pedido.'
            }
        }
    },

    init: function() {
        const bridge = document.getElementById('theme-editor-bridge');
        if (!bridge) return;

        this.slug = bridge.getAttribute('data-slug') || '';
        this.storeName = bridge.getAttribute('data-store-name') || 'Nuestra Tienda';
        this.previewUrl = bridge.getAttribute('data-preview-url') || `/s/${this.slug}?preview=draft`;

        try {
            this.theme = JSON.parse(bridge.getAttribute('data-theme') || '{}');
        } catch (e) {
            this.theme = { globalStyles: {}, sections: [] };
        }

        try {
            this.categories = JSON.parse(bridge.getAttribute('data-categories') || '[]');
        } catch (e) {
            this.categories = [];
        }

        if (!this.theme.globalStyles) this.theme.globalStyles = {};
        if (!Array.isArray(this.theme.sections)) this.theme.sections = [];

        this.renderSectionsList();
        this.initSortable();
        this.initGlobalStylesInputs();
        this.renderAddSectionModalCatalog();
        this.renderPresetsCatalog();
        this.initIframeBridgeListener();
    },

    // Escuchar clics sobre las secciones directamente desde el Iframe de vista previa
    initIframeBridgeListener: function() {
        window.addEventListener('message', (e) => {
            if (e.origin !== window.location.origin || !e.data) return;
            if (e.data.type === 'storevo:select-section' && e.data.sectionId) {
                this.setMobilePane('editor');
                this.openInspector(e.data.sectionId);
            }
        });
    },

    // Enviar estilos globales en vivo al Iframe en 0ms sin recargar la página
    pushLiveStylesToIframe: function() {
        const iframe = document.getElementById('storefront-preview-iframe');
        if (!iframe || !iframe.contentWindow) return;
        try {
            iframe.contentWindow.postMessage({
                type: 'storevo:live-styles',
                styles: this.theme.globalStyles
            }, window.location.origin);
        } catch (e) {}
    },

    setMobilePane: function(pane) {
        const workspace = document.getElementById('theme-editor-workspace');
        const btnEditor = document.getElementById('btn-pane-editor');
        const btnPreview = document.getElementById('btn-pane-preview');

        if (workspace) workspace.setAttribute('data-mobile-pane', pane);

        if (btnEditor && btnPreview) {
            const activeClass = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-slate-800 text-white shadow-sm';
            const inactiveClass = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
            btnEditor.className = pane === 'editor' ? activeClass : inactiveClass;
            btnPreview.className = pane === 'preview' ? activeClass : inactiveClass;
        }
    },

    markUnpublishedChanges: function(hasChanges) {
        this.hasUnpublishedChanges = hasChanges;
        const badge = document.getElementById('unpublished-badge');
        if (badge) {
            badge.classList.toggle('hidden', !hasChanges);
        }
    },

    switchTab: function(tab) {
        const tabs = ['sections', 'styles', 'presets'];
        const activeClass = 'flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all bg-slate-800 text-white shadow-sm flex items-center justify-center gap-1.5';
        const inactiveClass = 'flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center justify-center gap-1.5';

        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            if (btn) btn.className = (t === tab) ? activeClass : inactiveClass;
        });

        const panelList = document.getElementById('panel-sections-list');
        const panelInspector = document.getElementById('panel-section-inspector');
        const panelStyles = document.getElementById('panel-global-styles');
        const panelPresets = document.getElementById('panel-theme-presets');

        if (panelList) panelList.classList.add('hidden');
        if (panelInspector) panelInspector.classList.add('hidden');
        if (panelStyles) panelStyles.classList.add('hidden');
        if (panelPresets) panelPresets.classList.add('hidden');

        if (tab === 'sections') {
            if (this.activeSectionId) {
                if (panelInspector) panelInspector.classList.remove('hidden');
            } else {
                if (panelList) panelList.classList.remove('hidden');
            }
        } else if (tab === 'styles') {
            if (panelStyles) panelStyles.classList.remove('hidden');
        } else if (tab === 'presets') {
            if (panelPresets) panelPresets.classList.remove('hidden');
        }
    },

    setDevice: function(device) {
        const wrapper = document.getElementById('preview-viewport-wrapper');
        const btnDesktop = document.getElementById('btn-device-desktop');
        const btnMobile = document.getElementById('btn-device-mobile');

        if (wrapper) wrapper.setAttribute('data-device', device);

        if (btnDesktop && btnMobile) {
            const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-800 text-white shadow-sm';
            const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-400 hover:text-white';
            btnDesktop.className = device === 'desktop' ? activeClass : inactiveClass;
            btnMobile.className = device === 'mobile' ? activeClass : inactiveClass;
        }
    },

    initSortable: function() {
        const container = document.getElementById('sortable-sections-container');
        if (!container || typeof Sortable === 'undefined') return;

        Sortable.create(container, {
            handle: '.drag-handle',
            animation: 180,
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                const orderedIds = Array.from(container.querySelectorAll('[data-sec-id]'))
                    .map(el => el.getAttribute('data-sec-id'));

                const reordered = [];
                orderedIds.forEach(id => {
                    const found = this.theme.sections.find(s => s.id === id);
                    if (found) reordered.push(found);
                });
                this.theme.sections = reordered;
                this.scheduleAutoSave();
            }
        });
    },

    renderSectionsList: function() {
        const container = document.getElementById('sortable-sections-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.theme.sections.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl">
                    <p class="text-xs text-slate-400">No hay secciones en la portada.</p>
                </div>
            `;
            return;
        }

        this.theme.sections.forEach(sec => {
            const def = this.catalogDefinitions[sec.type] || { label: sec.type };
            const subtitle = (sec.settings && (sec.settings.title || sec.settings.text || sec.settings.card1Title)) || def.label;
            const isEnabled = sec.enabled !== false;

            const row = document.createElement('div');
            row.setAttribute('data-sec-id', sec.id);
            row.className = `group flex items-center justify-between gap-2 p-3 rounded-xl border transition-all ${
                isEnabled
                    ? 'bg-slate-950 border-slate-800 hover:border-storevo-500/50'
                    : 'bg-slate-950/50 border-slate-800/50 opacity-50'
            }`;

            row.innerHTML = `
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <button type="button" class="drag-handle p-1 text-slate-500 hover:text-slate-300 cursor-move flex-shrink-0" title="Arrastrar para mover">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                    </button>
                    <button type="button" class="sec-edit-trigger text-left min-w-0 flex-1">
                        <p class="text-xs font-bold text-white truncate">${this.escapeHtml(def.label)}</p>
                        <p class="text-[11px] text-slate-500 truncate mt-0.5">${this.escapeHtml(subtitle)}</p>
                    </button>
                </div>
                <div class="flex items-center gap-0.5 flex-shrink-0">
                    <button type="button" class="sec-dup-btn p-1.5 text-slate-500 hover:text-storevo-400 rounded-lg hover:bg-slate-800 transition" title="Duplicar sección">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                    <button type="button" class="sec-toggle-btn p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition" title="${isEnabled ? 'Ocultar sección' : 'Mostrar sección'}">
                        ${isEnabled
                ? '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>'
                : '<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>'
            }
                    </button>
                    <button type="button" class="sec-delete-btn p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition" title="Eliminar sección">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;

            row.querySelector('.sec-edit-trigger').addEventListener('click', () => this.openInspector(sec.id));
            row.querySelector('.sec-dup-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.duplicateSection(sec.id);
            });
            row.querySelector('.sec-toggle-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                sec.enabled = !isEnabled;
                this.renderSectionsList();
                this.scheduleAutoSave();
            });
            row.querySelector('.sec-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.theme.sections = this.theme.sections.filter(item => item.id !== sec.id);
                this.renderSectionsList();
                this.scheduleAutoSave();
            });

            container.appendChild(row);
        });
    },

    duplicateSection: function(sectionId) {
        const index = this.theme.sections.findIndex(s => s.id === sectionId);
        if (index === -1) return;

        const original = this.theme.sections[index];
        const cloned = {
            id: 'sec_' + Date.now().toString(36),
            type: original.type,
            enabled: true,
            settings: JSON.parse(JSON.stringify(original.settings || {}))
        };

        this.theme.sections.splice(index + 1, 0, cloned);
        this.renderSectionsList();
        this.openInspector(cloned.id);
        this.scheduleAutoSave();

        if (Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show('Sección duplicada', 'success');
        }
    },

    duplicateActiveSection: function() {
        if (this.activeSectionId) {
            this.duplicateSection(this.activeSectionId);
        }
    },

    openInspector: function(sectionId) {
        const sec = this.theme.sections.find(s => s.id === sectionId);
        if (!sec) return;
        this.activeSectionId = sectionId;

        const def = this.catalogDefinitions[sec.type] || { label: sec.type };
        const titleEl = document.getElementById('inspector-section-title');
        if (titleEl) titleEl.textContent = def.label;

        const container = document.getElementById('inspector-fields-container');
        if (!container) return;
        container.innerHTML = '';

        if (!sec.settings) sec.settings = {};

        const fieldsSchema = this.getFieldsForType(sec.type);
        fieldsSchema.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'space-y-1.5';
            wrapper.setAttribute('data-field-key', field.key);

            const label = document.createElement('label');
            label.className = 'block text-xs font-bold text-slate-300';
            label.textContent = field.label;
            wrapper.appendChild(label);

            const currentVal = sec.settings[field.key] !== undefined && sec.settings[field.key] !== null
                ? sec.settings[field.key]
                : (field.defaultVal !== undefined ? field.defaultVal : '');

            if (field.type === 'image') {
                const imgBox = document.createElement('div');
                imgBox.className = 'bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5';

                const previewWrap = document.createElement('div');
                previewWrap.className = currentVal ? 'relative h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800' : 'hidden relative h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800';
                const imgEl = document.createElement('img');
                imgEl.src = currentVal || '';
                imgEl.className = 'w-full h-full object-cover';
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow';
                removeBtn.textContent = 'Quitar imagen';
                previewWrap.appendChild(imgEl);
                previewWrap.appendChild(removeBtn);

                const actionsRow = document.createElement('div');
                actionsRow.className = 'flex items-center gap-2';

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/jpeg,image/png,image/webp';
                fileInput.className = 'hidden';

                const uploadBtn = document.createElement('button');
                uploadBtn.type = 'button';
                uploadBtn.className = 'w-full py-2 px-3 bg-slate-800 hover:bg-storevo-500 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5';
                uploadBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg><span>Subir imagen desde mi equipo</span>';

                const urlInput = document.createElement('input');
                urlInput.type = 'text';
                urlInput.value = currentVal;
                urlInput.placeholder = 'O pega una URL de imagen (https://...)';
                urlInput.className = 'w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-storevo-500 focus:outline-none';

                uploadBtn.addEventListener('click', () => fileInput.click());

                fileInput.addEventListener('change', () => {
                    if (!fileInput.files || !fileInput.files[0]) return;
                    const file = fileInput.files[0];
                    const originalBtnHtml = uploadBtn.innerHTML;
                    uploadBtn.disabled = true;
                    uploadBtn.innerHTML = '<span class="animate-pulse">Subiendo imagen...</span>';

                    const formData = new FormData();
                    formData.append('file', file);

                    fetch(`/dashboard/${this.slug}/template/upload-image`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(r => r.json())
                        .then(data => {
                            if (data.success && data.url) {
                                sec.settings[field.key] = data.url;
                                urlInput.value = data.url;
                                imgEl.src = data.url;
                                previewWrap.classList.remove('hidden');
                                this.scheduleAutoSave();
                                if (Storevo.UI && Storevo.UI.Toast) {
                                    Storevo.UI.Toast.show('Imagen subida y aplicada', 'success');
                                }
                            } else if (Storevo.UI && Storevo.UI.Toast) {
                                Storevo.UI.Toast.show(data.message || 'Error al subir imagen', 'error');
                            }
                        })
                        .catch(() => {
                            if (Storevo.UI && Storevo.UI.Toast) {
                                Storevo.UI.Toast.show('Error de conexión al subir la imagen', 'error');
                            }
                        })
                        .finally(() => {
                            uploadBtn.disabled = false;
                            uploadBtn.innerHTML = originalBtnHtml;
                            fileInput.value = '';
                        });
                });

                removeBtn.addEventListener('click', () => {
                    sec.settings[field.key] = '';
                    urlInput.value = '';
                    imgEl.src = '';
                    previewWrap.classList.add('hidden');
                    this.scheduleAutoSave();
                });

                urlInput.addEventListener('input', () => {
                    const val = urlInput.value.trim();
                    sec.settings[field.key] = val;
                    if (val) {
                        imgEl.src = val;
                        previewWrap.classList.remove('hidden');
                    } else {
                        previewWrap.classList.add('hidden');
                    }
                    this.scheduleAutoSave();
                });

                actionsRow.appendChild(fileInput);
                actionsRow.appendChild(uploadBtn);
                imgBox.appendChild(previewWrap);
                imgBox.appendChild(actionsRow);
                imgBox.appendChild(urlInput);
                wrapper.appendChild(imgBox);

            } else if (field.type === 'url') {
                // Selector asistido de destinos para usuarios sin conocimientos técnicos
                const urlBox = document.createElement('div');
                urlBox.className = 'space-y-1.5';

                const presetSelect = document.createElement('select');
                presetSelect.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:border-storevo-500 focus:outline-none';

                const presetOpts = [
                    { value: '/catalog', label: '📦 Ir a Todo el Catálogo' },
                    { value: '/', label: '🏠 Ir al Inicio de la Tienda' }
                ];
                this.categories.forEach(c => {
                    presetOpts.push({ value: `/catalog?category=${c.id}`, label: `📁 Categoría: ${c.name}` });
                });
                presetOpts.push({ value: '__custom__', label: '🔗 Enlace externo o personalizado...' });

                let matchedPreset = false;
                presetOpts.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value;
                    o.textContent = opt.label;
                    if (opt.value !== '__custom__' && String(opt.value) === String(currentVal)) {
                        o.selected = true;
                        matchedPreset = true;
                    }
                    presetSelect.appendChild(o);
                });
                if (!matchedPreset) {
                    presetSelect.value = '__custom__';
                }

                const customUrlInput = document.createElement('input');
                customUrlInput.type = 'text';
                customUrlInput.value = currentVal;
                customUrlInput.placeholder = 'Ej: https://instagram.com/mitienda o /catalog';
                customUrlInput.className = (matchedPreset ? 'hidden ' : '') + 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-storevo-500 focus:outline-none';

                presetSelect.addEventListener('change', () => {
                    if (presetSelect.value === '__custom__') {
                        customUrlInput.classList.remove('hidden');
                        customUrlInput.focus();
                    } else {
                        customUrlInput.classList.add('hidden');
                        customUrlInput.value = presetSelect.value;
                        sec.settings[field.key] = presetSelect.value;
                        this.scheduleAutoSave();
                    }
                });

                customUrlInput.addEventListener('input', () => {
                    sec.settings[field.key] = customUrlInput.value;
                    this.scheduleAutoSave();
                });

                urlBox.appendChild(presetSelect);
                urlBox.appendChild(customUrlInput);
                wrapper.appendChild(urlBox);

            } else if (field.type === 'textarea') {
                const input = document.createElement('textarea');
                input.rows = 3;
                input.value = currentVal;
                input.placeholder = field.placeholder || '';
                input.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none';
                input.addEventListener('input', () => {
                    sec.settings[field.key] = input.value;
                    this.scheduleAutoSave();
                });
                wrapper.appendChild(input);

            } else if (field.type === 'select') {
                const select = document.createElement('select');
                select.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none';
                (field.options || []).forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value;
                    o.textContent = opt.label;
                    if (String(opt.value) === String(currentVal)) o.selected = true;
                    select.appendChild(o);
                });
                select.addEventListener('change', () => {
                    sec.settings[field.key] = select.value;

                    // Si en product_grid el usuario selecciona una categoría, activamos source = CATEGORY automáticamente
                    if (sec.type === 'product_grid') {
                        if (field.key === 'source') {
                            const catWrapper = container.querySelector('[data-field-key="categoryId"]');
                            if (catWrapper) {
                                catWrapper.classList.toggle('hidden', select.value !== 'CATEGORY');
                            }
                        } else if (field.key === 'categoryId' && select.value) {
                            sec.settings.source = 'CATEGORY';
                            const sourceSelect = container.querySelector('[data-field-key="source"] select');
                            if (sourceSelect) sourceSelect.value = 'CATEGORY';
                        }
                    }

                    this.scheduleAutoSave();
                });
                wrapper.appendChild(select);

                // Ocultar inicialmente el selector de categoría en product_grid si source != CATEGORY
                if (sec.type === 'product_grid' && field.key === 'categoryId') {
                    const currentSource = sec.settings.source || 'NEWEST';
                    if (currentSource !== 'CATEGORY') {
                        wrapper.classList.add('hidden');
                    }
                }

            } else if (field.type === 'color') {
                const colorRow = document.createElement('div');
                colorRow.className = 'flex items-center gap-2';

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = currentVal || '#0f172a';
                colorInput.className = 'w-8 h-8 rounded cursor-pointer bg-transparent';

                const hexInput = document.createElement('input');
                hexInput.type = 'text';
                hexInput.value = currentVal || '#0f172a';
                hexInput.className = 'flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white';

                colorInput.addEventListener('input', () => {
                    hexInput.value = colorInput.value;
                    sec.settings[field.key] = colorInput.value;
                    this.scheduleAutoSave();
                });
                hexInput.addEventListener('input', () => {
                    if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value.trim())) {
                        colorInput.value = hexInput.value.trim();
                        sec.settings[field.key] = hexInput.value.trim();
                        this.scheduleAutoSave();
                    }
                });

                colorRow.appendChild(colorInput);
                colorRow.appendChild(hexInput);
                wrapper.appendChild(colorRow);

            } else if (field.type === 'checkbox') {
                const checkLabel = document.createElement('label');
                checkLabel.className = 'flex items-center gap-2.5 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800';
                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.checked = Boolean(currentVal);
                chk.className = 'w-4 h-4 rounded border-slate-700 text-storevo-500';
                chk.addEventListener('change', () => {
                    sec.settings[field.key] = chk.checked;
                    this.scheduleAutoSave();
                });
                const span = document.createElement('span');
                span.className = 'text-xs font-medium text-slate-300';
                span.textContent = field.placeholder || 'Activar opción';
                checkLabel.appendChild(chk);
                checkLabel.appendChild(span);
                wrapper.innerHTML = '';
                wrapper.appendChild(checkLabel);

            } else {
                const input = document.createElement('input');
                input.type = field.type || 'text';
                input.value = currentVal;
                input.placeholder = field.placeholder || '';
                input.className = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-storevo-500 focus:outline-none';
                input.addEventListener('input', () => {
                    sec.settings[field.key] = input.value;
                    this.scheduleAutoSave();
                });
                wrapper.appendChild(input);
            }

            container.appendChild(wrapper);
        });

        this.switchTab('sections');
        this.highlightSectionInIframe(sectionId);
    },

    closeInspector: function() {
        this.activeSectionId = null;
        this.renderSectionsList();
        document.getElementById('panel-section-inspector').classList.add('hidden');
        document.getElementById('panel-sections-list').classList.remove('hidden');
        this.highlightSectionInIframe(null);
    },

    getFieldsForType: function(type) {
        const catOptions = [{ value: '', label: 'Selecciona una categoría...' }]
            .concat(this.categories.map(c => ({ value: String(c.id), label: c.name })));

        switch (type) {
            case 'announcement_bar':
                return [
                    { key: 'text', label: 'Texto del anuncio', type: 'text', placeholder: 'Ej: Envío gratis en compras mayores a $150.000' },
                    { key: 'linkUrl', label: 'Destino al hacer clic', type: 'url', defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo', type: 'color', defaultVal: '#0f172a' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'hero_banner':
                return [
                    { key: 'imageUrl', label: 'Imagen de Fondo del Banner', type: 'image' },
                    { key: 'overlayOpacity', label: 'Oscuridad sobre la imagen (0 a 90)', type: 'number', defaultVal: 50 },
                    { key: 'badgeText', label: 'Etiqueta superior (Opcional)', type: 'text', placeholder: 'Ej: Nueva Colección' },
                    { key: 'title', label: 'Título Principal', type: 'text', placeholder: 'Bienvenido a nuestra tienda' },
                    { key: 'subtitle', label: 'Subtítulo descriptivo', type: 'textarea', placeholder: 'Explora nuestro catálogo...' },
                    { key: 'alignment', label: 'Alineación del texto', type: 'select', options: [
                            { value: 'center', label: 'Centrado' },
                            { value: 'left', label: 'Izquierda' }
                        ]},
                    { key: 'buttonText', label: 'Texto del botón principal', type: 'text', placeholder: 'Ver Catálogo' },
                    { key: 'buttonUrl', label: 'Destino del botón principal', type: 'url', defaultVal: '/catalog' },
                    { key: 'secondaryButtonText', label: 'Texto 2do botón (Opcional)', type: 'text', placeholder: 'Ofertas' },
                    { key: 'secondaryButtonUrl', label: 'Destino 2do botón', type: 'url', defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo (si no hay imagen)', type: 'color', defaultVal: '#6366f1' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'product_grid':
                return [
                    { key: 'title', label: 'Título de la vitrina', type: 'text', placeholder: 'Novedades' },
                    { key: 'subtitle', label: 'Subtítulo (Opcional)', type: 'text', placeholder: 'Los favoritos de la temporada' },
                    { key: 'source', label: 'Qué productos mostrar', type: 'select', options: [
                            { value: 'NEWEST', label: 'Últimos productos agregados' },
                            { value: 'OFFERS', label: 'Solo productos en oferta / descuento' },
                            { value: 'CATEGORY', label: 'Productos de una categoría específica' }
                        ]},
                    { key: 'categoryId', label: 'Categoría a mostrar', type: 'select', options: catOptions },
                    { key: 'limit', label: 'Cantidad máxima de productos', type: 'select', options: [
                            { value: '4', label: '4 productos (1 fila)' },
                            { value: '8', label: '8 productos (2 filas)' },
                            { value: '12', label: '12 productos (3 filas)' }
                        ]},
                    { key: 'showViewAll', label: 'Enlace al catálogo', type: 'checkbox', placeholder: 'Mostrar botón "Ver todo →"', defaultVal: true }
                ];
            case 'featured_categories':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text', placeholder: 'Explora por Categoría' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Encuentra rápidamente lo que buscas' }
                ];
            case 'multi_banners':
                return [
                    { key: 'card1ImageUrl', label: 'Tarjeta 1: Imagen de Fondo', type: 'image' },
                    { key: 'card1Badge', label: 'Tarjeta 1: Etiqueta', type: 'text' },
                    { key: 'card1Title', label: 'Tarjeta 1: Título', type: 'text' },
                    { key: 'card1Subtitle', label: 'Tarjeta 1: Subtítulo', type: 'text' },
                    { key: 'card1ButtonText', label: 'Tarjeta 1: Texto botón', type: 'text' },
                    { key: 'card1ButtonUrl', label: 'Tarjeta 1: Destino botón', type: 'url', defaultVal: '/catalog' },
                    { key: 'card1BgColor', label: 'Tarjeta 1: Color de fondo', type: 'color', defaultVal: '#1e293b' },
                    { key: 'card2ImageUrl', label: 'Tarjeta 2: Imagen de Fondo', type: 'image' },
                    { key: 'card2Badge', label: 'Tarjeta 2: Etiqueta', type: 'text' },
                    { key: 'card2Title', label: 'Tarjeta 2: Título', type: 'text' },
                    { key: 'card2Subtitle', label: 'Tarjeta 2: Subtítulo', type: 'text' },
                    { key: 'card2ButtonText', label: 'Tarjeta 2: Texto botón', type: 'text' },
                    { key: 'card2ButtonUrl', label: 'Tarjeta 2: Destino botón', type: 'url', defaultVal: '/catalog' },
                    { key: 'card2BgColor', label: 'Tarjeta 2: Color de fondo', type: 'color', defaultVal: '#4f46e5' }
                ];
            case 'promo_banner':
                return [
                    { key: 'imageUrl', label: 'Imagen Lateral de la Promoción', type: 'image' },
                    { key: 'badgeText', label: 'Etiqueta superior', type: 'text', placeholder: 'Destacado' },
                    { key: 'title', label: 'Título de la promoción', type: 'text', placeholder: 'Promoción Especial' },
                    { key: 'subtitle', label: 'Descripción', type: 'textarea', placeholder: 'Detalles de tu promoción...' },
                    { key: 'buttonText', label: 'Texto del botón', type: 'text', placeholder: 'Comprar ahora' },
                    { key: 'buttonUrl', label: 'Destino del botón', type: 'url', defaultVal: '/catalog' },
                    { key: 'bgColor', label: 'Color de fondo del bloque', type: 'color', defaultVal: '#0f172a' },
                    { key: 'textColor', label: 'Color del texto', type: 'color', defaultVal: '#ffffff' }
                ];
            case 'trust_badges':
                return [
                    { key: 'item1Title', label: 'Beneficio 1: Título', type: 'text' },
                    { key: 'item1Text', label: 'Beneficio 1: Descripción', type: 'text' },
                    { key: 'item2Title', label: 'Beneficio 2: Título', type: 'text' },
                    { key: 'item2Text', label: 'Beneficio 2: Descripción', type: 'text' },
                    { key: 'item3Title', label: 'Beneficio 3: Título', type: 'text' },
                    { key: 'item3Text', label: 'Beneficio 3: Descripción', type: 'text' }
                ];
            case 'faq_accordion':
                return [
                    { key: 'title', label: 'Título de la sección', type: 'text' },
                    { key: 'subtitle', label: 'Subtítulo', type: 'text' },
                    { key: 'q1', label: 'Pregunta 1', type: 'text' },
                    { key: 'a1', label: 'Respuesta 1', type: 'textarea' },
                    { key: 'q2', label: 'Pregunta 2', type: 'text' },
                    { key: 'a2', label: 'Respuesta 2', type: 'textarea' },
                    { key: 'q3', label: 'Pregunta 3', type: 'text' },
                    { key: 'a3', label: 'Respuesta 3', type: 'textarea' }
                ];
            case 'whatsapp_cta':
                return [
                    { key: 'title', label: 'Título del bloque', type: 'text' },
                    { key: 'subtitle', label: 'Subtítulo persuasivo', type: 'textarea' },
                    { key: 'buttonText', label: 'Texto del botón de WhatsApp', type: 'text' }
                ];
            case 'rich_text':
                return [
                    { key: 'title', label: 'Título', type: 'text', placeholder: 'Sobre Nosotros' },
                    { key: 'content', label: 'Contenido', type: 'textarea', placeholder: 'Escribe aquí la historia o mensaje de tu tienda...' }
                ];
            default:
                return [];
        }
    },

    initGlobalStylesInputs: function() {
        const gs = this.theme.globalStyles;

        const bindColor = (pickerId, hexId, prop, fallback) => {
            const picker = document.getElementById(pickerId);
            const hex = document.getElementById(hexId);
            if (!picker || !hex) return;

            const initial = gs[prop] || fallback;
            picker.value = initial;
            hex.value = initial;

            picker.oninput = () => {
                hex.value = picker.value;
                gs[prop] = picker.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
            hex.oninput = () => {
                if (/^#[0-9a-fA-F]{6}$/.test(hex.value.trim())) {
                    picker.value = hex.value.trim();
                    gs[prop] = hex.value.trim();
                    this.pushLiveStylesToIframe();
                    this.scheduleAutoSave(false);
                }
            };
        };

        bindColor('style-primary-color', 'style-primary-color-hex', 'primaryColor', '#6366f1');
        bindColor('style-secondary-color', 'style-secondary-color-hex', 'secondaryColor', '#0f172a');
        bindColor('style-bg-color', 'style-bg-color-hex', 'backgroundColor', '#f8fafc');
        bindColor('style-text-color', 'style-text-color-hex', 'textColor', '#0f172a');

        const headingSelect = document.getElementById('style-heading-font');
        if (headingSelect) {
            headingSelect.value = gs.headingFont || 'Inter';
            headingSelect.onchange = () => {
                gs.headingFont = headingSelect.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        const bodySelect = document.getElementById('style-body-font');
        if (bodySelect) {
            bodySelect.value = gs.bodyFont || 'Inter';
            bodySelect.onchange = () => {
                gs.bodyFont = bodySelect.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }

        const radiusSelect = document.getElementById('style-border-radius');
        if (radiusSelect) {
            radiusSelect.value = gs.borderRadius || '1rem';
            radiusSelect.onchange = () => {
                gs.borderRadius = radiusSelect.value;
                this.pushLiveStylesToIframe();
                this.scheduleAutoSave(false);
            };
        }
    },

    getPresetsDefinitions: function() {
        const name = this.storeName || 'Nuestra Tienda';
        return [
            {
                id: 'editorial_minimal',
                name: 'Moda Editorial Minimalista',
                tag: 'Ideal para Ropa y Calzado',
                colors: ['#18181b', '#f8fafc', '#ffffff'],
                description: 'Tipografía editorial elegante (Playfair Display), tonos sobrios en negro carbón y estructura limpia enfocada en fotografía.',
                config: {
                    globalStyles: {
                        primaryColor: '#18181b',
                        secondaryColor: '#27272a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Playfair Display',
                        bodyFont: 'Inter',
                        borderRadius: '0.375rem'
                    },
                    sections: [
                        {
                            id: 'sec_ann_ed', type: 'announcement_bar', enabled: true,
                            settings: { text: '✨ Envíos a toda Colombia • Compra segura en línea o por WhatsApp', bgColor: '#18181b', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_ed', type: 'hero_banner', enabled: true,
                            settings: { badgeText: 'Colección Exclusiva', title: name, subtitle: 'Prendas y diseños pensados para destacar en cada ocasión.', buttonText: 'Explorar Colección', buttonUrl: '/catalog', secondaryButtonText: '', secondaryButtonUrl: '', imageUrl: '', overlayOpacity: 45, bgColor: '#18181b', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_cats_ed', type: 'featured_categories', enabled: true,
                            settings: { title: 'Categorías', subtitle: 'Explora nuestras líneas principales' }
                        },
                        {
                            id: 'sec_grid_ed', type: 'product_grid', enabled: true,
                            settings: { title: 'Nuevos Ingresos', subtitle: 'Recién llegados a nuestro catálogo', source: 'NEWEST', categoryId: '', limit: 8, showViewAll: true }
                        },
                        {
                            id: 'sec_faq_ed', type: 'faq_accordion', enabled: true,
                            settings: { title: 'Preguntas Frecuentes', subtitle: 'Todo lo que necesitas saber sobre tus compras', q1: '¿Cómo elijo mi talla ideal?', a1: 'En cada producto encontrarás sus especificaciones, o puedes escribirnos por WhatsApp para asesorarte.', q2: '¿Cuánto tardan los envíos?', a2: 'Entregamos entre 2 y 5 días hábiles en cualquier ciudad de Colombia.', q3: '¿Qué medios de pago reciben?', a3: 'Recibimos pagos en línea seguros con Wompi (PSE, Nequi, Tarjetas) y pedidos por WhatsApp.' }
                        }
                    ]
                }
            },
            {
                id: 'urban_tech',
                name: 'Urbano / Tech Audaz',
                tag: 'Ideal para Streetwear y Gadgets',
                colors: ['#4f46e5', '#0f172a', '#f1f5f9'],
                description: 'Fuente geométrica moderna (Montserrat), alto impacto visual con mosaico doble de colecciones y sección de ofertas.',
                config: {
                    globalStyles: {
                        primaryColor: '#4f46e5',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Montserrat',
                        bodyFont: 'DM Sans',
                        borderRadius: '1rem'
                    },
                    sections: [
                        {
                            id: 'sec_ann_ut', type: 'announcement_bar', enabled: true,
                            settings: { text: '🔥 ¡Nuevos lanzamientos disponibles! Unidades limitadas', bgColor: '#4f46e5', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_hero_ut', type: 'hero_banner', enabled: true,
                            settings: { badgeText: 'Tendencia 2026', title: 'Lleva tu estilo al siguiente nivel con ' + name, subtitle: 'Referencias seleccionadas con disponibilidad inmediata y despacho rápido.', buttonText: 'Comprar Ahora', buttonUrl: '/catalog', secondaryButtonText: 'Ver Todo', secondaryButtonUrl: '/catalog', imageUrl: '', overlayOpacity: 55, bgColor: '#0f172a', textColor: '#ffffff', alignment: 'left' }
                        },
                        {
                            id: 'sec_multi_ut', type: 'multi_banners', enabled: true,
                            settings: { card1Badge: 'Lo más top', card1Title: 'Lanzamientos', card1Subtitle: 'Lo último que llegó a la tienda', card1ButtonText: 'Ver nuevos', card1ButtonUrl: '/catalog', card1ImageUrl: '', card1BgColor: '#1e293b', card2Badge: 'Precios especiales', card2Title: 'Zona de Ofertas', card2Subtitle: 'Aprovecha antes de que se agoten', card2ButtonText: 'Ver descuentos', card2ButtonUrl: '/catalog', card2ImageUrl: '', card2BgColor: '#4f46e5' }
                        },
                        {
                            id: 'sec_grid_ut', type: 'product_grid', enabled: true,
                            settings: { title: 'Catálogo Destacado', subtitle: 'Los favoritos de nuestros clientes', source: 'NEWEST', categoryId: '', limit: 8, showViewAll: true }
                        },
                        {
                            id: 'sec_trust_ut', type: 'trust_badges', enabled: true,
                            settings: { item1Title: 'Pagos 100% Seguros', item1Text: 'Transacciones protegidas en línea o vía WhatsApp.', item2Title: 'Despacho Ágil', item2Text: 'Enviamos con guía de rastreo a toda Colombia.', item3Title: 'Garantía Real', item3Text: 'Respaldo directo en todas tus compras.' }
                        }
                    ]
                }
            },
            {
                id: 'whatsapp_express',
                name: 'Catálogo Express WhatsApp',
                tag: 'Máxima velocidad de venta',
                colors: ['#059669', '#0f172a', '#f8fafc'],
                description: 'Diseñada para ir directo al grano: muestra tus productos arriba inmediatamente y cierra ventas con el bloque de WhatsApp.',
                config: {
                    globalStyles: {
                        primaryColor: '#059669',
                        secondaryColor: '#0f172a',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Plus Jakarta Sans',
                        bodyFont: 'Plus Jakarta Sans',
                        borderRadius: '1rem'
                    },
                    sections: [
                        {
                            id: 'sec_ann_wa', type: 'announcement_bar', enabled: true,
                            settings: { text: '📲 ¡Haz tu pedido fácil! Agrega a tu bolsa y envíalo por WhatsApp en segundos', bgColor: '#059669', textColor: '#ffffff', linkUrl: '/catalog' }
                        },
                        {
                            id: 'sec_grid_wa', type: 'product_grid', enabled: true,
                            settings: { title: 'Catálogo Disponible en ' + name, subtitle: 'Elige tus productos favoritos y agrégalos a la bolsa', source: 'NEWEST', categoryId: '', limit: 12, showViewAll: true }
                        },
                        {
                            id: 'sec_cta_wa', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Prefieres atención personalizada?', subtitle: 'Escríbenos directamente a nuestro WhatsApp para confirmar disponibilidad, tallas y tiempos de entrega.', buttonText: 'Chatear por WhatsApp' }
                        },
                        {
                            id: 'sec_trust_wa', type: 'trust_badges', enabled: true,
                            settings: { item1Title: 'Atención Inmediata', item1Text: 'Confirmamos tu pedido directamente contigo.', item2Title: 'Envíos Seguros', item2Text: 'Despachos confiables a tu ciudad o municipio.', item3Title: 'Calidad Garantizada', item3Text: 'Productos revisados antes de cada despacho.' }
                        }
                    ]
                }
            },
            {
                id: 'warm_boutique',
                name: 'Boutique Cálida & Estilo',
                tag: 'Ideal para Accesorios, Belleza y Hogar',
                colors: ['#b45309', '#1c1917', '#fafaf9'],
                description: 'Tipografía clásica (Lora) combinada con tonos cálidos dorados/terracota, historia de marca y vitrina curada.',
                config: {
                    globalStyles: {
                        primaryColor: '#b45309',
                        secondaryColor: '#1c1917',
                        backgroundColor: '#f8fafc',
                        textColor: '#0f172a',
                        headingFont: 'Lora',
                        bodyFont: 'Inter',
                        borderRadius: '1.5rem'
                    },
                    sections: [
                        {
                            id: 'sec_hero_wb', type: 'hero_banner', enabled: true,
                            settings: { badgeText: 'Bienvenidos', title: name, subtitle: 'Detalles únicos seleccionados con dedicación para ti.', buttonText: 'Ver Catálogo', buttonUrl: '/catalog', secondaryButtonText: '', secondaryButtonUrl: '', imageUrl: '', overlayOpacity: 45, bgColor: '#b45309', textColor: '#ffffff', alignment: 'center' }
                        },
                        {
                            id: 'sec_grid_wb', type: 'product_grid', enabled: true,
                            settings: { title: 'Nuestros Favoritos', subtitle: 'Descubre las piezas más pedidas', source: 'NEWEST', categoryId: '', limit: 8, showViewAll: true }
                        },
                        {
                            id: 'sec_rich_wb', type: 'rich_text', enabled: true,
                            settings: { title: 'Nuestra Esencia', content: 'En ' + name + ' cuidamos cada detalle para brindarte productos especiales con una experiencia de compra cercana, rápida y confiable.' }
                        },
                        {
                            id: 'sec_cta_wb', type: 'whatsapp_cta', enabled: true,
                            settings: { title: '¿Buscas un regalo o asesoría especial?', subtitle: 'Conversa con nosotros por WhatsApp y te ayudamos a elegir.', buttonText: 'Recibir asesoría por WhatsApp' }
                        }
                    ]
                }
            }
        ];
    },

    renderPresetsCatalog: function() {
        const container = document.getElementById('presets-cards-container');
        if (!container) return;
        container.innerHTML = '';

        this.getPresetsDefinitions().forEach(preset => {
            const card = document.createElement('div');
            card.className = 'bg-slate-950 border border-slate-800 hover:border-storevo-500/50 rounded-2xl p-4 space-y-3 transition-all';

            const swatchesHtml = preset.colors.map(hex =>
                `<span class="w-4 h-4 rounded-full border border-slate-700 inline-block" style="background-color: ${hex};"></span>`
            ).join('');

            card.innerHTML = `
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-storevo-400">${this.escapeHtml(preset.tag)}</span>
                        <h4 class="text-sm font-bold text-white mt-0.5">${this.escapeHtml(preset.name)}</h4>
                    </div>
                    <div class="flex items-center gap-1">${swatchesHtml}</div>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">${this.escapeHtml(preset.description)}</p>
                <button type="button" class="apply-preset-btn w-full py-2 px-3 bg-slate-800 hover:bg-storevo-500 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition">
                    Probar esta plantilla en vista previa
                </button>
            `;

            card.querySelector('.apply-preset-btn').addEventListener('click', () => {
                this.applyPreset(preset);
            });

            container.appendChild(card);
        });
    },

    applyPreset: function(preset) {
        this.theme = JSON.parse(JSON.stringify(preset.config));
        this.activeSectionId = null;
        this.markUnpublishedChanges(true);
        this.renderSectionsList();
        this.initGlobalStylesInputs();
        this.saveDraft(false, true);
        if (Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show(`Plantilla "${preset.name}" aplicada en vista previa`, 'success');
        }
    },

    renderAddSectionModalCatalog: function() {
        const grid = document.getElementById('available-sections-grid');
        if (!grid) return;
        grid.innerHTML = '';

        Object.entries(this.catalogDefinitions).forEach(([type, def]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'text-left p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-storevo-500 transition flex flex-col justify-between gap-2 group';
            btn.innerHTML = `
                <div>
                    <p class="text-sm font-bold text-white group-hover:text-storevo-400 transition-colors">${this.escapeHtml(def.label)}</p>
                    <p class="text-xs text-slate-400 mt-1">${this.escapeHtml(def.description)}</p>
                </div>
                <span class="text-[11px] font-bold text-storevo-400 inline-flex items-center gap-1 mt-2">
                    + Añadir sección
                </span>
            `;
            btn.addEventListener('click', () => this.addSection(type));
            grid.appendChild(btn);
        });
    },

    openAddSectionModal: function() {
        const modal = document.getElementById('add-section-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeAddSectionModal: function() {
        const modal = document.getElementById('add-section-modal');
        if (modal) modal.classList.add('hidden');
    },

    addSection: function(type) {
        const def = this.catalogDefinitions[type];
        if (!def) return;

        const newSection = {
            id: 'sec_' + Date.now().toString(36),
            type: type,
            enabled: true,
            settings: JSON.parse(JSON.stringify(def.defaultSettings || {}))
        };

        this.theme.sections.push(newSection);
        this.closeAddSectionModal();
        this.renderSectionsList();
        this.openInspector(newSection.id);
        this.scheduleAutoSave(true);
    },

    scheduleAutoSave: function(reloadIframe = true) {
        this.markUnpublishedChanges(true);
        this.setSyncStatus('pending', 'Guardando borrador...');
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft(false, reloadIframe);
        }, 650);
    },

    saveDraft: function(showToast = false, reloadIframe = true) {
        this.setSyncStatus('saving', 'Sincronizando vista previa...');
        const overlay = document.getElementById('preview-loading-overlay');
        if (reloadIframe && overlay) overlay.classList.remove('hidden');

        fetch(`/dashboard/${this.slug}/template/save-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.theme)
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    if (reloadIframe) {
                        this.reloadPreviewIframe();
                    }
                    this.setSyncStatus('synced', 'Borrador guardado');
                    if (showToast && Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show(data.message, 'success');
                    }
                } else {
                    if (overlay) overlay.classList.add('hidden');
                    this.setSyncStatus('error', 'Error al sincronizar');
                    if (Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show(data.message || 'Error al guardar borrador', 'error');
                    }
                }
            })
            .catch(() => {
                if (overlay) overlay.classList.add('hidden');
                this.setSyncStatus('error', 'Sin conexión');
            });
    },

    publish: function() {
        const btn = document.getElementById('btn-publish-theme');
        if (btn) btn.disabled = true;

        fetch(`/dashboard/${this.slug}/template/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.theme)
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.markUnpublishedChanges(false);
                    this.reloadPreviewIframe();
                    this.setSyncStatus('synced', '¡Publicado en tienda!');
                    if (Storevo.UI && Storevo.UI.Toast) {
                        Storevo.UI.Toast.show(data.message, 'success');
                    }
                } else if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show(data.message || 'No se pudo publicar', 'error');
                }
            })
            .catch(() => {
                if (Storevo.UI && Storevo.UI.Toast) {
                    Storevo.UI.Toast.show('Error de red al publicar.', 'error');
                }
            })
            .finally(() => {
                if (btn) btn.disabled = false;
            });
    },

    discardDraft: function() {
        const executeDiscard = () => {
            fetch(`/dashboard/${this.slug}/template/discard-draft`, { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.theme) {
                        this.theme = data.theme;
                        this.markUnpublishedChanges(false);
                        this.closeInspector();
                        this.renderSectionsList();
                        this.initGlobalStylesInputs();
                        this.reloadPreviewIframe();
                        if (Storevo.UI && Storevo.UI.Toast) {
                            Storevo.UI.Toast.show(data.message, 'success');
                        }
                    }
                });
        };

        if (Storevo.UI && Storevo.UI.Modal && typeof Storevo.UI.Modal.showConfirm === 'function') {
            Storevo.UI.Modal.showConfirm('¿Descartar los cambios actuales del borrador y volver a tu diseño publicado?', executeDiscard);
        } else if (confirm('¿Descartar los cambios actuales del borrador y volver a tu diseño publicado?')) {
            executeDiscard();
        }
    },

    resetTheme: function() {
        const executeReset = () => {
            fetch(`/dashboard/${this.slug}/template/reset`, { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.theme) {
                        this.theme = data.theme;
                        this.markUnpublishedChanges(true);
                        this.closeInspector();
                        this.renderSectionsList();
                        this.initGlobalStylesInputs();
                        this.reloadPreviewIframe();
                        if (Storevo.UI && Storevo.UI.Toast) {
                            Storevo.UI.Toast.show(data.message, 'success');
                        }
                    }
                });
        };

        if (Storevo.UI && Storevo.UI.Modal && typeof Storevo.UI.Modal.showConfirm === 'function') {
            Storevo.UI.Modal.showConfirm('¿Restablecer el borrador a las secciones iniciales de fábrica?', executeReset);
        } else if (confirm('¿Restablecer el borrador a las secciones iniciales de fábrica?')) {
            executeReset();
        }
    },

    reloadPreviewIframe: function() {
        const iframe = document.getElementById('storefront-preview-iframe');
        const overlay = document.getElementById('preview-loading-overlay');
        if (!iframe) return;

        let previousScrollY = 0;
        try {
            if (iframe.contentWindow) {
                previousScrollY = iframe.contentWindow.scrollY || 0;
            }
        } catch (e) {}

        const onLoadHandler = () => {
            if (overlay) overlay.classList.add('hidden');
            try {
                if (this.activeSectionId) {
                    this.highlightSectionInIframe(this.activeSectionId);
                } else if (iframe.contentWindow && previousScrollY > 0) {
                    iframe.contentWindow.scrollTo(0, previousScrollY);
                }
            } catch (e) {}
            iframe.removeEventListener('load', onLoadHandler);
        };

        iframe.addEventListener('load', onLoadHandler);
        iframe.src = `${this.previewUrl}&t=${Date.now()}`;
    },

    highlightSectionInIframe: function(sectionId) {
        const iframe = document.getElementById('storefront-preview-iframe');
        if (!iframe || !iframe.contentWindow) return;
        try {
            iframe.contentWindow.postMessage({
                type: 'storevo:highlight-section',
                sectionId: sectionId
            }, window.location.origin);
        } catch (e) {}
    },

    scrollToSectionInIframe: function(sectionId) {
        this.highlightSectionInIframe(sectionId);
    },

    setSyncStatus: function(state, text) {
        const statusEl = document.getElementById('editor-sync-status');
        if (!statusEl) return;

        let dotClass = 'bg-emerald-400';
        if (state === 'pending' || state === 'saving') dotClass = 'bg-orange-400 animate-pulse';
        if (state === 'error') dotClass = 'bg-red-400';

        statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span><span>${this.escapeHtml(text)}</span>`;
    },

    escapeHtml: function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.ThemeEditor.init());
} else {
    Storevo.ThemeEditor.init();
}