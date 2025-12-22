// /api/analyze.js
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");

  const url = new URL(req.url, `https://${req.headers.host}`);
  const lat = parseFloat(url.searchParams.get("lat"));
  const lon = parseFloat(url.searchParams.get("lon"));

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return res.status(200).json({
      ok: false,
      error: "Ongeldige coördinaten. Geef lat en lon mee.",
    });
  }

  const results = {
    ok: true,
    coords: { lat, lon },
    georisques: null,
    plu: null,
    cadastre: null,
    errors: [],
  };

  // GeoJSON Point voor API Carto calls
  const geoJsonPoint = {
    type: "Point",
    coordinates: [lon, lat],
  };

  // ========== GEORISQUES: CATNAT + RISQUES ==========
  try {
    // Georisques gebruikt latlon=lon,lat (let op: lon eerst!)
    const [catnatRes, risquesRes] = await Promise.all([
      fetch(
        `https://www.georisques.gouv.fr/api/v1/gaspar/catnat?rayon=1000&latlon=${lon},${lat}`
      ),
      fetch(
        `https://www.georisques.gouv.fr/api/v1/gaspar/risques?rayon=1000&latlon=${lon},${lat}`
      ),
    ]);

    const catnat = catnatRes.ok ? await catnatRes.json() : null;
    const risques = risquesRes.ok ? await risquesRes.json() : null;

    const catnatCount = catnat?.data?.length || 0;
    const catnatTypes = catnat?.data
      ? [...new Set(catnat.data.map((c) => c.libelle_risque_jo))]
      : [];

    const risquesList = risques?.data?.[0]?.risques_detail || [];
    const risquesActifs = risquesList
      .filter((r) => r.num_risque)
      .map((r) => r.libelle_risque_long || r.libelle_risque);

    results.georisques = {
      status: "ok",
      catnat: {
        count: catnatCount,
        types: catnatTypes.slice(0, 5),
        message:
          catnatCount > 0
            ? `${catnatCount} arrêté(s) catnat sinds 1982`
            : "Geen catnat-arresten bekend",
      },
      risques: {
        count: risquesActifs.length,
        types: risquesActifs.slice(0, 5),
        message:
          risquesActifs.length > 0
            ? `${risquesActifs.length} risico(s) geïdentificeerd`
            : "Geen bekende risico's",
      },
      sourceUrl: `https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi/rapport?lon=${lon}&lat=${lat}`,
    };
  } catch (e) {
    results.errors.push("georisques: " + e.message);
    results.georisques = {
      status: "error",
      message: "Georisques API niet bereikbaar",
      sourceUrl: "https://www.georisques.gouv.fr/",
    };
  }

  // ========== API CARTO GPU: PLU ZONE ==========
  try {
    const gpuUrl = `https://apicarto.ign.fr/api/gpu/zone-urba?geom=${encodeURIComponent(
      JSON.stringify(geoJsonPoint)
    )}`;

    const gpuRes = await fetch(gpuUrl);

    if (gpuRes.ok) {
      const gpu = await gpuRes.json();
      if (gpu.features?.length) {
        const props = gpu.features[0].properties;
        results.plu = {
          status: "ok",
          zone: props.libelle || props.typezone || "Onbekend",
          typeZone: props.typezone || null,
          destdomi: props.destdomi || null,
          partition: props.partition || null,
          idurba: props.idurba || null,
          message: `Zone: ${props.libelle || props.typezone || "n.v.t."}`,
          sourceUrl: "https://www.geoportail-urbanisme.gouv.fr/",
        };
      } else {
        results.plu = {
          status: "no_data",
          message: "Geen PLU-data beschikbaar (mogelijk RNU-gemeente)",
          sourceUrl: "https://www.geoportail-urbanisme.gouv.fr/",
        };
      }
    } else {
      const errText = await gpuRes.text();
      throw new Error(`HTTP ${gpuRes.status}: ${errText.substring(0, 100)}`);
    }
  } catch (e) {
    results.errors.push("plu: " + e.message);
    results.plu = {
      status: "error",
      message: "PLU-check niet beschikbaar",
      sourceUrl: "https://www.geoportail-urbanisme.gouv.fr/",
    };
  }

  // ========== API CARTO CADASTRE: PARCELLE ==========
  try {
    const cadUrl = `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${encodeURIComponent(
      JSON.stringify(geoJsonPoint)
    )}`;

    const cadRes = await fetch(cadUrl);

    if (cadRes.ok) {
      const cad = await cadRes.json();
      if (cad.features?.length) {
        const props = cad.features[0].properties;
        results.cadastre = {
          status: "ok",
          commune: props.nom_com || null,
          codeInsee: props.code_dep + props.code_com || null,
          section: props.section || null,
          numero: props.numero || null,
          contenance: props.contenance || null,
          feuille: props.feuille || null,
          reference: `${props.section || ""}${props.numero || ""}`,
          message: `Parcelle ${props.section || ""}${props.numero || ""} - ${props.nom_com || "Onbekend"}`,
          sourceUrl: `https://www.cadastre.gouv.fr/scpc/rechercherPlan.do`,
        };
      } else {
        results.cadastre = {
          status: "no_data",
          message: "Geen kadasterdata op dit punt",
          sourceUrl: "https://www.cadastre.gouv.fr/",
        };
      }
    } else {
      const errText = await cadRes.text();
      throw new Error(`HTTP ${cadRes.status}: ${errText.substring(0, 100)}`);
    }
  } catch (e) {
    results.errors.push("cadastre: " + e.message);
    results.cadastre = {
      status: "error",
      message: "Kadaster-check niet beschikbaar",
      sourceUrl: "https://www.cadastre.gouv.fr/",
    };
  }

  // ========== SAMENVATTING ==========
  results.summary = buildSummary(results);
  results.disclaimer =
    "Indicatief. Geen bouwrecht. Definitieve zekerheid uitsluitend via Certificat d'Urbanisme bij de mairie.";

  return res.status(200).json(results);
}

