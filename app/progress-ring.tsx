export default function ProgressRing({value,label}:{value:number;label:string}){
 const progress=Math.max(0,Math.min(100,value)),circumference=2*Math.PI*22;
 const text=progress===100?"100%":progress>0&&progress<.1?"<0.1%":`${Number(progress.toFixed(1))}%`;
 return <div className="progress-ring" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${text} funded`}><svg viewBox="0 0 56 56" aria-hidden="true"><circle className="ring-track" cx="28" cy="28" r="22"/><circle className="ring-fill" cx="28" cy="28" r="22" strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress/100)} transform="rotate(-90 28 28)"/></svg><span>{text}</span></div>;
}
