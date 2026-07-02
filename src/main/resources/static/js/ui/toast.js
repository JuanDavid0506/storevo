window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Toast = {
    // REEMPLAZAR EL MÉTODO SHOW POR ESTE:
        show: function(message, type = 'success') {
                const toast = document.createElement('div');
                let bgColor = 'bg-slate-900';
                let icon = `<svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

                if (type === 'error') {
                    bgColor = 'bg-red-500';
                    icon = `<svg class="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
                } else if (type === 'warning') {
                    bgColor = 'bg-orange-500';
                    icon = `<svg class="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
                }

                // Contenedor principal con overflow-hidden para la barra de progreso
                toast.className = `fixed bottom-6 right-6 ${bgColor} text-white px-5 pt-4 pb-5 rounded-xl shadow-2xl z-[100] transform transition-all duration-300 translate-y-full opacity-0 flex flex-col min-w-[300px] overflow-hidden`;

                toast.innerHTML = `
                    <div class="flex items-center gap-3 w-full relative z-10">
                        ${icon}
                        <span class="flex-1 text-sm font-bold">${message}</span>
                        <button type="button" class="close-toast p-1 hover:bg-white/20 rounded-md transition-colors">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div class="absolute bottom-0 left-0 h-1 bg-black/20 w-full">
                        <div class="toast-progress h-full bg-white transition-all ease-linear" style="width: 100%; transition-duration: 3500ms;"></div>
                    </div>
                `;

                document.body.appendChild(toast);

                let hideTimeout;
                const hideToast = () => {
                    toast.classList.add('translate-y-full', 'opacity-0');
                    setTimeout(() => toast.remove(), 300);
                };

                // Cerrar con la X
                toast.querySelector('.close-toast').onclick = () => {
                    clearTimeout(hideTimeout);
                    hideToast();
                };

                // Animación de entrada y arranque de la barra de progreso
                requestAnimationFrame(() => {
                    toast.classList.remove('translate-y-full', 'opacity-0');
                    setTimeout(() => {
                        toast.querySelector('.toast-progress').style.width = '0%';
                    }, 50);
                });

                // Auto-cierre exacto a los 3.5 segundos
                hideTimeout = setTimeout(hideToast, 3500);
            }
};

// Puente de Retrocompatibilidad para vistas que aún no usan el namespace
window.showToast = Storevo.UI.Toast.show;