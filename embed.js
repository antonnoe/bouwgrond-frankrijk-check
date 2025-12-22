(function () {
  const btn = document.getElementById('checkBtn');
  const input = document.getElementById('loc');
  const result = document.getElementById('result');

  if (!btn || !input || !result) return;

  btn.addEventListener('click', async function () {
    const q = input.value.trim();
    if (!q) return;

    const checks = {
      plu: document.getElementById('chk-plu')?.checked,
      risk: document.getElementById('chk-risk')?.checked,
      context: document.getElementById('chk-context')?.checked,
      cad: document.getElementById('chk-cad')?.checked
    };

    result.style.display = 'block';
    result.innerHTML = '<p>Analyse wordt uitgevoerd…</p>';

    try {
      const r = await fetch(`/api/check?q=${encodeURIComponent(q)}`);
      const data = await r.json();

      if (data.error) {
        result.innerHTML = `<p><strong>Fout:</strong> ${data.error}</p>`;
        return;
      }

      let html = `
        <h2 style="color:#800000;">Resultaat</h2>
        <p><strong>In principe:</strong> ${data.samenvatting.status}</p>
      `;

      if (checks.plu) {
        html += `
          <h3>Planologisch</h3>
          <p>${data.samenvatting.status === 'mogelijk'
            ? 'Er is planologisch kader aanwezig (indicatief).'
            : 'Geen planologisch kader gevonden (indicatief).'}</p>
          <p><a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank">
            Géoportail de l’Urbanisme →</a></p>
        `;
      }

      if (checks.risk) {
        html += `
          <h3>Risico’s</h3>
          <p>${data.aandachtspunten.risico_aanwezig
            ? 'Bekende risico’s aanwezig.'
            : 'Geen bekende risico’s gemeld.'}</p>
          <p><a href="https://www.georisques.gouv.fr/" target="_blank">
            GéoRisques →</a></p>
        `;
      }

      if (checks.context) {
        html += `
          <h3>Planologische context</h3>
          <p>Indicatie van functies in de omgeving (wonen / bedrijvigheid).</p>
          <p><a href="https://www.geoportail.gouv.fr/" target="_blank">
            IGN kaartviewer →</a></p>
        `;
      }

      if (checks.cad) {
        html += `
          <h3>Perceel / cadastre</h3>
          <p>Geavanceerde analyse. Automatisch mogelijk beperkt.</p>
          <p><a href="https://www.cadastre.gouv.fr/" target="_blank">
            Cadastre →</a></p>
        `;
      }

      html += `
        <h3>Wat nu doen</h3>
        <ol>${data.wat_nu_doen.map(x => `<li>${x}</li>`).join('')}</ol>
        <p style="font-size:.9em;color:#555;">${data.disclaimer}</p>
      `;

      result.innerHTML = html;
    } catch (e) {
      result.innerHTML = `<p><strong>Fout:</strong> ${e.message}</p>`;
    }
  });
})();
