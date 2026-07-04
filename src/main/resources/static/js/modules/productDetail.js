window.Storevo = window.Storevo || {};

Storevo.ProductDetail = {
    changeImage: function(btn) {
        const mainImg = document.getElementById('main-product-image');
        if (!mainImg || !btn) return;

        // 1. Efecto de transición suave (Fade)
        const newSrc = btn.getAttribute('data-src');
        mainImg.style.opacity = '0.5';

        setTimeout(() => {
            mainImg.src = newSrc;
            mainImg.style.opacity = '1';
        }, 150);

        // 2. Actualizar estado visual de los botones (Remover focus de todos)
        document.querySelectorAll('.product-thumbnail').forEach(t => {
            t.classList.remove('border-brand', 'shadow-md', 'ring-2', 'ring-brand/20');
            t.classList.add('border-transparent', 'opacity-70');
        });

        // 3. Añadir focus al seleccionado
        btn.classList.remove('border-transparent', 'opacity-70');
        btn.classList.add('border-brand', 'shadow-md', 'ring-2', 'ring-brand/20');
    }
};