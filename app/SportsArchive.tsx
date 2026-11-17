"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type SportId = "TABLE_TENNIS" | "FORMULA_RACING" | "ICE_HOCKEY" | "ATHLETICS" | "FIGURE_SKATING" | "SPEED_SKATING";
type SportConfig = { id: SportId; name: string; description: string; fields: string[]; identity: string[]; required: string[]; label: string[] };

const SPORTS: SportConfig[] = [
  { id: "TABLE_TENNIS", name: "Table tennis", description: "Keep singles, doubles, mixed and team events distinct. Scores are games won, not goals or points from another sport.", fields: ["date","competition","season","event","discipline","round","participant_a","participant_b","games_a","games_b","winner","source_url"], identity: ["competition","season","event","discipline","round","participant_a","participant_b"], required: ["competition","season","event","discipline","round","participant_a","participant_b","games_a","games_b"], label: ["date","event","discipline","round","participant_a","participant_b","games_a","games_b","winner"] },
  { id: "FORMULA_RACING", name: "Formula 1", description: "Each Grand Prix, sprint, qualifying and practice session is a separate classification. Position and points are not mixed with other sports.", fields: ["date","competition","season","grand_prix","session","driver","constructor","position","points","status","source_url"], identity: ["competition","season","grand_prix","session","driver","constructor"], required: ["competition","season","grand_prix","session","driver","constructor","position","status"], label: ["date","grand_prix","session","driver","constructor","position","points","status"] },
  { id: "ICE_HOCKEY", name: "Ice hockey", description: "League, playoff and international event results stay in their own competition and season.", fields: ["date","competition","season","stage","home_team","away_team","home_goals","away_goals","status","source_url"], identity: ["competition","season","stage","date","home_team","away_team"], required: ["competition","season","stage","home_team","away_team","home_goals","away_goals"], label: ["date","competition","season","stage","home_team","away_team","home_goals","away_goals"] },
  { id: "ATHLETICS", name: "Athletics & running", description: "Track discipline, event category, mark and unit explicitly. Times, distances and heights are never compared as if they were the same measurement.", fields: ["date","competition","season","meeting","discipline","category","athlete","country","mark","unit","place","source_url"], identity: ["competition","season","meeting","discipline","category","athlete"], required: ["competition","season","meeting","discipline","category","athlete","mark","unit","place"], label: ["date","meeting","discipline","category","athlete","mark","unit","place"] },
  { id: "FIGURE_SKATING", name: "Figure skating", description: "Keep disciplines and short/free segments separate. The archive records official segment or total scores without combining unlike events.", fields: ["date","competition","season","event","discipline","segment","skater_or_team","country","score","place","source_url"], identity: ["competition","season","event","discipline","segment","skater_or_team"], required: ["competition","season","event","discipline","segment","skater_or_team","score","place"], label: ["date","event","discipline","segment","skater_or_team","score","place"] },
  { id: "SPEED_SKATING", name: "Speed skating", description: "Store each distance, relay category and time separately. Rankings remain within the selected event and edition.", fields: ["date","competition","season","event","distance","category","athlete_or_team","country","time","place","source_url"], identity: ["competition","season","event","distance","category","athlete_or_team"], required: ["competition","season","event","distance","category","athlete_or_team","time","place"], label: ["date","event","distance","category","athlete_or_team","time","place"] }
];

type RecordRow = Record<string, string>;
const keyFor = (sport: SportId) => "rapsometeddy-sports-archive-v1-" + sport;

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
      quoted = true;
      closedQuote = false;
    } else if (ch === ",") {
      row.push(cell.trim()); cell = ""; closedQuote = false;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(value => value !== "")) rows.push(row);
      row = []; cell = ""; closedQuote = false;
    } else {
      cell += ch;
    }
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

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch { return false; }
}

function validPlace(value: string): boolean {
  return /^(?:[1-9]\d*|T[1-9]\d*|DNS|DNF|DQ|DSQ|NM|NH|WD)$/i.test(value);
}

