# Sport-specific CSV schemas

All CSV files use UTF-8 with one header row. Fields containing commas, quotes or line breaks must be quoted; embedded quotes are doubled. Each file belongs to one sport only. Required columns and cell counts are checked before the import is saved.

## Table tennis

Required: competition, season, event, discipline, round, participant_a, participant_b, games_a, games_b.

Optional: date, winner, source_url. Dates use YYYY-MM-DD. Game totals must be whole numbers and cannot be tied. Participants must differ. If winner is supplied, it must match one of the participants. Keep singles, doubles, mixed and team competitions distinct.

## Formula 1

Required: competition, season, grand_prix, session, driver, constructor, position, status.

Optional: date, points, source_url. Session values should distinguish practice, qualifying, sprint and race. Position must be a positive place or a classification such as NC, DNF, DNS, DSQ or EX. Points, when supplied, must be non-negative.

## Ice hockey

Required: competition, season, stage, home_team, away_team, home_goals, away_goals.

Optional: date, status, source_url. Goals are whole non-negative numbers and teams must differ. Keep regular season, playoffs, divisions and international tournament stages separate.

## Athletics and running

Required: competition, season, meeting, discipline, category, athlete, mark, unit, place.

Optional: date, country, source_url. Mark must be a positive number; its measurement unit is a separate field. Never compare marks with different disciplines or units.

## Figure skating

Required: competition, season, event, discipline, segment, skater_or_team, score, place.

Optional: date, country, source_url. Score must be a non-negative number. Keep short program, free skate and total classifications distinct.

## Speed skating

Required: competition, season, event, distance, category, athlete_or_team, time, place.

Optional: date, country, source_url. Time uses a numeric or minutes:seconds representation. Keep distances, relays and categories separate.

## Football

Required: competition_id, competition_type, season, home_team, away_team, home_goals, away_goals, match_status.

Optional: date, competition_name, region, stage, source_id. Scores must be whole non-negative numbers. Only completed statuses such as FINISHED, COMPLETED, FT, AET or PEN are accepted. Competition and season are required so standings cannot accidentally combine unrelated editions. A source_id should match a separate row in data/source-log-template.csv.

## Provenance and isolation

A source_url or source_id records where the user says the result came from; it is not an automatic verification. The app does not fetch or authenticate the source. Each non-football sport has a distinct browser storage key. Import, export and clearing operate only on the selected sport. The football competition archive remains separate from these six modules.

## Important limitation

Validators catch common format mistakes; they cannot guarantee official accuracy, completeness or coverage. Review imported data against permitted official sources and export backups regularly.
