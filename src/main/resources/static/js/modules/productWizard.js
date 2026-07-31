window.Storevo = window.Storevo || {};

Storevo.ProductWizard = {
    // ---------------------------------------------------
    // LÓGICA DEL DIRECTOR DE ESCENA (MODO DUAL Y PASOS)
    // ---------------------------------------------------
    currentStep: 1,
    totalSteps: 4,
    mode: 'wizard',
    currentRecommendation: null,

    init: function() {
        const savedMode = localStorage.getItem('storevo_product_mode');
        if (savedMode && window.IS_NEW_PRODUCT) {
            this.mode = savedMode;
        } else if (!window.IS_NEW_PRODUCT) {
            this.mode = 'advanced';
        }

        // NUEVO: Recuperar el paso en el que estaba antes de recargar
        const savedStep = sessionStorage.getItem('storevo_current_step');
        if (savedStep) {
            this.currentStep = parseInt(savedStep);
        } else {
            this.currentStep = 1;
        }

        this.setMode(this.mode);
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

        // NUEVO: Guardar el paso actual en la memoria de la pestaña
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
            wizardState.innerHTML = `<div class="py-4"><div class="w-6 h-6 border-2 border-storevo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p class="text-xs text-slate-500">Buscando configuración ideal...</p></div>`;
        }

        const catIdInput = document.getElementById('finalCategoryId');
        const catId = catIdInput ? catIdInput.value : null;

        if (catId && catId !== "") {
            try {
                const slug = window.location.pathname.split('/')[2];
                const response = await fetch(`/dashboard/${slug}/products/api/categories/${catId}/smart-template`);

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.recommendation) {
                        this.currentRecommendation = data.recommendation;
                        this.renderSmartTemplate(data.recommendation);
                        return;
                    }
                }
            } catch (error) {
                console.error("Fallo silencioso al buscar recomendación:", error);
            }
        }
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

    renderSmartTemplate: function(rec) {
        const wizState = document.getElementById('options-wizard-state');
        if(wizState) wizState.classList.add('hidden');

        const panel = document.getElementById('smart-recommendation-panel');
        if(!panel) return;

        document.getElementById('smart-title').textContent = rec.title;
        document.getElementById('smart-subtitle').textContent = rec.subtitle;

        const confBadge = document.getElementById('smart-confidence');
        if(confBadge) {
            confBadge.textContent = rec.confidenceLabel + ' (' + rec.confidence + '%)';
            if (rec.confidence >= 90) {
                confBadge.className = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide";
            } else {
                confBadge.className = "bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide";
            }
        }

        const optionsList = document.getElementById('smart-options-list');
        if(optionsList) {
            optionsList.innerHTML = '';
            rec.options.forEach(opt => {
                const vals = opt.values.slice(0,3).join(', ') + (opt.values.length > 3 ? '...' : '');
                optionsList.innerHTML += `
                    <div class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        <span class="text-sm font-bold text-white">${opt.name}</span>
                        <span class="text-xs text-slate-500 ml-1">(${vals})</span>
                    </div>
                `;
            });
        }

        panel.classList.remove('hidden');
        setTimeout(() => panel.classList.remove('opacity-0'), 20);
    },

    applySmartTemplate: function() {
        const panel = document.getElementById('smart-recommendation-panel');
        if(panel) panel.classList.add('hidden');

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.remove('hidden');
            setTimeout(() => builder.classList.remove('opacity-0'), 20);
        }

        if (!this.currentRecommendation) return;

        if(window.Storevo.VariantBuilder) {
            window.Storevo.VariantBuilder.state.options = [];
            window.Storevo.VariantBuilder.state.variantsData = {};
            window.Storevo.VariantBuilder.state.excluded = {};

            this.currentRecommendation.options.forEach(opt => {
                const optKey = opt.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                window.Storevo.VariantBuilder.state.suggestionsCache[optKey] = [...opt.values];
                window.Storevo.VariantBuilder.state.options.push({ name: opt.name, values: [] });
            });

            // NUEVO: Forzar la activación del interruptor de Variantes
            const toggleUI = document.getElementById('hasVariantsToggleUI');
            if(toggleUI && !toggleUI.checked) {
                toggleUI.checked = true;
                document.getElementById('hasVariantsToggle').checked = true;
                if(Storevo.ProductUX) Storevo.ProductUX.toggleVariantsUX(true);
            }

            window.Storevo.VariantBuilder.renderOptions();
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

        if (templateId === 'ropa' || templateId === 'calzado') {
            Storevo.VariantBuilder.state.options = [{ name: 'Talla', values: [] }, { name: 'Color', values: [] }];
        } else if (templateId === 'perfume') {
            Storevo.VariantBuilder.state.options = [{ name: 'Presentación', values: [] }];
        } else if (templateId === 'tecnologia') {
            Storevo.VariantBuilder.state.options = [{ name: 'Capacidad', values: [] }, { name: 'Color', values: [] }];
        } else if (templateId === 'accesorios') {
            Storevo.VariantBuilder.state.options = [{ name: 'Material', values: [] }, { name: 'Color', values: [] }];
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

        // 2. DIBUJAR LA PLANTILLA
        Storevo.VariantBuilder.renderOptions();

        this.removeBanner();
        if (showBanner && templateId !== 'personalizado') {
            this.injectBanner(t);
        }

        // 3. AUTOGUARDADO INMEDIATO
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
                    <p class="text-xs text-slate-400 mt-0.5">Puedes modificar colores, tallas y opciones libremente.</p>
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