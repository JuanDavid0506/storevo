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

        if (!btn || !menu || btn.dataset.mobileMenuBound === 'true') return;
        btn.dataset.mobileMenuBound = 'true';

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
     * Mantiene dentro de la pantalla cualquier panel absoluto (mega menú, split, strip, acordeón, flyout o cascada).
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
    // Posicionamiento de paneles y sub-cajas laterales (.sv-nav__flyout)
    // ---------------------------------------------------------------
    placeDropdown: function (parent) {
        if (!parent) return;

        const customPanel = parent._customPanel || parent.querySelector(':scope > .sv-dropdown-panel');
        if (customPanel) {
            this.fitPanel(customPanel, parent);
            customPanel.querySelectorAll('.nav-flyout-parent').forEach((fp, idx) => {
                fp.style.setProperty('--stagger-idx', String(idx));
                this.placeFlyout(fp);
            });
            return;
        }

        const dropdown = parent.querySelector(':scope > .sv-nav__dropdown');
        if (dropdown) {
            const margin = this.EDGE_MARGIN;
            const vw = this.viewportWidth();

            dropdown.classList.remove('is-align-right');

            const rect = parent.getBoundingClientRect();
            const width = dropdown.offsetWidth;
            const spaceRight = vw - margin - rect.left;
            const spaceLeft = rect.right - margin;

            if (width > spaceRight && spaceLeft > spaceRight) {
                dropdown.classList.add('is-align-right');
            }

            dropdown.querySelectorAll('.nav-flyout-parent').forEach((fp, idx) => {
                fp.style.setProperty('--stagger-idx', String(idx));
                this.placeFlyout(fp);
            });
        }
    },

    placeFlyout: function (flyoutParent) {
        const flyout = flyoutParent.querySelector(':scope > .sv-nav__flyout');
        if (!flyout) return;

        const margin = this.EDGE_MARGIN;
        const vw = this.viewportWidth();

        flyout.classList.remove('is-flip');

        const rect = flyoutParent.getBoundingClientRect();
        const width = flyout.offsetWidth || 220;
        const spaceRight = vw - margin - rect.right;
        const spaceLeft = rect.left - margin;

        if (width > spaceRight && spaceLeft > spaceRight) {
            flyout.classList.add('is-flip');
        }
    },

    bindFlyoutIntent: function (rootContainer) {
        if (!rootContainer) return;
        rootContainer.querySelectorAll('.nav-flyout-parent').forEach((fp) => {
            if (fp.dataset.flyoutBound === 'true') return;
            fp.dataset.flyoutBound = 'true';

            let flyoutTimer = null;
            fp.addEventListener('mouseenter', () => {
                clearTimeout(flyoutTimer);
                const siblings = fp.parentElement ? Array.from(fp.parentElement.querySelectorAll(':scope > .nav-flyout-parent')) : [];
                siblings.forEach(s => {
                    if (s !== fp) s.classList.remove('is-flyout-open');
                });
                this.placeFlyout(fp);
                fp.classList.add('is-flyout-open');
            });
            fp.addEventListener('mouseleave', () => {
                flyoutTimer = setTimeout(() => {
                    fp.classList.remove('is-flyout-open');
                }, 140);
            });
        });
    },

    initDropdownEdgeGuard: function () {
        const nav = document.getElementById('storeNavbar');
        if (!nav) return;

        this.bindFlyoutIntent(nav);

        if (nav.dataset.edgeGuard === 'true') return;
        nav.dataset.edgeGuard = 'true';

        nav.addEventListener('mouseover', (e) => {
            const parent = e.target && e.target.closest ? e.target.closest('.nav-parent') : null;
            if (!parent) return;
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