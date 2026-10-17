window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Navbar = {
    // Distancia mínima (px) que se deja entre un desplegable y el borde de la pantalla
    EDGE_MARGIN: 12,

    // ---------------------------------------------------------------
    // Menú lateral (móvil y diseño Minimalista)
    // ---------------------------------------------------------------
    initMobileMenu: function () {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        const closeBtn = document.getElementById('mobile-menu-close');

        if (!btn || !menu) return;

        const openMenu = () => {
            menu.classList.remove('-translate-x-full');
            if (backdrop) {
                backdrop.classList.remove('hidden');
                requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
            }
            document.body.classList.add('overflow-hidden');
        };

        const closeMenu = () => {
            menu.classList.add('-translate-x-full');
            if (backdrop) {
                backdrop.classList.add('opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 300);
            }
            document.body.classList.remove('overflow-hidden');
        };

        btn.addEventListener('click', openMenu);
        if (closeBtn) closeBtn.addEventListener('click', closeMenu);
        if (backdrop) backdrop.addEventListener('click', closeMenu);
    },

    // ---------------------------------------------------------------
    // Utilidades de posición
    // ---------------------------------------------------------------
    viewportWidth: function () {
        return document.documentElement.clientWidth || window.innerWidth;
    },

    /**
     * Mantiene dentro de la pantalla un panel absoluto (mega menú o cascada).
     * El panel queda alineado al borde izquierdo de `anchor` y se desplaza hacia
     * la izquierda solo lo necesario. Se llama justo antes de abrirlo.
     */
    fitPanel: function (panel, anchor) {
        if (!panel || !anchor) return;

        const margin = this.EDGE_MARGIN;
        panel.style.left = '0px';

        const vw = this.viewportWidth();
        const width = panel.offsetWidth;
        const anchorLeft = anchor.getBoundingClientRect().left;

        let shift = 0;
        if (anchorLeft + width > vw - margin) {
            shift = (vw - margin) - (anchorLeft + width);
        }
        if (anchorLeft + shift < margin) {
            shift = margin - anchorLeft;
        }
        panel.style.left = Math.round(shift) + 'px';
    },

    // ---------------------------------------------------------------
    // Desplegables de categorías (.nav-parent > .sv-nav__dropdown > .sv-nav__flyout)
    // ---------------------------------------------------------------
    placeDropdown: function (parent) {
        const dropdown = parent.querySelector(':scope > .sv-nav__dropdown');
        if (!dropdown) return;

        const margin = this.EDGE_MARGIN;
        const vw = this.viewportWidth();

        dropdown.classList.remove('is-align-right');

        const rect = parent.getBoundingClientRect();
        const width = dropdown.offsetWidth;
        const spaceRight = vw - margin - rect.left;   // si se alinea al borde izquierdo del padre
        const spaceLeft = rect.right - margin;        // si se alinea al borde derecho del padre

        if (width > spaceRight && spaceLeft > spaceRight) {
            dropdown.classList.add('is-align-right');
        }

        // Los flyouts se calculan después de alinear el desplegable que los contiene
        dropdown.querySelectorAll('.nav-flyout-parent').forEach((fp) => this.placeFlyout(fp));
    },

    placeFlyout: function (flyoutParent) {
        const flyout = flyoutParent.querySelector(':scope > .sv-nav__flyout');
        if (!flyout) return;

        const margin = this.EDGE_MARGIN;
        const vw = this.viewportWidth();

        flyout.classList.remove('is-flip');

        const rect = flyoutParent.getBoundingClientRect();
        const width = flyout.offsetWidth;
        const spaceRight = vw - margin - rect.right;
        const spaceLeft = rect.left - margin;

        if (width > spaceRight && spaceLeft > spaceRight) {
            flyout.classList.add('is-flip');
        }
    },

    initDropdownEdgeGuard: function () {
        const nav = document.getElementById('storeNavbar');
        if (!nav || nav.dataset.edgeGuard === 'true') return;
        nav.dataset.edgeGuard = 'true';

        nav.addEventListener('mouseover', (e) => {
            const parent = e.target && e.target.closest ? e.target.closest('.nav-parent') : null;
            if (!parent) return;
            // Solo cuando el mouse entra al grupo, no en cada movimiento interno
            if (e.relatedTarget && parent.contains(e.relatedTarget)) return;
            this.placeDropdown(parent);
        });
    },

    init: function () {
        this.initMobileMenu();
        this.initDropdownEdgeGuard();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.UI.Navbar.init());
} else {
    Storevo.UI.Navbar.init();
}