function parseCsv(source: string, config: SportConfig): RecordRow[] {
  const rows = parseCsvRows(source);
  if (rows.length < 2) throw new Error("Add a header and at least one result row.");
  const headers = rows[0].map(value => value.toLowerCase().replace(/[ -]/g, "_"));
  if (headers.some(value => !value)) throw new Error("The CSV header contains an empty column name.");
  if (new Set(headers).size !== headers.length) throw new Error("The CSV contains duplicate column names.");
  const missing = config.required.filter(field => !headers.includes(field));
  if (missing.length) throw new Error("This " + config.name + " file is missing: " + missing.join(", "));

  return rows.slice(1).map((cells, index) => {
    const lineNumber = index + 2;
    if (cells.length !== headers.length) throw new Error("CSV row " + lineNumber + " has " + cells.length + " values; expected " + headers.length + ".");
    const raw = Object.fromEntries(headers.map((header, i) => [header, (cells[i] ?? "").trim()])) as RecordRow;
    const row = Object.fromEntries(config.fields.map(field => [field, raw[field] ?? ""])) as RecordRow;
    const missingValues = config.required.filter(field => !row[field]);
    if (missingValues.length) throw new Error("CSV row " + lineNumber + " is missing: " + missingValues.join(", ") + ".");
    if (row.date && !validDate(row.date)) throw new Error("CSV row " + lineNumber + ": date must use YYYY-MM-DD.");
    if (row.source_url && !validHttpUrl(row.source_url)) throw new Error("CSV row " + lineNumber + ": source_url must be a valid HTTP or HTTPS link.");

    if (config.id === "TABLE_TENNIS") {
      if (![row.games_a, row.games_b].every(value => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)))) throw new Error("CSV row " + lineNumber + ": table-tennis game scores must be whole numbers.");
      if (Number(row.games_a) === Number(row.games_b)) throw new Error("CSV row " + lineNumber + ": a completed table-tennis match cannot have tied game totals.");
      if (row.participant_a.toLowerCase() === row.participant_b.toLowerCase()) throw new Error("CSV row " + lineNumber + ": the two participants must be different.");
      if (row.winner && ![row.participant_a.toLowerCase(), row.participant_b.toLowerCase()].includes(row.winner.toLowerCase())) throw new Error("CSV row " + lineNumber + ": winner must match participant_a or participant_b.");
    }
    if (config.id === "FORMULA_RACING") {
      if (!/^(?:[1-9]\d*|NC|DNF|DNS|DSQ|EX)$/i.test(row.position)) throw new Error("CSV row " + lineNumber + ": F1 position must be a positive place or NC, DNF, DNS, DSQ or EX.");
      if (row.points && (!Number.isFinite(Number(row.points)) || Number(row.points) < 0)) throw new Error("CSV row " + lineNumber + ": F1 points must be a non-negative number.");
    }
    if (config.id === "ICE_HOCKEY") {
      if (![row.home_goals, row.away_goals].every(value => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)))) throw new Error("CSV row " + lineNumber + ": ice-hockey goals must be whole non-negative numbers.");
      if (row.home_team.toLowerCase() === row.away_team.toLowerCase()) throw new Error("CSV row " + lineNumber + ": a team cannot play itself.");
    }
    if (config.id === "ATHLETICS") {
      if (!Number.isFinite(Number(row.mark)) || Number(row.mark) <= 0) throw new Error("CSV row " + lineNumber + ": athletics mark must be a positive number; keep its unit in the unit column.");
      if (!validPlace(row.place)) throw new Error("CSV row " + lineNumber + ": place must be a positive place or a recognised result status.");
    }
    if (config.id === "FIGURE_SKATING") {
      if (!Number.isFinite(Number(row.score)) || Number(row.score) < 0) throw new Error("CSV row " + lineNumber + ": figure-skating score must be a non-negative number.");
      if (!validPlace(row.place)) throw new Error("CSV row " + lineNumber + ": place must be a positive place or a recognised result status.");
    }
    if (config.id === "SPEED_SKATING") {
      if (!/^\d+(?::[0-5]?\d){0,2}(?:\.\d+)?$/.test(row.time)) throw new Error("CSV row " + lineNumber + ": time must look like 37.85 or 1:07.123.");
      if (!validPlace(row.place)) throw new Error("CSV row " + lineNumber + ": place must be a positive place or a recognised result status.");
    }
    return row;
  });
}

