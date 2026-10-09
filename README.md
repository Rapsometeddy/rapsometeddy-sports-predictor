# Rapsometeddy Sports Predictor

Mobile-first, offline-first football match analysis dashboard.

## Current features
- Manual team inputs: goals scored/conceded averages and recent-form points.
- Educational home/draw/away outcome estimates using a lightweight Poisson model.
- Import historical match results from CSV without connecting a third-party data API.
- Imported history is stored in the browser on the current device.
- Local history can be exported or cleared.
- When enough head-to-head rows exist, historical outcomes are blended into the estimate.
- Responsive purple Rapsometeddy dashboard, designed for phone use.

## CSV format
Required columns: `home_team,away_team,home_goals,away_goals`. Optional column: `date`.
The dashboard includes a downloadable template. Import a dataset you have permission to use; imported data remains in local browser storage unless you export it.

## Run locally
```bash
npm install
npm run dev
``
No football API key or third-party data API is required for the current dashboard. Existing API routes/helpers may remain in the repository but are not called by the homepage.

## Important limitations
These are educational statistical estimates, not betting advice or guaranteed outcomes. The simple model is not validated for forecasting. Check data quality, use time-based train/test splits, and evaluate historical performance before making claims about predictive accuracy. No bookmaker odds, staking tools, or wagering integrations are included.
