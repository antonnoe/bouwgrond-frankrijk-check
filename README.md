# Bouwgrond Frankrijk Check

Live tool voor Nederlandstaligen die willen weten of een perceel in Frankrijk
juridisch geschikt is om op te bouwen.

Deze tool combineert officiële Franse overheidsdata tot één overzichtelijk
antwoord per postcode of gemeente.

## Voor wie is deze tool?

- Nederlanders en Vlamingen die bouwgrond zoeken in Frankrijk
- Kopers die vóór aankoop risico’s willen uitsluiten
- Lezers van Infofrankrijk.com
- Gebruikers die geen giswerk willen, maar officiële bronnen

## Wat doet de tool?

De tool controleert, op basis van een postcode of gemeentenaam:

1. Of de gemeente beschikt over een PLU of carte communale
2. Of bekende risicogebieden van toepassing zijn (PPRN)
3. Of er historische grondtransacties bekend zijn (indicatief)
4. Welke officiële bronnen hierbij horen

De tool geeft **context**, geen vergunning.

## Wat doet de tool nadrukkelijk niet?

- Geen bouwvergunning afgeven
- Geen exacte prijzen voorspellen
- Geen juridisch advies vervangen
- Geen beloftes doen over bouwrechten

Voor definitieve zekerheid blijft altijd nodig:
- Certificat d’Urbanisme
- Bezoek aan de mairie
- Notaris / architect

## Bronnen (officieel)

- Géoportail de l’Urbanisme (PLU, zonering)
- GéoRisques (risicogebieden)
- DVF / data.gouv.fr (historische transacties)

## Architectuur (hoog niveau)

- Serverless API-proxy (Vercel)
- Frontend embed (HTML/JS)
- WordPress/Divi fungeert alleen als viewer

De logica en data blijven buiten WordPress.

## Status

- v1: technisch fundament + basisdata (actief)
- v2: NL-samenvatting + visuele UI (gepland)
- v3: premium functies & uitbreiding (toekomst)
