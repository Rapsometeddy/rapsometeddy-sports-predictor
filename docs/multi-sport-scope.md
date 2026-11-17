# Multi-sport scope — MATCH IQ

## Product boundary
MATCH IQ is being expanded as a non-wagering sports statistics and results archive. It can organise verified historical results, schedules, standings, athlete/team profiles, event records and source notes. It must not provide betting picks, odds, stake sizing, bookmaker links, wagering tools or claims that an outcome is guaranteed.

## Coverage strategy
Prioritise the highest-level, widely followed competitions in each sport. Add feeder, regional and national competitions only when reliable public results are available and the source can be checked. Do not invent missing data. Each sport has its own data model: a football score, table-tennis game score, F1 classification, skating time and athletics time/distance are not interchangeable.

## Proposed rollout

### Phase 1 — establish reusable sport framework
- Keep football as the first completed sport module, including domestic leagues, domestic cups, continental club competitions and national-team tournaments.
- Add a sport selector and separate competition catalogues.
- Give each sport its own result schema, filters, season/edition, event stage and source log.
- Preserve offline CSV import/export and browser-local storage as the zero-cost baseline. Explain that browser storage does not synchronise across devices and can be cleared by the browser.

### Phase 2 — first additional sports
- Table tennis: WTT top-tier events, ITTF World Championships and team events, continental championships, and Olympic events.
- Formula racing: FIA Formula One World Championship first; include qualifying, sprint and Grand Prix classifications as distinct session types. Add F2/F3 only when verified datasets are available.
- Ice hockey: NHL, IIHF World Championship, Olympic tournament, and major national leagues where reliable results are available.
- Athletics/running: World Athletics Championships, Diamond League meetings, World Cross Country Championships, major road-running championships and Olympic events.
- Ice skating: keep figure skating and speed skating separate. Track figure-skating disciplines and segment scores separately from speed-skating distances and times.

### Phase 3 — additional sports
Consider basketball, rugby, cricket, volleyball, badminton, cycling, swimming, golf and other globally followed sports after the first modules are stable. Add only competitions with dependable, attributable results and enough historical coverage to support meaningful summaries.

### Horse racing boundary
If included at all, horse-racing data is limited to neutral historical sporting records and event classifications. Do not add odds, tips, selections, betting markets, bookmaker links or wagering features.

## Data integrity rules
1. Store sport, competition, season/edition, event, stage/session, participant IDs, result fields and source IDs separately.
2. Keep men's, women's and mixed events distinct where the competition does.
3. Never combine unlike scoring systems or rankings across sports.
4. Record the official source URL, retrieval date, verification status and any secondary source.
5. Mark missing, disputed, provisional and corrected results explicitly.
6. Use only permitted public sources; respect site terms and avoid scraping where it is not allowed.
7. Do not label a dataset complete unless coverage has been checked for the stated dates and competition.
8. Historical summaries describe recorded performance; they are not promises about future results.

## Technical approach
Use a shared shell (navigation, search, filters, source provenance, import/export, accessibility and responsive layout) with sport-specific modules and validators. Store raw imported rows separately from derived standings or summaries so calculations can be reproduced. Keep the initial system API-free and local-first; evaluate any optional service only after checking its free-tier limits, exportability, privacy and terms. No paid service should be activated without explicit approval.

## Release gate
Before a sport module is considered ready: validate its CSV schema, test malformed and duplicate rows, verify calculations against hand-checked examples, confirm season/event separation, document source coverage, and test the phone layout. Do not publish unverified datasets.
