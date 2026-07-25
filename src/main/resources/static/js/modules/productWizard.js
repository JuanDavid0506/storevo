window.Storevo = window.Storevo || {};

Storevo.ProductWizard = {
    init: function() {
        this.renderTemplates();

        const urlParams = new URLSearchParams(window.location.search);
        const isContinue = urlParams.get('continue') === 'true';
        const savedTemplate = localStorage.getItem('storevo_product_template');

        const hasInitialData = (window.INITIAL_OPTIONS && window.INITIAL_OPTIONS.length > 0);
        const isNewProduct = typeof window.IS_NEW_PRODUCT !== 'undefined' ? window.IS_NEW_PRODUCT : true;

        if (isContinue && isNewProduct) {
            if(Storevo.ProductDraft) Storevo.ProductDraft.restoreContext();

            if (savedTemplate && Storevo.VariantBuilder && !hasInitialData) {
                Storevo.VariantBuilder.applyTemplate(savedTemplate, true);
            }
        } else if (!isContinue && isNewProduct) {
            const lastMode = localStorage.getItem('storevo_product_mode');

            if (lastMode === 'options' && savedTemplate && !hasInitialData) {
                if (Storevo.VariantBuilder) {
                    Storevo.VariantBuilder.applyTemplate(savedTemplate, true);
                }
            } else if (!hasInitialData) {
                if(Storevo.ProductDraft) Storevo.ProductDraft.clearContext();
                localStorage.setItem('storevo_product_mode', 'simple');
                localStorage.removeItem('storevo_product_template');
            }
        }

        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (e.submitter && e.submitter.value === 'save_and_new') {
                    if(Storevo.ProductDraft) Storevo.ProductDraft.saveContext();
                } else {
                    if(Storevo.ProductDraft) Storevo.ProductDraft.clearContext();
                }
            });
        }

        if (isNewProduct) {
            const lastMode = localStorage.getItem('storevo_product_mode');
            if (lastMode === 'options') {
                this.chooseManual(false);
            } else if (lastMode === 'simple') {
                this.chooseSimple(false);
            }
        } else if (window.INITIAL_HAS_VARIANTS) {
            this.chooseManual(false);
        }
    },

    startWizard: function() {
        this.switchState('options-wizard-state');
        document.getElementById('hasVariantsToggle').checked = true;
    },

    chooseManual: function(animate = true) {
        this.switchState('variant-builder-container', animate);
        document.getElementById('hasVariantsToggle').checked = true;
        localStorage.setItem('storevo_product_mode', 'options');
    },

    chooseSimple: function(animate = true) {
        this.switchState('options-empty-state', animate);
        document.getElementById('hasVariantsToggle').checked = false;
        localStorage.setItem('storevo_product_mode', 'simple');
    },

    showTemplates: function() {
        this.switchState('vb-templates-panel');
    },

    applyTemplate: function(key) {
        localStorage.setItem('storevo_product_template', key);
        if (Storevo.VariantBuilder) {
            Storevo.VariantBuilder.applyTemplate(key, false);
        }
        this.chooseManual();
    },

    cancel: function() {
        this.switchState('options-empty-state');
        document.getElementById('hasVariantsToggle').checked = false;
        localStorage.setItem('storevo_product_mode', 'simple');
        localStorage.removeItem('storevo_product_template');

        if (Storevo.VariantBuilder) {
            Storevo.VariantBuilder.state.options = [{ name: 'Talla', values: [] }];
            Storevo.VariantBuilder.renderOptions();
        }
        if (Storevo.ProductForm && Storevo.ProductForm.clearTemplateSpecs) {
            Storevo.ProductForm.clearTemplateSpecs();
        }
    },

    switchState: function(targetId, animate = true) {
        const els = ['options-empty-state', 'options-wizard-state', 'vb-templates-panel', 'variant-builder-container'];
        els.forEach(id => {
            if (id !== targetId) {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.add('hidden', 'opacity-0');
                    el.classList.remove('opacity-100', 'translate-y-0');
                }
            }
        });

        const target = document.getElementById(targetId);
        if (target) {
            target.classList.remove('hidden');
            if (animate) {
                target.classList.add('opacity-0');
                setTimeout(() => {
                    target.classList.remove('opacity-0', '-translate-y-2');
                    target.classList.add('opacity-100', 'translate-y-0');
                }, 30);
            } else {
                target.classList.remove('opacity-0', '-translate-y-2');
                target.classList.add('opacity-100', 'translate-y-0');
            }
        }
    },

    renderTemplates: function() {
        const grid = document.getElementById('vb-templates-grid');
        if (!grid || !Storevo.VariantBuilder) return;

        const templates = Storevo.VariantBuilder.TEMPLATES;
        grid.innerHTML = Object.keys(templates).map(key => {
            const t = templates[key];
            return `
                <button type="button" onclick="Storevo.ProductWizard.applyTemplate('${key}')" class="flex flex-col items-center justify-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-4 hover:border-storevo-500 hover:bg-slate-800/60 transition-all group">
                    <span class="text-2xl group-hover:scale-110 transition-transform">${t.icon}</span>
                    <span class="text-xs font-bold text-slate-300 group-hover:text-storevo-400 transition-colors">${t.label}</span>
                </button>
            `;
        }).join('');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.ProductWizard.init());
} else {
    Storevo.ProductWizard.init();
}