"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type MatchRow = {
  date?: string;
  competition_id: string;
  competition_name: string;
  competition_type: string;
  season: string;
  stage?: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  source_id?: string;
};

type Standing = {
  team: string; played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number; points: number;
};

const STORE = "rapsometeddy-competition-history-v3";

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let value = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { cells.push(value.trim()); value = ""; }
    else value += ch;
  }
  cells.push(value.trim());
  return cells;
}

function parseCsv(text: string): MatchRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error("Add a header row and at least one completed match.");
  const headers = splitCsvLine(lines[0]).map(v => v.toLowerCase().replace(/[ -]/g, "_"));
  const idx = (names: string[]) => headers.findIndex(h => names.includes(h));
  const get = (cells: string[], names: string[]) => { const i = idx(names); return i < 0 ? "" : (cells[i] ?? ""); };
  const hi = idx(["home_team", "hometeam", "home"]);
  const ai = idx(["away_team", "awayteam", "away"]);
  const hgi = idx(["home_goals", "home_score", "fthg"]);
  const agi = idx(["away_goals", "away_score", "ftag"]);
  const ci = idx(["competition_id", "competition", "league", "competition_name"]);
  if ([hi, ai, hgi, agi, ci].some(i => i < 0)) {
    throw new Error("Required columns: competition_id (or competition/league), home_team, away_team, home_goals, away_goals.");
  }
  const rows: MatchRow[] = [];
  for (const line of lines.slice(1)) {
    const c = splitCsvLine(line);
    const hg = Number(c[hgi]), ag = Number(c[agi]);
    const compId = get(c, ["competition_id"]) || get(c, ["competition", "league", "competition_name"]);
    const compName = get(c, ["competition_name"]) || compId;
    if (!compId || !c[hi] || !c[ai] || c[hgi] === "" || c[agi] === "" ||
        !Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0) continue;
    rows.push({
      date: get(c, ["date", "match_date"]) || undefined,
      competition_id: compId,
      competition_name: compName,
      competition_type: get(c, ["competition_type"]) || "unspecified",
      season: get(c, ["season", "edition"]) || "unspecified",
      stage: get(c, ["stage", "round"]) || undefined,
      home_team: c[hi], away_team: c[ai], home_goals: hg, away_goals: ag,
      source_id: get(c, ["source_id"]) || undefined
    });
  }
  if (!rows.length) throw new Error("No valid completed match rows found. Check competition, team and score columns.");
  return rows;
}

