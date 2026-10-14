window.Storevo = window.Storevo || {};

Storevo.CustomerDetail = {
    openEditModal: function() {
        const modal = document.getElementById('customer-edit-modal');
        const content = document.getElementById('customer-edit-modal-content');
        if (!modal || !content) return;

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        });
    },

    closeEditModal: function() {
        const modal = document.getElementById('customer-edit-modal');
        const content = document.getElementById('customer-edit-modal-content');
        if (!modal || !content) return;

        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    toggleNitField: function(docType) {
        const dvInput = document.getElementById('modal-nit-dv');
        if (!dvInput) return;
        dvInput.classList.toggle('hidden', docType !== 'NIT');
    }
};