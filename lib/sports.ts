export type ApiMatch={id:number;utcDate:string;status:string;homeTeam:{id:number;name:string};awayTeam:{id:number;name:string};score?:{fullTime?:{home:number|null;away:number|null}};competition?:{name:string;code:string}};
export async function getMatches(dateFrom?:string,dateTo?:string){
 const token=process.env.FOOTBALL_DATA_API_KEY;
 if(!token) return {matches:[],source:"demo",message:"Add FOOTBALL_DATA_API_KEY to enable live fixtures."};
 const params=new URLSearchParams();
 if(dateFrom) params.set("dateFrom",dateFrom);
 if(dateTo) params.set("dateTo",dateTo);
 const res=await fetch("https://api.football-data.org/v4/matches?"+params.toString(),{headers:{"X-Auth-Token":token},next:{revalidate:300}});
 if(!res.ok) throw new Error("Football API returned "+res.status);
 const data=await res.json();
 return {matches:(data.matches??[]) as ApiMatch[],source:"football-data.org"};
}