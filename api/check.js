export default async function handler(req, res) {
  const q = (req.query.q || req.query.code || '').toString().trim();
  if (!q) {
    res.status(400).json({ error: 'Ontbrekende invoer (postcode of gemeente).' });
    return;
  }

  const fetchJSON = async (url) => {
    const r = await fetch(url, { headers: { 'User-Agent': 'Bouwgrond-Check-NLFR' } });
    if (!r.ok) throw new Error(`Fetch fout ${r.status}`);
    return r.json();
  };

  try {
    // Urbanisme (PLU / carte communale – gemeentelijk)
    const urbanisme = await fetchJSON(
      `https://www.geoportail-urbanisme.gouv.fr/api/communecodes?search=${encodeURIComponent(q)}`
    );

    // Risico’s (PPRN – gemeentelijk)
    const risques = await fetchJSON(
      `https://www.georisques.gouv.fr/api/v1/communes?codePostal=${encodeURIComponent(q)}`
    );

    // Beslisregels v1 (samengevat, indicatief)
    const hasUrbanisme = Array.isArray(urbanisme) && urbanisme.length > 0;
    const hasRisques = Array.isArray(risques?.data) && risques.data.length > 0;

    let status = 'onwaarschijnlijk';
    if (hasUrbanisme) status = 'beperkt';
    if (hasUrbanisme) status = 'mogelijk';

    const out = {
      query: q,
      samenvatting: {
        status, // mogelijk | beperkt | onwaarschijnlijk
        zones: ['U', 'AU', 'A', 'N'] // placeholder v1
      },
      aandachtspunten: {
        risico_aanwezig: hasRisques
      },
      wat_nu_doen: [
        'Certificat d’Urbanisme aanvragen',
        'Mairie raadplegen',
        'Officiële documenten controleren'
      ],
      bronnen: [
        'Géoportail de l’Urbanisme',
        'GéoRisques',
        'Service-public.fr'
      ],
      disclaimer:
        'Indicatief. Geen bouwrecht. Definitieve zekerheid via Certificat d’Urbanisme en mairie.'
    };

    res.setHeader('Cache-Control', 's-maxage=172800, stale-while-revalidate');
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
