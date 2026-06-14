# ⚽ BLOW Poule — Nederland 🟧 – 🎌 Japan (WK 2026)

Live dashboard voor de voorspellingspoule. De stand wordt **automatisch live**
opgehaald van de gratis [ESPN-API](https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard)
(geen sleutel nodig, ververst elke 15 seconden) en de ranglijst rekent direct mee.

➡️ **Live site:** _zie GitHub Pages-URL in de repo-instellingen_

## Hoe het telt
| Onderdeel | Punten |
|---|---|
| Eerste doelpuntenmaker goed | 5 |
| Minuut 1e goal — exact / 1 ernaast / 2-3 ernaast | 4 / 2 / 1 |
| Eindstand exact | 6 |
| Juiste uitslag (winst/gelijk/verlies), verkeerde cijfers | 2 |

De namen op het briefje zijn achternamen ("Gakpo", "Rijnders"); ESPN geeft
volledige namen. De match is slim: achternaam-vergelijking met tolerantie voor
één tikfout (zo telt "Rijnders" ook voor _Tijjani Reijnders_).

## Databron-schakelaar
- **Automatisch (standaard):** live van ESPN.
- **Handmatig:** zet de schakelaar "handmatig" aan om zelf goals in te tikken of
  een ESPN-fout te corrigeren — bijvoorbeeld als je sneller bent dan de API.
  "⤓ Overnemen van ESPN" kopieert de huidige live stand als startpunt.

## Bestanden
- `index.html` — het dashboard
- `live.js` — ophalen + omzetten van ESPN-data (`mapScoreboard` is puur/testbaar)
- `scoring.js` — puntenregels, naam-matching en ranglijst
- `predictions.js` — de inzendingen + spelerslijst
- `test.js` — `node test.js` (scoring, naam-matching, live-mapping op echte data)

## Lokaal draaien
```bash
python3 -m http.server 8000   # open http://localhost:8000
node test.js                  # tests
```

Gebouwd met [Claude Code](https://claude.com/claude-code).