function buildSummary(r) {
  const warnings = [];
  const positives = [];

  // Georisques
  if (r.georisques?.catnat?.count > 5) {
    warnings.push(`Let op: ${r.georisques.catnat.count} catnat-arresten`);
  } else if (r.georisques?.catnat?.count > 0) {
    positives.push(`${r.georisques.catnat.count} catnat-arrest(en) - gemiddeld`);
  }

  if (r.georisques?.risques?.count > 0) {
    warnings.push(`Risico's: ${r.georisques.risques.types.join(", ")}`);
  } else if (r.georisques?.status === "ok") {
    positives.push("Geen bekende natuurrisico's");
  }

  // PLU
  if (r.plu?.status === "ok") {
    const zone = r.plu.typeZone || "";
    if (zone.startsWith("U")) {
      positives.push(`PLU-zone ${r.plu.zone} (bebouwd gebied)`);
    } else if (zone.startsWith("AU")) {
      positives.push(`PLU-zone ${r.plu.zone} (toekomstig bouwgebied)`);
    } else if (zone.startsWith("A")) {
      warnings.push(`PLU-zone ${r.plu.zone} (landbouwzone - restrictief)`);
    } else if (zone.startsWith("N")) {
      warnings.push(`PLU-zone ${r.plu.zone} (natuurzone - zeer restrictief)`);
    } else {
      positives.push(`PLU-zone: ${r.plu.zone}`);
    }
  } else if (r.plu?.status === "no_data") {
    warnings.push("Geen PLU beschikbaar - mogelijk RNU (strenger regime)");
  }

  // Cadastre
  if (r.cadastre?.status === "ok") {
    positives.push(`Perceel: ${r.cadastre.reference} (${r.cadastre.commune})`);
  }

  return { warnings, positives };
}
