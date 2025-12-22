// /api/check.js
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // 🚨 ABSOLUTE REGEL: deze API geeft ALTIJD JSON + 200
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const safeJson = (obj) => {
    res.status(200).end(JSON.stringify(obj));
  };

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = (url.searchParams.get("q") || "").trim();

    if (!q) {
      return safeJson({
        ok: false,
        error: "Ontbrekende invoer (postcode, plaats of adres).",
        fallback: true,
      });
    }

    // ⛔ GEEN live externe API-calls meer in v1
    // Alles is indicatief + autonomiegericht

    return safeJson({
      ok: true,
      query: q,

      summary: {
        status: "indicatief",
        note:
          "Automatische checks kunnen tijdelijk niet beschikbaar zijn. Gebruik de officiële links per onderdeel.",
      },

      results: {
        plu: {
          status: "momenteel niet beschikbaar",
          message:
            "Automatische PLU-check is technisch instabiel. Gebruik de officiële bron handmatig.",
          sourceUrl: "https://www.geoportail-urbanisme.gouv.fr/",
        },
        risk: {
          status: "beschikbaar",
          message:
            "Risico-informatie is beschikbaar via de officiële kaartviewer.",
          sourceUrl: "https://www.georisques.gouv.fr/",
        },
        context: {
          status: "beschikbaar",
          message:
            "Planologische context kan via de officiële IGN-kaart bekeken worden.",
          sourceUrl: "https://www.geoportail.gouv.fr/",
        },
        cad: {
          status: "beschikbaar",
          message:
            "Perceelinformatie is beschikbaar via het Franse kadaster.",
          sourceUrl: "https://www.cadastre.gouv.fr/",
        },
      },

      wat_nu_doen: [
        "Controleer planologische status via Géoportail de l’Urbanisme",
        "Bekijk risico’s via GéoRisques",
        "Analyseer omgeving via IGN kaartviewer",
        "Vraag altijd een Certificat d’Urbanisme aan bij de mairie",
      ],

      disclaimer:
        "Indicatief. Geen bouwrecht. Definitieve zekerheid uitsluitend via Certificat d’Urbanisme en mairie.",
    });
  } catch (e) {
    // 🔒 LAATSTE VANGNET — zelfs dit mag nooit breken
    return safeJson({
      ok: false,
      error: "Interne fout (afgevangen).",
      fallback: true,
    });
  }
}
