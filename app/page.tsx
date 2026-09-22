import {getMatchesWithPredictions,getFootballAnalytics} from "@/lib/sports";

type Match={id:number;utcDate:string;status:string;homeTeam:{name:string};awayTeam:{name:string};competition?:{name:string};prediction?:{home:number;draw:number;away:number;scoreHome:number;scoreAway:number;confidence:number;basis:string}|null};

export default async function Home(){
 const data=await getMatchesWithPredictions() as {matches:Match[];source:string;message?:string};
 const matches=data.matches??[];
 const analytics=await getFootballAnalytics();
 return <main>
  <header><div><span className="eyebrow">RAPSOMETTEDY LABS</span><h1>Sports Predictor</h1><p>Live football fixtures with transparent statistical estimates.</p></div><a className="button" href="/?refresh=1">↻ Refresh</a></header>
  <div className="status">● {data.source}{data.source==="football-data.org"?" • live data": ""}</div>
  <section className="card"><div className="section-head"><h2>Upcoming fixtures</h2><span className="pill">Model v2</span></div>
   {!matches.length&&<p>{data.message||"No fixtures returned right now."}</p>}
   <div className="list">{matches.slice(0,20).map(m=><article key={m.id}>
    <div className="match-main"><small>{m.competition?.name||"Football"} • {new Date(m.utcDate).toLocaleString()}</small><h3>{m.homeTeam.name} <span>vs</span> {m.awayTeam.name}</h3>
    {m.prediction?<div className="prediction"><div><b>{Math.round(m.prediction.home*100)}%</b><small> HOME</small></div><div><b>{Math.round(m.prediction.draw*100)}%</b><small> DRAW</small></div><div><b>{Math.round(m.prediction.away*100)}%</b><small> AWAY</small></div><strong>Est. {m.prediction.scoreHome}–{m.prediction.scoreAway}</strong></div>:<p className="muted">Standings data unavailable for this competition.</p>}
    </div><b className="match-status">{m.status}</b>
   </article>)}</div>
  </section>
  <section className="card"><div className="section-head"><h2>⚽ Football analytics</h2><span className="pill">Live dataset</span></div>
   <div className="stats-grid"><div><b>{analytics.analytics.finished}</b><small>FINISHED</small></div><div><b>{analytics.analytics.upcoming}</b><small>UPCOMING</small></div><div><b>{analytics.analytics.goals}</b><small>GOALS</small></div><div><b>{analytics.analytics.avgGoals}</b><small>AVG GOALS</small></div></div>
   <div className="stats-grid"><div><b>{Math.round(analytics.analytics.homeWinRate*100)}%</b><small>HOME WINS</small></div><div><b>{Math.round(analytics.analytics.drawRate*100)}%</b><small>DRAWS</small></div><div><b>{Math.round(analytics.analytics.awayWinRate*100)}%</b><small>AWAY WINS</small></div><div><b>{analytics.analytics.teams}</b><small>TEAMS</small></div></div>
   <p className="muted">Statistical summary of the live football dataset. No bookmaker odds.</p>
  </section>
  <section className="grid"><div className="card"><h2>How the model works</h2><p>Uses competition standings, points per game, goals scored/conceded and a small home-field adjustment. It does not use bookmaker odds.</p></div><div className="card"><h2>Confidence</h2><p>Confidence is the model's highest probability, not a guarantee. Missing standings data means no fabricated prediction is shown.</p></div></section>
  <footer>For statistical analysis and learning — not a guarantee of match results.</footer>
 </main>
}