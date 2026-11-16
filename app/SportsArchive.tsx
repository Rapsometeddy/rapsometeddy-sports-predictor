"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type SportId = "TABLE_TENNIS" | "FORMULA_RACING" | "ICE_HOCKEY" | "ATHLETICS" | "FIGURE_SKATING" | "SPEED_SKATING";
type SportConfig = { id: SportId; name: string; description: string; fields: string[]; required: string[]; label: string[] };

const SPORTS: SportConfig[] = [
  { id: "TABLE_TENNIS", name: "Table tennis", description: "Keep singles, doubles, mixed and team events distinct. Scores are games won, not goals or points from another sport.", fields: ["date","competition","season","event","discipline","round","participant_a","participant_b","games_a","games_b","winner","source_url"], required: ["competition","season","event","discipline","round","participant_a","participant_b","games_a","games_b"] , label: ["date","event","discipline","round","participant_a","participant_b","games_a","games_b","winner"] },
  { id: "FORMULA_RACING", name: "Formula 1", description: "Each Grand Prix, sprint, qualifying and practice session is a separate classification. Position and points are not mixed with other sports.", fields: ["date","competition","season","grand_prix","session","driver","constructor","position","points","status","source_url"], required: ["competition","season","grand_prix","session","driver","constructor","position","status"], label: ["date","grand_prix","session","driver","constructor","position","points","status"] },
  { id: "ICE_HOCKEY", name: "Ice hockey", description: "League, playoff and international event results stay in their own competition and season.", fields: ["date","competition","season","stage","home_team","away_team","home_goals","away_goals","status","source_url"], required: ["competition","season","stage","home_team","away_team","home_goals","away_goals"], label: ["date","competition","season","stage","home_team","away_team","home_goals","away_goals"] },
  { id: "ATHLETICS", name: "Athletics & running", description: "Track discipline, event category, mark and unit explicitly. Times, distances and heights are never compared as if they were the same measurement.", fields: ["date","competition","season","meeting","discipline","category","athlete","country","mark","unit","place","source_url"], required: ["competition","season","meeting","discipline","category","athlete","mark","unit","place"], label: ["date","meeting","discipline","category","athlete","mark","unit","place"] },
  { id: "FIGURE_SKATING", name: "Figure skating", description: "Keep disciplines and short/free segments separate. The archive records official segment or total scores without combining unlike events.", fields: ["date","competition","season","event","discipline","segment","skater_or_team","country","score","place","source_url"], required: ["competition","season","event","discipline","segment","skater_or_team","score","place"], label: ["date","event","discipline","segment","skater_or_team","score","place"] },
  { id: "SPEED_SKATING", name: "Speed skating", description: "Store each distance, relay category and time separately. Rankings remain within the selected event and edition.", fields: ["date","competition","season","event","distance","category","athlete_or_team","country","time","place","source_url"], required: ["competition","season","event","distance","category","athlete_or_team","time","place"], label: ["date","event","distance","category","athlete_or_team","time","place"] }
];

