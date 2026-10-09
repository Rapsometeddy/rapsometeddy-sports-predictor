"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type HistoricalMatch = { home_team: string; away_team: string; home_goals: number; away_goals: number; date?: string };
type Inputs = { homeName: string; awayName: string; homeGF: string; homeGA: string; awayGF: string; awayGA: string; homeForm: string; awayForm: string };
type Probabilities = { home: number; draw: number; away: number; expectedHome: number; expectedAway: number; sample: number };

const STORAGE_KEY = "rapsometeddy-local-match-history-v1";
const initial: Inputs = { homeName: "Home Team", awayName: "Away Team", homeGF: "1.6", homeGA: "1.0", awayGF: "1.2", awayGA: "1.3", homeForm: "8", awayForm: "6" };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const normalise = (s: string) => s.trim().toLocaleLowerCase();

function poisson(lambda: number, k: number) {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial;
}
function estimate(input: Inputs, history: HistoricalMatch[]): Probabilities {
  const homeName = normalise(input.homeName), awayName = normalise(input.awayName);
  const h2h = history.filter(m =>
    (normalise(m.home_team) === homeName && normalise(m.away_team) === awayName) ||
    (normalise(m.home_team) === awayName && normalise(m.away_team) === homeName)
  );
  let homeGF = Number(input.homeGF), homeGA = Number(input.homeGA);
  let awayGF = Number(input.awayGF), awayGA = Number(input.awayGA);
  const teamStats = (name: string) => {
    const rows = history.filter(m => normalise(m.home_team) === name || normalise(m.away_team) === name);
    if (!rows.length) return null;
    let scored = 0, conceded = 0, games = 0;
    rows.forEach(m => {
      if (normalise(m.home_team) === name) { scored += m.home_goals; conceded += m.away_goals; }
      else { scored += m.away_goals; conceded += m.home_goals; }
      games++;
    });
    return { gf: scored / games, ga: conceded / games };
  };
  const hs = teamStats(homeName), as = teamStats(awayName);
  if (hs) { homeGF = hs.gf; homeGA = hs.ga; }
  if (as) { awayGF = as.gf; awayGA = as.ga; }
  const formDiff = (Number(input.homeForm) - Number(input.awayForm)) / 20;
  const expectedHome = clamp(((homeGF + awayGA) / 2 + 0.18) * Math.exp(clamp(formDiff * 0.07, -0.18, 0.18)), 0.15, 4.5);
  const expectedAway = clamp(((awayGF + homeGA) / 2) * Math.exp(clamp(-formDiff * 0.07, -0.18, 0.18)), 0.15, 4.5);
  let home = 0, draw = 0, away = 0, total = 0;
  for (let h = 0; h <= 8; h++) for (let a = 0; a <= 8; a++) {
    const p = poisson(expectedHome, h) * poisson(expectedAway, a);
    total += p;
    if (h > a) home += p; else if (h === a) draw += p; else away += p;
  }
  home /= total; draw /= total; away /= total;
  if (h2h.length >= 3) {
    let hh = 0, dd = 0, aa = 0;
    h2h.forEach(m => {
      const homeIsListedHome = normalise(m.home_team) === homeName;
      const listedHomeScore = homeIsListedHome ? m.home_goals : m.away_goals;
      const listedAwayScore = homeIsListedHome ? m.away_goals : m.home_goals;
      if (listedHomeScore > listedAwayScore) hh++;
      else if (listedHomeScore === listedAwayScore) dd++;
      else aa++;
    });
    const n = h2h.length;
    home = home * 0.7 + hh / n * 0.3;
    draw = draw * 0.7 + dd / n * 0.3;
    away = away * 0.7 + aa / n * 0.3;
  }
  const sum = home + draw + away;
  return { home: home / sum, draw: draw / sum, away: away / sum, expectedHome, expectedAway, sample: h2h.length };
}
function parseCsv(text: string): HistoricalMatch[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error("CSV needs a header and at least one match row.");
  const split = (line: string) => line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
  const headers = split(lines[0]).map(v => v.toLowerCase().replace(/[ -]/g, "_"));
  const idx = (names: string[]) => headers.findIndex(h => names.includes(h));
  const hi = idx(["home_team", "hometeam", "home"]);
  const ai = idx(["away_team", "awayteam", "away"]);
  const hgi = idx(["home_goals", "home_score", "fthg"]);
  const agi = idx(["away_goals", "away_score", "ftag"]);
  const di = idx(["date", "match_date"]);
  if ([hi, ai, hgi, agi].some(i => i < 0)) throw new Error("Required CSV columns: home_team, away_team, home_goals, away_goals.");
  const rows: HistoricalMatch[] = [];
  for (const line of lines.slice(1)) {
    const cells = split(line);
    const hg = Number(cells[hgi]), ag = Number(cells[agi]);
    if (!cells[hi] || !cells[ai] || !Number.isFinite(hg) || !Number.isFinite(ag) || hg < 0 || ag < 0) continue;
    rows.push({ home_team: cells[hi], away_team: cells[ai], home_goals: hg, away_goals: ag, date: di >= 0 ? cells[di] : undefined });
  }
  if (!rows.length) throw new Error("No valid match rows found. Check the column names and scores.");
  return rows;
}

