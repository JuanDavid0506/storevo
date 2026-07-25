window.Storevo = window.Storevo || {};

Storevo.ProductWizard = {
    init: function() {
        this.renderTemplates();

        // 1. GESTIÓN DEL DRAFT CONTEXT (La nueva arquitectura)
        const urlParams = new URLSearchParams(window.location.search);
        const isContinue = urlParams.get('continue') === 'true';

        if (isContinue && window.IS_NEW_PRODUCT) {
            // Si viene de "Crear otro", restauramos la memoria antes de renderizar
            if(Storevo.ProductDraft) Storevo.ProductDraft.restoreContext();
        } else if (!isContinue) {
            // Si es una visita limpia, matamos cualquier memoria vieja para evitar fantasmas
            if(Storevo.ProductDraft) Storevo.ProductDraft.clearContext();
            localStorage.setItem('storevo_product_mode', 'simple'); // Por defecto simple
        }

        // 2. INTERCEPTAR EL ENVÍO DEL FORMULARIO
        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                // e.submitter es el botón exacto que disparó el submit
                if (e.submitter && e.submitter.value === 'save_and_new') {
                    if(Storevo.ProductDraft) Storevo.ProductDraft.saveContext();
                } else {
                    if(Storevo.ProductDraft) Storevo.ProductDraft.clearContext();
                }
            });
        }

        // 3. DESPLIEGUE VISUAL
        if (window.IS_NEW_PRODUCT) {
            const lastMode = localStorage.getItem('storevo_product_mode');
            if (lastMode === 'options') {
                this.chooseManual(false); // Autodespliegue silencioso
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
        if (Storevo.VariantBuilder) {
            Storevo.VariantBuilder.applyTemplate(key);
        }
        // Tras aplicar la plantilla, lo mandamos al constructor
        this.chooseManual();
    },

    cancel: function() {
        this.switchState('options-empty-state');
        document.getElementById('hasVariantsToggle').checked = false;
        localStorage.setItem('storevo_product_mode', 'simple');

        // Limpiamos el constructor por si se arrepiente
        if (Storevo.VariantBuilder) {
            Storevo.VariantBuilder.state.options = [{ name: 'Talla', values: [] }];
            Storevo.VariantBuilder.renderOptions();
        }
    },

    // Utilidad Inteligente: Cambia entre los paneles manejando las transiciones sin choques
    switchState: function(targetId, animate = true) {
        const els = ['options-empty-state', 'options-wizard-state', 'vb-templates-panel', 'variant-builder-container'];

        // 1. Ocultamos TODOS los demás paneles de forma INMEDIATA
        // Esto elimina el "empujón" y el rebote feo en la página
        els.forEach(id => {
            if (id !== targetId) {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.add('hidden', 'opacity-0');
                    el.classList.remove('opacity-100', 'translate-y-0');
                }
            }
        });

        // 2. Mostramos el panel objetivo
        const target = document.getElementById(targetId);
        if (target) {
            target.classList.remove('hidden'); // Lo metemos al DOM

            if (animate) {
                // Forzamos estado inicial transparente
                target.classList.add('opacity-0');

                // Un retardo milimétrico para permitir un fade-in suave sin alterar la altura
                setTimeout(() => {
                    target.classList.remove('opacity-0', '-translate-y-2');
                    target.classList.add('opacity-100', 'translate-y-0');
                }, 30);
            } else {
                // Aparición sin animación (para cuando recarga la memoria)
                target.classList.remove('opacity-0', '-translate-y-2');
                target.classList.add('opacity-100', 'translate-y-0');
            }
        }
    },

    // Rellena la cuadrícula leyendo del diccionario de VariantBuilder
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

document.addEventListener('DOMContentLoaded', () => Storevo.ProductWizard.init());