# Rapsometeddy MATCH IQ — Sports Records Lab

Mobile-first, offline-first sports results archive. This project organises completed historical records and descriptive statistics. It is not a wagering or outcome-selection product.

## Available modules

- **Football:** competition- and season-separated results archive. Domestic league summaries are calculated only within the selected domestic league and season.
- **Table tennis:** singles, doubles, mixed and team events have distinct event/discipline/round fields; game totals are validated.
- **Formula 1:** Grand Prix, sprint, qualifying and practice classifications are recorded as separate session rows.
- **Ice hockey:** competition, season, stage and match scores are kept together; goal totals are validated.
- **Athletics and running:** discipline, category, mark, unit and placing remain explicit.
- **Figure skating:** event, discipline, segment, score and placing remain explicit.
- **Speed skating:** event, distance, category, time and placing remain explicit.

## Data separation

Each non-football sport has its own CSV schema and browser-local storage key. Football has a separate archive. Importing or clearing one sport does not modify another sport's archive. Filters let you inspect one competition and season at a time. Do not combine unlike scoring systems, units, event formats, disciplines, or rankings.

## Import quality checks

- CSV headers must be unique and include the sport's required fields.
- Rows must have the same number of cells as the header; malformed quotes and incomplete required values are rejected.
- Dates, numeric scores, places, times and source URLs are checked using sport-specific rules.
- Duplicate records within an import and against the existing archive are skipped.
- Football imports can update an existing fixture when its score has been corrected; conflicting duplicate fixtures inside the same file are rejected.
- Source URLs and source IDs are provenance fields, not proof that a result is official. The app does not independently verify imported data.
- Only import completed results. Do not label a dataset complete unless you have checked its competition and date coverage.

## Using the app

1. Open the sport or football archive you want to maintain.
2. Download that module's CSV template.
3. Add completed historical results, preserving source URLs or source IDs.
4. Import the CSV. Correct any validation message before retrying.
5. Filter by competition and season before reviewing records or tables.
6. Export regular CSV backups and keep the separate football source log with your match archive.

## Storage and privacy

- Records are stored in browser local storage on the current device and browser profile.
- There is no cloud sync, account database, or automatic cross-device backup.
- Clearing browser data, changing browsers, or using a different phone can make local records unavailable.
- Export backups before clearing an archive or changing devices. Store backups somewhere you control.

## Statistics and limitations

Football league summaries use a simple 3–1–0 points rule and sort by points, goal difference and goals scored. They do not account for points deductions or every competition-specific tie-breaker, so they are research summaries, not certified official tables.

The other sport modules currently provide validated record storage, filters and source-provenance visibility; they do not yet calculate complete sport-specific rankings or collect live results automatically. No live feed or paid API is configured.

## Run locally

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Product boundary

This is a historical sports records and statistics archive. It does not provide betting tips, odds, staking advice, bookmaker links, wagering tools, or guaranteed future outcomes.
