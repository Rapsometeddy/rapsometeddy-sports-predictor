"use client";

import { ChangeEvent, useMemo, useState } from "react";

type LeagueRow = {
  date?: string;
  league: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  home_corners?: number;
  away_corners?: number;
};

const STORE = "rapsometeddy-league-history-v1";

function parseCsv(text: string): LeagueRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error("Add a header row and at least one match row.");
  const split = (line: string) => line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
  const headers = split(lines[0]).map(v => v.toLowerCase().replace(/[ -]/g, "_"));
  const idx = (names: string[]) => headers.findIndex(h => names.includes(h));
  const li = idx(["league", "competition", "division"]);
  const di = idx(["date", "match_date"]);
  const hi = idx(["home_team", "hometeam", "home"]);
  const ai = idx(["away_team", "awayteam", "away"]);
  const hgi = idx(["home_goals", "home_score", "fthg"]);
  const agi = idx(["away_goals", "away_score", "ftag"]);
  const hci = idx(["home_corners", "homecorner", "hc"]);
  const aci = idx(["away_corners", "awaycorner", "ac"]);
  if ([li, hi, ai, hgi, agi].some(i => i < 0)) {
    throw new Error("Required columns: league, home_team, away_team, home_goals, away_goals. Corner columns are optional.");
  }
  const rows: LeagueRow[] = [];
  for (const line of lines.slice(1)) {
    const c = split(line);
    const hg = Number(c[hgi]), ag = Number(c[agi]);
    const hc = hci >= 0 && c[hci] !== "" ? Number(c[hci]) : undefined;
    const ac = aci >= 0 && c[aci] !== "" ? Number(c[aci]) : undefined;
    if (!c[li] || !c[hi] || !c[ai] || !Number.isFinite(hg) || !Number.isFinite(ag) || hg < 0 || ag < 0) continue;
    if ((hc !== undefined && (!Number.isFinite(hc) || hc < 0)) || (ac !== undefined && (!Number.isFinite(ac) || ac < 0))) continue;
    rows.push({ date: di >= 0 ? c[di] : undefined, league: c[li], home_team: c[hi], away_team: c[ai], home_goals: hg, away_goals: ag, home_corners: hc, away_corners: ac });
  }
  if (!rows.length) throw new Error("No valid match rows found. Check the CSV headings and values.");
  return rows;
}

function csvCell(value: unknown) {
  return '"' + String(value ?? "").replace(/"/g, '""') + '"';
}

export default function LeagueInsights() {
  const [rows, setRows] = useState<LeagueRow[]>([]);
  const [notice, setNotice] = useState("Import a results CSV to compare historical league goal and corner statistics.");
  const [loaded, setLoaded] = useState(false);

  useMemo(() => {
    if (typeof window === "undefined" || loaded) return null;
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) setRows(JSON.parse(saved) as LeagueRow[]);
    } catch {
      setNotice("Saved league history could not be read. You can import the CSV again.");
    }
    setLoaded(true);
    return null;
  }, [loaded]);

  function persist(next: LeagueRow[]) {
    setRows(next);
    try { localStorage.setItem(STORE, JSON.stringify(next)); }
    catch { setNotice("Browser storage is full. Export your data before clearing old rows."); }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseCsv(await file.text());
      const next = [...rows, ...parsed];
      persist(next);
      setNotice("Imported " + parsed.length + " rows. Imported history is saved in this browser on this device.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not read that CSV.");
    }
    event.target.value = "";
  }

  function downloadTemplate() {
    const csv = "date,league,home_team,away_team,home_goals,away_goals,home_corners,away_corners\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "rapsometeddy-league-results-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const header = ["date","league","home_team","away_team","home_goals","away_goals","home_corners","away_corners"];
    const csv = [header.join(","), ...rows.map(r => [r.date,r.league,r.home_team,r.away_team,r.home_goals,r.away_goals,r.home_corners,r.away_corners].map(csvCell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "rapsometeddy-league-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const leagues = useMemo(() => {
    const groups = new Map<string, LeagueRow[]>();
    rows.forEach(r => groups.set(r.league, [...(groups.get(r.league) ?? []), r]));
    return [...groups.entries()].map(([league, matches]) => {
      const over15 = matches.filter(m => m.home_goals + m.away_goals >= 2).length;
      const corners = matches.filter(m => m.home_corners !== undefined && m.away_corners !== undefined);
      return {
        league, matches: matches.length, over15, over15Pct: matches.length ? over15 / matches.length * 100 : 0,
        avgGoals: matches.reduce((s,m) => s + m.home_goals + m.away_goals, 0) / matches.length,
        cornerMatches: corners.length,
        avgCorners: corners.length ? corners.reduce((s,m) => s + (m.home_corners ?? 0) + (m.away_corners ?? 0), 0) / corners.length : null,
      };
    }).sort((a,b) => b.matches - a.matches);
  }, [rows]);

  const cornerRows = rows.filter(r => r.home_corners !== undefined && r.away_corners !== undefined).length;
  return <section className="card">
    <div className="section-head"><h2>4. League goals &amp; corners research</h2><span className="pill">Historical data only</span></div>
    <p>Compare completed-match records by league. The 2+ goals figure is a descriptive historical frequency, not a forecast. Corner averages are shown only when both teams' corner counts were provided.</p>
    <div className="actions">
      <label className="button upload">⬆ Import league CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label>
      <button className="button" onClick={downloadTemplate}>Download league CSV template</button>
      <button className="button" onClick={exportCsv} disabled={!rows.length}>Export league data</button>
      <button className="button danger" onClick={() => { persist([]); setNotice("League research history cleared from this browser."); }}>Clear league data</button>
    </div>
    <p className="notice" role="status">{notice}</p>
    <div className="stats-grid">
      <div><b>{rows.length}</b><small>LEAGUE MATCH ROWS</small></div>
      <div><b>{leagues.length}</b><small>LEAGUES IN DATA</small></div>
      <div><b>{rows.length ? Math.round(rows.filter(r => r.home_goals + r.away_goals >= 2).length / rows.length * 100) + "%" : "—"}</b><small>ROWS WITH 2+ GOALS</small></div>
      <div><b>{cornerRows}</b><small>MATCHES WITH CORNERS</small></div>
    </div>
    {leagues.length ? <div className="league-table-wrap"><table className="league-table">
      <thead><tr><th>League</th><th>Matches</th><th>2+ goals</th><th>Avg goals</th><th>Avg total corners</th></tr></thead>
      <tbody>{leagues.map(l => <tr key={l.league}><td>{l.league}</td><td>{l.matches}</td><td>{l.over15Pct.toFixed(0)}% <span className="table-muted">({l.over15}/{l.matches})</span></td><td>{l.avgGoals.toFixed(2)}</td><td>{l.avgCorners === null ? "No corner data" : l.avgCorners.toFixed(2) + " (" + l.cornerMatches + " matches)"}</td></tr>)}</tbody>
    </table></div> : <p className="muted">No league dataset imported yet. Download the template, add verified completed match records, and import it here. Required columns: league, home_team, away_team, home_goals, away_goals. Optional: date, home_corners, away_corners.</p>}
    <p className="muted">No live feed is connected. Results and corner counts must come from a reliable source and be entered in the CSV. Avoid treating small samples as representative; this dashboard does not select bets or guarantee outcomes.</p>
  </section>;
}
