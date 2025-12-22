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
    return String(s)
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
    const statusText = pill(meta.status);
    const msg = meta.message ? `<p style="margin:6px 0 0;">${esc(meta.message)}</p>` : "";
    const link = meta.sourceUrl
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

  btn.addEventListener("click", async function () {
    const q = input.value.trim();
    if (!q) return;

    const wantPLU = chkPLU ? !!chkPLU.checked : true;
    const wantRisk = chkRisk ? !!chkRisk.checked : true;
    const wantContext = chkContext ? !!chkContext.checked : true;
    const wantCad = chkCad ? !!chkCad.checked : false;

    result.style.display = "block";
    result.innerHTML = "<p>Analyse wordt uitgevoerd…</p>";

    try {
      const r = await fetch(`/api/check?q=${encodeURIComponent(q)}`);
      const data = await r.json();

      if (data.error) {
        result.innerHTML = `<p><strong>Fout:</strong> ${esc(data.error)}</p>`;
        return;
      }

      let html = `
        <h2 style="color:#800000;margin:0 0 6px;">Resultaat</h2>
        <p style="margin:0 0 8px;"><strong>Input:</strong> ${esc(data.query)}</p>
        <p style="margin:0 0 10px;"><strong>Samenvatting:</strong> ${esc(data.summary?.status || "indicatief")}</p>
        <p style="margin:0 0 10px;color:#555;">${esc(data.summary?.note || "")}</p>
      `;

      // Belangrijk: elk onderdeel onafhankelijk tonen (ook bij “momenteel niet beschikbaar”)
      if (wantPLU && data.results?.plu) {
        html += section(
          "Planologisch (PLU / zonering)",
          data.results.plu,
          "Géoportail de l’Urbanisme"
        );
      }

      if (wantRisk && data.results?.risk) {
        html += section(
          "Risico’s (overstroming, bosbrand, bodem)",
          data.results.risk,
          "GéoRisques"
        );
      }

      if (wantContext && data.results?.context) {
        html += section(
          "Planologische context (wonen / bedrijvigheid)",
          data.results.context,
          "IGN kaartviewer"
        );
      }

      if (wantCad && data.results?.cad) {
        html += section(
          "Perceel / cadastre (geavanceerd)",
          data.results.cad,
          "Cadastre"
        );
      }

      // Always “wat nu doen”
      if (Array.isArray(data.wat_nu_doen)) {
        html += `
          <div style="margin-top:16px;padding-top:10px;border-top:1px solid #eee;">
            <h3 style="margin:0;color:#800000;">Wat nu doen</h3>
            <ol style="margin:8px 0 0;">
              ${data.wat_nu_doen.map((x) => `<li>${esc(x)}</li>`).join("")}
            </ol>
            ${
              data.officialLinks?.servicePublicCU
                ? `<p style="margin:10px 0 0;">
                     <a href="${data.officialLinks.servicePublicCU}" target="_blank" rel="noopener noreferrer">
                       Service-Public: Certificat d’Urbanisme →
                     </a>
                   </p>`
                : ""
            }
          </div>
        `;
      }

      html += `<p style="margin-top:14px;font-size:.9em;color:#555;">${esc(data.disclaimer || "")}</p>`;

      result.innerHTML = html;
    } catch (e) {
      result.innerHTML = `<p><strong>Fout:</strong> ${esc(e.message || String(e))}</p>`;
    }
  });
})();
