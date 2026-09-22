import {getMatchesWithPredictions} from "@/lib/sports";
import {getTableTennisBulkAnalytics} from "@/lib/table-tennis";

type Match={id:number;utcDate:string;status:string;homeTeam:{name:string};awayTeam:{name:string};score?:{fullTime?:{home:number|null;away:number|null}};competition?:{name:string};prediction?:{home:number;draw:number;away:number;scoreHome:number;scoreAway:number;confidence:number;basis:string;dataQuality:number}|null};

export default async function Home(){
 const data=await getMatchesWithPredictions() as {matches:Match[];source:string;message?:string};
 const matches=data.matches??[];
 const tt=await getTableTennisBulkAnalytics();
 return <main>
  <header><div><span className="eyebrow">RAPSOMETTEDY LABS</span><h1>Sports Predictor</h1><p>Live football fixtures with transparent statistical estimates.</p></div><a className="button" href="/?refresh=1">↻ Refresh</a></header>
  <div className="status">● {data.source}{data.source==="football-data.org"?" • live data": ""}</div>
  <section className="card"><div className="section-head"><h2>Upcoming fixtures</h2><span className="pill">Model v3 • Football + Table Tennis</span></div>
   {!matches.length&&<p>{data.message||"No fixtures returned right now."}</p>}
   <div className="list">{matches.slice(0,20).map(m=><article key={m.id}>
    <div className="match-main"><small>{m.competition?.name||"Football"} • {new Date(m.utcDate).toLocaleString()}</small><h3>{m.homeTeam.name} <span>vs</span> {m.awayTeam.name}</h3>
    {m.prediction?<div className="prediction"><div><b>{Math.round(m.prediction.home*100)}%</b><small> HOME</small></div><div><b>{Math.round(m.prediction.draw*100)}%</b><small> DRAW</small></div><div><b>{Math.round(m.prediction.away*100)}%</b><small> AWAY</small></div><strong>Est. {m.prediction.scoreHome}–{m.prediction.scoreAway}</strong><small> DATA {m.prediction.dataQuality}%</small></div>:<p className="muted">Standings data unavailable for this competition.</p>}
    </div><b className="match-status">{m.status}</b>
   </article>)}</div>
  </section>
  <section className="card"><div className="section-head"><h2>⚽ Football analytics</h2><span className="pill">Live dataset summary</span></div>
   <div className="stats-grid">
    <div><b>{matches.filter(m=>m.status==="FINISHED").length}</b><small>FINISHED</small></div>
    <div><b>{matches.filter(m=>m.status!=="FINISHED").length}</b><small>UPCOMING</small></div>
    <div><b>{matches.filter(m=>m.score?.fullTime?.home!=null&&m.score?.fullTime?.away!=null).reduce((s,m)=>s+(m.score?.fullTime?.home??0)+(m.score?.fullTime?.away??0),0)}</b><small>GOALS</small></div>
    <div><b>{(()=>{const f=matches.filter(m=>m.score?.fullTime?.home!=null&&m.score?.fullTime?.away!=null);const g=f.reduce((s,m)=>s+(m.score?.fullTime?.home??0)+(m.score?.fullTime?.away??0),0);return f.length?(g/f.length).toFixed(2):"0.00"})()}</b><small>AVG GOALS</small></div>
   </div>
   <p className="muted">This section summarizes the fixtures currently returned by the live football feed. It does not use bookmaker odds.</p>
  </section>
  <section className="card"><div className="section-head"><h2>🏓 Table Tennis</h2><span className="pill">Historical engine online</span></div><p>{tt.matches.toLocaleString()} historical WTT matches loaded across {tt.players.toLocaleString()} players{tt.from&&tt.to?` • ${tt.from.slice(0,10)} → ${tt.to.slice(0,10)}`:""}.</p><div className="tt-grid">{tt.playersTop.slice(0,6).map((p,i)=><div className="tt-player" key={p.player}><b>#{i+1} {p.player}</b><small>ELO {p.elo} • {Math.round(p.winRate*100)}% wins • last 8 {Math.round(p.recentForm*100)}%</small></div>)}</div><p className="muted">Model uses historical ELO and recent form for educational analysis. Live fixtures will be added when a live table-tennis feed is connected.</p></section><section className="grid"><div className="card"><h2>How the model works</h2><p>Uses competition standings, points per game, goals scored/conceded and a small home-field adjustment. It does not use bookmaker odds.</p></div><div className="card"><h2>Confidence</h2><p>Confidence is the model's highest probability, not a guarantee. Missing standings data means no fabricated prediction is shown.</p></div></section>
  <footer>For statistical analysis and learning — not a guarantee of match results.</footer>
 </main>
}