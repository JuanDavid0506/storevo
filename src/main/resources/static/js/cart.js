document.addEventListener('DOMContentLoaded', () => {
    // Busca todos los formularios de "Añadir a la bolsa"
    const addToCartForms = document.querySelectorAll('form[action$="/cart/add"]');

    addToCartForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitamos la redirección síncrona

            const formData = new FormData(form);
            const ajaxAction = form.action.replace('/cart/add', '/cart/add-ajax');

            try {
                // CORREGIDO: credentials: 'include' mantiene viva la sesión del CartManager
                const response = await fetch(ajaxAction, {
                    method: 'POST',
                    body: new URLSearchParams(formData),
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    // 1. Actualizar el contador global respetando tu HTML original
                    const cartBadge = document.getElementById('cart-counter-badge');
                    if (cartBadge) {
                        cartBadge.textContent = data.cartCount;
                    }

                    // 2. Mostrar confirmación visual discreta
                    showToast('¡Producto agregado a tu bolsa!');
                }
            } catch (error) {
                console.error('Error al agregar a la bolsa:', error);
                showToast('No se pudo agregar el producto.', true);
            }
        });
    });
});

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    const bgColor = isError ? 'bg-red-500' : 'bg-slate-900';
    const icon = isError
        ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
        : `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

    toast.className = `fixed bottom-6 right-6 ${bgColor} text-white px-5 py-3.5 rounded-xl shadow-xl z-50 transform transition-all duration-300 translate-y-full opacity-0 flex items-center gap-2.5 text-sm font-medium`;
    toast.innerHTML = `${icon} <span>${message}</span>`;

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-full', 'opacity-0'), 10);

    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}