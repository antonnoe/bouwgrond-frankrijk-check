// /api/embed.js
(function () {
  const btn = document.getElementById('checkBtn');
  const input = document.getElementById('loc');
  const result = document.getElementById('result');
  const radios = document.querySelectorAll('input[name="mode"]');

  if (!btn || !input || !result || !radios.length) return;

  // Init state
  btn.disabled = true;
  btn.style.opacity = 0.5;

  function updateMode() {
    const mode = document.querySelector('input[name="mode"]:checked')?.value;

    if (!mode) {
      btn.disabled = true;
      btn.style.opacity = 0.5;
      result.style.display = 'none';
      return;
    }

    if (mode === 'local') {
      btn.disabled = false;
      btn.style.opacity = 1;
      result.style.display = 'none';
    } else {
      btn.disabled = true;
      btn.style.opacity = 0.5;
      result.style.display = 'block';
      result.innerHTML =
        '<p><strong>Regionaal (reverse)</strong> komt in v2. Kies <em>Locatiespecifiek</em>.</p>';
    }
  }

  radios.forEach(r => r.addEventListener('change', updateMode));
  updateMode();

  btn.addEventListener('click', async function () {
    const q = input.value.trim();
    if (!q) return;

    result.style.display = 'block';
    result.innerHTML = '<p>Bezig met controleren…</p>';

    try {
      const r = await fetch(`/api/check?code=${encodeURIComponent(q)}`);
      const data = await r.json();

      result.innerHTML = `
        <h2 style="color:#800000;">Resultaat</h2>
        <p><strong>In principe:</strong> ${data.samenvatting.status}</p>
        <p><strong>Zone(s):</strong> ${data.samenvatting.zones.join(' / ')}</p>
        <h3>Wat nu doen</h3>
        <ol>${data.wat_nu_doen.map(x => `<li>${x}</li>`).join('')}</ol>
        <p style="font-size:.9em;color:#555;">${data.disclaimer}</p>
      `;
    } catch (e) {
      result.innerHTML = `<p><strong>Fout:</strong> ${e.message}</p>`;
    }
  });
})();