type RecordRow = Record<string, string>;
const keyFor = (sport: SportId) => "rapsometeddy-sports-archive-v1-" + sport;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let value = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { out.push(value.trim()); value = ""; }
    else value += ch;
  }
  out.push(value.trim());
  return out;
}
function parseCsv(source: string, config: SportConfig): RecordRow[] {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error("Add a header and at least one result row.");
  const headers = parseCsvLine(lines[0]).map(v => v.toLowerCase().replace(/[ -]/g, "_"));
  const missing = config.required.filter(field => !headers.includes(field));
  if (missing.length) throw new Error("This " + config.name + " file is missing: " + missing.join(", "));
  const parsed = lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""])) as RecordRow;
  }).filter(row => config.required.every(field => (row[field] ?? "").trim() !== ""));
  if (!parsed.length) throw new Error("No complete rows found. Check the required columns and values.");
  if (config.id === "TABLE_TENNIS" && parsed.some(r => !/^\d+$/.test(r.games_a) || !/^\d+$/.test(r.games_b))) throw new Error("Table-tennis games_a and games_b must be whole numbers.");
  if (config.id === "ICE_HOCKEY" && parsed.some(r => !/^\d+$/.test(r.home_goals) || !/^\d+$/.test(r.away_goals))) throw new Error("Ice-hockey goals must be whole numbers.");
  if (config.id === "FORMULA_RACING" && parsed.some(r => r.position !== "" && !/^(\d+|NC|DNF|DNS|DSQ)$/i.test(r.position))) throw new Error("F1 position must be a number or a classification such as DNF, DNS, NC or DSQ.");
  if (config.id === "FIGURE_SKATING" && parsed.some(r => !Number.isFinite(Number(r.score)))) throw new Error("Figure-skating scores must be numeric.");
  return parsed;
}
const csvCell = (v: string) => '"' + String(v ?? "").replace(/"/g, '""') + '"';

export default function SportsArchive() {
  const [sportId, setSportId] = useState<SportId>("TABLE_TENNIS");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [notice, setNotice] = useState("Choose a sport, then import a CSV using its own schema. Records stay separate on this device.");
  const [loaded, setLoaded] = useState(false);
  const config = SPORTS.find(s => s.id === sportId)!;

  useEffect(() => {
    setLoaded(false);
    try {
      const saved = localStorage.getItem(keyFor(sportId));
      const parsed = saved ? JSON.parse(saved) : [];
      setRecords(Array.isArray(parsed) ? parsed : []);
      setNotice("Loaded " + config.name + " records from this browser.");
    } catch {
      setRecords([]);
      setNotice("Saved records could not be read. Import a CSV backup if you have one.");
    }
    setLoaded(true);
  }, [sportId]);

  const save = (next: RecordRow[]) => {
    setRecords(next);
    try { localStorage.setItem(keyFor(sportId), JSON.stringify(next)); }
    catch { setNotice("Browser storage is full. Export a backup before clearing old records."); }
  };

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const incoming = parseCsv(await file.text(), config);
      const signature = (r: RecordRow) => config.required.map(k => r[k] ?? "").join("|").toLowerCase();
      const seen = new Set(records.map(signature));
      const unique: RecordRow[] = [];
      for (const row of incoming) {
        const key = signature(row);
        if (!seen.has(key)) { seen.add(key); unique.push(row); }
      }
      save([...records, ...unique]);
      setNotice("Imported " + unique.length + " new " + config.name + " records; skipped " + (incoming.length - unique.length) + " duplicates. No other sport archive was changed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read this CSV.");
    }
    event.target.value = "";
  }

  function downloadTemplate() {
    const csv = config.fields.join(",") + "\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = config.id.toLowerCase() + "-results-template.csv"; a.click(); URL.revokeObjectURL(url);
  }
  function exportRecords() {
    const csv = [config.fields.join(","), ...records.map(row => config.fields.map(field => csvCell(row[field] ?? "")).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = config.id.toLowerCase() + "-archive.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const competitions = useMemo(() => new Set(records.map(r => r.competition).filter(Boolean)).size, [records]);
  return <section className="card">
    <div className="section-head"><h2>Independent sports archives</h2><span className="pill">Local-first · No API keys</span></div>
    <p>Each sport has its own CSV schema and browser storage key. Switching sports loads a separate archive; importing table tennis cannot alter Formula 1, hockey, athletics or skating records.</p>
    <label className="league-filter">Select a sport
      <select value={sportId} onChange={e => setSportId(e.target.value as SportId)}>
        {SPORTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </label>
    <p>{config.description}</p>
    <div className="pipeline-steps">
      <div><b>01 · Sport schema</b><small>{config.fields.length} dedicated fields</small></div>
      <div><b>02 · Validate</b><small>Required fields and score formats</small></div>
      <div><b>03 · Isolate</b><small>Separate local storage</small></div>
      <div><b>04 · Archive</b><small>Exportable CSV records</small></div>
    </div>
    <div className="actions">
      <label className="button upload">⬆ Import {config.name} CSV<input type="file" accept=".csv,text/csv" onChange={importFile} /></label>
      <button className="button" onClick={downloadTemplate}>Download {config.name} template</button>
      <button className="button" onClick={exportRecords} disabled={!records.length}>Export {config.name} archive</button>
      <button className="button danger" onClick={() => { save([]); setNotice(config.name + " archive cleared. Other sports are untouched."); }}>Clear this sport only</button>
    </div>
    <p className="notice" role="status">{loaded ? notice : "Loading selected sport archive…"}</p>
    <div className="stats-grid">
      <div><b>{records.length}</b><small>RESULT RECORDS</small></div>
      <div><b>{competitions}</b><small>COMPETITIONS</small></div>
      <div><b>{new Set(records.map(r => r.season).filter(Boolean)).size}</b><small>SEASONS / EDITIONS</small></div>
      <div><b>{new Set(records.map(r => r.event || r.grand_prix || r.meeting).filter(Boolean)).size}</b><small>EVENTS</small></div>
    </div>
    <div className="league-table-wrap">
      {records.length ? <table className="league-table"><thead><tr>{config.label.map(field => <th key={field}>{field.replace(/_/g, " ")}</th>)}</tr></thead><tbody>
        {records.slice(-100).reverse().map((row, index) => <tr key={index}>{config.label.map(field => <td key={field}>{row[field] || "—"}</td>)}</tr>)}
      </tbody></table> : <p className="muted">No {config.name.toLowerCase()} records imported yet. Download the template, add verified results and import it here.</p>}
    </div>
    <p className="muted">Use public sources you are permitted to use and keep the source_url column. Imported data is stored only in this browser; it does not sync across devices. Export backups regularly. This is a historical sports-record archive, not a wagering or outcome-picking tool.</p>
  </section>;
}
