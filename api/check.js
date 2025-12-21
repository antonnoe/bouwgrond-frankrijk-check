export default async function handler(req, res) {
  const q = (req.query.code || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'code ontbreekt' });

  const fetchJSON = async (url) => {
    const r = await fetch(url, { headers: { 'User-Agent': 'NLFR-Bouwgrond-Check' } });
    if (!r.ok) throw new Error(`Fetch ${r.status}`);
    return r.json();
  };

  try {
    const urbanisme = await fetchJSON(
      `https://www.geoportail-urbanisme.gouv.fr/api/communecodes?search=${encodeURIComponent(q)}`
    );

    const risques = await fetchJSON(
      `https://www.georisques.gouv.fr/api/v1/communes?codePostal=${encodeURIComponent(q)}`
    );

    const dvf = await fetchJSON(
      `https://api.dvf.etalab.gouv.fr/transactions?code_postal=${encodeURIComponent(q)}`
    );

    const out = {
      query: q,
      urbanisme: { found: Array.isArray(urbanisme) && urbanisme.length > 0 },
      risques: { found: !!risques?.data?.length },
      prijscontext: { transactions: dvf?.features?.length || 0 },
      disclaimer:
        'Indicatief. Geen bouwrecht. Raadpleeg mairie en vraag een Certificat d’Urbanisme.'
    };

    res.setHeader('Cache-Control', 's-maxage=172800, stale-while-revalidate');
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