function csvCell(value: unknown) {
  return '"' + String(value ?? "").replace(/"/g, '""') + '"';
}

function calculateStandings(matches: MatchRow[]): Standing[] {
  const table = new Map<string, Standing>();
  const get = (team: string) => {
    if (!table.has(team)) table.set(team, {
      team, played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    });
    return table.get(team)!;
  };
  for (const match of matches) {
    const home = get(match.home_team), away = get(match.away_team);
    home.played++; away.played++;
    home.goalsFor += match.home_goals; home.goalsAgainst += match.away_goals;
    away.goalsFor += match.away_goals; away.goalsAgainst += match.home_goals;
    if (match.home_goals > match.away_goals) { home.wins++; home.points += 3; away.losses++; }
    else if (match.home_goals < match.away_goals) { away.wins++; away.points += 3; home.losses++; }
    else { home.draws++; away.draws++; home.points++; away.points++; }
  }
  return [...table.values()].map(row => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.team.localeCompare(b.team));
}

function groupKey(row: MatchRow) {
  return [row.competition_id, row.season].join("::");
}

export default function LeagueInsights() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [notice, setNotice] = useState("Import verified completed results. Records stay on this device.");
  const [loaded, setLoaded] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) {
        const parsed = JSON.parse(saved) as MatchRow[];
        if (Array.isArray(parsed)) setRows(parsed);
      }
    } catch { setNotice("Saved history could not be read. Import your CSV backup again."); }
    finally { setLoaded(true); }
  }, []);

  function persist(next: MatchRow[]) {
    setRows(next);
    try { localStorage.setItem(STORE, JSON.stringify(next)); }
    catch { setNotice("Browser storage is full. Export your history before clearing old rows."); }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseCsv(await file.text());
      const known = new Set(rows.map(r => [groupKey(r), r.date, r.home_team, r.away_team].join("|")));
      const fresh = parsed.filter(r => !known.has([groupKey(r), r.date, r.home_team, r.away_team].join("|")));
      persist([...rows, ...fresh]);
      setNotice("Imported " + fresh.length + " new completed records; skipped " + (parsed.length - fresh.length) + " duplicates. Competitions and seasons remain separate.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not read that CSV."); }
    event.target.value = "";
  }

  function downloadTemplate() {
    const csv = "date,competition_id,competition_name,competition_type,region,season,stage,home_team,away_team,home_goals,away_goals,match_status,source_id\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "rapsometeddy-competition-results-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const header = ["date","competition_id","competition_name","competition_type","season","stage","home_team","away_team","home_goals","away_goals","source_id"];
    const csv = [header.join(","), ...rows.map(r => [r.date,r.competition_id,r.competition_name,r.competition_type,r.season,r.stage,r.home_team,r.away_team,r.home_goals,r.away_goals,r.source_id].map(csvCell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "rapsometeddy-competition-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const groups = useMemo(() => {
    const map = new Map<string, MatchRow>();
    rows.forEach(r => { if (!map.has(groupKey(r))) map.set(groupKey(r), r); });
    return [...map.entries()].sort((a,b) => a[1].competition_name.localeCompare(b[1].competition_name) || a[1].season.localeCompare(b[1].season));
  }, [rows]);
  const activeRows = useMemo(() => selectedGroup === "all" ? rows : rows.filter(r => groupKey(r) === selectedGroup), [rows, selectedGroup]);
  const selected = groups.find(([key]) => key === selectedGroup)?.[1];
  const isLeague = selected?.competition_type === "domestic_league";
  const standings = useMemo(() => isLeague ? calculateStandings(activeRows) : [], [activeRows, isLeague]);
  const uniqueCompetitions = new Set(rows.map(r => r.competition_id)).size;
  const teams = new Set(activeRows.flatMap(r => [r.home_team, r.away_team])).size;

  return <section className="card">
    <div className="section-head"><h2>Historical competition archive</h2><span className="pill">Offline data</span></div>
    <p>Import verified results for leagues, domestic cups, continental club tournaments and national-team competitions. Each competition and season is stored separately. League tables are calculated only for domestic league datasets; knockout cups are shown as results, not misleading league standings.</p>
    <div className="pipeline-steps" aria-label="Data processing pipeline">
      <div><b>01 · Import</b><small>Read CSV on device</small></div>
      <div><b>02 · Validate</b><small>Check IDs, teams and scores</small></div>
      <div><b>03 · Separate</b><small>Competition + season</small></div>
      <div><b>04 · Summarise</b><small>Tables or result archive</small></div>
    </div>
    <div className="actions">
      <label className="button upload">⬆ Import results CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label>
      <button className="button" onClick={downloadTemplate}>Download CSV template</button>
      <button className="button" onClick={exportCsv} disabled={!rows.length}>Export history</button>
      <button className="button danger" onClick={() => { persist([]); setSelectedGroup("all"); setNotice("Competition history cleared from this browser."); }}>Clear history</button>
    </div>
    <p className="notice" role="status">{loaded ? notice : "Loading saved results…"}</p>
    <div className="stats-grid">
      <div><b>{rows.length}</b><small>COMPLETED MATCHES</small></div>
      <div><b>{uniqueCompetitions}</b><small>COMPETITIONS</small></div>
      <div><b>{teams}</b><small>TEAMS IN VIEW</small></div>
      <div><b>{standings.length}</b><small>LEAGUE TABLE ROWS</small></div>
    </div>
    {groups.length > 0 && <label className="league-filter">Competition and season
      <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
        <option value="all">All records (archive only)</option>
        {groups.map(([key, row]) => <option key={key} value={key}>{row.competition_name} · {row.season}</option>)}
      </select>
    </label>}
    {selectedGroup === "all" ? <p className="muted">Choose one competition and season to inspect its records. Combined records are intentionally not ranked together.</p> :
      isLeague ? <div className="league-table-wrap"><table className="league-table">
        <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>{standings.map((s, i) => <tr key={s.team}><td>{i + 1}</td><td>{s.team}</td><td>{s.played}</td><td>{s.wins}</td><td>{s.draws}</td><td>{s.losses}</td><td>{s.goalsFor}</td><td>{s.goalsAgainst}</td><td>{s.goalDifference > 0 ? "+" : ""}{s.goalDifference}</td><td><b>{s.points}</b></td></tr>)}</tbody>
      </table></div> :
      <div className="league-table-wrap"><table className="league-table">
        <thead><tr><th>Date</th><th>Stage</th><th>Home</th><th>Score</th><th>Away</th></tr></thead>
        <tbody>{activeRows.slice().sort((a,b) => (a.date || "").localeCompare(b.date || "")).map((m,i) => <tr key={i}><td>{m.date || "—"}</td><td>{m.stage || "—"}</td><td>{m.home_team}</td><td><b>{m.home_goals}–{m.away_goals}</b></td><td>{m.away_team}</td></tr>)}</tbody>
      </table></div>}
    <p className="muted">League tables use win = 3 points, draw = 1, loss = 0. Cup and international knockout results are kept as match records only. Imported data is stored in this browser; export backups regularly. This module provides historical statistics, not betting advice or outcome selections.</p>
  </section>;
}
