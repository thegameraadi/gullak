"use client";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { parseCurrencyAmount, type Rates } from "./currency";
export default function AmountSlider({label,value,onChange,currency,fx,maxCents,defaultMaxCents=100000,disabled=false}:{label:string;value:string;onChange:(v:string)=>void;currency:string;fx:Rates|null;maxCents?:number;defaultMaxCents?:number;disabled?:boolean}){
 const [range,setRange]=useState(defaultMaxCents);
 const rate=currency==="USD"?1:fx?.rates[currency]?.rate;
 let minor=0;try{minor=Math.round(parseCurrencyAmount(value,currency)*100);}catch{}
 const bound=Math.min(100000000,maxCents===undefined?Math.max(range,defaultMaxCents,rate?minor/rate:0):Math.max(0,maxCents));
 // Round down so a slider never offers more money than the account holds.
 const max=rate?Math.max(0,Math.floor(bound*rate+1e-7)):0;
 const format=(n:number)=>new Intl.NumberFormat(currency==="INR"?"en-IN":"en-US",{style:"currency",currency,maximumFractionDigits:2}).format(n/100);
 return <details className="amount-slider"><summary>Use slider</summary><div className="slider-controls"><Slider ref={node=>{const thumb=node?.querySelector("[role=slider]");if(thumb){thumb.setAttribute("aria-label",`${label} in ${currency}`);thumb.setAttribute("aria-valuetext",format(Math.min(minor,max)));}}} aria-label={`${label} in ${currency}`} aria-valuetext={format(Math.min(minor,max))} min={0} max={Math.max(1,max)} step={1} value={[Math.max(0,Math.min(minor,max))]} onValueChange={v=>onChange((v[0]/100).toFixed(2))} disabled={disabled||!rate||max===0}/><div className="slider-scale"><span>{format(0)}</span><span>{format(max)}</span></div>{maxCents===undefined&&<button type="button" className="text-button" disabled={disabled||!rate||bound>=100000000} onClick={()=>setRange(Math.min(100000000,Math.max(range,bound)*2))}>Increase range</button>}{maxCents!==undefined&&minor>max&&<p className="help-text">Maximum available: {format(max)}</p>}</div></details>;
}
