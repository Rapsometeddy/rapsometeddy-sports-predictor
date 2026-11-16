# Sport-specific CSV schemas

All CSV files use UTF-8, a header row, commas as separators and double quotes for fields containing commas. Every record should retain a source URL when available. Do not mix rows from different sports in one file.

## Table tennis
Required: competition, season, event, discipline, round, participant_a, participant_b, games_a, games_b.
Optional: date, winner, source_url. Games are whole numbers. Keep singles, doubles, mixed and team competitions distinct.

## Formula 1
Required: competition, season, grand_prix, session, driver, constructor, position, status.
Optional: date, points, source_url. Session values should distinguish practice, qualifying, sprint and race. Position may be a number or a classification such as DNF, DNS, NC or DSQ.

## Ice hockey
Required: competition, season, stage, home_team, away_team, home_goals, away_goals.
Optional: date, status, source_url. Goals are whole numbers. Keep regular season, playoffs and international tournament stages separate.

## Athletics and running
Required: competition, season, meeting, discipline, category, athlete, mark, unit, place.
Optional: date, country, source_url. Never compare marks with different disciplines or units.

## Figure skating
Required: competition, season, event, discipline, segment, skater_or_team, score, place.
Optional: date, country, source_url. Keep short program, free skate and total classifications distinct.

## Speed skating
Required: competition, season, event, distance, category, athlete_or_team, time, place.
Optional: date, country, source_url. Keep distances, relays and categories separate.

## Isolation
Each sport has a distinct browser storage key. Import/export, duplicate checks and clearing operate only on the selected sport. The football competition archive remains separate from these six modules.
