"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type MatchRow = {
  date?: string;
  league: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
};

type Standing = {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

const STORE = "rapsometeddy-league-history-v2";

function parseCsv(text: string): MatchRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error("Add a header row and at least one completed match.");
  const split = (line: string) => line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
  const headers = split(lines[0]).map(v => v.toLowerCase().replace(/[ -]/g, "_"));
  const idx = (names: string[]) => headers.findIndex(h => names.includes(h));
  const li = idx(["league", "competition", "division"]);
  const di = idx(["date", "match_date"]);
  const hi = idx(["home_team", "hometeam", "home"]);
  const ai = idx(["away_team", "awayteam", "away"]);
  const hgi = idx(["home_goals", "home_score", "fthg"]);
  const agi = idx(["away_goals", "away_score", "ftag"]);
  if ([li, hi, ai, hgi, agi].some(i => i < 0)) {
    throw new Error("Required columns: league, home_team, away_team, home_goals, away_goals.");
  }
  const rows: MatchRow[] = [];
  for (const line of lines.slice(1)) {
    const c = split(line);
    const hg = Number(c[hgi]), ag = Number(c[agi]);
    if (!c[li] || !c[hi] || !c[ai] || c[hgi] === "" || c[agi] === "" ||
        !Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0) continue;
    rows.push({
      date: di >= 0 ? c[di] : undefined,
      league: c[li],
      home_team: c[hi],
      away_team: c[ai],
      home_goals: hg,
      away_goals: ag
    });
  }
  if (!rows.length) throw new Error("No valid completed match rows found. Check the CSV headings and scores.");
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
    const home = get(match.home_team);
    const away = get(match.away_team);
    home.played++; away.played++;
    home.goalsFor += match.home_goals;
    home.goalsAgainst += match.away_goals;
    away.goalsFor += match.away_goals;
    away.goalsAgainst += match.home_goals;
    if (match.home_goals > match.away_goals) {
      home.wins++; home.points += 3; away.losses++;
    } else if (match.home_goals < match.away_goals) {
      away.wins++; away.points += 3; home.losses++;
    } else {
      home.draws++; away.draws++; home.points++; away.points++;
    }
  }
  return [...table.values()].map(row => ({
    ...row, goalDifference: row.goalsFor - row.goalsAgainst
  })).sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.team.localeCompare(b.team)
  );
}

export default function LeagueInsights() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [notice, setNotice] = useState("Import a completed-results CSV. The standings pipeline will calculate the table automatically.");
  const [loaded, setLoaded] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) {
        const parsed = JSON.parse(saved) as MatchRow[];
        if (Array.isArray(parsed)) setRows(parsed);
      }
    } catch {
      setNotice("Saved history could not be read. Import your CSV again.");
    } finally {
      setLoaded(true);
    }
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
      const next = [...rows, ...parsed];
      persist(next);
      setNotice("Pipeline complete: validated and imported " + parsed.length + " completed matches. The table recalculates automatically.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not read that CSV.");
    }
    event.target.value = "";
  }

  function downloadTemplate() {
    const csv = "date,league,home_team,away_team,home_goals,away_goals\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "rapsometeddy-results-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const header = ["date","league","home_team","away_team","home_goals","away_goals"];
    const csv = [header.join(","), ...rows.map(r => [r.date,r.league,r.home_team,r.away_team,r.home_goals,r.away_goals].map(csvCell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "rapsometeddy-results-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const leagues = useMemo(() => [...new Set(rows.map(r => r.league))].sort(), [rows]);
  const activeRows = useMemo(() => selectedLeague === "all" ? rows : rows.filter(r => r.league === selectedLeague), [rows, selectedLeague]);
  const standings = useMemo(() => calculateStandings(activeRows), [activeRows]);
  const completed = rows.length;
  const teams = new Set(rows.flatMap(r => [r.home_team, r.away_team])).size;

  return <section className="card">
    <div className="section-head"><h2>4. Automatic league table pipeline</h2><span className="pill">Historical results</span></div>
    <p>Import completed match scores once. The system validates the rows, groups results by league, and recalculates each team's table automatically. No manual points or goal-difference calculations are needed.</p>
    <div className="pipeline-steps" aria-label="Calculation pipeline">
      <div><b>01 · Import</b><small>Read the CSV file</small></div>
      <div><b>02 · Validate</b><small>Check team names and scores</small></div>
      <div><b>03 · Calculate</b><small>W / D / L, GF, GA, GD, points</small></div>
      <div><b>04 · Rank</b><small>Points → GD → GF</small></div>
    </div>
    <div className="actions">
      <label className="button upload">⬆ Import results CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label>
      <button className="button" onClick={downloadTemplate}>Download CSV template</button>
      <button className="button" onClick={exportCsv} disabled={!rows.length}>Export history</button>
      <button className="button danger" onClick={() => { persist([]); setSelectedLeague("all"); setNotice("Results history cleared from this browser."); }}>Clear history</button>
    </div>
    <p className="notice" role="status">{loaded ? notice : "Loading saved results…"}</p>
    <div className="stats-grid">
      <div><b>{completed}</b><small>COMPLETED MATCHES</small></div>
      <div><b>{leagues.length}</b><small>LEAGUES LOADED</small></div>
      <div><b>{teams}</b><small>UNIQUE TEAMS</small></div>
      <div><b>{standings.length}</b><small>TEAMS IN VIEW</small></div>
    </div>
    {leagues.length > 0 && <label className="league-filter">League
      <select value={selectedLeague} onChange={e => setSelectedLeague(e.target.value)}>
        <option value="all">All leagues combined</option>
        {leagues.map(league => <option key={league} value={league}>{league}</option>)}
      </select>
    </label>}
    {standings.length ? <div className="league-table-wrap"><table className="league-table">
      <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
      <tbody>{standings.map((s, i) => <tr key={s.team}><td>{i + 1}</td><td>{s.team}</td><td>{s.played}</td><td>{s.wins}</td><td>{s.draws}</td><td>{s.losses}</td><td>{s.goalsFor}</td><td>{s.goalsAgainst}</td><td>{s.goalDifference > 0 ? "+" : ""}{s.goalDifference}</td><td><b>{s.points}</b></td></tr>)}</tbody>
    </table></div> : <p className="muted">No results loaded yet. Download the template, fill in verified completed match scores, and import it. Required columns: league, home_team, away_team, home_goals, away_goals. Date is optional.</p>}
    <p className="muted">Points use the standard league system: win = 3, draw = 1, loss = 0. The table is sorted by points, then goal difference, then goals scored. This is a historical statistics tool, not a live data feed or a match-outcome forecast.</p>
  </section>;
}
