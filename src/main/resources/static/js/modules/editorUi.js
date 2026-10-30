/* ==========================================================================
   Storevo Editor UI — Sprite SVG (Lucide + Marcas Oficiales), Controles
   Visuales y Agrupación Inteligente de Secciones (Vanilla JS)
   ========================================================================== */
(function() {
    window.Storevo = window.Storevo || {};

    const LUCIDE_PATHS = {
        'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
        'package': '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
        'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
        'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
        'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
        'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
        'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
        'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
        'monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
        'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
        'calendar': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
        'type': '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
        'image': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
        'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
        'palette': '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
        'sliders': '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
        'layout': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
        'layers': '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
        'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
        'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
        'landmark': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
        'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
        'truck': '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
        'chat': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/>',
        'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'gift': '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
        'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        'card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
        'none': '<circle cx="12" cy="12" r="9"/><line x1="5.7" x2="18.3" y1="5.7" y2="18.3"/>',
        'align-left': '<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>',
        'align-center': '<line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/>',
        'chevron-down': '<path d="m6 9 6 6 6-6"/>',
        'share-2': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
        'megaphone': '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
        'grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
        'columns': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
        'timer': '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
        'bar-chart': '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
        'list-checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
        'video': '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>'
    };

    const BRAND_SVGS = {
        whatsapp: {
            color: '#25D366',
            bg: 'rgba(37, 211, 102, 0.14)',
            path: '<path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>'
        },
        instagram: {
            color: '#E4405F',
            bg: 'rgba(228, 64, 95, 0.14)',
            path: '<path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>'
        },
        tiktok: {
            color: 'var(--adm-text-heading)',
            bg: 'var(--adm-bg-muted)',
            path: '<path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>'
        },
        facebook: {
            color: '#1877F2',
            bg: 'rgba(24, 119, 242, 0.14)',
            path: '<path fill="currentColor" d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>'
        },
        youtube: {
            color: '#FF0000',
            bg: 'rgba(255, 0, 0, 0.14)',
            path: '<path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>'
        },
        maps: {
            color: '#4285F4',
            bg: 'rgba(66, 133, 244, 0.14)',
            path: '<path fill="currentColor" d="M12 2C7.589 2 4 5.589 4 9.995 3.971 16.44 11.696 21.784 12 22c0 0 8.029-5.56 8-12 0-4.411-3.589-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>'
        }
    };

    const FRIENDLY_LABELS = {
        hero_banner: {
            heroLayout: 'Diseño del banner',
            heroHeight: 'Altura en pantalla',
            slideCount: 'Cantidad de slides',
            autoplay: 'Cambio automático de slides',
            autoplaySpeed: 'Tiempo entre cada slide',
            alignment: 'Alineación del texto',
            overlayOpacity: 'Oscurecer imagen de fondo',
            bgColor: 'Color de fondo',
            textColor: 'Color del texto',
            imageUrl: 'Imagen del banner (PC y celular)',
            badgeText: 'Etiqueta superior (opcional)',
            title: 'Título principal',
            subtitle: 'Subtítulo descriptivo',
            buttonText: 'Texto del botón principal',
            buttonUrl: 'Destino del botón principal',
            secondaryButtonText: 'Texto del 2do botón (opcional)',
            secondaryButtonUrl: 'Destino del 2do botón'
        },
        announcement_bar: {
            headerPosition: 'Ubicación respecto al menú',
            text: 'Mensaje principal',
            text2: '2do mensaje rotativo (opcional)',
            text3: '3er mensaje rotativo (opcional)',
            animationMode: 'Efecto de transición',
            speed: 'Velocidad',
            barFormat: 'Estilo del texto',
            linkUrl: 'Enlace al hacer clic (opcional)',
            linkText: 'Texto del botón',
            linkStyle: 'Presentación del enlace',
            showArrows: 'Flechas laterales',
            dismissible: 'Botón para cerrar anuncio'
        },
        product_grid: {
            source: 'Productos a mostrar',
            defaultSort: 'Orden inicial',
            displayMode: 'Vista de los productos',
            columnsDesktop: 'Columnas en computador',
            limit: 'Cantidad máxima a mostrar'
        },
        featured_video: {
            videoUrl: 'Enlace de YouTube (Video o Short)',
            aspectRatio: 'Formato del video',
            coverImageUrl: 'Portada personalizada (opcional)',
            buttonUrl: 'Destino del botón'
        },
        visit_us: {
            mapUrl: 'Enlace de ubicación (Google Maps o Waze)',
            imageSide: 'Posición de la foto en PC'
        }
    };

    const ICON_PICKER_LABELS = {
        none: 'Sin ícono',
        shield: 'Seguridad',
        truck: 'Envíos',
        chat: 'Soporte',
        star: 'Calidad',
        clock: 'Rapidez',
        gift: 'Regalo',
        refresh: 'Garantía',
        card: 'Pagos'
    };

    const LAYOUT_CARD_PREVIEWS = {
        heroLayout: {
            classic: {
                title: 'Portada Clásica',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="2" y="2" width="44" height="22" rx="3" opacity=".22"/><rect x="12" y="7" width="24" height="3.5" rx="1"/><rect x="15" y="12" width="18" height="2" rx="1" opacity=".6"/><rect x="18" y="16" width="12" height="3.5" rx="1.5"/></svg>'
            },
            split: {
                title: 'Dividido Editorial',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="2" y="2" width="44" height="22" rx="3" opacity=".15"/><rect x="5" y="7" width="16" height="3" rx="1"/><rect x="5" y="11.5" width="14" height="2" rx="1" opacity=".6"/><rect x="5" y="15.5" width="10" height="3.5" rx="1"/><rect x="25" y="4.5" width="18" height="17" rx="2" opacity=".45"/></svg>'
            },
            compact: {
                title: 'Compacto',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="2" y="6" width="44" height="14" rx="3" opacity=".25"/><rect x="12" y="10" width="24" height="3" rx="1"/><rect x="18" y="14.5" width="12" height="2.5" rx="1" opacity=".7"/></svg>'
            }
        },
        cardLayout: {
            visual: {
                title: 'Con Foto',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="3" y="3" width="13" height="20" rx="2" opacity=".35"/><rect x="17.5" y="3" width="13" height="20" rx="2" opacity=".35"/><rect x="32" y="3" width="13" height="20" rx="2" opacity=".35"/><rect x="5" y="18" width="9" height="2.5" rx="1"/><rect x="19.5" y="18" width="9" height="2.5" rx="1"/><rect x="34" y="18" width="9" height="2.5" rx="1"/></svg>'
            },
            icon: {
                title: 'Con Ícono',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="3" y="4" width="13" height="18" rx="2" opacity=".18"/><circle cx="7.5" cy="9" r="2.2"/><rect x="5.5" y="15" width="8" height="2" rx="1"/><rect x="17.5" y="4" width="13" height="18" rx="2" opacity=".18"/><circle cx="22" cy="9" r="2.2"/><rect x="20" y="15" width="8" height="2" rx="1"/><rect x="32" y="4" width="13" height="18" rx="2" opacity=".18"/><circle cx="36.5" cy="9" r="2.2"/><rect x="34.5" y="15" width="8" height="2" rx="1"/></svg>'
            },
            pills: {
                title: 'Píldoras',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="3" y="9" width="13" height="8" rx="4" opacity=".35"/><rect x="17.5" y="9" width="13" height="8" rx="4" opacity=".35"/><rect x="32" y="9" width="13" height="8" rx="4" opacity=".35"/></svg>'
            }
        },
        statStyle: {
            cards: {
                title: 'Tarjetas Blancas',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="3" y="4" width="13" height="18" rx="2.5" opacity=".3"/><rect x="17.5" y="4" width="13" height="18" rx="2.5" opacity=".3"/><rect x="32" y="4" width="13" height="18" rx="2.5" opacity=".3"/></svg>'
            },
            minimal: {
                title: 'Minimalista',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="5" y="9" width="9" height="3" rx="1"/><rect x="5" y="14" width="9" height="2" rx="1" opacity=".45"/><rect x="19.5" y="9" width="9" height="3" rx="1"/><rect x="19.5" y="14" width="9" height="2" rx="1" opacity=".45"/><rect x="34" y="9" width="9" height="3" rx="1"/><rect x="34" y="14" width="9" height="2" rx="1" opacity=".45"/></svg>'
            },
            secondary: {
                title: 'Color Secundario',
                svg: '<svg viewBox="0 0 48 26" class="w-10 h-6" fill="currentColor"><rect x="2" y="4" width="44" height="18" rx="3" opacity=".6"/><rect x="6" y="10" width="8" height="3" rx="1" fill="#fff"/><rect x="20" y="10" width="8" height="3" rx="1" fill="#fff"/><rect x="34" y="10" width="8" height="3" rx="1" fill="#fff"/></svg>'
            }
        }
    };
    LAYOUT_CARD_PREVIEWS.badgeStyle = LAYOUT_CARD_PREVIEWS.statStyle;

    function stripLeadingEmoji(str) {
        if (!str) return '';
        return String(str)
            .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}★⚓✓↻]+\s*/gu, '')
            .trim();
    }

    const EditorUI = {
        icon: function(name, className) {
            const cls = className || 'w-4 h-4';
            const path = LUCIDE_PATHS[name] || LUCIDE_PATHS['sliders'];
            return '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
        },

        brandBadge: function(brandKey) {
            const b = BRAND_SVGS[brandKey];
            if (!b) return '';
            return '<span class="sv-ed-brand-badge" style="background:' + b.bg + ';color:' + b.color + ';"><svg viewBox="0 0 24 24" aria-hidden="true">' + b.path + '</svg></span>';
        },

        cleanOptionText: function(raw) {
            return stripLeadingEmoji(raw);
        },

        getFriendlyLabel: function(sectionType, fieldKey, rawLabel) {
            const secMap = FRIENDLY_LABELS[sectionType];
            if (secMap && secMap[fieldKey]) {
                return secMap[fieldKey];
            }
            const cleaned = stripLeadingEmoji(String(rawLabel || ''))
                .replace(/^(Slide\s+\d+|Tarjeta\s+\d+|Imagen\s+\d+|Foto(?:\s+destacada)?\s+\d+|Marca\s+\d+|Indicador\s+\d+|Beneficio\s+\d+|Paso\s+\d+)\s*:\s*/i, '');
            if (cleaned.indexOf('¿A dónde lleva el 2do botón') === 0) return 'Destino del 2do botón';
            if (cleaned.indexOf('¿A dónde lleva el botón') === 0) return 'Destino del botón';
            if (cleaned.indexOf('¿A dónde lleva al hacer clic') === 0) return 'Enlace al hacer clic';
            return cleaned;
        },

        decorateBrandLabel: function(labelEl, sectionType, fieldKey) {
            if (!labelEl) return;
            let brand = null;
            if (fieldKey === 'instagramUrl') brand = 'instagram';
            else if (fieldKey === 'tiktokUrl') brand = 'tiktok';
            else if (fieldKey === 'facebookUrl') brand = 'facebook';
            else if (fieldKey === 'showWhatsapp' || fieldKey === 'showWhatsappBtn' || (sectionType === 'whatsapp_cta' && (fieldKey === 'buttonText' || fieldKey === 'prefilledMessage'))) brand = 'whatsapp';
            else if (fieldKey === 'videoUrl') brand = 'youtube';
            else if (fieldKey === 'mapUrl') brand = 'maps';

            if (brand) {
                const text = labelEl.textContent;
                labelEl.classList.add('sv-ed-brand-label');
                labelEl.innerHTML = this.brandBadge(brand) + '<span>' + text + '</span>';
            }
        },

        enhanceCheckbox: function(checkLabelEl, chkEl, field) {
            if (!checkLabelEl || !chkEl) return;
            checkLabelEl.className = 'sv-ed-switch-card';
            chkEl.className = 'sr-only';

            const titleText = stripLeadingEmoji(field.label || 'Opción');
            const descText = stripLeadingEmoji(field.placeholder || '');

            const textsDiv = document.createElement('div');
            textsDiv.className = 'sv-ed-switch-texts';
            const tSpan = document.createElement('span');
            tSpan.className = 'sv-ed-switch-title';
            tSpan.textContent = titleText;
            textsDiv.appendChild(tSpan);

            if (descText && descText.toLowerCase() !== titleText.toLowerCase()) {
                const dSpan = document.createElement('span');
                dSpan.className = 'sv-ed-switch-desc';
                dSpan.textContent = descText;
                textsDiv.appendChild(dSpan);
            }

            const track = document.createElement('span');
            track.className = 'sv-ed-switch-track';
            track.setAttribute('aria-hidden', 'true');
            const thumb = document.createElement('span');
            thumb.className = 'sv-ed-switch-thumb';
            track.appendChild(thumb);

            checkLabelEl.innerHTML = '';
            checkLabelEl.appendChild(chkEl);
            checkLabelEl.appendChild(textsDiv);
            checkLabelEl.appendChild(track);
        },

        enhanceOverlayRange: function(wrapperEl, numberInput, currentVal, commitFn) {
            if (!wrapperEl || !numberInput) return;
            numberInput.classList.add('hidden');

            const clamp = function(v) {
                const n = parseInt(v, 10);
                return isNaN(n) ? 50 : Math.min(90, Math.max(0, n));
            };
            const initial = clamp(currentVal);

            const wrap = document.createElement('div');
            wrap.className = 'sv-ed-range-wrap';

            const range = document.createElement('input');
            range.type = 'range';
            range.min = '0';
            range.max = '90';
            range.step = '5';
            range.value = String(initial);
            range.className = 'sv-ed-range-input';

            const badge = document.createElement('span');
            badge.className = 'sv-ed-range-badge';
            badge.textContent = initial + '%';

            range.addEventListener('input', function() {
                badge.textContent = range.value + '%';
                numberInput.value = range.value;
            });
            range.addEventListener('change', function() {
                const val = clamp(range.value);
                numberInput.value = String(val);
                commitFn('overlayOpacity', val);
            });

            wrap.appendChild(range);
            wrap.appendChild(badge);
            wrapperEl.appendChild(wrap);
        },

        enhanceSelect: function(wrapperEl, selectEl, field) {
            if (!wrapperEl || !selectEl) return;
            const self = this;
            const key = String(field.key || '');
            const opts = field.options || [];

            Array.from(selectEl.options).forEach(function(o) {
                o.textContent = stripLeadingEmoji(o.textContent);
            });

            const isIconField = key.indexOf('item') === 0 && key.endsWith('Icon');
            if (isIconField) {
                selectEl.classList.add('hidden');
                const grid = document.createElement('div');
                grid.className = 'sv-ed-icon-grid';

                opts.forEach(function(opt) {
                    const val = String(opt.value);
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'sv-ed-icon-btn' + (String(selectEl.value) === val ? ' is-selected' : '');
                    const shortLbl = ICON_PICKER_LABELS[val] || stripLeadingEmoji(opt.label).split(' ')[0];
                    btn.innerHTML = self.icon(val, 'w-4 h-4') + '<span>' + shortLbl + '</span>';
                    btn.addEventListener('click', function() {
                        selectEl.value = val;
                        grid.querySelectorAll('.sv-ed-icon-btn').forEach(function(b) {
                            b.classList.toggle('is-selected', b === btn);
                        });
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                    grid.appendChild(btn);
                });

                wrapperEl.appendChild(grid);
                return;
            }

            if (LAYOUT_CARD_PREVIEWS[key]) {
                selectEl.classList.add('hidden');
                const map = LAYOUT_CARD_PREVIEWS[key];
                const cardsWrap = document.createElement('div');
                cardsWrap.className = 'sv-ed-layout-cards';
                cardsWrap.setAttribute('data-cols', String(Math.min(3, opts.length)));

                opts.forEach(function(opt) {
                    const val = String(opt.value);
                    const meta = map[val] || { title: stripLeadingEmoji(opt.label), svg: '' };
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'sv-ed-layout-card' + (String(selectEl.value) === val ? ' is-selected' : '');
                    btn.innerHTML = '<span class="sv-ed-layout-card-preview">' + meta.svg + '</span>' +
                        '<span class="sv-ed-layout-card-title">' + meta.title + '</span>';
                    btn.addEventListener('click', function() {
                        selectEl.value = val;
                        cardsWrap.querySelectorAll('.sv-ed-layout-card').forEach(function(b) {
                            b.classList.toggle('is-selected', b === btn);
                        });
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                    cardsWrap.appendChild(btn);
                });

                wrapperEl.appendChild(cardsWrap);
                return;
            }

            const SEGMENTED_KEYS = new Set([
                'alignment', 'textAlign', 'columnsDesktop', 'columns', 'displayMode',
                'imageSide', 'imageFit', 'aspectRatio', 'logoSize', 'speed',
                'autoplaySpeed', 'barFormat', 'mobileLayout', 'paymentStyle',
                'cardCount', 'headerPosition', 'onExpire',
                'layoutBgMode', 'layoutTone', 'layoutWidth', 'layoutVisibility'
            ]);

            if (SEGMENTED_KEYS.has(key) && opts.length >= 2 && opts.length <= 3) {
                this.mountSegmentedForSelect(wrapperEl, selectEl, key);
            }
        },

        mountSegmentedForSelect: function(wrapperEl, selectEl, keyHint) {
            if (!wrapperEl || !selectEl || selectEl.dataset.svSegMounted === 'true') return;
            // Nunca convertir en botones segmentados si el selector está en una rejilla de 2 o 3 columnas
            if (selectEl.closest('.grid-cols-2, .grid-cols-3')) return;

            const self = this;
            const key = String(keyHint || selectEl.id || '');
            const opts = Array.from(selectEl.options).map(function(o) {
                return { value: o.value, label: o.textContent };
            });
            if (opts.length < 2 || opts.length > 3) return;

            const shortenSegLabel = function(val, rawLbl) {
                const clean = stripLeadingEmoji(rawLbl);
                if (key === 'columnsDesktop' || key === 'columns' || key === 'style-detail-related-cols') return val + ' columnas';
                if (key === 'cardCount') return val + ' tarjetas';
                if (key === 'layoutBgMode') {
                    if (val === 'none') return 'Sin fondo';
                    if (val === 'solid') return 'Color sólido';
                    if (val === 'image') return 'Imagen';
                }
                if (key === 'layoutTone') {
                    return val === 'light' ? 'Texto oscuro' : 'Texto claro';
                }
                if (key === 'layoutWidth') {
                    return val === 'full' ? 'Ancho 100%' : 'Centrado';
                }
                if (key === 'layoutVisibility') {
                    if (val === 'desktop_only') return 'Solo PC';
                    if (val === 'mobile_only') return 'Solo celular';
                    return 'PC y celular';
                }
                if (key === 'style-navbar-brand-mode') {
                    if (val === 'logo') return 'Solo logo';
                    if (val === 'logo_text') return 'Logo + Nombre';
                    if (val === 'text') return 'Solo nombre';
                }
                const SHORT_MAP = {
                    'below_menu': 'Debajo del menú',
                    'above_menu': 'Arriba del menú',
                    'center': 'Centrado',
                    'left': 'Izquierda',
                    'right': 'Derecha',
                    'grid': 'Cuadrícula',
                    'carousel': 'Carrusel',
                    'contain': 'Completa',
                    'cover': 'Rellenar',
                    'flush': 'Borde a borde',
                    'inset': 'Con marco',
                    '16:9': 'Horizontal 16:9',
                    '9:16': 'Vertical 9:16',
                    'portrait': 'Vertical 4:5',
                    'square': 'Cuadrada 1:1',
                    'landscape': 'Horizontal 4:3',
                    'sm': 'Compacto',
                    'md': 'Mediano',
                    'lg': 'Grande',
                    'fast': 'Rápida',
                    'normal': 'Normal',
                    'slow': 'Pausada',
                    'compact': 'Compacta',
                    'uppercase': 'MAYÚSCULAS',
                    'stack': 'Apilados',
                    'cards': 'Tarjetas claras',
                    'secondary': 'Color secundario',
                    'hide': 'Ocultar sección',
                    'message': 'Mostrar aviso'
                };
                return SHORT_MAP[val] || clean.replace(/\s*\(.*?\)\s*/g, '').trim();
            };

            // Verificar que todas las etiquetas cortas quepan holgadamente según la cantidad de botones
            const maxAllowedChars = opts.length === 2 ? 18 : 13;
            const preparedOpts = opts.map(function(opt) {
                const shortText = shortenSegLabel(String(opt.value), opt.label);
                return {
                    value: String(opt.value),
                    fullLabel: stripLeadingEmoji(opt.label),
                    shortLabel: shortText
                };
            });

            const anyTooLong = preparedOpts.some(function(item) {
                return item.shortLabel.length > maxAllowedChars;
            });
            if (anyTooLong) return;

            selectEl.dataset.svSegMounted = 'true';
            selectEl.classList.add('hidden');

            const seg = document.createElement('div');
            seg.className = 'sv-ed-segmented';

            const buttons = [];
            const syncButtons = function() {
                const current = String(selectEl.value);
                buttons.forEach(function(item) {
                    item.btn.classList.toggle('is-selected', item.val === current);
                });
            };

            preparedOpts.forEach(function(opt) {
                const val = opt.value;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.title = opt.fullLabel;
                btn.className = 'sv-ed-seg-btn' + (String(selectEl.value) === val ? ' is-selected' : '');
                let iconHtml = '';
                const isAlignKey = (key === 'alignment' || key === 'textAlign');
                if (isAlignKey && val === 'left') iconHtml = self.icon('align-left', 'w-3.5 h-3.5');
                if (isAlignKey && val === 'center') iconHtml = self.icon('align-center', 'w-3.5 h-3.5');
                btn.innerHTML = iconHtml + '<span>' + opt.shortLabel + '</span>';
                btn.addEventListener('click', function() {
                    selectEl.value = val;
                    syncButtons();
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                });
                buttons.push({ val: val, btn: btn });
                seg.appendChild(btn);
            });

            const protoDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            if (protoDesc && protoDesc.get && protoDesc.set) {
                Object.defineProperty(selectEl, 'value', {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        return protoDesc.get.call(this);
                    },
                    set: function(v) {
                        protoDesc.set.call(this, v);
                        syncButtons();
                    }
                });
            }

            selectEl._syncSegmentedUI = syncButtons;
            wrapperEl.appendChild(seg);
        },

        organizeInspectorFields: function(containerEl, sec) {
            if (!containerEl || !sec) return;
            const self = this;
            const settings = sec.settings || {};

            const fieldNodes = new Map();
            Array.from(containerEl.children).forEach(function(ch) {
                const k = ch.getAttribute && ch.getAttribute('data-field-key');
                if (k) fieldNodes.set(k, ch);
            });
            if (fieldNodes.size === 0) return;

            const layoutDetails = containerEl.querySelector('details[data-acc="section-layout"]');
            const usedKeys = new Set();

            const createGroupDetails = function(title, subtitle, iconName, isOpen) {
                const details = document.createElement('details');
                details.className = 'sv-ed-group';
                if (isOpen) details.open = true;

                const summary = document.createElement('summary');
                summary.className = 'sv-ed-group-summary';
                summary.innerHTML =
                    '<div class="sv-ed-group-header-left">' +
                    '<span class="sv-ed-group-icon">' + self.icon(iconName) + '</span>' +
                    '<div class="sv-ed-group-titles">' +
                    '<span class="sv-ed-group-title">' + title + '</span>' +
                    (subtitle ? '<span class="sv-ed-group-subtitle">' + subtitle + '</span>' : '') +
                    '</div>' +
                    '</div>' +
                    '<svg class="sv-ed-group-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';

                const body = document.createElement('div');
                body.className = 'sv-ed-group-body';

                details.appendChild(summary);
                details.appendChild(body);
                return { details: details, body: body };
            };

            const appendKeysToTarget = function(keys, targetBody) {
                let count = 0;
                keys.forEach(function(k) {
                    const node = fieldNodes.get(k);
                    if (node && !usedKeys.has(k)) {
                        usedKeys.add(k);
                        targetBody.appendChild(node);
                        count++;
                    }
                });
                return count;
            };

            const buildTabbedGroup = function(cfg) {
                const grp = createGroupDetails(cfg.title, cfg.subtitle, cfg.iconName, cfg.isOpen);
                const shell = document.createElement('div');
                shell.className = 'sv-ed-tabs-shell';

                const nav = document.createElement('div');
                nav.className = 'sv-ed-tabs-nav';
                nav.setAttribute('role', 'tablist');

                const panesWrap = document.createElement('div');
                const tabBtns = [];
                const tabPanes = [];

                const activateTab = function(idx) {
                    tabBtns.forEach(function(b, i) {
                        const active = i === idx;
                        b.classList.toggle('is-active', active);
                        b.setAttribute('aria-selected', active ? 'true' : 'false');
                    });
                    tabPanes.forEach(function(p, i) {
                        p.classList.toggle('is-active', i === idx);
                    });
                };

                cfg.tabs.forEach(function(tabDef, idx) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.role = 'tab';
                    btn.className = 'sv-ed-tab-btn' + (idx === 0 ? ' is-active' : '');
                    const hasData = typeof tabDef.hasContent === 'function' ? tabDef.hasContent(settings) : false;
                    if (hasData) btn.classList.add('has-content');
                    btn.innerHTML = '<span class="sv-ed-tab-dot"></span><span>' + tabDef.label + '</span>';

                    const pane = document.createElement('div');
                    pane.className = 'sv-ed-tab-pane' + (idx === 0 ? ' is-active' : '');

                    tabDef.keys.forEach(function(k) {
                        const node = fieldNodes.get(k);
                        if (node && !usedKeys.has(k)) {
                            usedKeys.add(k);
                            pane.appendChild(node);
                        }
                    });

                    btn.addEventListener('click', function() { activateTab(idx); });
                    tabBtns.push(btn);
                    tabPanes.push(pane);
                    nav.appendChild(btn);
                    panesWrap.appendChild(pane);
                });

                const syncVisibleTabsByCount = function() {
                    if (!cfg.countSelectorKey) return;
                    const fallbackCount = sec.type === 'multi_banners' ? '2' : '1';
                    const maxActive = parseInt(settings[cfg.countSelectorKey] || fallbackCount, 10) || 1;
                    let activeTabHidden = false;
                    tabBtns.forEach(function(btn, idx) {
                        const visible = (idx + 1) <= maxActive;
                        btn.classList.toggle('hidden', !visible);
                        if (!visible && btn.classList.contains('is-active')) {
                            activeTabHidden = true;
                        }
                    });
                    nav.classList.toggle('hidden', maxActive <= 1 && sec.type === 'hero_banner');
                    if (activeTabHidden) activateTab(0);
                };

                if (cfg.countSelectorKey) {
                    const countWrap = fieldNodes.get(cfg.countSelectorKey);
                    const countSel = countWrap ? countWrap.querySelector('select') : null;
                    if (countSel) {
                        countSel.addEventListener('change', function() {
                            settings[cfg.countSelectorKey] = countSel.value;
                            syncVisibleTabsByCount();
                        });
                    }
                    syncVisibleTabsByCount();
                }

                shell.appendChild(nav);
                shell.appendChild(panesWrap);
                grp.body.appendChild(shell);
                return grp.details;
            };

            const groupsFragment = document.createDocumentFragment();

            if (sec.type === 'hero_banner') {
                const gDesign = createGroupDetails('Diseño, altura y carrusel', 'Estructura visual, cantidad de slides y colores', 'layout', true);
                appendKeysToTarget(['heroLayout', 'heroHeight', 'slideCount', 'autoplay', 'autoplaySpeed', 'alignment', 'overlayOpacity', 'bgColor', 'textColor'], gDesign.body);

                const splitNote = document.createElement('div');
                splitNote.className = 'sv-ed-callout-info' + (settings.heroLayout === 'split' ? '' : ' hidden');
                splitNote.textContent = 'En el diseño «Dividido Editorial», el texto se alinea a la izquierda junto a la imagen sin aplicar oscurecimiento sobre la foto.';
                gDesign.body.appendChild(splitNote);
                const layoutWrap = fieldNodes.get('heroLayout');
                const layoutSel = layoutWrap ? layoutWrap.querySelector('select') : null;
                if (layoutSel) {
                    layoutSel.addEventListener('change', function() {
                        splitNote.classList.toggle('hidden', layoutSel.value !== 'split');
                    });
                }
                groupsFragment.appendChild(gDesign.details);

                const slideTabs = [
                    {
                        label: 'Slide 1',
                        hasContent: function(s) { return Boolean(s.imageUrl || s.title); },
                        keys: ['imageUrl', 'badgeText', 'title', 'subtitle', 'buttonText', 'buttonUrl', 'secondaryButtonText', 'secondaryButtonUrl']
                    }
                ];
                for (let i = 2; i <= 5; i++) {
                    slideTabs.push({
                        label: 'Slide ' + i,
                        hasContent: function(s) { return Boolean(s['slide' + i + 'ImageUrl'] || s['slide' + i + 'Title']); },
                        keys: [
                            'slide' + i + 'ImageUrl', 'slide' + i + 'BadgeText', 'slide' + i + 'Title', 'slide' + i + 'Subtitle',
                            'slide' + i + 'ButtonText', 'slide' + i + 'ButtonUrl', 'slide' + i + 'SecondaryButtonText', 'slide' + i + 'SecondaryButtonUrl'
                        ]
                    });
                }
                groupsFragment.appendChild(buildTabbedGroup({
                    title: 'Contenido de los Slides',
                    subtitle: 'Imagen, textos y botones de cada slide',
                    iconName: 'image',
                    isOpen: true,
                    tabs: slideTabs,
                    countSelectorKey: 'slideCount'
                }));
            } else if (sec.type === 'multi_banners') {
                const gLayout = createGroupDetails('Distribución del mosaico', 'Cantidad de tarjetas y diseño en pantalla', 'layout', true);
                appendKeysToTarget(['cardCount', 'bannerLayout'], gLayout.body);
                groupsFragment.appendChild(gLayout.details);

                const cardTabs = [1, 2, 3, 4].map(function(i) {
                    return {
                        label: 'Tarjeta ' + i,
                        hasContent: function(s) { return Boolean(s['card' + i + 'ImageUrl'] || s['card' + i + 'Title']); },
                        keys: ['card' + i + 'ImageUrl', 'card' + i + 'Badge', 'card' + i + 'Title', 'card' + i + 'Subtitle', 'card' + i + 'ButtonText', 'card' + i + 'ButtonUrl', 'card' + i + 'BgColor']
                    };
                });
                groupsFragment.appendChild(buildTabbedGroup({
                    title: 'Tarjetas del mosaico',
                    subtitle: 'Configura la imagen, textos y color de cada tarjeta',
                    iconName: 'layers',
                    isOpen: true,
                    tabs: cardTabs,
                    countSelectorKey: 'cardCount'
                }));
            } else if (sec.type === 'stats_counter') {
                const gHead = createGroupDetails('Encabezado y apariencia', 'Título y estilo visual de las tarjetas', 'type', true);
                appendKeysToTarget(['title', 'subtitle', 'statStyle'], gHead.body);
                groupsFragment.appendChild(gHead.details);

                const statTabs = [1, 2, 3, 4].map(function(i) {
                    return {
                        label: 'Cifra ' + i,
                        hasContent: function(s) { return Boolean(s['item' + i + 'Value'] && s['item' + i + 'Label']); },
                        keys: ['item' + i + 'Icon', 'item' + i + 'Value', 'item' + i + 'Label']
                    };
                });
                groupsFragment.appendChild(buildTabbedGroup({
                    title: 'Indicadores (2 a 4 cifras)',
                    subtitle: 'Ícono, número y descripción de cada indicador',
                    iconName: 'sparkles',
                    isOpen: true,
                    tabs: statTabs
                }));
            } else if (sec.type === 'trust_badges') {
                const gStyle = createGroupDetails('Apariencia de la franja', 'Estilo de tarjetas y vista en celular', 'layout', true);
                appendKeysToTarget(['badgeStyle', 'mobileLayout'], gStyle.body);
                groupsFragment.appendChild(gStyle.details);

                const badgeTabs = [1, 2, 3, 4, 5, 6].map(function(i) {
                    return {
                        label: '#' + i,
                        hasContent: function(s) { return Boolean(s['item' + i + 'Title']); },
                        keys: ['item' + i + 'Icon', 'item' + i + 'Title', 'item' + i + 'Text']
                    };
                });
                groupsFragment.appendChild(buildTabbedGroup({
                    title: 'Beneficios y sellos (hasta 6)',
                    subtitle: 'Selecciona cada sello para editar su ícono y texto',
                    iconName: 'shield',
                    isOpen: true,
                    tabs: badgeTabs
                }));
            } else if (sec.type === 'gallery_lookbook') {
                const gHead = createGroupDetails('Encabezado y cuadrícula', 'Título, columnas y proporción de las fotos', 'layout', true);
                appendKeysToTarget(['title', 'subtitle', 'columns', 'imageAspect'], gHead.body);
                groupsFragment.appendChild(gHead.details);

                const lookbookTabs = [1, 2, 3, 4, 5, 6].map(function(i) {
                    return {
                        label: 'Foto ' + i,
                        hasContent: function(s) { return Boolean(s['item' + i + 'ImageUrl']); },
                        keys: ['item' + i + 'ImageUrl', 'item' + i + 'Caption', 'item' + i + 'LinkUrl']
                    };
                });
                groupsFragment.appendChild(buildTabbedGroup({
                    title: 'Fotografías del Lookbook (1 a 6)',
                    subtitle: 'Sube cada foto y asigna su texto o enlace opcional',
                    iconName: 'image',
                    isOpen: true,
                    tabs: lookbookTabs
                }));
            } else if (sec.type === 'brand_carousel') {
                const gCfg = createGroupDetails('Configuración de la vitrina', 'Título, modo automático/manual y formato', 'sliders', true);
                appendKeysToTarget(['title', 'subtitle', 'source', 'displayMode', 'logoSize', 'grayscale'], gCfg.body);
                groupsFragment.appendChild(gCfg.details);

                const brandTabs = [1, 2, 3, 4, 5, 6].map(function(i) {
                    return {
                        label: 'Marca ' + i,
                        hasContent: function(s) { return Boolean(s['item' + i + 'Name'] || s['item' + i + 'ImageUrl']); },
                        keys: ['item' + i + 'Name', 'item' + i + 'ImageUrl', 'item' + i + 'LinkUrl']
                    };
                });
                const brandTabsDetails = buildTabbedGroup({
                    title: 'Marcas manuales (1 a 6)',
                    subtitle: 'Nombre, logotipo y enlace de cada marca',
                    iconName: 'tag',
                    isOpen: String(settings.source || 'MANUAL').toUpperCase() !== 'AUTO',
                    tabs: brandTabs
                });
                brandTabsDetails.classList.toggle('hidden', String(settings.source || 'MANUAL').toUpperCase() === 'AUTO');
                const srcWrap = fieldNodes.get('source');
                const srcSel = srcWrap ? srcWrap.querySelector('select') : null;
                if (srcSel) {
                    srcSel.addEventListener('change', function() {
                        brandTabsDetails.classList.toggle('hidden', String(srcSel.value).toUpperCase() === 'AUTO');
                    });
                }
                groupsFragment.appendChild(brandTabsDetails);
            } else if (sec.type === 'social_showcase') {
                const gProfiles = createGroupDetails('Perfiles y encabezado', 'Enlaces a tus redes sociales y textos', 'share-2', true);
                appendKeysToTarget(['handleText', 'title', 'subtitle', 'instagramUrl', 'tiktokUrl', 'facebookUrl', 'showWhatsapp'], gProfiles.body);
                groupsFragment.appendChild(gProfiles.details);

                const postTabs = [1, 2, 3, 4].map(function(i) {
                    return {
                        label: 'Post ' + i,
                        hasContent: function(s) { return Boolean(s['post' + i + 'ImageUrl']); },
                        keys: ['post' + i + 'ImageUrl', 'post' + i + 'Caption', 'post' + i + 'LinkUrl']
                    };
                });
                groupsFragment.appendChild(buildTabbedGroup({
                    title: 'Galería de publicaciones (opcional)',
                    subtitle: 'Hasta 4 fotos destacadas con enlace a tus posts',
                    iconName: 'image',
                    isOpen: Boolean(settings.post1ImageUrl || settings.post2ImageUrl),
                    tabs: postTabs
                }));
            } else if (sec.type === 'how_to_buy') {
                const gMain = createGroupDetails('Encabezado y sello de pagos', 'Título general y barra de medios aceptados', 'type', true);
                appendKeysToTarget(['title', 'subtitle', 'showPaymentBadges'], gMain.body);
                groupsFragment.appendChild(gMain.details);

                const stepTabs = [1, 2, 3].map(function(i) {
                    return {
                        label: 'Paso ' + i,
                        hasContent: function(s) { return Boolean(s['step' + i + 'Title']); },
                        keys: ['step' + i + 'Title', 'step' + i + 'Text']
                    };
                });
                groupsFragment.appendChild(buildTabbedGroup({
                    title: 'Los 3 pasos de compra',
                    subtitle: 'Título y explicación de cada paso',
                    iconName: 'layers',
                    isOpen: true,
                    tabs: stepTabs
                }));
            } else if (sec.type === 'announcement_bar') {
                const gMsg = createGroupDetails('Mensajes y enlace', 'Textos rotativos y acción al hacer clic', 'type', true);
                appendKeysToTarget(['text', 'text2', 'text3', 'linkUrl', 'linkText', 'linkStyle'], gMsg.body);
                groupsFragment.appendChild(gMsg.details);

                const gAnim = createGroupDetails('Ubicación, animación y colores', 'Efecto de transición, formato y paleta', 'palette', false);
                appendKeysToTarget(['headerPosition', 'animationMode', 'speed', 'barFormat', 'showArrows', 'dismissible', 'bgColor', 'textColor'], gAnim.body);
                groupsFragment.appendChild(gAnim.details);
            } else if (sec.type === 'product_grid') {
                const gSource = createGroupDetails('Contenido y origen de productos', 'Título, selección de productos y pestañas', 'shopping-bag', true);
                appendKeysToTarget(['title', 'subtitle', 'source', 'categoryId', 'defaultSort', 'enableTabs'], gSource.body);
                groupsFragment.appendChild(gSource.details);

                const gLayout = createGroupDetails('Diseño de cuadrícula y herramientas', 'Columnas, límite, buscador y filtros', 'layout', false);
                appendKeysToTarget(['displayMode', 'columnsDesktop', 'limit', 'showViewAll', 'showSortDropdown', 'showFilters'], gLayout.body);
                groupsFragment.appendChild(gLayout.details);
            } else if (sec.type === 'visit_us') {
                const gLoc = createGroupDetails('Ubicación y horarios', 'Dirección, ciudad, horarios y teléfonos', 'map-pin', true);
                appendKeysToTarget(['badgeText', 'title', 'subtitle', 'address', 'city', 'reference', 'hoursText', 'phone'], gLoc.body);
                groupsFragment.appendChild(gLoc.details);

                const gMedia = createGroupDetails('Fotografía, mapa y WhatsApp', 'Foto del local y botones de cómo llegar', 'image', false);
                appendKeysToTarget(['imageUrl', 'imageSide', 'mapUrl', 'mapButtonText', 'showWhatsappBtn'], gMedia.body);
                groupsFragment.appendChild(gMedia.details);
            } else if (sec.type === 'catalog_results') {
                const gHeader = createGroupDetails('Encabezado y navegación', 'Título del catálogo, píldoras y columnas', 'layout', true);
                appendKeysToTarget(['showHeader', 'headerBadge', 'headerTitle', 'headerSubtitle', 'showCategoryPills', 'columnsDesktop'], gHeader.body);
                groupsFragment.appendChild(gHeader.details);

                const gFilters = createGroupDetails('Buscador y filtros del catálogo', 'Criterios visibles en esta página', 'sliders', false);
                appendKeysToTarget(['showSearchAndSort', 'filterLayout', 'showFilterAvailability', 'showFilterPrice', 'showFilterCategory', 'showFilterVariants', 'showFilterAttributes'], gFilters.body);
                groupsFragment.appendChild(gFilters.details);
            } else if (sec.type === 'whatsapp_cta') {
                const gMain = createGroupDetails('Mensaje y botón de WhatsApp', 'Título, invitación y mensaje prellenado', 'chat', true);
                appendKeysToTarget(['title', 'subtitle', 'buttonText', 'prefilledMessage'], gMain.body);
                groupsFragment.appendChild(gMain.details);

                const gSched = createGroupDetails('Horario de atención en vivo', 'Indicador automático En línea / Fuera de horario', 'clock', Boolean(settings.showSchedule));
                appendKeysToTarget(['showSchedule', 'scheduleDays', 'openTime', 'closeTime', 'scheduleText'], gSched.body);
                groupsFragment.appendChild(gSched.details);
            } else if (sec.type === 'countdown_promo') {
                const gOffer = createGroupDetails('Texto y contador de la oferta', 'Título, fecha límite y acción al vencer', 'clock', true);
                appendKeysToTarget(['badgeText', 'title', 'subtitle', 'endDate', 'onExpire', 'expiredMessage'], gOffer.body);
                groupsFragment.appendChild(gOffer.details);

                const gAction = createGroupDetails('Botón y colores del banner', 'Enlace de destino y combinación de colores', 'palette', false);
                appendKeysToTarget(['buttonText', 'buttonUrl', 'bgColor', 'textColor'], gAction.body);
                groupsFragment.appendChild(gAction.details);
            } else if (sec.type === 'rich_text' || sec.type === 'promo_banner' || sec.type === 'featured_video') {
                const gContent = createGroupDetails('Contenido principal', 'Textos y mensaje de la sección', 'type', true);
                appendKeysToTarget(['badgeText', 'title', 'subtitle', 'content', 'bulletItems', 'videoUrl'], gContent.body);
                groupsFragment.appendChild(gContent.details);

                const gMedia = createGroupDetails('Imagen, botón y apariencia', 'Recursos visuales, enlace y diseño', 'image', true);
                appendKeysToTarget(['imageUrl', 'coverImageUrl', 'aspectRatio', 'imagePosition', 'textAlign', 'buttonText', 'buttonUrl', 'bgColor', 'textColor'], gMedia.body);
                groupsFragment.appendChild(gMedia.details);
            }

            const remainingKeys = Array.from(fieldNodes.keys()).filter(function(k) { return !usedKeys.has(k); });
            if (remainingKeys.length > 0) {
                const isOnlyGroup = usedKeys.size === 0;
                const gRest = createGroupDetails(
                    isOnlyGroup ? 'Configuración principal' : 'Más opciones',
                    isOnlyGroup ? 'Opciones principales de esta sección' : 'Ajustes adicionales de la sección',
                    'sliders',
                    isOnlyGroup
                );
                appendKeysToTarget(remainingKeys, gRest.body);
                groupsFragment.appendChild(gRest.details);
            }

            if (layoutDetails) {
                containerEl.insertBefore(groupsFragment, layoutDetails);
            } else {
                containerEl.appendChild(groupsFragment);
            }
        },

        SECTION_ICONS: {
            announcement_bar: 'megaphone',
            hero_banner: 'layout',
            multi_banners: 'grid',
            promo_banner: 'columns',
            countdown_promo: 'timer',
            product_grid: 'shopping-bag',
            spotlight_product: 'sparkles',
            featured_categories: 'folder',
            brand_carousel: 'tag',
            trust_badges: 'shield',
            testimonials: 'star',
            stats_counter: 'bar-chart',
            how_to_buy: 'list-checks',
            payment_methods: 'credit-card',
            faq_accordion: 'help-circle',
            gallery_lookbook: 'image',
            featured_video: 'video',
            rich_text: 'file-text',
            social_showcase: 'share-2',
            whatsapp_cta: 'chat',
            visit_us: 'map-pin',
            catalog_results: 'shopping-bag',
            product_main: 'package'
        },

        getSectionIconHtml: function(type, className) {
            if (type === 'whatsapp_cta') {
                return this.brandBadge('whatsapp');
            }
            const iconName = this.SECTION_ICONS[type] || 'layers';
            return this.icon(iconName, className || 'w-4 h-4');
        },

        renderCategorizedAddSectionModal: function(gridEl, catalogDefinitions, onSelectType) {
            if (!gridEl || !catalogDefinitions) return;
            const self = this;
            gridEl.innerHTML = '';

            const categories = [
                {
                    title: 'Portada, Banners y Promociones',
                    types: ['hero_banner', 'announcement_bar', 'multi_banners', 'promo_banner', 'countdown_promo']
                },
                {
                    title: 'Catálogo, Productos y Marcas',
                    types: ['product_grid', 'spotlight_product', 'featured_categories', 'brand_carousel']
                },
                {
                    title: 'Confianza, Reseñas y Pagos',
                    types: ['trust_badges', 'testimonials', 'stats_counter', 'how_to_buy', 'payment_methods', 'faq_accordion']
                },
                {
                    title: 'Contenido, Redes y Contacto',
                    types: ['gallery_lookbook', 'featured_video', 'rich_text', 'social_showcase', 'whatsapp_cta', 'visit_us']
                }
            ];

            const renderedTypes = new Set();

            const appendCard = function(type, def) {
                if (!def || def.anchorOnly || renderedTypes.has(type)) return;
                renderedTypes.add(type);

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sv-ed-sec-card group';
                const iconName = self.SECTION_ICONS[type] || 'layers';
                btn.innerHTML =
                    '<span class="sv-ed-sec-card-icon">' + self.icon(iconName, 'w-4 h-4') + '</span>' +
                    '<div class="sv-ed-sec-card-body">' +
                    '<p class="sv-ed-sec-card-title">' + stripLeadingEmoji(def.label || type) + '</p>' +
                    '<p class="sv-ed-sec-card-desc">' + stripLeadingEmoji(def.description || '') + '</p>' +
                    '<span class="sv-ed-sec-card-cta">+ Añadir sección</span>' +
                    '</div>';
                btn.addEventListener('click', function() {
                    if (typeof onSelectType === 'function') onSelectType(type);
                });
                gridEl.appendChild(btn);
            };

            categories.forEach(function(cat) {
                const validTypes = cat.types.filter(function(t) {
                    return catalogDefinitions[t] && !catalogDefinitions[t].anchorOnly;
                });
                if (validTypes.length === 0) return;

                const header = document.createElement('div');
                header.className = 'sv-ed-modal-cat-header';
                header.innerHTML = '<span class="sv-ed-modal-cat-title">' + cat.title + '</span>';
                gridEl.appendChild(header);

                validTypes.forEach(function(t) {
                    appendCard(t, catalogDefinitions[t]);
                });
            });

            // Cualquier sección futura adicional no listada en las 4 categorías
            Object.keys(catalogDefinitions).forEach(function(type) {
                const def = catalogDefinitions[type];
                if (def && !def.anchorOnly && !renderedTypes.has(type)) {
                    appendCard(type, def);
                }
            });
        },

        enhanceGlobalStylesPanel: function() {
            const self = this;

            // 1. Convertir todos los checkboxes de Estilos Globales, Paginación, Plantillas y Modales en switches modernos (.sv-ed-switch-card)
            const scopes = [
                document.getElementById('panel-global-styles'),
                document.getElementById('panel-theme-presets'),
                document.getElementById('custom-page-settings-bar'),
                document.getElementById('create-custom-page-modal')
            ];

            scopes.forEach(function(root) {
                if (!root) return;
                root.querySelectorAll('label').forEach(function(labelEl) {
                    const chk = labelEl.querySelector('input[type="checkbox"]');
                    if (!chk) return;
                    if (labelEl.dataset.svSwitchEnhanced === 'true') return;
                    labelEl.dataset.svSwitchEnhanced = 'true';

                    const spans = Array.from(labelEl.querySelectorAll('span'));
                    let titleText = '';
                    let descText = '';

                    if (spans.length >= 2) {
                        titleText = stripLeadingEmoji(spans[0].textContent || '');
                        descText = stripLeadingEmoji(spans[1].textContent || '');
                    } else if (spans.length === 1) {
                        titleText = stripLeadingEmoji(spans[0].textContent || '');
                    } else {
                        titleText = stripLeadingEmoji(labelEl.textContent || '');
                    }

                    // Conservar los hijos que no sean el checkbox para no perder referencias, solo ocultándolos visualmente si hace falta
                    Array.from(labelEl.children).forEach(function(ch) {
                        if (ch !== chk) ch.classList.add('hidden');
                    });

                    labelEl.className = 'sv-ed-switch-card';
                    chk.className = 'sr-only';

                    const textsDiv = document.createElement('div');
                    textsDiv.className = 'sv-ed-switch-texts';
                    const tSpan = document.createElement('span');
                    tSpan.className = 'sv-ed-switch-title';
                    tSpan.textContent = titleText;
                    textsDiv.appendChild(tSpan);

                    if (descText && descText.toLowerCase() !== titleText.toLowerCase()) {
                        const dSpan = document.createElement('span');
                        dSpan.className = 'sv-ed-switch-desc';
                        dSpan.textContent = descText;
                        textsDiv.appendChild(dSpan);
                    }

                    const track = document.createElement('span');
                    track.className = 'sv-ed-switch-track';
                    track.setAttribute('aria-hidden', 'true');
                    const thumb = document.createElement('span');
                    thumb.className = 'sv-ed-switch-thumb';
                    track.appendChild(thumb);

                    labelEl.appendChild(textsDiv);
                    labelEl.appendChild(track);
                });
            });

            // 2. Convertir únicamente los <select> de ancho completo (1 sola columna) con 2-3 opciones cortas
            const GLOBAL_SEGMENTED_IDS = [
                'style-navbar-brand-mode',
                'style-card-img-padding',
                'style-detail-related-cols'
            ];

            GLOBAL_SEGMENTED_IDS.forEach(function(selId) {
                const selectEl = document.getElementById(selId);
                if (!selectEl || !selectEl.parentElement) return;
                if (selectEl.dataset.svSegMounted === 'true') {
                    if (typeof selectEl._syncSegmentedUI === 'function') selectEl._syncSegmentedUI();
                    return;
                }
                self.mountSegmentedForSelect(selectEl.parentElement, selectEl, selId);
            });

            // 3. Añadir tooltip con el texto completo a todos los <select> en rejillas de 2 y 3 columnas
            const panelStyles = document.getElementById('panel-global-styles');
            if (panelStyles) {
                panelStyles.querySelectorAll('.grid-cols-2 select, .grid-cols-3 select').forEach(function(sel) {
                    const syncTitle = function() {
                        const opt = sel.options[sel.selectedIndex];
                        sel.title = opt ? opt.textContent.trim() : '';
                    };
                    syncTitle();
                    if (!sel.dataset.svTitleBound) {
                        sel.dataset.svTitleBound = 'true';
                        sel.addEventListener('change', syncTitle);
                    }
                });
            }
        }
    };

    Storevo.EditorUI = EditorUI;
    window.StorevoEditorUI = EditorUI;
})();