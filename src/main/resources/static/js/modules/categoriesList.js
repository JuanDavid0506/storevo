window.Storevo = window.Storevo || {};

Storevo.CategoriesList = {
    init: function() {
        const input = document.getElementById('categorySearchInput');
        if (!input) return;

        const roots = document.querySelectorAll('details.cat-root');
        const noResults = document.getElementById('noSearchResults');

        input.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            let visibleCount = 0;

            roots.forEach(function(details) {
                const text = details.textContent.toLowerCase();
                const matches = !query || text.indexOf(query) !== -1;
                if (matches) {
                    details.classList.remove('hidden');
                    visibleCount++;
                    if (query) details.setAttribute('open', '');
                } else {
                    details.classList.add('hidden');
                }
            });

            if (noResults) {
                noResults.classList.toggle('hidden', !(query && visibleCount === 0));
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.CategoriesList.init());
} else {
    Storevo.CategoriesList.init();
}