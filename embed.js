(function () {
  const input = document.getElementById("loc");
  const btn = document.getElementById("checkBtn");
  const result = document.getElementById("result");
  const suggestBox = document.getElementById("ban-suggest");

  /* ================= MAP ================= */

  const map = L.map("map").setView([46.6, 2.4], 6);

  const baseOSM = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap" }
  ).addTo(map);

  // ---- STABIELE CARTO / IGN LAGEN ----
  const ignOCS = L.tileLayer.wms(
    "https://wxs.ign.fr/essentiels/geoportail/r/wms",
    {
      layers: "OCSGE_2019",
      format: "image/png",
      transparent: true,
      attribution: "IGN – Occupation du sol",
    }
  );

  const ignBuildings = L.tileLayer.wms(
    "https://wxs.ign.fr/essentiels/geoportail/r/wms",
    {
      layers: "BATIMENTS",
      format: "image/png",
      transparent: true,
      attribution: "IGN – Bâtiments",
    }
  );

  const ignTransport = L.tileLayer.wms(
    "https://wxs.ign.fr/essentiels/geoportail/r/wms",
    {
      layers: "TRANSPORTS",
      format: "image/png",
      transparent: true,
      attribution: "IGN – Infrastructuur",
    }
  );

  const ignHydro = L.tileLayer.wms(
    "https://wxs.ign.fr/essentiels/geoportail/r/wms",
    {
      layers: "HYDROGRAPHIE",
      format: "image/png",
      transparent: true,
      attribution: "IGN – Waterlopen",
    }
  );

  const overlays = {
    "Landgebruik (OCS)": ignOCS,
    "Bebouwing": ignBuildings,
    "Infrastructuur": ignTransport,
    "Waterlopen": ignHydro,
  };

  L.control.layers(null, overlays, { collapsed: false }).addTo(map);

  let marker = null;
  function setMarker(lat, lon, label) {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map);
    if (label) marker.bindPopup(label).openPopup();
    map.setView([lat, lon], 14);
  }

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
        const data = await r.json();

        if (!data.features || !data.features.length) {
          suggestBox.style.display = "none";
          return;
        }

        suggestBox.innerHTML = data.features
          .map(
            (f) =>
              `<div data-lat="${f.geometry.coordinates[1]}"
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

  suggestBox.addEventListener("click", function (e) {
    const d = e.target.closest("div");
    if (!d) return;

    const lat = parseFloat(d.dataset.lat);
    const lon = parseFloat(d.dataset.lon);
    const label = d.textContent;

    input.value = label;
    suggestBox.style.display = "none";
    setMarker(lat, lon, label);
  });

  /* ================= ANALYSE / LINKS ================= */

  btn.addEventListener("click", async function () {
    const q = input.value.trim();
    if (!q) return;

    result.style.display = "block";
    result.innerHTML = `
      <h2 style="color:#800000;">Resultaat & vervolgstappen</h2>
      <p><strong>Locatie:</strong> ${q}</p>

      <h3>Automatische analyse</h3>
      <p>Deze tool toont stabiele contextlagen op de kaart. Voor juridische zekerheid gebruik je de officiële bronnen hieronder.</p>

      <h3>Officiële bronnen (handmatig)</h3>
      <ul>
        <li>
          <a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank">
            Géoportail de l’Urbanisme (PLU / zonering)
          </a>
        </li>
        <li>
          <a href="https://www.georisques.gouv.fr/" target="_blank">
            GéoRisques (overstroming, bosbrand, bodem)
          </a>
        </li>
        <li>
          <a href="https://www.cadastre.gouv.fr/" target="_blank">
            Cadastre (perceelgegevens)
          </a>
        </li>
        <li>
          <a href="https://www.geoportail.gouv.fr/" target="_blank">
            IGN kaartviewer (volledig)
          </a>
        </li>
      </ul>

      <p style="font-size:.9em;color:#555;">
        Indicatief. Geen bouwrecht. Definitieve zekerheid via
        <strong>Certificat d’Urbanisme</strong> en de <strong>mairie</strong>.
      </p>
    `;
  });
})();
