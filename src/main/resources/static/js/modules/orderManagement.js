window.Storevo = window.Storevo || {};

Storevo.OrderManagement = {
    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        const statusForm = document.getElementById('status-update-form');
        const noteForm = document.getElementById('internal-note-form');
        const shipmentForm = document.getElementById('shipment-form');

        if (statusForm) {
            statusForm.addEventListener('submit', (e) => this.handleStatusUpdate(e));
        }

        if (noteForm) {
            noteForm.addEventListener('submit', (e) => this.handleAddNote(e));
        }

        if (shipmentForm) {
            shipmentForm.addEventListener('submit', (e) => this.handleShipmentSubmit(e));
        }
    },

    getApiBaseUrl: function() {
        const slug = document.getElementById('store-slug').value;
        const orderId = document.getElementById('order-id').value;
        return `/dashboard/${slug}/orders/${orderId}`;
    },

    // --- LÓGICA DEL MODAL DE DESPACHO (FASE 3.2) ---
    openShipmentModal: function() {
        const modal = document.getElementById('shipment-modal');
        const content = document.getElementById('shipment-modal-content');

        modal.classList.remove('hidden');
        // Pequeño delay para permitir que el display:block se aplique antes de animar opacidad
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
    },

    closeShipmentModal: function() {
        const modal = document.getElementById('shipment-modal');
        const content = document.getElementById('shipment-modal-content');

        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');

        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('shipment-form').reset();
        }, 300); // Tiempo de la transición Tailwind
    },

    handleShipmentSubmit: async function(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const formData = new FormData(e.target);

        const params = new URLSearchParams();
        for (const pair of formData) {
            params.append(pair[0], pair[1]);
        }

        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.getApiBaseUrl()}/shipments-ajax`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            const data = await response.json();

            if (data.success) {
                if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(data.message, 'success');
                this.closeShipmentModal();

                // Recarga limpia para inyectar la tarjeta de logística, el timeline y el nuevo estado
                setTimeout(() => window.location.reload(), 1500);
            } else {
                if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(data.message, 'error');
            }
        } catch (error) {
            if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Error de conexión', 'error');
        } finally {
            this.setLoading(submitBtn, false, 'Generar Envío Seguro');
        }
    },
    // -----------------------------------------------

    handleStatusUpdate: async function(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const statusSelect = document.getElementById('new-status');
        const statusVal = statusSelect.value;

        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.getApiBaseUrl()}/status-ajax`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `status=${encodeURIComponent(statusVal)}`
            });

            const data = await response.json();

            if (data.success) {
                if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(data.message, 'success');

                const badge = document.getElementById('main-status-badge');
                if(badge && data.newBadge && data.newName) {
                    badge.className = `text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full border ${data.newBadge}`;
                    badge.textContent = data.newName;
                }

                this.prependToTimeline(data.history);

                setTimeout(() => window.location.reload(), 1200);

            } else {
                if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(data.message, 'error');
            }
        } catch (error) {
            if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Error de conexión', 'error');
        } finally {
            this.setLoading(submitBtn, false, '<span>Actualizar Flujo</span>');
        }
    },

    handleAddNote: async function(e) {
        e.preventDefault();
        const textarea = document.getElementById('internal-note-text');
        const note = textarea.value.trim();
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!note) {
            if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('La nota no puede estar vacía', 'warning');
            return;
        }

        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.getApiBaseUrl()}/notes-ajax`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `note=${encodeURIComponent(note)}`
            });

            const data = await response.json();

            if (data.success) {
                if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(data.message, 'success');
                textarea.value = '';
                this.prependToNotes(data.note);
            } else {
                if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show(data.message, 'error');
            }
        } catch (error) {
            if(Storevo.UI && Storevo.UI.Toast) Storevo.UI.Toast.show('Error al guardar la nota', 'error');
        } finally {
            this.setLoading(submitBtn, false, 'Guardar Nota');
        }
    },

    prependToTimeline: function(historyObj) {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        const div = document.createElement('div');
        div.className = 'mb-8 ml-6 relative timeline-item animate-fade-in-up';

        let iconHtml = '';
        let titleText = '';

        if (historyObj.eventType === 'STATE_CHANGE') {
            titleText = 'Estado Actualizado';
            iconHtml = `<span class="absolute flex items-center justify-center w-6 h-6 bg-slate-900 rounded-full -left-[35px] ring-4 ring-slate-900 text-storevo-400 border border-storevo-500/50"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>`;
        } else {
            titleText = 'Sistema';
            iconHtml = `<span class="absolute flex items-center justify-center w-6 h-6 bg-slate-900 rounded-full -left-[35px] ring-4 ring-slate-900 text-slate-400 border border-slate-700"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></span>`;
        }

        div.innerHTML = `
            ${iconHtml}
            <div class="flex flex-col">
                <span class="text-xs text-slate-500 font-medium mb-1">${historyObj.createdAt} • Origen: ${historyObj.origin}</span>
                <h4 class="text-sm font-bold text-white mb-0.5">${titleText}</h4>
                <p class="text-sm text-slate-400">${historyObj.description}</p>
            </div>
        `;

        container.insertBefore(div, container.firstChild);
    },

    prependToNotes: function(noteObj) {
        const container = document.getElementById('notes-container');
        if (!container) return;

        const noNotesMsg = document.getElementById('no-notes-msg');
        if (noNotesMsg) noNotesMsg.remove();

        const div = document.createElement('div');
        div.className = 'bg-slate-950 p-4 rounded-lg border border-slate-800/50 animate-fade-in-up';

        div.innerHTML = `
            <p class="text-sm text-slate-300 mb-2">${noteObj.note}</p>
            <p class="text-xs font-mono text-slate-500">${noteObj.createdAt} • ${noteObj.createdBy}</p>
        `;

        container.insertBefore(div, container.firstChild);
    },

    setLoading: function(btn, isLoading, originalText = '') {
        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-not-allowed');
            btn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-70', 'cursor-not-allowed');
            btn.innerHTML = originalText;
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.OrderManagement.init());
} else {
    Storevo.OrderManagement.init();
}