export type ApiMatch={id:number;utcDate:string;status:string;homeTeam:{id:number;name:string};awayTeam:{id:number;name:string};score?:{fullTime?:{home:number|null;away:number|null}};competition?:{name:string;code:string}};

type Standing={team:{id:number;name:string};position:number;playedGames:number;won:number;draw:number;lost:number;goalsFor:number;goalsAgainst:number;points:number};

type Prediction={home:number;draw:number;away:number;scoreHome:number;scoreAway:number;confidence:number;basis:string};

async function footballFetch(path:string){
 const token=process.env.FOOTBALL_DATA_API_KEY;
 if(!token) return null;
 const res=await fetch("https://api.football-data.org/v4/"+path,{headers:{"X-Auth-Token":token},next:{revalidate:600}});
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

function buildPrediction(home:Standing,away:Standing):Prediction{
 const homePpg=home.playedGames?home.points/home.playedGames:1.2;
 const awayPpg=away.playedGames?away.points/away.playedGames:1.2;
 const homeGf=home.playedGames?home.goalsFor/home.playedGames:1.3;
 const awayGf=away.playedGames?away.goalsFor/away.playedGames:1.1;
 const homeGa=home.playedGames?home.goalsAgainst/home.playedGames:1.2;
 const awayGa=away.playedGames?away.goalsAgainst/away.playedGames:1.3;
 const strength=(homePpg-awayPpg)*0.55+(homeGf-awayGf)*0.20+(awayGa-homeGa)*0.15+0.35;
 const rawHome=Math.exp(strength);
 const rawAway=Math.exp(-strength*0.85);
 const rawDraw=0.48;
 const total=rawHome+rawDraw+rawAway;
 const h=rawHome/total,d=rawDraw/total,a=rawAway/total;
 const attackHome=(homeGf+awayGa)/2+0.18;
 const attackAway=(awayGf+homeGa)/2;
 return {home:h,draw:d,away:a,scoreHome:Math.max(0,Math.min(5,Math.round(attackHome))),scoreAway:Math.max(0,Math.min(5,Math.round(attackAway))),confidence:Math.round(Math.max(h,d,a)*100),basis:"Current competition standings + scoring rates + home advantage"};
}

export async function getMatchesWithPredictions(){
 const result=await getMatches();
 if(!result.matches.length) return result;
 const codes=[...new Set(result.matches.map(m=>m.competition?.code).filter(Boolean))] as string[];
 const tables=new Map<string,Standing[]>();
 await Promise.all(codes.slice(0,10).map(async code=>{
  try{
   const data=await footballFetch("competitions/"+encodeURIComponent(code)+"/standings");
   const rows=(data?.standings?.[0]?.table??[]) as Standing[];
   tables.set(code,rows);
  }catch{}
 }));
 const matches=result.matches.map(m=>{
  const table=tables.get(m.competition?.code||"")??[];
  const home=table.find(t=>t.team?.id===m.homeTeam.id);
  const away=table.find(t=>t.team?.id===m.awayTeam.id);
  return {...m,prediction:home&&away?buildPrediction(home,away):null};
 });
 return {...result,matches};
}
