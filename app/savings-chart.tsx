"use client";
import { money, type Entry } from "./domain";

export default function SavingsChart({entries}:{entries:Entry[]}){
  const changes=entries.filter(e=>e.goalDeltaCents!==0).slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  let sum=0;const values=[0,...changes.map(e=>sum+=e.goalDeltaCents)];
  const maximum=Math.max(10000,...values);const w=720,h=140,left=0,bottom=124;
  const points=values.map((value,i)=>[left+(i/Math.max(1,values.length-1))*w,bottom-value/maximum*108]);
  if(points.length===1)points.push([w,bottom]);
  const line=points.map(([x,y],i)=>`${i?"L":"M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area=`${line} L${w},${bottom} L0,${bottom} Z`;
  const label=(value:string)=>new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric"});
  return <div className="history-chart" aria-label={changes.length?`Savings history. Current reserved balance: ${money(sum)}.`:"Savings history is empty. Add money to a goal to begin."} role="img">
    <svg className="savings-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="savings-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".13"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
      {[16,70,124].map(y=><line key={y} className="chart-grid" x1="0" x2={w} y1={y} y2={y}/>)}
      {changes.length>0&&<path d={area} fill="url(#savings-fill)"/>}
      <path className="chart-line" d={line} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" pathLength="1"/>
      {changes.length>0&&<circle cx={points.at(-1)![0]} cy={points.at(-1)![1]} r="3.2" fill="currentColor"/>}
    </svg>
    {changes.length===0&&<div className="chart-empty">Add your first contribution to start the line.</div>}
    <div className="chart-axis"><span>{changes.length?label(changes[0].createdAt):"Getting started"}</span><span>{changes.length?label(changes.at(-1)!.createdAt):"Your next contribution"}</span></div>
  </div>;
}
