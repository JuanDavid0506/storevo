window.Storevo = window.Storevo || {};

Storevo.ProductDetail = {
    changeMainImage: function(btn) {
        document.getElementById('mainImage').src = btn.querySelector('img').src;
        document.querySelectorAll('.thumb-btn').forEach(b => {
            b.classList.remove('border-brand');
            b.classList.add('border-transparent');
        });
        btn.classList.replace('border-transparent', 'border-brand');
    }
};

// Puente de Retrocompatibilidad
window.changeMainImage = Storevo.ProductDetail.changeMainImage;
