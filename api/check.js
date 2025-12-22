// /api/check.js
export const config = { runtime: 'nodejs' };

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'bouwgrond-frankrijk-check' } });
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = (url.searchParams.get('q') || url.searchParams.get('code') || '').trim();
    if (!q) {
      res.status(200).json({ error: 'Ontbrekende invoer (postcode of gemeente).' });
      return;
    }

    // 1) Urbanisme: PLU / carte communale (gemeenteniveau)
    const gpu = await fetchJSON(
      `https://www.geoportail-urbanisme.gouv.fr/api/communecodes?search=${encodeURIComponent(q)}`
    );
    const hasUrbanisme = Array.isArray(gpu) && gpu.length > 0;

    // 2) Risico’s: PPRN (gemeenteniveau)
    const geo = await fetchJSON(
      `https://www.georisques.gouv.fr/api/v1/communes?codePostal=${encodeURIComponent(q)}`
    );
    const hasRisques = Array.isArray(geo?.data) && geo.data.length > 0;

    // v1: status volgens afgesproken beslisregels (zonder zonedetail)
    let status = 'onwaarschijnlijk';
    if (hasUrbanisme) status = 'beperkt';
    if (hasUrbanisme) status = 'mogelijk';

    res.setHeader('Cache-Control', 's-maxage=172800, stale-while-revalidate');
    res.status(200).json({
      query: q,
      samenvatting: {
        status,                 // mogelijk | beperkt | onwaarschijnlijk
        zones: ['U', 'AU', 'A', 'N'] // v1 placeholder; zonedetail volgt in B
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
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
