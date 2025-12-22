(function () {
  const input = document.getElementById("loc");
  const btn = document.getElementById("checkBtn");
  const result = document.getElementById("result");
  const suggestBox = document.getElementById("ban-suggest");

  let map = L.map("map").setView([46.6, 2.4], 6);
  let marker = null;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 19,
  }).addTo(map);

  function setMarker(lat, lon, label) {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map);
    if (label) marker.bindPopup(label).openPopup();
    map.setView([lat, lon], 14);
  }

  /* ---------------- BAN AUTOCOMPLETE ---------------- */

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

  /* ---------------- ANALYSE ---------------- */

  btn.addEventListener("click", async function () {
    const q = input.value.trim();
    if (!q) return;

    result.style.display = "block";
    result.innerHTML = "<p>Analyse wordt uitgevoerd…</p>";

    try {
      const r = await fetch(`/api/check?q=${encodeURIComponent(q)}`);
      const data = await r.json();

      let html = `
        <h2 style="color:#800000;">Resultaat</h2>
        <p><strong>Invoer:</strong> ${q}</p>
        <p><strong>Status:</strong> ${data.summary?.status || "indicatief"}</p>
      `;

      for (const [key, item] of Object.entries(data.results || {})) {
        html += `
          <div style="margin-top:12px;border-top:1px solid #eee;padding-top:8px;">
            <strong>${key.toUpperCase()}</strong><br>
            ${item.status}<br>
            ${item.message || ""}
            ${item.sourceUrl ? `<br><a href="${item.sourceUrl}" target="_blank">${item.sourceUrl}</a>` : ""}
          </div>
        `;
      }

      result.innerHTML = html;
    } catch (e) {
      result.innerHTML = "<p>Analyse tijdelijk niet beschikbaar.</p>";
    }
  });
})();
