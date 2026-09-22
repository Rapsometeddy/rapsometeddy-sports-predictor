export type TTHistoricalMatch={date:string;winner:string;loser:string;winnerSets?:number;loserSets?:number};
export type TTPlayerStats={player:string;matches:number;wins:number;losses:number;winRate:number;elo:number;recentForm:number};

const SOURCES=[
 "https://raw.githubusercontent.com/Li02003121/racket-sports-dataset/main/table_tennis_wtt_men_std.csv",
 "https://raw.githubusercontent.com/Li02003121/racket-sports-dataset/main/table_tennis_wtt_women_std.csv"
];

function pick(row:Record<string,string>, names:string[]){
 const key=Object.keys(row).find(k=>names.includes(k.trim().toLowerCase()));
 return key?row[key]:"";
}
function parseCsv(text:string){
 const lines=text.replace(/\\r/g,"").split("\\n").filter(Boolean);
 if(lines.length<2) return [] as Record<string,string>[];
 const headers=lines[0].split(",").map(x=>x.trim().toLowerCase());
 return lines.slice(1).map(line=>{const cells=line.split(",");const row:Record<string,string>={};headers.forEach((h,i)=>row[h]=(cells[i]??"").replace(/^"|"$/g,""));return row;});
}
function normalise(rows:Record<string,string>[]){
 return rows.map(r=>({
  date:pick(r,["date","match_date","event_date","datetime","tournament_date"]),
  winner:pick(r,["winner","winner_name","player1","player_a","winner_player"]),
  loser:pick(r,["loser","loser_name","player2","player_b","loser_player"]),
  winnerSets:Number(pick(r,["winner_sets","sets_won","sets1","p1_sets"]))||undefined,
  loserSets:Number(pick(r,["loser_sets","sets_lost","sets2","p2_sets"]))||undefined
 })).filter(r=>r.winner&&r.loser) as TTHistoricalMatch[];
}

export async function getTableTennisBulkAnalytics(){
 const results=await Promise.all(SOURCES.map(async url=>{try{const res=await fetch(url,{next:{revalidate:86400}});if(!res.ok)return [];return normalise(parseCsv(await res.text()));}catch{return [];}}));
 const matches=results.flat().sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());
 const elo=new Map<string,number>(); const wins=new Map<string,number>(); const games=new Map<string,number>(); const recent=new Map<string,number[]>();
 const K=24;
 for(const m of matches){
  const a=elo.get(m.winner)??1500,b=elo.get(m.loser)??1500;
  const expected=1/(1+Math.pow(10,(b-a)/400));
  elo.set(m.winner,a+K*(1-expected)); elo.set(m.loser,b+K*(0-expected));
  wins.set(m.winner,(wins.get(m.winner)??0)+1); games.set(m.winner,(games.get(m.winner)??0)+1); games.set(m.loser,(games.get(m.loser)??0)+1);
  const wr=recent.get(m.winner)??[];wr.push(1);recent.set(m.winner,wr.slice(-8));const lr=recent.get(m.loser)??[];lr.push(0);recent.set(m.loser,lr.slice(-8));
 }
 const players=[...games.keys()].map(player=>{const matches=games.get(player)??0,winsN=wins.get(player)??0,form=recent.get(player)??[];return {player,matches,wins:winsN,losses:matches-winsN,winRate:matches?winsN/matches:0,elo:Math.round(elo.get(player)??1500),recentForm:form.length?form.reduce((a,b)=>a+b,0)/form.length:0};}).sort((a,b)=>b.elo-a.elo);
 return {matches:matches.length,players:players.length,from:matches[0]?.date??null,to:matches.at(-1)?.date??null,playersTop:players.slice(0,8),source:"RSMD WTT bulk dataset"};
}

export function tableTennisMatchEstimate(playerA:TTPlayerStats,playerB:TTPlayerStats){
 const eloProb=1/(1+Math.pow(10,((playerB.elo-playerA.elo)/400)));
 const form=(playerA.recentForm-playerB.recentForm)*0.12;
 const pA=Math.max(0.05,Math.min(0.95,eloProb+form));
 return {playerA:pA,playerB:1-pA,confidence:Math.round(Math.max(pA,1-pA)*100),basis:"Historical ELO + last-8 match form; educational estimate"};
}
