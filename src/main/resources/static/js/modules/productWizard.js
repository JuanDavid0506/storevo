window.Storevo = window.Storevo || {};

Storevo.ProductWizard = {
    // ---------------------------------------------------
    // LÓGICA DEL DIRECTOR DE ESCENA (MODO DUAL Y PASOS)
    // ---------------------------------------------------
    currentStep: 1,
    totalSteps: 4,
    mode: 'wizard',

    init: function() {
        const savedMode = localStorage.getItem('storevo_product_mode');
        // Si hay un modo guardado y NO estamos editando un producto viejo, aplicarlo.
        if (savedMode && window.IS_NEW_PRODUCT) {
            this.mode = savedMode;
        } else if (!window.IS_NEW_PRODUCT) {
            this.mode = 'advanced';
        }

        this.setMode(this.mode);
    },

    setMode: function(newMode) {
        this.mode = newMode;
        localStorage.setItem('storevo_product_mode', newMode);

        const btnWiz = document.getElementById('btn-mode-wizard');
        const btnAdv = document.getElementById('btn-mode-advanced');
        const allSteps = document.querySelectorAll('.wizard-step');

        // Obtenemos el formulario
        const formLayout = document.getElementById('product-form');

        // LA MAGIA: Al cambiar este atributo, nuestro <style> CSS hace el trabajo pesado
        if(formLayout) formLayout.setAttribute('data-mode', this.mode);

        if (this.mode === 'wizard') {
            // UI Switch: Activar botón Asistente
            if(btnWiz) btnWiz.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all bg-storevo-500 text-white shadow-md";
            if(btnAdv) btnAdv.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all text-slate-500 hover:text-slate-300 bg-transparent";

            this.goToStep(this.currentStep);

        } else {
            // UI Switch: Activar botón Avanzado
            if(btnAdv) btnAdv.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all bg-slate-700 text-white shadow-md";
            if(btnWiz) btnWiz.className = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all text-slate-500 hover:text-slate-300 bg-transparent";

            // Mostrar TODO
            allSteps.forEach(step => {
                step.classList.remove('hidden', 'animate-fade-in-up');
            });

            // Ocultar botones de pasos, mostrar grupo submit
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

    // ---------------------------------------------------
    // LÓGICA DE PLANTILLAS Y VARIANTES
    // ---------------------------------------------------
    templates: [
        { id: 'ropa', name: 'Ropa', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', desc: 'Camisetas, pantalones, vestidos...' },
        { id: 'calzado', name: 'Calzado', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', desc: 'Zapatos, tenis, botas...' },
        { id: 'perfume', name: 'Perfumes', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', desc: 'Lociones, fragancias, cremas...' },
        { id: 'accesorios', name: 'Accesorios', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Gafas, relojes, anillos...' },
        { id: 'tecnologia', name: 'Tecnología', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', desc: 'Celulares, tablets, laptops...' },
        { id: 'personalizado', name: 'Personalizado', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', desc: 'Empieza desde cero' }
    ],

    startWizard: function() {
        const emptyState = document.getElementById('options-empty-state');
        if(emptyState) emptyState.classList.add('hidden');

        const wizardState = document.getElementById('options-wizard-state');
        if(wizardState) {
            wizardState.classList.remove('hidden');
            setTimeout(() => wizardState.classList.remove('opacity-0'), 10);
        }

        const templatesPanel = document.getElementById('vb-templates-panel');
        if(templatesPanel) templatesPanel.classList.add('hidden', 'opacity-0');

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }
    },

    cancel: function() {
        const emptyState = document.getElementById('options-empty-state');
        if(emptyState) emptyState.classList.remove('hidden');

        const wizardState = document.getElementById('options-wizard-state');
        if(wizardState) wizardState.classList.add('hidden', 'opacity-0');

        const templatesPanel = document.getElementById('vb-templates-panel');
        if(templatesPanel) templatesPanel.classList.add('hidden', 'opacity-0');

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }

        if(Storevo.VariantBuilder) {
            Storevo.VariantBuilder.options = [];
            Storevo.VariantBuilder.variants = [];
            Storevo.VariantBuilder.renderOptions();
            const tableContainer = document.getElementById('vb-table-container');
            if(tableContainer) tableContainer.classList.add('hidden');
        }
    },

    showTemplates: function() {
        const wizardState = document.getElementById('options-wizard-state');
        if(wizardState) wizardState.classList.add('hidden', 'opacity-0');

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

        Storevo.VariantBuilder.options = [];
        Storevo.VariantBuilder.variants = [];

        const tableContainer = document.getElementById('vb-table-container');
        if(tableContainer) tableContainer.classList.add('hidden');

        const t = this.templates.find(x => x.id === templateId);

        if (templateId === 'ropa') {
            Storevo.VariantBuilder.addOption('Color', ['Negro', 'Blanco', 'Gris', 'Azul']);
            Storevo.VariantBuilder.addOption('Talla', ['XS', 'S', 'M', 'L', 'XL']);
        }
        else if (templateId === 'calzado') {
            Storevo.VariantBuilder.addOption('Color', ['Negro', 'Blanco']);
            Storevo.VariantBuilder.addOption('Talla', ['35', '36', '37', '38', '39', '40']);
        }
        else if (templateId === 'perfume') {
            Storevo.VariantBuilder.addOption('Presentación', ['30 ml', '50 ml', '100 ml']);
        }
        else if (templateId === 'tecnologia') {
            Storevo.VariantBuilder.addOption('Color', ['Negro', 'Blanco']);
            Storevo.VariantBuilder.addOption('Capacidad', ['64 GB', '128 GB', '256 GB']);
        }
        else if (templateId === 'accesorios') {
            Storevo.VariantBuilder.addOption('Color', []);
            Storevo.VariantBuilder.addOption('Material', []);
        }
        else if (templateId === 'personalizado') {
            Storevo.VariantBuilder.addOption('', []);
        }

        this.removeBanner();
        if (showBanner && templateId !== 'personalizado') {
            this.injectBanner(t);
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