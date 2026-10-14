window.Storevo = window.Storevo || {};

Storevo.Settings = {
    cambiarPestana: function(pestanaActiva) {
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('block');
        });

        const activeContent = document.getElementById('content-' + pestanaActiva);
        if (activeContent) {
            activeContent.classList.remove('hidden');
            activeContent.classList.add('block');
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.className = "tab-btn flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent";
        });

        const btnActivo = document.getElementById('tab-' + pestanaActiva);
        if (btnActivo) {
            btnActivo.className = "tab-btn flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-500/15 text-indigo-300 border border-indigo-500/25";
        }
    },

    initWompiTest: function() {
        const btnProbar = document.getElementById('btnProbarWompi');
        if (!btnProbar) return;

        btnProbar.addEventListener('click', function() {
            const boton = this;
            const resultado = document.getElementById('resultadoProbarWompi');
            const publicKey = document.querySelector('[name="wompiPublicKey"]')?.value || '';
            const environment = document.querySelector('[name="wompiEnvironment"]')?.value || 'SANDBOX';

            boton.disabled = true;
            resultado.className = 'text-sm mt-2 text-slate-400';
            resultado.textContent = 'Probando conexión...';

            const params = new URLSearchParams();
            params.append('publicKey', publicKey);
            params.append('environment', environment);

            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
            const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
            if (csrfToken && csrfHeader) {
                headers[csrfHeader] = csrfToken;
            }

            fetch(window.location.pathname + '/wompi/test-connection', {
                method: 'POST',
                headers: headers,
                body: params.toString()
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'ok') {
                        resultado.className = 'text-sm mt-2 text-emerald-400 font-medium';
                        resultado.textContent = '✓ Conexión exitosa: ' + data.merchantName;
                    } else {
                        resultado.className = 'text-sm mt-2 text-red-400 font-medium';
                        resultado.textContent = '✗ ' + data.message;
                    }
                })
                .catch(() => {
                    resultado.className = 'text-sm mt-2 text-red-400 font-medium';
                    resultado.textContent = '✗ No se pudo contactar a Storevo para hacer la prueba.';
                })
                .finally(() => {
                    boton.disabled = false;
                });
        });
    }
};

window.cambiarPestana = Storevo.Settings.cambiarPestana;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storevo.Settings.initWompiTest());
} else {
    Storevo.Settings.initWompiTest();
}