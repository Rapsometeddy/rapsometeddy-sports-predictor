export type Prediction={home:number;draw:number;away:number;scoreHome:number;scoreAway:number};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function predict(homeForm:number,awayForm:number,homeGoals:number,awayGoals:number):Prediction{
 const diff=(homeForm-awayForm)/100;
 const attack=homeGoals-awayGoals;
 const h=clamp(.48+diff*.30+attack*.07+.07,.08,.86);
 const a=clamp(.30-diff*.30-attack*.05,.08,.70);
 const d=clamp(1-h-a,.08,.55);
 const sum=h+d+a;
 return {home:h/sum,draw:d/sum,away:a/sum,scoreHome:Math.max(0,Math.round(homeGoals)),scoreAway:Math.max(0,Math.round(awayGoals))};
}