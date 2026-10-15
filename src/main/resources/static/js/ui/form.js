window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Form = {
    initAutoSubmit: function() {
        if (document.body.dataset.autoSubmitBound) return;
        document.body.dataset.autoSubmitBound = 'true';

        document.addEventListener('change', function(e) {
            const el = e.target.closest('[data-auto-submit="true"]');
            if (!el || !el.form) return;

            if (el.form.id === 'listing-form' && window.Storevo && Storevo.Listing) {
                Storevo.Listing.submitForm();
            } else {
                el.form.submit();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', Storevo.UI.Form.initAutoSubmit);