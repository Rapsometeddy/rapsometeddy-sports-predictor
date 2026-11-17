# Data quality, provenance and recovery

## Product boundary

MATCH IQ is a historical sports-record and descriptive-statistics archive. It is not a betting, wagering, odds, bookmaker, stake-sizing or outcome-selection service.

## General import rules

- Use one CSV file per sport module. Never put football, table tennis, motorsport, hockey, athletics or skating rows in the same file.
- Keep one header row and the exact number of cells for every record row.
- Use UTF-8 CSV. Quote fields containing commas, quotes or line breaks; escape a quote inside a quoted field by doubling it.
- Required fields cannot be blank. Dates, when supplied, use YYYY-MM-DD.
- Use the official competition organiser's published result as the preferred source. Keep the source URL or source ID with the record.
- A source URL or source ID is provenance only. MATCH IQ does not fetch the URL, authenticate the publisher, compare a second source or certify the result.
- Never add a result from memory as if it were verified. Mark uncertain records in your external source notes and do not treat them as complete coverage.
- Do not import scheduled, live, postponed or abandoned events as completed results.

## Sport-specific checks

| Sport | Checks applied |
|---|---|
| Table tennis | Game totals must be whole numbers and cannot be tied; participants must differ; optional winner must match a participant |
| Formula 1 | Position must be a positive place or a recognised classification (NC, DNF, DNS, DSQ, EX); optional points must be non-negative |
| Ice hockey | Goals must be whole non-negative numbers; home and away teams must differ |
| Athletics/running | Mark must be a positive number, with its measurement unit stored separately; place/status must be recognised |
| Figure skating | Score must be a non-negative number; place/status must be recognised |
| Speed skating | Time must use a supported numeric or minutes:seconds format; place/status must be recognised |
| Football | Competition ID, competition type, season, teams, completed-match status and non-negative whole-number goals are required |

The validators catch common format mistakes; they do not prove that a record is factually correct or that all competition-specific edge cases are covered.

## Duplicate and correction handling

- Other-sport modules use a sport-specific event identity that excludes result values. Exact duplicates are skipped; re-importing that same identity with corrected result or provenance fields updates the existing row. Conflicting copies of one identity inside a single CSV are rejected.
- Football matches are identified by competition, season, date (or stage when no date is supplied), home team and away team.
- Re-importing an identical football fixture is skipped. Re-importing the same fixture with a changed score updates the stored score. Conflicting copies of the same fixture inside one CSV are rejected.
- Export a backup before importing a large correction file. Review the import summary before continuing.

## Football source log

The football results CSV stores a source_id. Keep a matching row in data/source-log-template.csv with the source name, URL, checked date, optional second source and verification status. The source log is maintained separately; the web app does not currently join or validate those records automatically.

## Local storage and recovery

- Each non-football sport has a separate browser local-storage key. Football uses its own archive key.
- Data stays in the current browser profile on the current device. There is no server backup, login sync or cross-device sync.
- Export each archive to CSV regularly. Keep a second copy somewhere safe before clearing browser data, changing phones or switching browsers.
- If local storage becomes full, export the archive and remove unneeded records only after checking the backup.
- Clearing a sport is destructive for that sport on that browser. The interface asks for confirmation; export first.
- A browser reset or cleared site data can remove local archives. CSV backups are the recovery path.

## Interpretation limits

- Football league summaries use a simple 3-1-0 points rule and basic sorting by points, goal difference and goals scored. They do not account for deductions, head-to-head rules, fair-play rules or every competition's tie-breaker sequence.
- Other sports include descriptive summaries for the selected competition and season, with discipline/session/stage distinctions preserved. These summaries are not certified official ranking tables.
- No live data feed or automatic collection is configured.
- A historical sample is not a representative sample unless the coverage period and missing records have been checked. Do not describe partial data as a complete season.

## Release gate

Before merging or promoting a release:
1. Run the TypeScript check and production build.
2. Test valid, invalid, malformed and duplicate CSV imports.
3. Test the correction path for football results.
4. Verify sport isolation by importing and clearing one sport while checking another.
5. Export and re-import a backup.
6. Check competition and season filters on a narrow mobile screen.
7. Confirm no synthetic test rows remain in any real archive.
8. Confirm the public description matches the actual features and limitations.
