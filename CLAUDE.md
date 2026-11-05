# CLAUDE.md

Repo: bouwgrond-frankrijk-check

## Wat dit is
Live tool (pagina "Locatieanalyse Frankrijk, Infofrankrijk") die voor een adres, postcode of gemeente in Frankrijk toont of een perceel juridisch geschikt lijkt om op te bouwen, op basis van officiële Franse overheidsdata. De tool geeft context, geen vergunning. Bron: README.md.

## Live adres
Niet in de repo vastgelegd. README.md noemt WordPress/Divi als viewer (embed) en Infofrankrijk.com als doelgroep.

## Opbouw
- index.html: de pagina met kaartweergave en bronnenlijst; laadt Leaflet 1.9.4 van unpkg en /embed.js.
- embed.js: frontend (Leaflet-kaart met OpenStreetMap-tegels, WMTS van data.geopf.fr, adreszoeker via data.geopf.fr/geocodage, aanroep van /api/analyze).
- api/analyze.js: serverless functie; zoekt percelen op via apicarto.ign.fr (cadastre), risico's via georisques.gouv.fr (gaspar catnat en risques) en zonering via apicarto.ign.fr (gpu zone-urba).
- api/check.js: serverless functie die altijd JSON met status 200 teruggeeft en bronverwijzingen levert.
- package.json: alleen naam, versie, private en type module.
- LICENSE en README.md.

## Techniek
Platte HTML en JavaScript in de browser, Vercel serverless functies in Node (ES-modules). Geen afhankelijkheden en geen build.

## Externe diensten en namen van omgevingsvariabelen
- apicarto.ign.fr (cadastre en GPU), georisques.gouv.fr, data.geopf.fr (WMTS en geocodering), OpenStreetMap-tegels, cadastre.gouv.fr, geoportail-urbanisme.gouv.fr, app.dvf.etalab.gouv.fr (links naar bronnen).
- Leaflet via unpkg en Google Fonts.
- Omgevingsvariabelen: geen.

## Hoe het live gaat
README.md noemt een serverless API-proxy op Vercel, met de frontend als embed in WordPress/Divi. Er is geen vercel.json en geen workflow in de repo.

## Regels en besluiten
Bron: README.md.
- De tool geeft geen bouwvergunning, geen exacte prijzen, geen juridisch advies en geen beloftes over bouwrechten.
- Voor zekerheid blijven nodig: Certificat d'Urbanisme, bezoek aan de mairie en notaris of architect.
- De logica en data blijven buiten WordPress; WordPress/Divi is alleen viewer.
- Bronnen zijn officieel: Géoportail de l'Urbanisme, GéoRisques en DVF (data.gouv.fr).
- Status volgens README: v1 actief, v2 (NL-samenvatting en visuele UI) gepland, v3 (premium) toekomst.

Laatst nagelopen: 5 november 2026