export default function LocalMatchLab() {
  const [input, setInput] = useState<Inputs>(initial);
  const [history, setHistory] = useState<HistoricalMatch[]>([]);
  const [notice, setNotice] = useState("No external data connection. Import a CSV or enter team averages below.");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setHistory(JSON.parse(saved)); }
    catch { setNotice("Saved history could not be read; you can import the CSV again."); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { setNotice("Browser storage is full; export your history and clear some saved data."); } } }, [history, ready]);
  const result = useMemo(() => estimate(input, history), [input, history]);
  const update = (key: keyof Inputs, value: string) => setInput(old => ({ ...old, [key]: value }));
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      setHistory(old => [...old, ...rows]);
      setNotice("Imported " + rows.length + " historical matches. Data stays in this browser.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not read this CSV."); }
    event.target.value = "";
  }
  function downloadTemplate() {
    const csv = "date,home_team,away_team,home_goals,away_goals\n2026-08-01,Team Alpha,Team Beta,2,1\n2026-08-08,Team Beta,Team Alpha,0,0\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "match-history-template.csv"; a.click(); URL.revokeObjectURL(url);
  }
  function exportHistory() {
    const rows = ["date,home_team,away_team,home_goals,away_goals", ...history.map(m => [m.date ?? "", m.home_team, m.away_team, m.home_goals, m.away_goals].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","))];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "rapsometeddy-match-history.csv"; a.click(); URL.revokeObjectURL(url);
  }
  const pct = (v: number) => Math.round(v * 100) + "%";
  return <main>
    <header><div><span className="eyebrow">RAPSOMETTEDY LABS • OFFLINE MODE</span><h1>Football Match Lab</h1><p>Explore match outcomes with manual team stats and your own historical CSV dataset.</p></div><button className="button" onClick={() => { setInput(initial); setNotice("Inputs reset. Imported history is still saved in this browser."); }}>↻ Reset inputs</button></header>
    <div className="status">● Local model active • No third-party API • No API key required</div>
    <section className="card"><div className="section-head"><h2>1. Team inputs</h2><span className="pill">Manual + local data</span></div><p>Enter goals scored/conceded per match and recent-form points (0–15 across the last five matches). Imported history overrides the goal averages for matching team names.</p>
      <div className="team-input-grid">
        <div className="input-panel"><h3>🏠 Home team</h3><label>Team name<input value={input.homeName} onChange={e => update("homeName", e.target.value)} /></label><label>Goals scored / match<input type="number" min="0" max="8" step="0.1" value={input.homeGF} onChange={e => update("homeGF", e.target.value)} /></label><label>Goals conceded / match<input type="number" min="0" max="8" step="0.1" value={input.homeGA} onChange={e => update("homeGA", e.target.value)} /></label><label>Recent-form points / 15<input type="number" min="0" max="15" value={input.homeForm} onChange={e => update("homeForm", e.target.value)} /></label></div>
        <div className="input-panel"><h3>✈️ Away team</h3><label>Team name<input value={input.awayName} onChange={e => update("awayName", e.target.value)} /></label><label>Goals scored / match<input type="number" min="0" max="8" step="0.1" value={input.awayGF} onChange={e => update("awayGF", e.target.value)} /></label><label>Goals conceded / match<input type="number" min="0" max="8" step="0.1" value={input.awayGA} onChange={e => update("awayGA", e.target.value)} /></label><label>Recent-form points / 15<input type="number" min="0" max="15" value={input.awayForm} onChange={e => update("awayForm", e.target.value)} /></label></div>
      </div>
    </section>
    <section className="card"><div className="section-head"><h2>2. Outcome research estimate</h2><span className="pill">Poisson + form + optional history</span></div><div className="outcome-grid">
      <div><small>HOME WIN</small><b>{pct(result.home)}</b><div className="bar"><span style={{width:pct(result.home)}} /></div></div>
      <div><small>DRAW</small><b>{pct(result.draw)}</b><div className="bar"><span style={{width:pct(result.draw)}} /></div></div>
      <div><small>AWAY WIN</small><b>{pct(result.away)}</b><div className="bar"><span style={{width:pct(result.away)}} /></div></div>
    </div><div className="stats-grid"><div><b>{result.expectedHome.toFixed(2)}</b><small>EXPECTED HOME GOALS</small></div><div><b>{result.expectedAway.toFixed(2)}</b><small>EXPECTED AWAY GOALS</small></div><div><b>{history.length}</b><small>LOCAL MATCH ROWS</small></div><div><b>{result.sample}</b><small>HEAD-TO-HEAD ROWS</small></div></div><p className="muted">Educational estimates only, not betting advice or guaranteed outcomes. This simple model is not validated for forecasting; use historical backtesting before drawing conclusions.</p></section>
    <section className="card"><div className="section-head"><h2>3. Historical dataset</h2><span className="pill">Stored on this device</span></div><p>Import a CSV from your phone. Supported columns: <code>home_team, away_team, home_goals, away_goals</code>. Optional columns: <code>date</code>. The app uses imported matches to calculate team scoring/conceding averages and, when at least three head-to-head rows exist, blend in historical head-to-head outcomes.</p><div className="actions"><label className="button upload">⬆ Import CSV<input type="file" accept=".csv,text/csv" onChange={importFile} /></label><button className="button" onClick={downloadTemplate}>Download CSV template</button><button className="button" onClick={exportHistory} disabled={!history.length}>Export saved history</button><button className="button danger" onClick={() => { setHistory([]); setNotice("Local history cleared."); }}>Clear history</button></div><p className="notice" role="status">{notice}</p><div className="stats-grid"><div><b>{history.length}</b><small>ROWS STORED</small></div><div><b>{new Set(history.flatMap(m => [m.home_team, m.away_team])).size}</b><small>UNIQUE TEAMS</small></div><div><b>{history.filter(m => m.home_goals > m.away_goals).length}</b><small>HOME WINS IN FILE</small></div><div><b>{history.filter(m => m.home_goals === m.away_goals).length}</b><small>DRAWS IN FILE</small></div></div></section>
    <footer>Rapsometeddy Sports Predictor • Offline-first educational football analytics • No bookmaker odds, staking tools, or wagering integrations.</footer>
  </main>;
}
