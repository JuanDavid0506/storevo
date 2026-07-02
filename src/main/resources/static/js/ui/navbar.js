window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Navbar = {
    initMobileMenu: function() {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        const closeBtn = document.getElementById('mobile-menu-close');

        if (!btn || !menu) return;

        const openMenu = () => {
            menu.classList.remove('-translate-x-full');
            if(backdrop) {
                backdrop.classList.remove('hidden');
                requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
            }
            document.body.classList.add('overflow-hidden');
        };

        const closeMenu = () => {
            menu.classList.add('-translate-x-full');
            if(backdrop) {
                backdrop.classList.add('opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 300);
            }
            document.body.classList.remove('overflow-hidden');
        };

        btn.addEventListener('click', openMenu);
        if(closeBtn) closeBtn.addEventListener('click', closeMenu);
        if(backdrop) backdrop.addEventListener('click', closeMenu);
    }
};

document.addEventListener('DOMContentLoaded', Storevo.UI.Navbar.initMobileMenu);