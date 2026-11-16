# Rapsometeddy MATCH IQ — Sports Records Lab

Mobile-first, offline-first sports results archive. This project is for historical sporting records and statistics, not wagering or outcome selections.

## Available modules

- Football: competition- and season-separated historical results archive; domestic league standings are calculated only within the selected league and season.
- Table tennis: separate event, discipline, round, participant and games fields.
- Formula 1: separate Grand Prix and session classifications, driver, constructor, position and points.
- Ice hockey: competition-, season- and stage-specific match results.
- Athletics and running: discipline, category, athlete, mark, unit and placing.
- Figure skating: event, discipline, segment, skater/team and score.
- Speed skating: event, distance, category, athlete/team, time and placing.

## Data separation

Each non-football sport has its own CSV schema and local-storage key. Importing or clearing one sport does not modify another sport's archive. Football retains its own competition archive. Do not combine unlike scoring systems, units, event formats, or rankings.

## Using the app

1. Open the sport you want to maintain.
2. Download that sport's CSV template.
3. Add completed, verified historical results and preserve the source_url where available.
4. Import the CSV on the same browser/device.
5. Export regular backups. Browser storage does not sync across devices and can be cleared by the browser.

## Run locally

~~~bash
npm install
npm run dev
~~~

## Data quality and limitations

- Only import records from sources you are permitted to use.
- Keep competition, season/edition, event, discipline, session and category distinctions intact.
- Corrected or provisional results should be clearly noted in your source records.
- Imported data is not independently verified by the app.
- Sport-specific validators check required fields and selected numeric formats; they do not certify official accuracy.
- This app does not provide betting tips, odds, stake sizing, bookmaker links, wagering tools, or guaranteed future outcomes.

## Release status

The feature branch and pull request require a successful production build and manual phone testing before merge or deployment. No merge or deployment should be assumed.
