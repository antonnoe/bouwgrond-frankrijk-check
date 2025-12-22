// api/embed.js
// Koppelt index.html (UI) aan api/check.js (v1)
// Verwacht: input#loc, button#checkBtn, div#result

(function () {
  const btn = document.getElementById('checkBtn');
  const input = document.getElementById('loc');
  const result = document.getElementById('result');

  if (!btn || !input || !result) return;

  btn.addEventListener('click', async function () {
    const q = input.value.trim();
    if (!q) return;

    result.style.display = 'block';
    result.innerHTML = '<p>Bezig met controleren…</p>';

    try {
      const r = await fetch(`/api/check?q=${encodeURIComponent(q)}`);
      const data = await r.json();

      if (data.error) {
        result.innerHTML = `<p><strong>Fout:</strong> ${data.error}</p>`;
        return;
      }

      const statusMap = {
        mogelijk: '🟢 mogelijk',
        beperkt: '🟠 beperkt',
        onwaarschijnlijk: '🔴 onwaarschijnlijk'
      };

      result.innerHTML = `
        <h2 style="color:#800000;">Resultaat</h2>

        <p><strong>In principe:</strong> ${statusMap[data.samenvatting.status] || '—'}</p>

        <p>
          <strong>Zone(s):</strong> ${data.samenvatting.zones.join(' / ')}
          <span title="U = stedelijk | AU = te urbaniseren | A = agrarisch | N = natuur"
                style="cursor:help;">[ i ]</span>
        </p>

        <h3>Aandachtspunten</h3>
        <ul>
          <li>Risico’s: ${data.aandachtspunten.risico_aanwezig ? 'aanwezig' : 'geen bekende'}</li>
        </ul>

        <h3>Wat nu doen</h3>
        <ol>
          ${data.wat_nu_doen.map(x => `<li>${x}</li>`).join('')}
        </ol>

        <p style="font-size:0.9em;color:#555;">
          ${data.disclaimer}
        </p>
      `;
    } catch (e) {
      result.innerHTML = `<p><strong>Fout:</strong> ${e.message}</p>`;
    }
  });
})();
