export type ApiMatch={id:number;utcDate:string;status:string;homeTeam:{id:number;name:string};awayTeam:{id:number;name:string};score?:{fullTime?:{home:number|null;away:number|null}};competition?:{name:string;code:string}};

type Standing={team:{id:number;name:string};position:number;playedGames:number;won:number;draw:number;lost:number;goalsFor:number;goalsAgainst:number;points:number};
type TeamMatch={status:string;utcDate:string;homeTeam:{id:number};awayTeam:{id:number};score?:{fullTime?:{home:number|null;away:number|null}}};
type TeamForm={ppg:number;gf:number;ga:number;recentPoints:number;recentGF:number;recentGA:number;matches:number};
export type Prediction={home:number;draw:number;away:number;scoreHome:number;scoreAway:number;confidence:number;basis:string;dataQuality:number};

async function footballFetch(path:string){
 const token=process.env.FOOTBALL_DATA_API_KEY;
 if(!token) return null;
 const res=await fetch("https://api.football-data.org/v4/"+path,{headers:{"X-Auth-Token":token},next:{revalidate:900}});
 if(!res.ok) throw new Error("Football API returned "+res.status);
 return res.json();
}

export async function getMatches(dateFrom?:string,dateTo?:string){
 const token=process.env.FOOTBALL_DATA_API_KEY;
 if(!token) return {matches:[],source:"demo",message:"Add FOOTBALL_DATA_API_KEY to enable live fixtures."};
 const params=new URLSearchParams();
 if(dateFrom) params.set("dateFrom",dateFrom);
 if(dateTo) params.set("dateTo",dateTo);
 const data=await footballFetch("matches?"+params.toString());
 return {matches:(data?.matches??[]) as ApiMatch[],source:"football-data.org"};
}

function formFromMatches(rows:TeamMatch[],teamId:number):TeamForm{
 const finished=rows.filter(r=>r.status==="FINISHED"&&r.score?.fullTime?.home!=null&&r.score?.fullTime?.away!=null).slice(-8);
 if(!finished.length) return {ppg:1.2,gf:1.2,ga:1.2,recentPoints:0,recentGF:0,recentGA:0,matches:0};
 let points=0,gf=0,ga=0;
 for(const m of finished){const h=m.score!.fullTime!.home!,a=m.score!.fullTime!.away!;const home=m.homeTeam.id===teamId;const scored=home?h:a,conceded=home?a:h;gf+=scored;ga+=conceded;points+=scored>conceded?3:scored===conceded?1:0;}
 return {ppg:points/finished.length,gf/finished.length,ga:ga/finished.length,recentPoints:points,recentGF:gf,recentGA:ga,matches:finished.length};
}

function buildPrediction(home:Standing,away:Standing,homeForm:TeamForm,awayForm:TeamForm):Prediction{
 const seasonHomePpg=home.playedGames?home.points/home.playedGames:1.2;
 const seasonAwayPpg=away.playedGames?away.points/away.playedGames:1.2;
 const seasonHomeGF=home.playedGames?home.goalsFor/home.playedGames:1.2;
 const seasonAwayGF=away.playedGames?away.goalsFor/away.playedGames:1.1;
 const seasonHomeGA=home.playedGames?home.goalsAgainst/home.playedGames:1.2;
 const seasonAwayGA=away.playedGames?away.goalsAgainst/away.playedGames:1.2;
 const formHome=homeForm.matches?homeForm.ppg:seasonHomePpg;
 const formAway=awayForm.matches?awayForm.ppg:seasonAwayPpg;
 const attackHome=(0.55*seasonHomeGF+0.45*homeForm.gf+0.55*seasonAwayGA+0.45*awayForm.ga)/2+0.20;
 const attackAway=(0.55*seasonAwayGF+0.45*awayForm.gf+0.55*seasonHomeGA+0.45*homeForm.ga)/2;
 const strength=(formHome-formAway)*0.42+(seasonHomePpg-seasonAwayPpg)*0.28+(attackHome-attackAway)*0.22+0.28;
 const rh=Math.exp(strength),ra=Math.exp(-strength*0.9),rd=0.52,total=rh+rd+ra;
 const h=rh/total,d=rd/total,a=ra/total;
 const max=Math.max(h,d,a);
 const quality=Math.round(Math.min(100,45+(homeForm.matches+awayForm.matches)*3+Math.min(home.playedGames,away.playedGames)));
 return {home:h,draw:d,away:a,scoreHome:Math.max(0,Math.min(5,Math.round(attackHome))),scoreAway:Math.max(0,Math.min(5,Math.round(attackAway))),confidence:Math.round(max*100),dataQuality:quality,basis:"Season strength + last 8 results + scoring/conceding rates + home advantage"};
}

export async function getMatchesWithPredictions(){
 const result=await getMatches();
 if(!result.matches.length) return result;
 const codes=[...new Set(result.matches.map(m=>m.competition?.code).filter(Boolean))] as string[];
 const tables=new Map<string,Standing[]>();
 await Promise.all(codes.slice(0,6).map(async code=>{try{const data=await footballFetch("competitions/"+encodeURIComponent(code)+"/standings");tables.set(code,(data?.standings?.find((s:any)=>s.type==="TOTAL")?.table??[]) as Standing[]);}catch{}}));
 const teamIds=[...new Set(result.matches.flatMap(m=>[m.homeTeam.id,m.awayTeam.id]))].slice(0,20);
 const forms=new Map<number,TeamForm>();
 await Promise.all(teamIds.map(async id=>{try{const data=await footballFetch("teams/"+id+"/matches?status=FINISHED&limit=8");forms.set(id,formFromMatches((data?.matches??[]) as TeamMatch[],id));}catch{}}));
 const matches=result.matches.map(m=>{const table=tables.get(m.competition?.code||"")??[];const home=table.find(t=>t.team?.id===m.homeTeam.id);const away=table.find(t=>t.team?.id===m.awayTeam.id);return {...m,prediction:home&&away?buildPrediction(home,away,forms.get(m.homeTeam.id)!,forms.get(m.awayTeam.id)!):null};});
 return {...result,matches};
}

export type TableTennisMatch={id:string;startTime:string;status:string;player1:{name:string};player2:{name:string};prediction?:{player1:number;player2:number;sets1:number;sets2:number;confidence:number;basis:string}};

// Provider-neutral table-tennis adapter. Set TABLE_TENNIS_API_URL and TABLE_TENNIS_API_KEY
// when a licensed/live provider is connected; secrets remain server-side.
export async function getTableTennisMatches(){
 const url=process.env.TABLE_TENNIS_API_URL;
 const key=process.env.TABLE_TENNIS_API_KEY;
 if(!url||!key) return {matches:[] as TableTennisMatch[],source:"not-connected",message:"Connect a table-tennis data provider to enable live matches."};
 const res=await fetch(url,{headers:{Authorization:"Bearer "+key},next:{revalidate:300}});
 if(!res.ok) throw new Error("Table tennis API returned "+res.status);
 const data=await res.json();
 return {matches:(data.matches??[]) as TableTennisMatch[],source:"table-tennis-api"};
}

export function predictTableTennis(player1:number,player2:number,setsToWin=3){
 const p1=Math.max(0.02,Math.min(0.98,player1)); const p2=Math.max(0.02,Math.min(0.98,player2));
 const total=p1+p2; const a=p1/total; const b=p2/total;
 return {player1:a,player2:b,sets1:a>=b?setsToWin:setsToWin-1,sets2:b>a?setsToWin:setsToWin-1,confidence:Math.round(Math.max(a,b)*100),basis:"Rating/form model placeholder until live table-tennis provider is connected"};
}
