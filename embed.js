// /embed.js
(function () {
  const btn = document.getElementById("checkBtn");
  const input = document.getElementById("loc");
  const result = document.getElementById("result");

  const chkPLU = document.getElementById("chk-plu");
  const chkRisk = document.getElementById("chk-risk");
  const chkContext = document.getElementById("chk-context");
  const chkCad = document.getElementById("chk-cad");

  if (!btn || !input || !result) return;

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function pill(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("beschikbaar")) return "🟢 beschikbaar";
    if (s.includes("traag") || s.includes("beperkt")) return "🟠 beperkt";
    if (s.includes("niet")) return "🔴 niet beschikbaar";
    return "⚪ status";
  }

  function section(title, meta, linkText) {
    const statusText = pill(meta?.status);
    const msg = meta?.message ? `<p style="margin:6px 0 0;">${esc(meta.message)}</p>` : "";
    const link = meta?.sourceUrl
      ? `<p style="margin:8px 0 0;">
           <a href="${meta.sourceUrl}" target="_blank" rel="noopener noreferrer">${esc(linkText)} →</a>
         </p>`
      : "";
    return `
      <div style="margin-top:14px;padding-top:10px;border-top:1px solid #eee;">
        <h3 style="margin:0;color:#800000;">${esc(title)}</h3>
        <p style="margin:6px 0 0;"><strong>Status:</strong> ${statusText}</p>
        ${msg}
        ${link}
      </div>
    `;
  }

  function fallbackLinksBlock(q) {
    const qp = encodeURIComponent(q || "");
    return `
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid #eee;">
        <h3 style="margin:0;color:#800000;">Alternatieve routes (officieel)</h3>
        <ul style="margin:8px 0 0;">
          <li><a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank" rel="noopener noreferrer">Géoportail de l’Urbanisme →</a></li>
          <li><a href="https://www.georisques.gouv.fr/" target="_blank" rel="noopener noreferrer">GéoRisques →</a></li>
          <li><a href="https://www.geoportail.gouv.fr/" target="_blank" rel="noopener noreferrer">IGN kaartviewer →</a></li>
          <li><a href="https://www.cadastre.gouv.fr/" target="_blank" rel="noopener noreferrer">Cadastre →</a></li>
        </ul>
        <p style="margin:10px 0 0;color:#555;font-size:.95em;">
          Technische check: <a href="/api/check?q=${qp}" target="_blank" rel="noopener noreferrer">open API-output →</a>
        </p>
      </div>
    `;
  }

  btn.addEventListener("click", async function () {
    const q = input.value.trim();
    if (!q) return;

    const wantPLU = chkPLU ? !!chkPLU.checked : true;
    const wantRisk = chkRisk ? !!chkRisk.checked : true;
    const wantContext = chkContext ? !!chkContext.checked : true;
    const wantCad = chkCad ? !!chkCad.checked : false;

    result.style.display = "block";
    result.innerHTML = "<p>Analyse wordt uitgevoerd…</p>";

    let r, text, data;

    try {
      r = await fetch(`/api/check?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      text = await r.text();

      // Alleen JSON proberen als het er ook uitziet als JSON
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      const looksJson = ct.includes("application/json") || /^\s*[\[{]/.test(text);

      if (!r.ok) {
        result.innerHTML = `
          <h2 style="color:#800000;margin:0 0 6px;">Resultaat</h2>
          <p><strong>Fout:</strong> API antwoord ${r.status}.</p>
          <p style="color:#555;">${esc(text.slice(0, 160))}${text.length > 160 ? "…" : ""}</p>
          ${fallbackLinksBlock(q)}
          <p style="margin-top:14px;font-size:.9em;color:#555;">
            Indicatief. Definitieve zekerheid via Certificat d’Urbanisme en mairie.
          </p>
        `;
        return;
      }

      if (!looksJson) {
        result.innerHTML = `
          <h2 style="color:#800000;margin:0 0 6px;">Resultaat</h2>
          <p><strong>Fout:</strong> de server gaf geen JSON terug (waarschijnlijk een tijdelijke serverpagina).</p>
          <p style="color:#555;">${esc(text.slice(0, 160))}${text.length > 160 ? "…" : ""}</p>
          ${fallbackLinksBlock(q)}
          <p style="margin-top:14px;font-size:.9em;color:#555;">
            Indicatief. Definitieve zekerheid via Certificat d’Urbanisme en mairie.
          </p>
        `;
        return;
      }

      data = JSON.parse(text);

      if (data.error) {
        result.innerHTML = `
          <h2 style="color:#800000;margin:0 0 6px;">Resultaat</h2>
          <p><strong>Fout:</strong> ${esc(data.error)}</p>
          ${fallbackLinksBlock(q)}
          <p style="margin-top:14px;font-size:.9em;color:#555;">
            Indicatief. Definitieve zekerheid via Certificat d’Urbanisme en mairie.
          </p>
        `;
        return;
      }

      // Render normaal (per onderdeel onafhankelijk)
      let html = `
        <h2 style="color:#800000;margin:0 0 6px;">Resultaat</h2>
        <p style="margin:0 0 8px;"><strong>Input:</strong> ${esc(data.query || q)}</p>
        <p style="margin:0 0 10px;"><strong>Samenvatting:</strong> ${esc(data.summary?.status || data.samenvatting?.status || "indicatief")}</p>
        <p style="margin:0 0 10px;color:#555;">${esc(data.summary?.note || "")}</p>
      `;

      // Als je API de nieuwe structuur heeft: data.results.*
      const R = data.results || {};

      if (wantPLU) {
        html += section(
          "Planologisch (PLU / zonering)",
          R.plu || {
            status: "momenteel niet beschikbaar",
            message: "Geen automatische output voor PLU. Gebruik de officiële bron.",
            sourceUrl: "https://www.geoportail-urbanisme.gouv.fr/",
          },
          "Géoportail de l’Urbanisme"
        );
      }

      if (wantRisk) {
        html += section(
          "Risico’s (overstroming, bosbrand, bodem)",
          R.risk || {
            status: "beschikbaar",
            message: "Gebruik GéoRisques voor details op kaartniveau.",
            sourceUrl: "https://www.georisques.gouv.fr/",
          },
          "GéoRisques"
        );
      }

      if (wantContext) {
        html += section(
          "Planologische context (wonen / bedrijvigheid)",
          R.context || {
            status: "beschikbaar",
            message: "Open de officiële kaartviewer voor lagen en omgeving.",
            sourceUrl: "https://www.geoportail.gouv.fr/",
          },
          "IGN kaartviewer"
        );
      }

      if (wantCad) {
        html += section(
          "Perceel / cadastre (geavanceerd)",
          R.cad || {
            status: "beschikbaar",
            message: "Open Cadastre voor perceel-info (automatisering volgt later).",
            sourceUrl: "https://www.cadastre.gouv.fr/",
          },
          "Cadastre"
        );
      }

      if (Array.isArray(data.wat_nu_doen)) {
        html += `
          <div style="margin-top:16px;padding-top:10px;border-top:1px solid #eee;">
            <h3 style="margin:0;color:#800000;">Wat nu doen</h3>
            <ol style="margin:8px 0 0;">
              ${data.wat_nu_doen.map((x) => `<li>${esc(x)}</li>`).join("")}
            </ol>
          </div>
        `;
      }

      html += `<p style="margin-top:14px;font-size:.9em;color:#555;">${esc(data.disclaimer || "Indicatief. Definitieve zekerheid via Certificat d’Urbanisme en mairie.")}</p>`;

      result.innerHTML = html;
    } catch (e) {
      result.innerHTML = `
        <h2 style="color:#800000;margin:0 0 6px;">Resultaat</h2>
        <p><strong>Fout:</strong> ${esc(e.message || String(e))}</p>
        ${fallbackLinksBlock(q)}
        <p style="margin-top:14px;font-size:.9em;color:#555;">
          Indicatief. Definitieve zekerheid via Certificat d’Urbanisme en mairie.
        </p>
      `;
    }
  });
})();
