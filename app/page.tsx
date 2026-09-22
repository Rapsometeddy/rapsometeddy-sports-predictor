"use client";
import {useEffect,useState} from "react";
type Match={id:number;utcDate:string;status:string;homeTeam:{name:string};awayTeam:{name:string};competition?:{name:string}};
export default function Home(){const [matches,setMatches]=useState<Match[]>([]);const [source,setSource]=useState("");const [loading,setLoading]=useState(true);const [error,setError]=useState("");
async function load(){setLoading(true);setError("");try{const r=await fetch("/api/matches");const d=await r.json();if(!r.ok)throw new Error(d.error||"Failed to load matches");setMatches(d.matches||[]);setSource(d.source||"unknown")}catch(e){setError(e instanceof Error?e.message:"Unable to load matches")}finally{setLoading(false)}}
useEffect(()=>{load()},[]);
return <main><header><div><span className="eyebrow">RAPSOMETTEDY LABS</span><h1>Sports Predictor</h1><p>Live football fixtures and statistical match analysis.</p></div><button onClick={load}>↻ Refresh</button></header>
<div className="status">{loading?"Loading fixtures…":error?"⚠ "+error:"● "+source}</div>
<section className="card"><h2>Upcoming fixtures</h2>{!loading&&!error&&!matches.length&&<p>No fixtures returned. Add <b>FOOTBALL_DATA_API_KEY</b> in Vercel to enable live data.</p>}
<div className="list">{matches.slice(0,20).map(m=><article key={m.id}><div><small>{m.competition?.name||"Football"} • {new Date(m.utcDate).toLocaleString()}</small><h3>{m.homeTeam.name} <span>vs</span> {m.awayTeam.name}</h3></div><b>{m.status}</b></article>)}</div></section>
<section className="grid"><div className="card"><h2>Analytics engine</h2><p>V1 foundation is ready for form, scoring rates, home/away performance and historical backtesting.</p></div><div className="card"><h2>Data pipeline</h2><p>Football API → server route → prediction engine → dashboard. API credentials stay server-side.</p></div></section>
<footer>Estimates are statistical analysis, not guarantees.</footer></main>}