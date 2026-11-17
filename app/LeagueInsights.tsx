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
  match_status?: string;
  source_id?: string;
};

type Standing = {
  team: string; played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number; points: number;
};

const STORE = "rapsometeddy-competition-history-v3";
const REQUIRED = ["competition_id", "competition_type", "season", "home_team", "away_team", "home_goals", "away_goals"];

function parseCsvRows(source: string): string[][] {
  const input = source.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closedQuote = true; }
      else cell += ch;
      continue;
    }
    if (closedQuote && ch !== "," && ch !== "\n" && ch !== "\r" && ch !== " " && ch !== "\t") {
      throw new Error("Invalid CSV: unexpected text after a closing quote.");
    }
    if (ch === '"') {
      if (cell.trim()) throw new Error("Invalid CSV: a quote appeared inside an unquoted value.");
      quoted = true; closedQuote = false;
    } else if (ch === ",") {
      row.push(cell.trim()); cell = ""; closedQuote = false;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(value => value !== "")) rows.push(row);
      row = []; cell = ""; closedQuote = false;
    } else cell += ch;
  }
  if (quoted) throw new Error("Invalid CSV: a quoted field was not closed.");
  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some(value => value !== "")) rows.push(row);
  }
  return rows;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseCsv(text: string): MatchRow[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("Add a header row and at least one completed match.");
  const headers = rows[0].map(value => value.toLowerCase().replace(/[ -]/g, "_"));
  if (headers.some(value => !value)) throw new Error("The CSV header contains an empty column name.");
  if (new Set(headers).size !== headers.length) throw new Error("The CSV contains duplicate column names.");
  const missing = REQUIRED.filter(field => !headers.includes(field));
  if (missing.length) throw new Error("Required columns are missing: " + missing.join(", ") + ".");

  return rows.slice(1).map((cells, index) => {
    const lineNumber = index + 2;
    if (cells.length !== headers.length) throw new Error("CSV row " + lineNumber + " has " + cells.length + " values; expected " + headers.length + ".");
    const raw = Object.fromEntries(headers.map((header, i) => [header, (cells[i] ?? "").trim()])) as Record<string, string>;
    const competitionId = raw.competition_id;
    const homeGoals = Number(raw.home_goals);
    const awayGoals = Number(raw.away_goals);
    const missingValues = REQUIRED.filter(field => !raw[field]);
    if (missingValues.length) throw new Error("CSV row " + lineNumber + " is missing: " + missingValues.join(", ") + ".");
    if (!Number.isSafeInteger(homeGoals) || homeGoals < 0 || !Number.isSafeInteger(awayGoals) || awayGoals < 0) {
      throw new Error("CSV row " + lineNumber + ": goals must be whole non-negative numbers.");
    }
    if (raw.home_team.toLowerCase() === raw.away_team.toLowerCase()) throw new Error("CSV row " + lineNumber + ": a team cannot play itself.");
    if (raw.date && !validDate(raw.date)) throw new Error("CSV row " + lineNumber + ": date must use YYYY-MM-DD.");
    if (raw.match_status && !/^(?:finished|completed|ft|full[ -]?time|aet|pen(?:alties)?)$/i.test(raw.match_status)) {
      throw new Error("CSV row " + lineNumber + ": only completed matches may be imported. Check match_status.");
    }
    return {
      date: raw.date || undefined,
      competition_id: competitionId,
      competition_name: raw.competition_name || competitionId,
      competition_type: raw.competition_type,
      season: raw.season,
      stage: raw.stage || undefined,
      home_team: raw.home_team,
      away_team: raw.away_team,
      home_goals: homeGoals,
      away_goals: awayGoals,
      match_status: raw.match_status || "completed",
      source_id: raw.source_id || undefined
    };
  });
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
  return [row.competition_id.trim().toLowerCase(), row.season.trim().toLowerCase()].join("::");
}

function matchIdentity(row: MatchRow) {
  return [groupKey(row), row.date || row.stage || "undated", row.home_team.trim().toLowerCase(), row.away_team.trim().toLowerCase()].join("::");
}

