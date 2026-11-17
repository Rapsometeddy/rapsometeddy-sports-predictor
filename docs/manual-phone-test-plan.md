# MATCH IQ manual phone test plan

Use a preview build and synthetic test rows only. These examples are fake and must never be presented as real sporting results.

## 1. Phone layout

- Open the preview on a Samsung phone in portrait mode.
- Check the title, status line, sport selector, import controls, filters and tables.
- Confirm controls are easy to tap, text does not overlap, and wide tables scroll horizontally.
- Rotate to landscape and return to portrait.

## 2. Sport isolation

1. Open Table tennis and import one synthetic row from its template.
2. Switch to Formula 1 and confirm it starts with its own archive.
3. Import one synthetic Formula 1 row.
4. Return to Table tennis and confirm its row remains.
5. Clear only Formula 1 after exporting a backup; confirm the Table tennis row remains.

Repeat this check between football and at least one non-football module.

## 3. Synthetic row examples

Create each file from the in-app template and keep the header exactly as downloaded. The following values are test-only placeholders.

**Table tennis**
```csv
date,competition,season,event,discipline,round,participant_a,participant_b,games_a,games_b,winner,source_url
2026-01-01,Test Open,2026,Test Event,Singles,Final,Player A,Player B,4,2,Player A,https://example.org/source
```

**Formula 1**
```csv
date,competition,season,grand_prix,session,driver,constructor,position,points,status,source_url
2026-01-01,Test Series,2026,Test Grand Prix,Race,Driver A,Team A,1,25,Finished,https://example.org/source
```

**Ice hockey**
```csv
date,competition,season,stage,home_team,away_team,home_goals,away_goals,status,source_url
2026-01-01,Test League,2026,Regular Season,Team A,Team B,3,2,Finished,https://example.org/source
```

**Athletics**
```csv
date,competition,season,meeting,discipline,category,athlete,country,mark,unit,place,source_url
2026-01-01,Test Meet,2026,Test Meet,100m,Men,Runner A,ZA,10.50,s,1,https://example.org/source
```

**Figure skating**
```csv
date,competition,season,event,discipline,segment,skater_or_team,country,score,place,source_url
2026-01-01,Test Event,2026,Test Event,Women,Free Skate,Skater A,ZA,150.25,1,https://example.org/source
```

**Speed skating**
```csv
date,competition,season,event,distance,category,athlete_or_team,country,time,place,source_url
2026-01-01,Test Cup,2026,Test Meet,500m,Women,Skater A,ZA,37.85,1,https://example.org/source
```

## 4. Football test rows

Use the football template. Import one completed result, then import the same row again. The second import should be reported as a duplicate.

```csv
date,competition_id,competition_name,competition_type,region,season,stage,home_team,away_team,home_goals,away_goals,match_status,source_id
2026-01-01,TEST_LEAGUE,Test League,domestic_league,Test,2025-26,Round 1,Team A,Team B,2,1,FINISHED,TEST-001
```

Change the home score from 2 to 3 and re-import the same fixture. The existing fixture should be updated rather than added as a second match. Check the displayed table summary.

## 5. Validation checks

Try one test at a time and confirm the import is rejected with a clear message:

- Remove a required column.
- Leave a required cell blank.
- Add an extra cell to one row.
- Break a quoted field or leave a quote unclosed.
- Enter a negative goal total.
- Enter an invalid date such as 2026-02-31.
- Enter an invalid source URL such as javascript:alert(1).
- For table tennis, make both game totals equal.
- For athletics, enter a non-numeric mark.
- For speed skating, enter an invalid time.

## 6. Filters, exports and recovery

- Import two competitions and two seasons in one sport; filter to one competition and one season.
- Export the archive and check that the CSV opens with the expected headers and rows.
- Re-import the exported CSV; it should not create duplicate rows.
- Clear one sport only after exporting. Confirm other sport archives remain.
- Export the football archive and keep its separate source log with it.

## 7. Sign-off

Do not merge or promote the branch until the TypeScript check and production build pass, the above manual checks pass on the phone, and all synthetic test rows have been removed.
