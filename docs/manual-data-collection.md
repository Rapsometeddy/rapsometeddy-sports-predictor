# API-free manual football data collection

This workflow is for **historical and descriptive football research**. It does not publish betting picks, odds, staking advice, or guaranteed outcomes.

## Competition coverage

The catalogue in `data/competitions.csv` is the source of truth for supported competitions. It covers:

### Domestic leagues
- English Premier League
- German Bundesliga
- Spanish La Liga
- Italian Serie A
- French Ligue 1

### Domestic cups
- England: FA Cup and EFL Cup (Carabao Cup)
- Italy: Coppa Italia
- Germany: DFB-Pokal
- Spain: Copa del Rey
- France: Coupe de France

### Continental club competitions
- UEFA Champions League (UCL)
- UEFA Europa League
- UEFA Conference League

### National-team competitions
- FIFA World Cup (men)
- FIFA Women's World Cup
- Africa Cup of Nations (AFCON)
- Copa América

The catalogue is designed to be extended. Add a competition as a separate row; do not merge different competitions into one dataset. Later editions of tournaments must have their own season/edition value.

## Source hierarchy

Use the competition organiser's official website as the primary source for fixtures, final scores, tables and official statistics. Examples:

| Competition | Primary source |
|---|---|
| Premier League | https://www.premierleague.com/ |
| Bundesliga | https://www.bundesliga.com/ |
| La Liga | https://www.laliga.com/ |
| Serie A | https://www.legaseriea.it/ |
| Ligue 1 | https://www.ligue1.com/ |
| UEFA club competitions | https://www.uefa.com/ |
| FA Cup and EFL Cup | https://www.thefa.com/ and https://www.efl.com/ |
| Coppa Italia | https://www.legaseriea.it/ |
| DFB-Pokal | https://www.dfb.de/ |
| Copa del Rey | https://rfef.es/ |
| Coupe de France | https://www.fff.fr/ |
| FIFA World Cup | https://www.fifa.com/ |
| Africa Cup of Nations | https://www.cafonline.com/ |
| Copa América | https://www.conmebol.com/ |

A reputable independent results/statistics publisher may be used as a cross-check, not as an undocumented replacement for the primary source. Check that a page is for the correct competition, season and stage.

## Manual update procedure

1. Open the official competition page and select the correct season or tournament edition.
2. Record the match date, competition ID, home team, away team, full-time home goals, full-time away goals and match status.
3. Record the exact source page URL and collection date/time in `data/source-log-template.csv`.
4. Cross-check each result against a second reputable source. If sources disagree, do not import the row until resolved.
5. Enter verified results in a copy of `data/matches-template.csv`. Keep one row per match.
6. Check competition ID, season/edition, stage, team names, dates, scores, duplicate rows and missing values.
7. Keep source notes. Never silently overwrite a disputed or corrected result; document the correction and its source.
8. Import the reviewed CSV through the app's local CSV import. Export a backup before replacing a local dataset.

## Data quality rules

- Store dates as ISO `YYYY-MM-DD`.
- Store full-time goals as whole numbers greater than or equal to zero.
- Use one consistent team name per competition and season.
- Keep league, domestic cup, continental club and national-team matches distinct.
- Do not combine men's and women's competitions.
- Do not enter a match as completed until the official final result is published.
- Record postponed, abandoned or awarded matches separately until their final status is clear.
- Keep competition ID, competition type, season/edition, stage and source metadata with every dataset.
- Do not invent missing values or infer scores from partial reports.
- Knockout ties may have extra time or penalties. Store the official match score consistently and do not mistake a penalty shoot-out score for the full-time score.

## Refresh cadence

Review domestic competitions after each matchweek and cup competitions after each matchday/round. Review international tournament data after each matchday. A midweek review can capture rescheduled fixtures. The source log makes the latest verified collection date visible.

## No-API guarantee

The manual workflow does not call a football-data API and does not require an API key. The current app's local CSV import remains the data-entry mechanism. Website layouts and access rules can change, so automated page extraction is not assumed. Any future automation must be reviewed for source terms, permission, reliability and test coverage before use.

## Research limitations

Historical descriptive statistics are not proof of future outcomes. League and cup formats differ, and national-team samples should not be mixed with club-team samples. Keep evaluation groups separate by competition type, season and team context; use time-based train/test splits; prevent future information from leaking into earlier records; report sample size and missing-data rates; and do not label a model validated based on a small sample.
