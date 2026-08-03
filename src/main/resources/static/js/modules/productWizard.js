window.Storevo = window.Storevo || {};

Storevo.ProductWizard = {
    // ---------------------------------------------------
    // LÓGICA DEL DIRECTOR DE ESCENA (MODO DUAL Y PASOS)
    // ---------------------------------------------------
    currentStep: 1,
    totalSteps: 4,
    mode: 'wizard',
    currentRecommendation: null,

    // 1. INICIALIZADOR: Escucha silenciosa del ID de categoría
    initSmartObserver: function() {
        const catInput = document.getElementById('finalCategoryId');
        if (!catInput) return;

        // Observa si el input oculto de categoría cambia de valor
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.attributeName === "value") {
                    const newCategoryId = catInput.value;
                    if (newCategoryId && newCategoryId.trim() !== '') {
                        this.fetchSmartRecommendation(newCategoryId);
                    }
                }
            });
        });
        observer.observe(catInput, { attributes: true });
    },

    // 2. CONSUMO DEL BACKEND (El nuevo Endpoint)
    fetchSmartRecommendation: async function(categoryId) {
        try {
            const response = await fetch(`/api/recommendations/category/${categoryId}`);

            // REGLA PURISTA: Si el backend dice 204 (No Content) o hay error, abortamos.
            if (!response.ok || response.status === 204) {
                const panel = document.getElementById('smart-recommendation-panel');
                if (panel) panel.classList.add('hidden', 'opacity-0');
                this.currentRecommendation = null;
                return;
            }

            const data = await response.json();
            this.currentRecommendation = data;
            const rec = data.recommendation;

            const panel = document.getElementById('smart-recommendation-panel');
            const title = document.getElementById('smart-title');
            const subtitle = document.getElementById('smart-subtitle');
            const optionsList = document.getElementById('smart-options-list');

            if (!panel) return;

            // Construir los chips visuales del banner
            let html = '';
            if (rec.options && rec.options.length > 0) {
                html += `<span class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 shadow-inner"><span class="text-storevo-400 font-bold">Variantes:</span> ${rec.options.join(', ')}</span>`;
            }
            if (rec.specifications && rec.specifications.length > 0) {
                html += `<span class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 shadow-inner"><span class="text-storevo-400 font-bold">Ficha:</span> ${rec.specifications.join(', ')}</span>`;
            }
            optionsList.innerHTML = html;

            title.textContent = 'Configuración recomendada';
            subtitle.textContent = `Basado en ${data.basedOnProductCount} productos creados en esta categoría.`;

            // Mostrar el banner verde solo porque estamos seguros de que hay datos
            panel.classList.remove('hidden');
            setTimeout(() => panel.classList.remove('opacity-0'), 20);

        } catch (error) {
            console.error("Error obteniendo recomendación:", error);
        }
    },

    init: function() {
        const savedMode = localStorage.getItem('storevo_product_mode');
        if (savedMode && window.IS_NEW_PRODUCT) {
            this.mode = savedMode;
        } else if (!window.IS_NEW_PRODUCT) {
            this.mode = 'advanced';
        }

        // Recuperar el paso en el que estaba antes de recargar
        const savedStep = sessionStorage.getItem('storevo_current_step');
        if (savedStep) {
            this.currentStep = parseInt(savedStep);
        } else {
            this.currentStep = 1;
        }

        this.setMode(this.mode);
        this.initSmartObserver(); // <-- Encendemos el vigía de categoría
    },

    setMode: function(newMode) {
        this.mode = newMode;
        localStorage.setItem('storevo_product_mode', newMode);

        const btnWiz = document.getElementById('btn-mode-wizard');
        const btnAdv = document.getElementById('btn-mode-advanced');
        const allSteps = document.querySelectorAll('.wizard-step');
        const formLayout = document.getElementById('product-form');

        if(formLayout) formLayout.setAttribute('data-mode', this.mode);

        if (this.mode === 'wizard') {
            if(btnWiz) btnWiz.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all bg-storevo-500 text-white shadow-md";
            if(btnAdv) btnAdv.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all text-slate-500 hover:text-slate-300 bg-transparent";
            this.goToStep(this.currentStep);
        } else {
            if(btnAdv) btnAdv.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all bg-slate-700 text-white shadow-md";
            if(btnWiz) btnWiz.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all text-slate-500 hover:text-slate-300 bg-transparent";

            allSteps.forEach(step => step.classList.remove('hidden', 'animate-fade-in-up'));

            const wizardControls = document.getElementById('wizard-controls');
            if(wizardControls) {
                wizardControls.classList.add('hidden');
                wizardControls.classList.remove('flex');
            }

            const submitGroup = document.getElementById('submit-group');
            if(submitGroup) {
                submitGroup.classList.remove('hidden');
                submitGroup.classList.add('flex');
            }
        }
    },

    nextStep: function() {
        if(Storevo.ProductDraft && typeof Storevo.ProductDraft.saveDraft === 'function' && window.IS_NEW_PRODUCT) {
            Storevo.ProductDraft.saveDraft();
        }
        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    prevStep: function() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    goToStep: function(stepNumber) {
        if (this.mode !== 'wizard') return;

        this.currentStep = stepNumber;

        // Guardar el paso actual en la memoria de la pestaña
        sessionStorage.setItem('storevo_current_step', stepNumber);

        document.querySelectorAll('.wizard-step').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('animate-fade-in-up');
        });

        document.querySelectorAll(`.wizard-step-${stepNumber}`).forEach(el => {
            el.classList.remove('hidden');
            el.classList.add('animate-fade-in-up');
        });

        const prevBtn = document.getElementById('wizard-prev');
        const nextBtn = document.getElementById('wizard-next');
        const submitGroup = document.getElementById('submit-group');
        const wizardControls = document.getElementById('wizard-controls');
        const progress = document.getElementById('wizard-progress');

        if(wizardControls) {
            wizardControls.classList.remove('hidden');
            wizardControls.classList.add('flex');
        }

        if (progress) progress.innerHTML = `<span class="font-bold text-white">Paso ${stepNumber}</span> de ${this.totalSteps}`;

        if (prevBtn) {
            if (stepNumber === 1) prevBtn.classList.add('invisible');
            else prevBtn.classList.remove('invisible');
        }

        if (stepNumber === this.totalSteps) {
            if(nextBtn) nextBtn.classList.add('hidden');
            if(submitGroup) {
                submitGroup.classList.remove('hidden');
                submitGroup.classList.add('flex');
            }
        } else {
            if(nextBtn) nextBtn.classList.remove('hidden');
            if(submitGroup) {
                submitGroup.classList.add('hidden');
                submitGroup.classList.remove('flex');
            }
        }
    },

    templates: [
        { id: 'ropa', name: 'Ropa', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', desc: 'Camisetas, pantalones, vestidos...' },
        { id: 'calzado', name: 'Calzado', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', desc: 'Zapatos, tenis, botas...' },
        { id: 'perfume', name: 'Perfumes', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', desc: 'Lociones, fragancias, cremas...' },
        { id: 'accesorios', name: 'Accesorios', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Gafas, relojes, anillos...' },
        { id: 'tecnologia', name: 'Tecnología', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', desc: 'Celulares, tablets, laptops...' },
        { id: 'personalizado', name: 'Personalizado', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', desc: 'Empieza desde cero' }
    ],

    startWizard: async function() {
        const emptyState = document.getElementById('options-empty-state');
        if(emptyState) emptyState.classList.add('hidden');

        const panelSmart = document.getElementById('smart-recommendation-panel');
        const panelTemplates = document.getElementById('vb-templates-panel');
        if (panelSmart) panelSmart.classList.add('hidden');
        if (panelTemplates) panelTemplates.classList.add('hidden');

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }

        const wizardState = document.getElementById('options-wizard-state');
        if(wizardState) {
            wizardState.classList.remove('hidden', 'opacity-0');
            wizardState.innerHTML = `<div class="py-4"><div class="w-6 h-6 border-2 border-storevo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p class="text-xs text-slate-500">Analizando el tipo de producto...</p></div>`;
        }

        const catIdInput = document.getElementById('finalCategoryId');
        const catId = catIdInput ? catIdInput.value : null;

        if (catId && catId !== "") {
            // Si el observador ya consumió el endpoint y encontró datos, mostramos el panel
            if (this.currentRecommendation) {
                if(wizardState) wizardState.classList.add('hidden');
                if (panelSmart) {
                    panelSmart.classList.remove('hidden');
                    setTimeout(() => panelSmart.classList.remove('opacity-0'), 20);
                }
                return;
            }
        }

        // Si no hay categoría o si la IA devolvió 204 (No Content), caemos al flujo normal
        this.showInitialOptions();
    },

    showInitialOptions: function() {
        const wizState = document.getElementById('options-wizard-state');
        if(!wizState) return;
        wizState.innerHTML = `
            <h4 class="text-white font-bold mb-2">¿Cómo deseas comenzar?</h4>
            <p class="text-xs text-slate-500 mb-5">Elige si quieres configurar todo desde cero o usar una plantilla prediseñada.</p>
            <div class="flex flex-col sm:flex-row justify-center gap-3">
                <button type="button" onclick="Storevo.ProductWizard.chooseManual()" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg border border-slate-700 transition-colors">Configuración manual</button>
                <button type="button" onclick="Storevo.ProductWizard.showTemplates()" class="px-5 py-2.5 bg-storevo-500/10 hover:bg-storevo-500/20 text-storevo-400 text-sm font-bold rounded-lg border border-storevo-500/30 transition-colors">Usar plantilla general</button>
            </div>
        `;
    },

    renderSmartTemplate: function(data) {
        const wizState = document.getElementById('options-wizard-state');
        if(wizState) wizState.classList.add('hidden');

        const panel = document.getElementById('smart-recommendation-panel');
        if(!panel) return;

        // Ya fue renderizado por el fetchSmartRecommendation() al cambiar la categoría.
        // Solo nos aseguramos de mostrar el panel.
        panel.classList.remove('hidden');
        setTimeout(() => panel.classList.remove('opacity-0'), 20);
    },

    // 3. INYECCIÓN ÚNICA (Variantes + Specs)
    applySmartTemplate: function() {
        if (!this.currentRecommendation) return;
        const rec = this.currentRecommendation.recommendation;

        // --- A. Inyectar Variantes (Tu lógica nativa) ---
        if (rec.options && rec.options.length > 0 && window.Storevo.VariantBuilder) {
            Storevo.VariantBuilder.state.options = rec.options.map(optName => ({
                name: optName,
                values: []
            }));

            const toggleUI = document.getElementById('hasVariantsToggleUI');
            const toggleHidden = document.getElementById('hasVariantsToggle');
            if (toggleUI) toggleUI.checked = true;
            if (toggleHidden) toggleHidden.checked = true;

            if (Storevo.VariantBuilder) Storevo.VariantBuilder.toggleMainFields(true);
            Storevo.VariantBuilder.state.options.forEach(opt => {
                if (opt.name) Storevo.VariantBuilder.fetchSuggestions(opt.name);
            });
            Storevo.VariantBuilder.renderOptions();

            document.getElementById('options-empty-state')?.classList.add('hidden');
            document.getElementById('smart-recommendation-panel')?.classList.add('hidden', 'opacity-0');
            document.getElementById('variant-builder-container')?.classList.remove('hidden', 'opacity-0');
        }

        // --- B. Inyectar Ficha Técnica (Ahora usando el Creador Universal) ---
        if (rec.specifications && rec.specifications.length > 0) {
            this.clearSpecs();
            rec.specifications.forEach(spec => {
                if (window.Storevo.ProductForm) Storevo.ProductForm.addSpecRow(spec, '');
            });
            // Dejamos siempre una fila vacía al final para activar el vigilante
            if (window.Storevo.ProductForm) Storevo.ProductForm.addSpecRow('', '');
        }

        // Autoguardado silencioso de todo el combo
        if (window.Storevo.ProductDraft && typeof window.Storevo.ProductDraft.scheduleSave === 'function') {
            Storevo.ProductDraft.scheduleSave();
        }
    },

    // 4. FUNCIÓN DE LIMPIEZA MANUAL (Ficha Técnica)
    clearSpecs: function() {
        const container = document.getElementById('specsContainer');
        if (container) {
            container.innerHTML = '';
            // Si el usuario limpia todo, el sistema le regala la primera fila vacía para empezar
            if (window.Storevo.ProductForm) Storevo.ProductForm.addSpecRow();
        }
        if (window.Storevo.ProductDraft && typeof window.Storevo.ProductDraft.scheduleSave === 'function') {
            Storevo.ProductDraft.scheduleSave();
        }
    },

    cancel: function() {
        const emptyState = document.getElementById('options-empty-state');
        if(emptyState) emptyState.classList.remove('hidden');

        const wizardState = document.getElementById('options-wizard-state');
        if(wizardState) wizardState.classList.add('hidden', 'opacity-0');

        const panelSmart = document.getElementById('smart-recommendation-panel');
        if (panelSmart) panelSmart.classList.add('hidden');

        const templatesPanel = document.getElementById('vb-templates-panel');
        if(templatesPanel) templatesPanel.classList.add('hidden', 'opacity-0');

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }

        if(Storevo.VariantBuilder) {
            Storevo.VariantBuilder.state.options = [];
            Storevo.VariantBuilder.state.variantsData = {};
            Storevo.VariantBuilder.state.excluded = {};
            Storevo.VariantBuilder.renderOptions();
            const tableContainer = document.getElementById('vb-table-container');
            if(tableContainer) tableContainer.classList.add('hidden');
        }
    },

    showTemplates: function() {
        const wizardState = document.getElementById('options-wizard-state');
        if(wizardState) wizardState.classList.add('hidden', 'opacity-0');

        const panelSmart = document.getElementById('smart-recommendation-panel');
        if (panelSmart) panelSmart.classList.add('hidden');

        this.removeBanner();

        const panel = document.getElementById('vb-templates-panel');
        if(panel) {
            panel.classList.remove('hidden');
            setTimeout(() => panel.classList.remove('opacity-0'), 10);
            this.renderTemplates();
        }

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }
    },

    chooseManual: function() {
        this.applyTemplate('personalizado', false);
    },

    renderTemplates: function() {
        const grid = document.getElementById('vb-templates-grid');
        if(!grid) return;
        grid.innerHTML = '';

        this.templates.forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'bg-slate-900 border border-slate-800 p-4 rounded-xl text-left hover:border-storevo-500/50 hover:bg-storevo-500/10 transition-all group';
            btn.onclick = () => this.applyTemplate(t.id, true);

            btn.innerHTML = `
                <svg class="w-6 h-6 text-slate-500 mb-2 group-hover:text-storevo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${t.icon}"/>
                </svg>
                <h5 class="text-sm font-bold text-white mb-1">${t.name}</h5>
                <p class="text-[11px] text-slate-500 leading-tight">${t.desc}</p>
            `;
            grid.appendChild(btn);
        });
    },

    applyTemplate: function(templateId, showBanner = true) {
        const wizardState = document.getElementById('options-wizard-state');
        if(wizardState) wizardState.classList.add('hidden', 'opacity-0');

        const templatesPanel = document.getElementById('vb-templates-panel');
        if(templatesPanel) templatesPanel.classList.add('hidden', 'opacity-0');

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.remove('hidden');
            setTimeout(() => builder.classList.remove('opacity-0'), 10);
        }

        if (!Storevo.VariantBuilder) return;

        sessionStorage.setItem('storevo_product_template', templateId);

        Storevo.VariantBuilder.state.options = [];
        Storevo.VariantBuilder.state.variantsData = {};
        Storevo.VariantBuilder.state.excluded = {};

        const tableContainer = document.getElementById('vb-table-container');
        if(tableContainer) tableContainer.classList.add('hidden');

        const t = this.templates.find(x => x.id === templateId);

        let defaultSpecs = []; // Ficha Técnica asociada a la plantilla predeterminada

        if (templateId === 'ropa') {
            Storevo.VariantBuilder.state.options = [{ name: 'Talla', values: [] }, { name: 'Color', values: [] }];
            defaultSpecs = ['Material', 'Género', 'Tipo de prenda', 'Estilo'];
        } else if (templateId === 'calzado') {
            Storevo.VariantBuilder.state.options = [{ name: 'Talla', values: [] }, { name: 'Color', values: [] }];
            defaultSpecs = ['Material', 'Género', 'Estilo'];
        } else if (templateId === 'perfume') {
            Storevo.VariantBuilder.state.options = [{ name: 'Presentación', values: [] }];
            defaultSpecs = ['Marca', 'Familia olfativa', 'Volumen'];
        } else if (templateId === 'tecnologia') {
            Storevo.VariantBuilder.state.options = [{ name: 'Capacidad', values: [] }, { name: 'Color', values: [] }];
            defaultSpecs = ['Marca', 'Modelo', 'Garantía', 'Sistema Operativo'];
        } else if (templateId === 'accesorios') {
            Storevo.VariantBuilder.state.options = [{ name: 'Material', values: [] }, { name: 'Color', values: [] }];
            defaultSpecs = ['Material', 'Género', 'Estilo'];
        } else {
            Storevo.VariantBuilder.state.options = [{ name: '', values: [] }];
        }

        Storevo.VariantBuilder.state.options.forEach(opt => {
            if (opt.name) {
                Storevo.VariantBuilder.fetchSuggestions(opt.name);
            }
        });

        // 1. FORZAR INTERRUPTOR Y BLOQUEOS DE FORMA SILENCIOSA
        const toggleUI = document.getElementById('hasVariantsToggleUI');
        const toggleHidden = document.getElementById('hasVariantsToggle');

        if (toggleUI) toggleUI.checked = true;
        if (toggleHidden) toggleHidden.checked = true;

        if (Storevo.VariantBuilder) {
            Storevo.VariantBuilder.toggleMainFields(true);
        }

        // 2. DIBUJAR LA PLANTILLA (Variantes)
        Storevo.VariantBuilder.renderOptions();

        // 3. INYECTAR FICHA TÉCNICA (Ahora usando el Creador Universal)
        this.clearSpecs();
        if (defaultSpecs.length > 0) {
            defaultSpecs.forEach(spec => {
                if (window.Storevo.ProductForm) Storevo.ProductForm.addSpecRow(spec, '');
            });
            if (window.Storevo.ProductForm) Storevo.ProductForm.addSpecRow('', '');
        } else {
            if (window.Storevo.ProductForm) Storevo.ProductForm.addSpecRow('', '');
        }

        this.removeBanner();
        if (showBanner && templateId !== 'personalizado') {
            this.injectBanner(t);
        }

        // 4. AUTOGUARDADO INMEDIATO
        if (window.Storevo.ProductDraft && typeof window.Storevo.ProductDraft.saveToDatabase === 'function') {
            Storevo.VariantBuilder.syncHiddenInputs();
            Storevo.ProductDraft.saveToDatabase();
        }
    },

    injectBanner: function(template) {
        const builder = document.getElementById('variant-builder-container');
        if(!builder) return;

        const banner = document.createElement('div');
        banner.id = 'template-success-banner';
        banner.className = 'bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all';
        banner.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="mt-0.5 text-emerald-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                    <p class="text-sm font-bold text-emerald-400">Plantilla "${template.name}" aplicada</p>
                    <p class="text-xs text-slate-400 mt-0.5">Puedes modificar colores, tallas y especificaciones libremente.</p>
                </div>
            </div>
            <button type="button" onclick="Storevo.ProductWizard.showTemplates()" class="text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition shrink-0">
                Cambiar plantilla
            </button>
        `;

        builder.insertBefore(banner, builder.firstChild);
    },

    removeBanner: function() {
        const existing = document.getElementById('template-success-banner');
        if(existing) existing.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Storevo.ProductWizard.init();
});