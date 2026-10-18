window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

/**
 * Aplica la configuración de navegación al #storeNavbar, calcula el tono
 * (texto claro u oscuro) y marca de inmediato el enlace activo sin FOUC.
 */
Storevo.UI.NavbarStyle = {
    isLightColor: function(hex) {
        let h = (hex || '').trim().replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return false;

        const toLinear = (v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        const r = toLinear(parseInt(h.substr(0, 2), 16));
        const g = toLinear(parseInt(h.substr(2, 2), 16));
        const b = toLinear(parseInt(h.substr(4, 2), 16));
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luminance > 0.42;
    },

    syncActiveLinks: function(targetUrlObj) {
        const nav = document.getElementById('storeNavbar');
        if (!nav) return;

        let currentUrl;
        try {
            currentUrl = targetUrlObj || new URL(window.location.href);
        } catch (e) {
            return;
        }

        const currentPath = currentUrl.pathname.replace(/\/+$/, '') || '/';
        const currentCat = currentUrl.searchParams.get('category') || '';
        const slugMatch = currentPath.match(/^\/s\/([^/?#]+)/);
        const slug = slugMatch ? slugMatch[1] : '';
        const homePath = slug ? `/s/${slug}` : '';
        const catalogPath = slug ? `/s/${slug}/catalog` : '';

        nav.querySelectorAll('.sv-nav__menu a.sv-nav__link, #mobile-menu a.sv-drawer__link').forEach(a => {
            const rawHref = a.getAttribute('href');
            if (!rawHref) return;
            let linkUrl;
            try {
                linkUrl = new URL(rawHref, window.location.origin);
            } catch (e) {
                return;
            }

            const linkPath = linkUrl.pathname.replace(/\/+$/, '') || '/';
            const linkCat = linkUrl.searchParams.get('category') || '';

            let isActive = false;
            if (homePath && linkPath === homePath) {
                isActive = (currentPath === homePath);
            } else if (catalogPath && linkPath === catalogPath) {
                isActive = linkCat
                    ? (currentPath === catalogPath && currentCat === linkCat)
                    : (currentPath === catalogPath && !currentCat);
            } else {
                isActive = (currentPath === linkPath);
            }

            a.classList.toggle('is-active', isActive);
            a.classList.remove('text-brand', 'font-bold');
            if (isActive) {
                a.setAttribute('aria-current', 'page');
            } else {
                a.removeAttribute('aria-current');
            }
        });
    },

    apply: function(styles) {
        const nav = document.getElementById('storeNavbar');
        if (!nav) return;

        if (styles) {
            if (styles.navbarLayout) nav.dataset.navLayout = styles.navbarLayout;
            if (styles.navbarStyle) nav.dataset.navStyle = styles.navbarStyle;
            if (styles.navbarLinkFormat) nav.dataset.navLinkFormat = styles.navbarLinkFormat;
            if (styles.navbarLinkHover) nav.dataset.navLinkHover = styles.navbarLinkHover;
            if (typeof styles.navbarSticky === 'boolean') nav.dataset.navSticky = String(styles.navbarSticky);
        }

        const style = nav.dataset.navStyle;
        if (style === 'primary' || style === 'secondary') {
            const cssVar = style === 'primary' ? '--brand-color' : '--brand-secondary';
            const color = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
            nav.dataset.navTone = this.isLightColor(color) ? 'light-bg' : 'dark-bg';
        } else {
            delete nav.dataset.navTone;
        }

        this.syncActiveLinks();
    }
};

// Se ejecuta apenas existe el navbar (el script va justo después del <nav>)
Storevo.UI.NavbarStyle.apply();