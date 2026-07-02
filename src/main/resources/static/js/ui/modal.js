window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Modal = {
    initConfirmModals: function() {
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const confirmMessage = form.getAttribute('data-confirm');

            if (confirmMessage) {
                e.preventDefault();
                Storevo.UI.Modal.showConfirm(confirmMessage, () => {
                    form.removeAttribute('data-confirm'); // Evita un bucle infinito
                    form.submit();
                });
            }
        });
    },

    showConfirm: function(message, onConfirm) {
        const modalHtml = `
            <div id="storevo-confirm-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm opacity-0 transition-opacity duration-300">
                <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform scale-95 transition-transform duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 class="text-lg font-bold text-white">Confirmar acción</h3>
                    </div>
                    <p class="text-slate-400 text-sm mb-6">${message}</p>
                    <div class="flex justify-end gap-3">
                        <button type="button" id="storevo-modal-cancel" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition">Cancelar</button>
                        <button type="button" id="storevo-modal-confirm" class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-500/30 transition">Sí, estoy seguro</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('storevo-confirm-modal');
        const inner = modal.querySelector('div');

        // Anima la entrada
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            inner.classList.remove('scale-95');
        });

        const close = () => {
            modal.classList.add('opacity-0');
            inner.classList.add('scale-95');
            setTimeout(() => modal.remove(), 300);
        };

        document.getElementById('storevo-modal-cancel').onclick = close;
        document.getElementById('storevo-modal-confirm').onclick = () => {
            close();
            onConfirm();
        };
    }
};

document.addEventListener('DOMContentLoaded', Storevo.UI.Modal.initConfirmModals);