const csvCell = (value: string) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
const eventName = (row: RecordRow) => row.event || row.grand_prix || row.meeting || "Unspecified";

export default function SportsArchive() {
  const [sportId, setSportId] = useState<SportId>("TABLE_TENNIS");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [notice, setNotice] = useState("Choose a sport, then import a CSV using its own schema. Records stay separate on this device.");
  const [loaded, setLoaded] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState("all");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const config = SPORTS.find(sport => sport.id === sportId)!;

  useEffect(() => {
    setLoaded(false);
    setSelectedCompetition("all");
    setSelectedSeason("all");
    try {
      const saved = localStorage.getItem(keyFor(sportId));
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item !== "object" || Array.isArray(item))) throw new Error("Invalid archive format");
      setRecords(parsed as RecordRow[]);
      setNotice("Loaded " + config.name + " records from this browser.");
    } catch {
      setRecords([]);
      setNotice("Saved records could not be read. Import a CSV backup if you have one.");
    }
    setLoaded(true);
  }, [sportId]);

  function save(next: RecordRow[]): boolean {
    try {
      localStorage.setItem(keyFor(sportId), JSON.stringify(next));
      setRecords(next);
      return true;
    } catch {
      setNotice("The browser could not save this change. Export a backup and free browser storage before trying again.");
      return false;
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("CSV is larger than 10 MB. Split it into smaller files and import them separately.");
      const incoming = parseCsv(await file.text(), config);
      const signature = (row: RecordRow) => config.identity.map(field => (row[field] ?? "").trim().toLowerCase()).join("|");
      const existingIndexes = new Map<string, number>();
      records.forEach((row, index) => existingIndexes.set(signature(row), index));
      const incomingSeen = new Map<string, RecordRow>();
      const next = [...records];
      let added = 0;
      let updated = 0;
      let duplicates = 0;
      for (const row of incoming) {
        const key = signature(row);
        const earlier = incomingSeen.get(key);
        if (earlier) {
          if (JSON.stringify(earlier) !== JSON.stringify(row)) throw new Error("This CSV contains the same event or participant more than once with conflicting results. Resolve the conflict before importing.");
          duplicates++;
          continue;
        }
        incomingSeen.set(key, row);
        const existingIndex = existingIndexes.get(key);
        if (existingIndex === undefined) {
          existingIndexes.set(key, next.length);
          next.push(row);
          added++;
        } else if (JSON.stringify(next[existingIndex]) === JSON.stringify(row)) {
          duplicates++;
        } else {
          next[existingIndex] = row;
          updated++;
        }
      }
      if (save(next)) {
        const linked = incoming.filter(row => row.source_url).length;
        setNotice("Added " + added + " new " + config.name + " records, updated " + updated + " existing records and skipped " + duplicates + " exact duplicates. " + linked + " imported rows include a source link. Source links are not independently verified.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read this CSV.");
    }
    event.target.value = "";
  }

  function downloadTemplate() {
    const csv = config.fields.join(",") + "\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = config.id.toLowerCase() + "-results-template.csv"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportRecords() {
    const csv = [config.fields.join(","), ...records.map(row => config.fields.map(field => csvCell(row[field] ?? "")).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = config.id.toLowerCase() + "-archive.csv"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const competitions = useMemo(() => [...new Set(records.map(row => row.competition).filter(Boolean))].sort(), [records]);
  const seasons = useMemo(() => [...new Set(records.filter(row => selectedCompetition === "all" || row.competition === selectedCompetition).map(row => row.season).filter(Boolean))].sort(), [records, selectedCompetition]);
  const visibleRecords = useMemo(() => records.filter(row =>
    (selectedCompetition === "all" || row.competition === selectedCompetition) &&
    (selectedSeason === "all" || row.season === selectedSeason)
  ), [records, selectedCompetition, selectedSeason]);
  const sourceLinked = records.filter(row => row.source_url).length;
  const eventCount = new Set(visibleRecords.map(eventName)).size;

  return <section className="card">
    <div className="section-head"><h2>Independent sports archives</h2><span className="pill">Local-first · No API keys</span></div>
    <p>Each sport has its own CSV schema and browser storage key. Switching sports loads a separate archive; importing table tennis cannot alter Formula 1, hockey, athletics or skating records.</p>
    <label className="league-filter">Select a sport
      <select value={sportId} onChange={event => setSportId(event.target.value as SportId)}>
        {SPORTS.map(sport => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
      </select>
    </label>
    <p>{config.description}</p>
    <div className="pipeline-steps">
      <div><b>01 · Sport schema</b><small>{config.fields.length} dedicated fields</small></div>
      <div><b>02 · Validate</b><small>Row structure, required values and sport-specific formats</small></div>
      <div><b>03 · Isolate</b><small>Separate local storage</small></div>
      <div><b>04 · Archive</b><small>Exportable CSV records</small></div>
    </div>
    <div className="actions">
      <label className="button upload">⬆ Import {config.name} CSV<input type="file" accept=".csv,text/csv" onChange={importFile} /></label>
      <button className="button" onClick={downloadTemplate}>Download {config.name} template</button>
      <button className="button" onClick={exportRecords} disabled={!records.length}>Export {config.name} archive</button>
      <button className="button danger" onClick={() => {
        if (window.confirm("Clear only the " + config.name + " archive from this browser? Export a backup first if you may need these records.")) {
          if (save([])) setNotice(config.name + " archive cleared. Other sports are untouched.");
        }
      }}>Clear this sport only</button>
    </div>
    <p className="notice" role="status" aria-live="polite">{loaded ? notice : "Loading selected sport archive…"}</p>
    <div className="stats-grid">
      <div><b>{records.length}</b><small>ALL RECORDS</small></div>
      <div><b>{visibleRecords.length}</b><small>RECORDS IN VIEW</small></div>
      <div><b>{competitions.length}</b><small>COMPETITIONS</small></div>
      <div><b>{sourceLinked}/{records.length || 0}</b><small>RECORDS WITH SOURCE LINKS</small></div>
    </div>
    <div className="archive-filters">
      <label>Competition
        <select value={selectedCompetition} onChange={event => { setSelectedCompetition(event.target.value); setSelectedSeason("all"); }}>
          <option value="all">All competitions</option>
          {competitions.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label>Season / edition
        <select value={selectedSeason} onChange={event => setSelectedSeason(event.target.value)}>
          <option value="all">All seasons</option>
          {seasons.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
    <div className="league-table-wrap">
      {visibleRecords.length ? <table className="league-table">
        <thead><tr>{config.label.map(field => <th key={field}>{field.replace(/_/g, " ")}</th>)}<th>Source</th></tr></thead>
        <tbody>{visibleRecords.slice(-100).reverse().map((row, index) => <tr key={index}>
          {config.label.map(field => <td key={field}>{row[field] || "—"}</td>)}
          <td>{row.source_url ? <a href={row.source_url} target="_blank" rel="noreferrer">Open source</a> : "Not supplied"}</td>
        </tr>)}</tbody>
      </table> : <p className="muted">No {config.name.toLowerCase()} records match this view. Download the template, add completed results and import it here.</p>}
    </div>
    <p className="muted">{visibleRecords.length > 100 ? "Showing the latest 100 matching rows. Export the archive for the full dataset. " : ""}{eventCount} event labels in this view. Source coverage: {sourceLinked} of {records.length} records have a URL. A URL is provenance, not proof that a result is official or correct. Imported data stays in this browser and does not sync across devices; export backups regularly.</p>
    <p className="muted">This is a historical sports-record archive, not a wagering or outcome-picking tool.</p>
  </section>;
}
