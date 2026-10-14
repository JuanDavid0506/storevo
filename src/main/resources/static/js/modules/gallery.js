window.Storevo = window.Storevo || {};

Storevo.Gallery = {
    next: function(e, btn) {
        e.preventDefault();
        e.stopPropagation();
        const imgEl = document.getElementById(btn.getAttribute('data-target'));
        const images = (btn.getAttribute('data-images') || '').split(',').filter(Boolean);
        if (!imgEl || images.length <= 1) return;
        const currentIndex = images.indexOf(imgEl.getAttribute('src'));
        const nextIndex = (currentIndex + 1) % images.length;
        imgEl.setAttribute('src', images[nextIndex]);
    },
    prev: function(e, btn) {
        e.preventDefault();
        e.stopPropagation();
        const imgEl = document.getElementById(btn.getAttribute('data-target'));
        const images = (btn.getAttribute('data-images') || '').split(',').filter(Boolean);
        if (!imgEl || images.length <= 1) return;
        let currentIndex = images.indexOf(imgEl.getAttribute('src'));
        if (currentIndex === -1) currentIndex = 0;
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        imgEl.setAttribute('src', images[prevIndex]);
    }
};