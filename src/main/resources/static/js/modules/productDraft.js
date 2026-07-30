window.Storevo = window.Storevo || {};

Storevo.ProductDraft = {
    // Generamos una llave única (ahora solo nos importa el "new")
    getDraftKey: function() {
        return `storevo_draft_product_new`;
    },

    init: function() {
        this.form = document.getElementById('product-form');
        if (!this.form) return;

        // --- LA REGLA DE ORO: Solo funcionar al crear un producto nuevo ---
        if (typeof window.IS_NEW_PRODUCT !== 'undefined' && !window.IS_NEW_PRODUCT) {
            console.log("Modo edición. Sistema de borradores locales desactivado.");
            return; // Salimos inmediatamente. No guardamos ni leemos borradores.
        }
        // ------------------------------------------------------------------

        this.draftKey = this.getDraftKey();
        this.saveTimeout = null;

        // 1. Revisar si hay un borrador local guardado al cargar la página
        this.checkDraft();

        // 2. Escuchar CUALQUIER cambio en el formulario para guardar en silencio
        this.form.addEventListener('input', () => this.scheduleSave());
        this.form.addEventListener('change', () => this.scheduleSave());

        // 3. Limpiar el borrador si el formulario se envía exitosamente a la Base de Datos
        this.form.addEventListener('submit', () => this.clearDraft());
    },

    scheduleSave: function() {
        // Espera 1.5 segundos de inactividad para no disparar el guardado con cada letra
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveDraft(), 1500);
    },

    saveDraft: function() {
        const formData = new FormData(this.form);
        const draft = {};

        // Convertimos los datos del formulario a un objeto JSON
        for (let [key, value] of formData.entries()) {
            // Ignoramos las imágenes (No se pueden ni deben guardar en LocalStorage)
            if (value instanceof File) continue;

            // Si hay varios campos con el mismo nombre (ej: Ficha Técnica), los agrupamos en un Array
            if (draft[key]) {
                if (!Array.isArray(draft[key])) draft[key] = [draft[key]];
                draft[key].push(value);
            } else {
                draft[key] = value;
            }
        }

        draft._timestamp = new Date().getTime(); // Sello de tiempo
        localStorage.setItem(this.draftKey, JSON.stringify(draft));

        // Feedback visual microscópico en el Header
        const indicator = document.querySelector('header span.bg-slate-800');
        if (indicator && indicator.innerText.includes('Borrador')) {
            indicator.innerHTML = '<span class="text-storevo-400">✓ Guardado local</span>';
            setTimeout(() => {
                indicator.innerHTML = 'Borrador sin guardar';
            }, 2000);
        }
    },

    checkDraft: function() {
        const draftString = localStorage.getItem(this.draftKey);
        if (!draftString) return;

        const draft = JSON.parse(draftString);
        const hoursOld = (new Date().getTime() - draft._timestamp) / (1000 * 60 * 60);

        // Si el borrador local es más viejo de 24 horas, se auto-destruye
        if (hoursOld > 24) {
            this.clearDraft();
            return;
        }

        this.showRestoreBanner(draft);
    },

    showRestoreBanner: function(draft) {
        const banner = document.createElement('div');
        banner.id = 'draft-restore-banner';
        banner.className = 'bg-slate-800 border border-storevo-500/30 text-slate-200 p-4 rounded-2xl mb-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all';

        const date = new Date(draft._timestamp);
        const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        banner.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-storevo-500/20 p-2 rounded-full text-storevo-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                    <p class="text-sm font-bold text-white">Tienes datos sin guardar</p>
                    <p class="text-xs text-slate-400 mt-0.5">Detectamos una edición pausada hoy a las ${timeStr}. ¿Deseas recuperarla?</p>
                </div>
            </div>
            <div class="flex items-center gap-3 w-full sm:w-auto">
                <button type="button" id="btn-discard-draft" class="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-700 rounded-xl border border-slate-700 transition">Descartar</button>
                <button type="button" id="btn-restore-draft" class="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-storevo-500 hover:bg-storevo-600 rounded-xl shadow-lg shadow-storevo-500/20 transition">Recuperar datos</button>
            </div>
        `;

        // Lo inyectamos justo encima del formulario
        this.form.parentNode.insertBefore(banner, this.form);

        document.getElementById('btn-restore-draft').onclick = () => {
            this.restoreDraft(draft);
            banner.remove();
        };

        document.getElementById('btn-discard-draft').onclick = () => {
            this.clearDraft();
            banner.remove();
        };
    },

    restoreDraft: function(draft) {
        Object.keys(draft).forEach(key => {
            if (key === '_timestamp') return;

            const value = draft[key];

            // 1. Restaurar Ficha Técnica (Múltiples inputs dinámicos)
            if (Array.isArray(value) && key === 'attrKeys') {
                const container = document.getElementById('specsContainer');
                if(container && Storevo.ProductForm) {
                    Storevo.ProductForm.clearTemplateSpecs();
                    container.innerHTML = '';
                    value.forEach(() => Storevo.ProductForm.addSpecRow());

                    setTimeout(() => {
                        const keys = document.getElementsByName('attrKeys');
                        const vals = document.getElementsByName('attrValues');
                        value.forEach((v, i) => {
                            if(keys[i]) { keys[i].value = v; Storevo.ProductForm.autoResize(keys[i]); }
                            if(vals[i] && draft['attrValues'] && draft['attrValues'][i]) {
                                vals[i].value = draft['attrValues'][i];
                                Storevo.ProductForm.autoResize(vals[i]);
                            }
                        });
                    }, 50);
                }
                return;
            }

            // 2. Restaurar inputs simples (Textos, Precios, Stock)
            if (!Array.isArray(value)) {
                const element = this.form.querySelector(`[name="${key}"]`);
                if (element) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        element.checked = (element.value === value || value === 'on' || value === 'true');
                    } else {
                        element.value = value;
                        // Forzamos a que ProductUX actualice el preview, progreso y los separadores de miles
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        });

        // 3. Restaurar Categoría (Reconstruye los Chips visuales)
        if (draft.categoryId && Storevo.ProductForm) {
            Storevo.ProductForm.preselectCategory(draft.categoryId);
        }

        if (Storevo.UI && Storevo.UI.Toast) {
            Storevo.UI.Toast.show('Borrador recuperado con éxito', 'success');
        }

        // Ya no necesitamos el borrador en memoria porque está en pantalla
        this.clearDraft();
    },

    clearDraft: function() {
        localStorage.removeItem(this.draftKey);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Storevo.ProductDraft.init();
});