export default function LeagueInsights() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [notice, setNotice] = useState("Import completed results with a competition type and season. Records stay on this device.");
  const [loaded, setLoaded] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) {
        const parsed = JSON.parse(saved) as MatchRow[];
        if (Array.isArray(parsed)) setRows(parsed);
        else throw new Error("Invalid saved archive");
      }
    } catch { setNotice("Saved history could not be read. Import your CSV backup again."); }
    finally { setLoaded(true); }
  }, []);

  function persist(next: MatchRow[]): boolean {
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
      setRows(next);
      return true;
    } catch {
      setNotice("The browser could not save this change. Export a backup and free browser storage before trying again.");
      return false;
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("CSV is larger than 10 MB. Split it into smaller files and import them separately.");
      const parsed = parseCsv(await file.text());
      const next = [...rows];
      const indexByIdentity = new Map<string, number>();
      next.forEach((row, index) => indexByIdentity.set(matchIdentity(row), index));
      const incomingSeen = new Map<string, MatchRow>();
      let added = 0;
      let duplicates = 0;
      let corrected = 0;

      for (const row of parsed) {
        const identity = matchIdentity(row);
        const earlierIncoming = incomingSeen.get(identity);
        if (earlierIncoming) {
          if (earlierIncoming.home_goals !== row.home_goals || earlierIncoming.away_goals !== row.away_goals) {
            throw new Error("This CSV contains the same fixture more than once with conflicting scores. Resolve the conflict before importing.");
          }
          duplicates++;
          continue;
        }
        incomingSeen.set(identity, row);
        const existingIndex = indexByIdentity.get(identity);
        if (existingIndex === undefined) {
          indexByIdentity.set(identity, next.length);
          next.push(row);
          added++;
        } else {
          const existing = next[existingIndex];
          if (existing.home_goals !== row.home_goals || existing.away_goals !== row.away_goals) {
            next[existingIndex] = row;
            corrected++;
          } else {
            duplicates++;
          }
        }
      }

      if (persist(next)) {
        const withSource = parsed.filter(row => row.source_id).length;
        setNotice("Added " + added + " new matches, updated " + corrected + " corrected scores and skipped " + duplicates + " exact duplicates. " + withSource + " imported rows include a source_id. Keep the separate source log; source IDs are not independently verified here.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read that CSV.");
    }
    event.target.value = "";
  }

  function downloadTemplate() {
    const csv = "date,competition_id,competition_name,competition_type,region,season,stage,home_team,away_team,home_goals,away_goals,match_status,source_id\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "rapsometeddy-competition-results-template.csv"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportCsv() {
    const header = ["date","competition_id","competition_name","competition_type","season","stage","home_team","away_team","home_goals","away_goals","match_status","source_id"];
    const csv = [header.join(","), ...rows.map(row => [row.date,row.competition_id,row.competition_name,row.competition_type,row.season,row.stage,row.home_team,row.away_team,row.home_goals,row.away_goals,row.match_status,row.source_id].map(csvCell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "rapsometeddy-competition-history.csv"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const groups = useMemo(() => {
    const map = new Map<string, MatchRow>();
    rows.forEach(row => { if (!map.has(groupKey(row))) map.set(groupKey(row), row); });
    return [...map.entries()].sort((a, b) => a[1].competition_name.localeCompare(b[1].competition_name) || a[1].season.localeCompare(b[1].season));
  }, [rows]);
  const activeRows = useMemo(() => selectedGroup === "all" ? rows : rows.filter(row => groupKey(row) === selectedGroup), [rows, selectedGroup]);
  const selected = groups.find(([key]) => key === selectedGroup)?.[1];
  const isLeague = selected?.competition_type === "domestic_league";
  const standings = useMemo(() => isLeague ? calculateStandings(activeRows) : [], [activeRows, isLeague]);
  const uniqueCompetitions = new Set(rows.map(row => row.competition_id)).size;
  const teams = new Set(activeRows.flatMap(row => [row.home_team, row.away_team])).size;
  const sourceIds = rows.filter(row => row.source_id).length;

  return <section className="card">
    <div className="section-head"><h2>Historical competition archive</h2><span className="pill">Offline data</span></div>
    <p>Import completed results for leagues, domestic cups, continental club tournaments and national-team competitions. Every competition and season is stored separately. League tables are calculated only for domestic league datasets; knockout cups are shown as results, not misleading league standings.</p>
    <div className="pipeline-steps" aria-label="Data processing pipeline">
      <div><b>01 · Import</b><small>Read CSV on device</small></div>
      <div><b>02 · Validate</b><small>Check structure, dates, teams and scores</small></div>
      <div><b>03 · Separate</b><small>Competition + season</small></div>
      <div><b>04 · Summarise</b><small>Tables or result archive</small></div>
    </div>
    <div className="actions">
      <label className="button upload">⬆ Import results CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label>
      <button className="button" onClick={downloadTemplate}>Download CSV template</button>
      <button className="button" onClick={exportCsv} disabled={!rows.length}>Export history</button>
      <button className="button danger" onClick={() => {
        if (window.confirm("Clear the entire football competition archive from this browser? Export a backup first if you may need these records.")) {
          if (persist([])) { setSelectedGroup("all"); setNotice("Competition history cleared from this browser."); }
        }
      }}>Clear football history</button>
    </div>
    <p className="notice" role="status" aria-live="polite">{loaded ? notice : "Loading saved results…"}</p>
    <div className="stats-grid">
      <div><b>{rows.length}</b><small>COMPLETED MATCHES</small></div>
      <div><b>{uniqueCompetitions}</b><small>COMPETITIONS</small></div>
      <div><b>{teams}</b><small>TEAMS IN VIEW</small></div>
      <div><b>{sourceIds}/{rows.length || 0}</b><small>WITH SOURCE ID</small></div>
    </div>
    {groups.length > 0 && <label className="league-filter">Competition and season
      <select value={selectedGroup} onChange={event => setSelectedGroup(event.target.value)}>
        <option value="all">All records (archive only)</option>
        {groups.map(([key, row]) => <option key={key} value={key}>{row.competition_name} · {row.season}</option>)}
      </select>
    </label>}
    {selectedGroup === "all" ? <p className="muted">Choose one competition and season to inspect its records. Combined records are intentionally not ranked together.</p> :
      isLeague ? <div className="league-table-wrap"><table className="league-table">
        <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>{standings.map((standing, index) => <tr key={standing.team}><td>{index + 1}</td><td>{standing.team}</td><td>{standing.played}</td><td>{standing.wins}</td><td>{standing.draws}</td><td>{standing.losses}</td><td>{standing.goalsFor}</td><td>{standing.goalsAgainst}</td><td>{standing.goalDifference > 0 ? "+" : ""}{standing.goalDifference}</td><td><b>{standing.points}</b></td></tr>)}</tbody>
      </table></div> :
      <div className="league-table-wrap"><table className="league-table">
        <thead><tr><th>Date</th><th>Stage</th><th>Home</th><th>Score</th><th>Away</th></tr></thead>
        <tbody>{activeRows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((match, index) => <tr key={index}><td>{match.date || "—"}</td><td>{match.stage || "—"}</td><td>{match.home_team}</td><td><b>{match.home_goals}–{match.away_goals}</b></td><td>{match.away_team}</td></tr>)}</tbody>
      </table></div>}
    <p className="muted">League summaries use a simple 3–1–0 points rule and sort by points, goal difference and goals scored. They do not model points deductions or every competition-specific tie-breaker, so they are research summaries rather than certified official tables. Cup and knockout results remain match records only. Imported data is stored in this browser; export backups regularly.</p>
    <p className="muted">A source_id should match a row in the separate source log. The app does not independently verify source links or the correctness of imported scores. This module provides historical statistics, not betting advice or outcome selections.</p>
  </section>;
}
