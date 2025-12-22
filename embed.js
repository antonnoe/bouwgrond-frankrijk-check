(function () {
  const input = document.getElementById("loc");
  const result = document.getElementById("result");
  const suggestBox = document.getElementById("ban-suggest");

  const chkOCS = document.getElementById("chk-ocs");
  const chkB = document.getElementById("chk-buildings");
  const chkT = document.getElementById("chk-transport");
  const chkH = document.getElementById("chk-hydro");

  /* ================= MAP ================= */

  const map = L.map("map").setView([46.6, 2.4], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  let marker = null;
  function setMarker(lat, lon, label) {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map).bindPopup(label).openPopup();
    map.setView([lat, lon], 15);
  }

  /* ===== IGN WMS LAYERS ===== */

  const WMS_URL = "https://wxs.ign.fr/essentiels/geoportail/r/wms";

  const ocs = L.tileLayer.wms(WMS_URL, {
    layers: "OCSGE_2019",
    format: "image/png",
    transparent: true,
  }).addTo(map);

  const buildings = L.tileLayer.wms(WMS_URL, {
    layers: "BATIMENTS",
    format: "image/png",
    transparent: true,
  }).addTo(map);

  const transport = L.tileLayer.wms(WMS_URL, {
    layers: "TRANSPORTS",
    format: "image/png",
    transparent: true,
  });

  const hydro = L.tileLayer.wms(WMS_URL, {
    layers: "HYDROGRAPHIE",
    format: "image/png",
    transparent: true,
  });

  function syncLayers() {
    chkOCS.checked ? map.addLayer(ocs) : map.removeLayer(ocs);
    chkB.checked ? map.addLayer(buildings) : map.removeLayer(buildings);
    chkT.checked ? map.addLayer(transport) : map.removeLayer(transport);
    chkH.checked ? map.addLayer(hydro) : map.removeLayer(hydro);
  }
  [chkOCS, chkB, chkT, chkH].forEach((c) =>
    c.addEventListener("change", syncLayers)
  );

  /* ================= BAN ================= */

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
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            q
          )}&limit=5`
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
               style="padding:6px;cursor:pointer;border-bottom:1px solid #eee;">
            ${f.properties.label}
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
    const label = d.textContent;
    input.value = label;
    suggestBox.style.display = "none";
    setMarker(lat, lon, label);
  });

  /* ================= WOW: CLICK → FEATURE INFO ================= */

  function getFeatureInfoUrl(layer, latlng) {
    const point = map.latLngToContainerPoint(latlng, map.getZoom());
    const size = map.getSize();

    const params = {
      request: "GetFeatureInfo",
      service: "WMS",
      srs: "EPSG:4326",
      styles: "",
      transparent: true,
      version: "1.3.0",
      format: "image/png",
      bbox: map.getBounds().toBBoxString(),
      height: size.y,
      width: size.x,
      layers: layer.wmsParams.layers,
      query_layers: layer.wmsParams.layers,
      info_format: "application/json",
      i: Math.round(point.x),
      j: Math.round(point.y),
    };

    return WMS_URL + L.Util.getParamString(params, WMS_URL, true);
  }

  map.on("click", async (e) => {
    result.innerHTML = `<h4>Analyse op aangeklikte locatie</h4>
      <p><strong>Coördinaat:</strong> ${e.latlng.lat.toFixed(
        5
      )}, ${e.latlng.lng.toFixed(5)}</p>
      <p>Bezig met analyseren…</p>`;

    let lines = [];

    if (chkOCS.checked) {
      try {
        const r = await fetch(getFeatureInfoUrl(ocs, e.latlng));
        const j = await r.json();
        if (j.features?.length) {
          lines.push(
            `<strong>Landgebruik:</strong> ${j.features[0].properties.NATURE}`
          );
        } else {
          lines.push("<strong>Landgebruik:</strong> geen data");
        }
      } catch {
        lines.push("<strong>Landgebruik:</strong> niet beschikbaar");
      }
    }

    if (chkB.checked) {
      try {
        const r = await fetch(getFeatureInfoUrl(buildings, e.latlng));
        const j = await r.json();
        lines.push(
          `<strong>Bebouwing:</strong> ${
            j.features?.length ? "gebouw aanwezig" : "geen gebouw"
          }`
        );
      } catch {
        lines.push("<strong>Bebouwing:</strong> niet beschikbaar");
      }
    }

    result.innerHTML = `
      <h4>Context (indicatief)</h4>
      <ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p><strong>Controleer officieel:</strong></p>
      <ul>
        <li><a target="_blank" href="https://www.geoportail-urbanisme.gouv.fr/">PLU (GPU)</a></li>
        <li><a target="_blank" href="https://www.georisques.gouv.fr/">Risico’s</a></li>
        <li><a target="_blank" href="https://www.cadastre.gouv.fr/">Cadastre</a></li>
      </ul>
      <p style="font-size:.9em;color:#555;">
        Indicatief. Geen bouwrecht. Definitieve zekerheid via Certificat d’Urbanisme en mairie.
      </p>
    `;
  });
})();
