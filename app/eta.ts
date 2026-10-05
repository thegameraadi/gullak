import { balance, type State, type Goal } from "./domain";
const day=(date:string)=>Date.parse(date+"T12:00:00Z")/86400000;
export function goalEta(state:State,goal:Goal,today:string){
 if(goal.draft||goal.status==="purchased")return null;
 const deposits=state.entries.filter(e=>e.goalId===goal.id&&e.goalDeltaCents>0&&e.date<=today);
 if(!deposits.length)return null;
 const first=deposits.reduce((a,e)=>e.date<a?e.date:a,deposits[0].date);
 const start=goal.startedOn&&goal.startedOn<first?goal.startedOn:first;
 const elapsed=Math.max(1,Math.floor(day(today)-day(start))+1);
 const total=deposits.reduce((n,e)=>n+e.goalDeltaCents,0);
 const averageDepositCents=total/deposits.length,averageIntervalDays=elapsed/deposits.length;
 const dailyCents=averageDepositCents/averageIntervalDays;
 const days=Math.ceil(Math.max(0,goal.targetCents-balance(state,goal.id))/dailyCents);
 const ms=(day(today)+days)*86400000;
 return {start,days,date:Number.isFinite(ms)&&ms<253402214400000?new Date(ms).toISOString().slice(0,10):null,dailyCents,averageDepositCents,averageIntervalDays,deposits:deposits.length};
}
