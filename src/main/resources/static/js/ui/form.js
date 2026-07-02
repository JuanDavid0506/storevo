window.Storevo = window.Storevo || {};
Storevo.UI = Storevo.UI || {};

Storevo.UI.Form = {
    initAutoSubmit: function() {
        document.querySelectorAll('[data-auto-submit="true"]').forEach(el => {
            el.addEventListener('change', function() {
                if (this.form) this.form.submit();
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', Storevo.UI.Form.initAutoSubmit);