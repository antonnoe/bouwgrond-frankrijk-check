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
    const q = (url.searchParams.get('q') || '').trim();

    if (!q) {
      res.status(200).json({ error: 'Ontbrekende invoer (postcode of gemeente).' });
      return;
    }

    // 1) Urbanisme: check of er een PLU/carte communale bestaat (gemeenteniveau)
    const gpu = await fetchJSON(
      `https://www.geoportail-urbanisme.gouv.fr/api/communecodes?search=${encodeURIComponent(q)}`
    );

    const hasUrbanisme = Array.isArray(gpu) && gpu.length > 0;

    // v1-beslisregel (alleen PLU-aanwezigheid)
    const status = hasUrbanisme ? 'mogelijk' : 'onwaarschijnlijk';

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json({
      query: q,
      samenvatting: {
        status,
        zones: ['U', 'AU', 'A', 'N'] // zonedetail volgt in volgende stap
      },
      aandachtspunten: {
        urbanisme_aanwezig: hasUrbanisme
      },
      wat_nu_doen: [
        'Certificat d’Urbanisme aanvragen',
        'Mairie raadplegen',
        'Officiële documenten controleren'
      ],
      bronnen: [
        'Géoportail de l’Urbanisme'
      ],
      disclaimer:
        'Indicatief. Geen bouwrecht. Definitieve zekerheid via Certificat d’Urbanisme en mairie.'
    });
  } catch (e) {
    res.status(500).json({ error: 'Urbanisme-check mislukt.' });
  }
}
