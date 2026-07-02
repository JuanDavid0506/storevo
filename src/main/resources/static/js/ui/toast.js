window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Toast = {
    show: function(message, type = 'success') {
        const toast = document.createElement('div');
        let bgColor = 'bg-slate-900';
        let icon = `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

        if (type === 'error') {
            bgColor = 'bg-red-500';
            icon = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        } else if (type === 'warning') {
            bgColor = 'bg-orange-500';
            icon = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
        }

        toast.className = `fixed bottom-6 right-6 ${bgColor} text-white px-5 py-4 rounded-xl shadow-2xl z-[100] transform transition-all duration-300 translate-y-full opacity-0 flex items-center gap-3 text-sm font-bold`;
        toast.innerHTML = `${icon} <span>${message}</span>`;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-y-full', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Puente de Retrocompatibilidad para vistas que aún no usan el namespace
window.showToast = Storevo.UI.Toast.show;