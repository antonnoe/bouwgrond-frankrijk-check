(function () {
  const input = document.getElementById("loc");
  const result = document.getElementById("result");
  const suggestBox = document.getElementById("ban-suggest");
  const checkBtn = document.getElementById("checkBtn");

  const chkOCS = document.getElementById("chk-ocs");
  const chkB = document.getElementById("chk-buildings");
  const chkT = document.getElementById("chk-transport");
  const chkH = document.getElementById("chk-hydro");

  let selectedLat = null;
  let selectedLon = null;
  let selectedLabel = null;

  /* ================= MAP ================= */

  const map = L.map("map").setView([46.6, 2.4], 6);

  // Basislaag: OpenStreetMap
  const osmBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  let marker = null;
  function setMarker(lat, lon, label) {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map).bindPopup(label).openPopup();
    map.setView([lat, lon], 15);
    selectedLat = lat;
    selectedLon = lon;
    selectedLabel = label;
  }

  /* ===== IGN GEOPLATEFORME WMTS LAYERS ===== */

  // WMTS endpoint (stabieler dan WMS)
  const WMTS_URL = "https://data.geopf.fr/wmts";

  // Kadastrale percelen
  const cadastre = L.tileLayer(
    `${WMTS_URL}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`,
    {
      attribution: "© IGN",
      opacity: 0.7,
      maxZoom: 19,
    }
  ).addTo(map);

  // Plan IGN (bebouwing + wegen + labels)
  const planIgn = L.tileLayer(
    `${WMTS_URL}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`,
    {
      attribution: "© IGN",
      opacity: 0.6,
      maxZoom: 19,
    }
  );

  // Luchtfoto's
  const ortho = L.tileLayer(
    `${WMTS_URL}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`,
    {
      attribution: "© IGN",
      opacity: 0.8,
      maxZoom: 19,
    }
  );

  // Hydrografie (waterlopen)
  const hydro = L.tileLayer(
    `${WMTS_URL}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=HYDROGRAPHY.HYDROGRAPHY&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`,
    {
      attribution: "© IGN",
      opacity: 0.7,
      maxZoom: 19,
    }
  );

  // Wegen/transport
  const transport = L.tileLayer(
    `${WMTS_URL}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=TRANSPORTNETWORKS.ROADS&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`,
    {
      attribution: "© IGN",
      opacity: 0.6,
      maxZoom: 19,
    }
  );

  /* ===== LAYER SYNC ===== */

  function syncLayers() {
    // Landgebruik = Kadaster (percelen zichtbaar)
    if (chkOCS.checked) {
      if (!map.hasLayer(cadastre)) map.addLayer(cadastre);
    } else {
      if (map.hasLayer(cadastre)) map.removeLayer(cadastre);
    }

    // Bebouwing = Plan IGN
    if (chkB.checked) {
      if (!map.hasLayer(planIgn)) map.addLayer(planIgn);
    } else {
      if (map.hasLayer(planIgn)) map.removeLayer(planIgn);
    }

    // Infrastructuur = Transport
    if (chkT.checked) {
      if (!map.hasLayer(transport)) map.addLayer(transport);
    } else {
      if (map.hasLayer(transport)) map.removeLayer(transport);
    }

    // Waterlopen = Hydro
    if (chkH.checked) {
      if (!map.hasLayer(hydro)) map.addLayer(hydro);
    } else {
      if (map.hasLayer(hydro)) map.removeLayer(hydro);
    }
  }

  [chkOCS, chkB, chkT, chkH].forEach((c) =>
    c.addEventListener("change", syncLayers)
  );

  // Initiële sync
  syncLayers();

  /* ================= BAN AUTOCOMPLETE ================= */

  let banTimer = null;
  input.addEventListener("input", function () {
    const q = input.value.trim();
    clearTimeout(banTimer);
    if (q.length < 3) {
      suggestBox.style.display = "none";
      return;
    }
    banTimer = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`
        );
        const d = await r.json();
        if (!d.features?.length) {
          suggestBox.style.display = "none";
          return;
        }
        suggestBox.innerHTML = d.features
          .map(
            (f) => `
          <div data-lat="${f.geometry.coordinates[1]}"
               data-lon="${f.geometry.coordinates[0]}"
               data-label="${f.properties.label}"
               data-city="${f.properties.city || ""}"
               data-postcode="${f.properties.postcode || ""}"
               style="padding:8px 10px;cursor:pointer;border-bottom:1px solid #eee;">
            ${f.properties.label}
            <span style="color:#888;font-size:.85em;"> (${f.properties.postcode || ""} ${f.properties.city || ""})</span>
          </div>`
          )
          .join("");
        suggestBox.style.display = "block";
      } catch {
        suggestBox.style.display = "none";
      }
    }, 300);
  });

  suggestBox.addEventListener("click", (e) => {
    const d = e.target.closest("div");
    if (!d) return;
    const lat = +d.dataset.lat;
    const lon = +d.dataset.lon;
    const label = d.dataset.label || d.textContent.trim();
    input.value = label;
    suggestBox.style.display = "none";
    setMarker(lat, lon, label);
  });

  // Sluit suggesties bij klik buiten
  document.addEventListener("click", (e) => {
    if (!suggestBox.contains(e.target) && e.target !== input) {
      suggestBox.style.display = "none";
    }
  });

  /* ================= ANALYZE BUTTON ================= */

  checkBtn.addEventListener("click", () => {
    if (selectedLat && selectedLon) {
      runAnalysis(selectedLat, selectedLon, selectedLabel);
    } else {
      result.innerHTML = `<p style="color:#800000;"><strong>Selecteer eerst een adres uit de lijst of klik op de kaart.</strong></p>`;
    }
  });

  /* ================= MAP CLICK → ANALYZE ================= */

  map.on("click", async (e) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const label = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    setMarker(lat, lon, label);
    input.value = label;
    runAnalysis(lat, lon, label);
  });

  /* ================= CORE ANALYSIS FUNCTION ================= */

  async function runAnalysis(lat, lon, label) {
    result.innerHTML = `
      <h4 style="color:#800000;">Analyse bezig…</h4>
      <p><strong>Geselecteerd:</strong> ${label || "Onbekend"}</p>
      <p><strong>Coördinaten:</strong> ${lat.toFixed(5)}, ${lon.toFixed(5)}</p>
      <p>Even geduld, gegevens worden opgehaald…</p>
    `;

    try {
      const adresseParam = encodeURIComponent(label || "");
      const res = await fetch(`/api/analyze?lat=${lat}&lon=${lon}&adresse=${adresseParam}`);
      const data = await res.json();

      if (!data.ok) {
        result.innerHTML = `<p style="color:#c00;"><strong>Fout:</strong> ${data.error || "Onbekende fout"}</p>`;
        return;
      }

      data._debug = { lat, lon, label };
      renderResults(data);
    } catch (e) {
      result.innerHTML = `<p style="color:#c00;"><strong>Verbindingsfout:</strong> ${e.message}</p>`;
    }
  }

  /* ================= RENDER RESULTS ================= */

  function renderResults(data) {
    let html = `<h4 style="color:#800000;">Analyseresultaat</h4>`;

    // Debug info - geselecteerde locatie
    if (data._debug) {
      html += `
        <div style="background:#f0f0f0;padding:8px 12px;border-radius:4px;margin-bottom:12px;font-size:.85em;">
          <strong>Geanalyseerd:</strong> ${data._debug.label || "Onbekend"}<br>
          <strong>Coördinaten:</strong> ${data._debug.lat.toFixed(5)}, ${data._debug.lon.toFixed(5)}
        </div>
      `;
    }

    // Samenvatting
    if (data.summary) {
      if (data.summary.warnings?.length) {
        html += `<div style="background:#fff3cd;border-left:4px solid #ffc107;padding:10px;margin:10px 0;">
          <strong>⚠️ Aandachtspunten:</strong>
          <ul style="margin:5px 0 0 0;padding-left:20px;">
            ${data.summary.warnings.map((w) => `<li>${w}</li>`).join("")}
          </ul>
        </div>`;
      }
      if (data.summary.positives?.length) {
        html += `<div style="background:#d4edda;border-left:4px solid #28a745;padding:10px;margin:10px 0;">
          <strong>✓ Positief:</strong>
          <ul style="margin:5px 0 0 0;padding-left:20px;">
            ${data.summary.positives.map((p) => `<li>${p}</li>`).join("")}
          </ul>
        </div>`;
      }
    }

    // Kadaster
    if (data.cadastre) {
      html += renderSection("Kadaster", data.cadastre, "🗺️");
    }

    // PLU
    if (data.plu) {
      html += renderSection("Bestemmingsplan (PLU)", data.plu, "📋");
    }

    // Georisques
    if (data.georisques) {
      html += renderGeorisques(data.georisques);
    }

    // DVF link
    html += `
      <div style="border:1px solid #ddd;padding:10px;margin:10px 0;border-radius:4px;">
        <strong>💶 Verkoopprijzen (DVF)</strong><br>
        <a href="https://app.dvf.etalab.gouv.fr/?lon=${data.coords.lon}&lat=${data.coords.lat}" 
           target="_blank" style="color:#800000;">
          Bekijk transacties in de omgeving →
        </a>
      </div>
    `;

    // Disclaimer
    html += `
      <p style="font-size:.85em;color:#666;margin-top:15px;padding-top:10px;border-top:1px solid #ddd;">
        ${data.disclaimer}
      </p>
    `;

    result.innerHTML = html;
  }

  function renderSection(title, section, icon) {
    const statusColor =
      section.status === "ok"
        ? "#28a745"
        : section.status === "no_data"
          ? "#ffc107"
          : "#dc3545";

    return `
      <div style="border:1px solid #ddd;padding:10px;margin:10px 0;border-radius:4px;">
        <strong>${icon} ${title}</strong>
        <span style="float:right;color:${statusColor};font-size:.85em;">
          ${section.status === "ok" ? "✓" : section.status === "no_data" ? "–" : "✗"}
        </span>
        <br>
        <span>${section.message}</span>
        ${section.sourceUrl ? `<br><a href="${section.sourceUrl}" target="_blank" style="font-size:.85em;color:#800000;">Officiële bron →</a>` : ""}
      </div>
    `;
  }

  function renderGeorisques(geo) {
    let html = `
      <div style="border:1px solid #ddd;padding:10px;margin:10px 0;border-radius:4px;">
        <strong>⚠️ Risico's (Georisques)</strong>
        <span style="float:right;color:${geo.status === "ok" ? "#28a745" : "#dc3545"};font-size:.85em;">
          ${geo.status === "ok" ? "✓" : "✗"}
        </span>
    `;

    if (geo.catnat) {
      html += `<br><span style="font-size:.9em;">Catnat: ${geo.catnat.message}</span>`;
      if (geo.catnat.types?.length) {
        html += `<br><span style="font-size:.85em;color:#666;">Types: ${geo.catnat.types.join(", ")}</span>`;
      }
    }

    if (geo.risques) {
      html += `<br><span style="font-size:.9em;">Risico's: ${geo.risques.message}</span>`;
      if (geo.risques.types?.length) {
        html += `<br><span style="font-size:.85em;color:#666;">${geo.risques.types.join(", ")}</span>`;
      }
    }

    if (geo.sourceUrl) {
      html += `<br><a href="${geo.sourceUrl}" target="_blank" style="font-size:.85em;color:#800000;">Volledig rapport →</a>`;
    }

    html += `</div>`;
    return html;
  }
})();
