window.Storevo = window.Storevo || {};

Storevo.Wishlist = {
    init: function() {},

    toggleItem: function(btn, slug, productId) {
        if (btn.classList.contains('pointer-events-none')) return;
        btn.classList.add('pointer-events-none');

        const emptyIcon = btn.querySelector('.icon-heart-empty');
        const filledIcon = btn.querySelector('.icon-heart-filled');
        const formData = new FormData();
        formData.append('productId', productId);

        fetch(`/s/${slug}/wishlist/toggle-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    if (data.added) {
                        if (emptyIcon) emptyIcon.classList.add('hidden');
                        if (filledIcon) filledIcon.classList.remove('hidden');
                        btn.classList.remove('bg-white/90', 'text-slate-400');
                        btn.classList.add('bg-white', 'border-red-500', 'text-red-500');
                    } else {
                        if (filledIcon) filledIcon.classList.add('hidden');
                        if (emptyIcon) emptyIcon.classList.remove('hidden');
                        btn.classList.remove('bg-white', 'border-red-500', 'text-red-500');
                        btn.classList.add('bg-white/90', 'text-slate-400');

                        // Si el usuario está en la página de Favoritos (/wishlist), retirar la tarjeta con transición suave
                        if (/\/wishlist\/?$/.test(window.location.pathname)) {
                            const card = btn.closest('.product-card');
                            if (card) {
                                card.style.transition = 'opacity 180ms ease, transform 180ms ease';
                                card.style.opacity = '0';
                                card.style.transform = 'scale(0.95)';
                                setTimeout(() => {
                                    card.remove();
                                    const remaining = document.querySelectorAll('#storevoMainContent .product-card');
                                    if (remaining.length === 0 && window.Storevo && Storevo.Router) {
                                        Storevo.Router.navigate(window.location.href, { replace: true });
                                    }
                                }, 180);
                            }
                        }
                    }
                    Storevo.Wishlist.updateGlobalCounter(data.wishlistCount);
                    if (Storevo.Router && typeof Storevo.Router.invalidateCache === 'function') {
                        Storevo.Router.invalidateCache();
                    }
                    Storevo.UI.Toast.show(data.message, 'success');
                }
            }).finally(() => btn.classList.remove('pointer-events-none'));
    },

    updateGlobalCounter: function(value) {
        const badge = document.getElementById('navWishlistCounter');
        if (badge) badge.textContent = value;
    }
};

window.toggleWishlistItem = Storevo.Wishlist.toggleItem;
window.updateWishlistGlobalCounter = Storevo.Wishlist.updateGlobalCounter;