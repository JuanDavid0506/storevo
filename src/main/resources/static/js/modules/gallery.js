window.Storevo = window.Storevo || {};

Storevo.Gallery = {
    next: function(e, btn) {
        e.preventDefault();
        e.stopPropagation();
        const imgEl = document.getElementById(btn.getAttribute('data-target'));
        const images = (btn.getAttribute('data-images') || '').split(',').filter(Boolean);
        if (!imgEl || images.length <= 1) return;

        let currentIndex = parseInt(imgEl.getAttribute('data-gallery-index') || '-1', 10);
        if (isNaN(currentIndex) || currentIndex < 0) {
            const bySrc = images.indexOf(imgEl.getAttribute('src'));
            currentIndex = bySrc !== -1 ? bySrc : 0;
        }

        const nextIndex = (currentIndex + 1) % images.length;
        imgEl.setAttribute('data-gallery-index', String(nextIndex));
        imgEl.setAttribute('src', images[nextIndex]);
    },

    prev: function(e, btn) {
        e.preventDefault();
        e.stopPropagation();
        const imgEl = document.getElementById(btn.getAttribute('data-target'));
        const images = (btn.getAttribute('data-images') || '').split(',').filter(Boolean);
        if (!imgEl || images.length <= 1) return;

        let currentIndex = parseInt(imgEl.getAttribute('data-gallery-index') || '-1', 10);
        if (isNaN(currentIndex) || currentIndex < 0) {
            const bySrc = images.indexOf(imgEl.getAttribute('src'));
            currentIndex = bySrc !== -1 ? bySrc : 0;
        }

        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        imgEl.setAttribute('data-gallery-index', String(prevIndex));
        imgEl.setAttribute('src', images[prevIndex]);
    }
};