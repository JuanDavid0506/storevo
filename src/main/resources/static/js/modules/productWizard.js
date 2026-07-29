window.Storevo = window.Storevo || {};

Storevo.ProductWizard = {
    templates: [
        { id: 'ropa', name: 'Ropa', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', desc: 'Camisetas, pantalones, vestidos...' },
        { id: 'calzado', name: 'Calzado', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', desc: 'Zapatos, tenis, botas...' },
        { id: 'perfume', name: 'Perfumes', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', desc: 'Lociones, fragancias, cremas...' },
        { id: 'accesorios', name: 'Accesorios', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Gafas, relojes, anillos...' },
        { id: 'tecnologia', name: 'Tecnología', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', desc: 'Celulares, tablets, laptops...' },
        { id: 'personalizado', name: 'Personalizado', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', desc: 'Empieza desde cero' }
    ],

    // Paso 1: Activar variantes -> Oculta el estado vacío y muestra (Manual o Plantilla)
    startWizard: function() {
        document.getElementById('options-empty-state').classList.add('hidden');
        const wizardState = document.getElementById('options-wizard-state');
        wizardState.classList.remove('hidden');
        setTimeout(() => wizardState.classList.remove('opacity-0'), 10);

        document.getElementById('vb-templates-panel').classList.add('hidden', 'opacity-0');
        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }
    },

    // Quitar variantes: Vuelve al estado vacío
    cancel: function() {
        document.getElementById('options-empty-state').classList.remove('hidden');
        document.getElementById('options-wizard-state').classList.add('hidden', 'opacity-0');
        document.getElementById('vb-templates-panel').classList.add('hidden', 'opacity-0');

        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }

        if(Storevo.VariantBuilder) {
            Storevo.VariantBuilder.options = [];
            Storevo.VariantBuilder.variants = []; // Limpiamos la tabla
            Storevo.VariantBuilder.renderOptions();
            const tableContainer = document.getElementById('vb-table-container');
            if(tableContainer) tableContainer.classList.add('hidden');
        }
    },

    // Paso 2: Mostrar grid de plantillas
    showTemplates: function() {
        document.getElementById('options-wizard-state').classList.add('hidden', 'opacity-0');

        // Si hay un banner de éxito previo, lo eliminamos
        this.removeBanner();

        const panel = document.getElementById('vb-templates-panel');
        panel.classList.remove('hidden');
        setTimeout(() => panel.classList.remove('opacity-0'), 10);
        this.renderTemplates();

        // Ocultar el constructor si estaba visible (Por si dio clic en "Cambiar plantilla")
        const builder = document.getElementById('variant-builder-container');
        if(builder) {
            builder.classList.add('opacity-0');
            setTimeout(() => builder.classList.add('hidden'), 200);
        }
    },

    // Paso 2 (Alternativo): Configuración manual
    chooseManual: function() {
        this.applyTemplate('personalizado', false); // false = No mostrar banner
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

    // Paso 3: Aplicar valores al constructor SIN generar variantes automáticamente
    applyTemplate: function(templateId, showBanner = true) {
        document.getElementById('options-wizard-state').classList.add('hidden', 'opacity-0');
        document.getElementById('vb-templates-panel').classList.add('hidden', 'opacity-0');

        const builder = document.getElementById('variant-builder-container');
        builder.classList.remove('hidden');
        setTimeout(() => builder.classList.remove('opacity-0'), 10);

        if (!Storevo.VariantBuilder) return;

        // 1. Limpiamos cualquier opción y variante anterior
        Storevo.VariantBuilder.options = [];
        Storevo.VariantBuilder.variants = [];

        // 2. Ocultamos la tabla de variantes para no forzar la generación automática
        const tableContainer = document.getElementById('vb-table-container');
        if(tableContainer) tableContainer.classList.add('hidden');

        const t = this.templates.find(x => x.id === templateId);

        // 3. Rellenamos las opciones según el diseño exacto que pediste
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

        // 4. Inyectamos el Banner de Éxito
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