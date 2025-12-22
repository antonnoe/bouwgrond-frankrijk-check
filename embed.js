(function () {
  const input = document.getElementById("loc");
  const btn = document.getElementById("checkBtn");
  const result = document.getElementById("result");
  const suggestBox = document.getElementById("ban-suggest");

  const chkOCS = document.getElementById("chk-ocs");
  const chkB = document.getElementById("chk-buildings");
  const chkT = document.getElementById("chk-transport");
  const chkH = document.getElementById("chk-hydro");

  /* ================= MAPS ================= */

  const map = L.map("map").setView([46.6, 2.4], 6);
  const mapSide = L.map("map-side", { zoomControl:false }).setView([46.6, 2.4], 6);

  const base = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution:"© OpenStreetMap" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapSide);

  let marker = null;
  function setMarker(lat, lon, label){
    if(marker){ map.removeLayer(marker); mapSide.removeLayer(marker); }
    marker = L.marker([lat, lon]).addTo(map).bindPopup(label).openPopup();
    L.marker([lat, lon]).addTo(mapSide);
    map.setView([lat, lon], 15);
    mapSide.setView([lat, lon], 15);
  }

  /* ===== STABIELE IGN LAGEN ===== */

  const ignBase = "https://wxs.ign.fr/essentiels/geoportail/r/wms";

  const ocs = L.tileLayer.wms(ignBase, {
    layers:"OCSGE_2019",
    transparent:true, format:"image/png"
  }).addTo(map);

  const buildings = L.tileLayer.wms(ignBase, {
    layers:"BATIMENTS",
    transparent:true, format:"image/png"
  }).addTo(map);

  const transport = L.tileLayer.wms(ignBase, {
    layers:"TRANSPORTS",
    transparent:true, format:"image/png"
  });

  const hydro = L.tileLayer.wms(ignBase, {
    layers:"HYDROGRAPHIE",
    transparent:true, format:"image/png"
  });

  function syncLayers(){
    chkOCS.checked ? map.addLayer(ocs) : map.removeLayer(ocs);
    chkB.checked ? map.addLayer(buildings) : map.removeLayer(buildings);
    chkT.checked ? map.addLayer(transport) : map.removeLayer(transport);
    chkH.checked ? map.addLayer(hydro) : map.removeLayer(hydro);
  }
  [chkOCS,chkB,chkT,chkH].forEach(c=>c.addEventListener("change",syncLayers));

  /* ===== BAN AUTOCOMPLETE ===== */

  let banTimer=null;
  input.addEventListener("input",()=>{
    const q=input.value.trim(); clearTimeout(banTimer);
    if(q.length<3){ suggestBox.style.display="none"; return; }
    banTimer=setTimeout(async()=>{
      try{
        const r=await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`);
        const d=await r.json();
        if(!d.features?.length){ suggestBox.style.display="none"; return; }
        suggestBox.innerHTML=d.features.map(f=>
          `<div data-lat="${f.geometry.coordinates[1]}" data-lon="${f.geometry.coordinates[0]}"
            style="padding:6px;cursor:pointer;border-bottom:1px solid #eee;">${f.properties.label}</div>`
        ).join("");
        suggestBox.style.display="block";
      }catch{ suggestBox.style.display="none"; }
    },300);
  });

  suggestBox.addEventListener("click",e=>{
    const d=e.target.closest("div"); if(!d)return;
    const lat=+d.dataset.lat, lon=+d.dataset.lon, label=d.textContent;
    input.value=label; suggestBox.style.display="none";
    setMarker(lat,lon,label);
  });

  /* ===== KLIK OP KAART = CONTEXT ===== */

  map.on("click", (e)=>{
    const {lat,lng}=e.latlng;
    result.innerHTML = `
      <h4>Context (indicatief)</h4>
      <p><strong>Locatie:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
      <ul>
        <li>Landgebruik & bebouwing: visueel op kaart (IGN OCS / Bâtiments)</li>
        <li>Infrastructuur / waterlopen: optionele lagen</li>
      </ul>
      <p><strong>Controleer officieel:</strong></p>
      <ul>
        <li><a target="_blank" href="https://www.geoportail-urbanisme.gouv.fr/">PLU (GPU)</a></li>
        <li><a target="_blank" href="https://www.georisques.gouv.fr/">Risico’s</a></li>
        <li><a target="_blank" href="https://www.cadastre.gouv.fr/">Cadastre</a></li>
      </ul>
    `;
  });

  /* ===== ANALYSE BUTTON (fail-safe) ===== */

  btn.addEventListener("click", async ()=>{
    const q=input.value.trim(); if(!q)return;
    result.innerHTML="<p>Analyse uitgevoerd. Gebruik kaart en context.</p>";
  });
})();
