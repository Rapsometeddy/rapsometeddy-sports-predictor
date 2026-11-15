# API-free manual football data collection

This workflow is for **historical and descriptive football research**. It does not publish betting picks, odds, staking advice, or guaranteed predictions.

## Scope

Initial competitions:
- English Premier League
- German Bundesliga
- Spanish La Liga
- Italian Serie A
- French Ligue 1

## Source hierarchy

Use the competition organiser's official website as the primary source for fixtures, final scores, tables and official competition statistics:

| Competition | Primary source |
|---|---|
| Premier League | https://www.premierleague.com/ |
| Bundesliga | https://www.bundesliga.com/ |
| La Liga | https://www.laliga.com/ |
| Serie A | https://www.legaseriea.it/ |
| Ligue 1 | https://www.ligue1.com/ |

A reputable independent results/statistics publisher may be used as a cross-check, not as an undocumented replacement for the primary source.

## Manual update procedure

1. Open the official competition page and select the correct season.
2. Record only information visible on the page: match date, home team, away team, full-time home goals, full-time away goals, and competition.
3. Record the exact source page URL and the date/time the information was collected in `data/source-log-template.csv`.
4. Cross-check the result against a second reputable source. If the sources disagree, do not import the row until the discrepancy is resolved.
5. Enter verified results in a copy of `data/matches-template.csv`. Keep one row per match.
6. Check team names, dates, scores, duplicate rows and missing values before import.
7. Keep the original source notes. Never silently overwrite a disputed or corrected result; document the correction and its source.
8. Import the reviewed CSV through the app's local CSV import. Export a backup before replacing a local dataset.

## Data quality rules

- Store dates as ISO `YYYY-MM-DD`.
- Store full-time goals as whole numbers greater than or equal to zero.
- Use one consistent team name per club within a competition and season.
- Do not mix league matches with cup or friendly matches.
- Do not enter a match as completed until the official final result is published.
- Record postponed, abandoned or awarded matches separately until their final status is clear.
- Keep competition, season and source metadata with every dataset.
- Do not invent missing values or infer scores from partial reports.

## Refresh cadence

For a small, reliable manual workflow, review each league's official results after its matchweek has finished. A midweek review can capture rescheduled fixtures. The source log makes the latest verified collection date visible.

## No-API guarantee

The manual workflow does not call a football-data API and does not require an API key. The current app's local CSV import remains the data entry mechanism. Website layouts and access rules can change, so automated page extraction is not assumed. Any future automation must be reviewed for source terms, permission, reliability and test coverage before use.

## Research limitations

Historical descriptive statistics are not proof of future outcomes. Keep training and evaluation periods separate, prevent future information from leaking into earlier records, report sample size and missing-data rates, and do not label a result as validated based on a small sample.
