export const config = {
  runtime: 'nodejs20.x'
};

export default function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const q = (url.searchParams.get('q') || url.searchParams.get('code') || '').trim();

  if (!q) {
    res.status(200).json({ error: 'Ontbrekende invoer (postcode of gemeente).' });
    return;
  }

  res.status(200).json({
    query: q,
    samenvatting: {
      status: 'mogelijk',
      zones: ['U', 'AU', 'A', 'N']
    },
    aandachtspunten: {
      risico_aanwezig: false
    },
    wat_nu_doen: [
      'Certificat d’Urbanisme aanvragen',
      'Mairie raadplegen',
      'Officiële documenten controleren'
    ],
    disclaimer:
      'Indicatief. Geen bouwrecht. Definitieve zekerheid via Certificat d’Urbanisme en mairie.'
  });
}
