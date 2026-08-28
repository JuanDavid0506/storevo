window.Storevo = window.Storevo || {};

Storevo.Wishlist = {
    toggleItem: function(btn, slug, productId) {
        if(btn.classList.contains('pointer-events-none')) return;
        btn.classList.add('pointer-events-none');

        const emptyIcon = btn.querySelector('.icon-heart-empty');
        const filledIcon = btn.querySelector('.icon-heart-filled');
        const formData = new FormData();
        formData.append('productId', productId);

        fetch(`/s/${slug}/wishlist/toggle-ajax`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin' // <-- VITAL para no perder el estado
        })
            .then(r => r.json())
            .then(data => {
                if(data.success) {
                    if(data.added) {
                        emptyIcon.classList.add('hidden');
                        filledIcon.classList.remove('hidden');
                        btn.classList.remove('bg-white/90', 'text-slate-400');
                        btn.classList.add('bg-white', 'border-red-500', 'text-red-500');
                    } else {
                        filledIcon.classList.add('hidden');
                        emptyIcon.classList.remove('hidden');
                        btn.classList.remove('bg-white', 'border-red-500', 'text-red-500');
                        btn.classList.add('bg-white/90', 'text-slate-400');
                    }
                    Storevo.Wishlist.updateGlobalCounter(data.wishlistCount);
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