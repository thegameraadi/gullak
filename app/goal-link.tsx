"use client";
import {useEffect,useRef,useState} from "react";
import {normalizeProductUrl,type ProductDetails} from "./product-link";
export default function GoalLink({onProduct,onSource,onBusy}:{onProduct:(product:ProductDetails)=>void;onSource:(url:string)=>void;onBusy:(busy:boolean)=>void}){
 const [url,setUrl]=useState(""),[loading,setLoading]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const pending=useRef<AbortController|null>(null),lock=useRef(false);
 useEffect(()=>()=>{pending.current?.abort();onBusy(false);},[onBusy]);
 const read=async()=>{if(lock.current)return;setError("");setMessage("");try{const sourceUrl=normalizeProductUrl(url);setUrl(sourceUrl);onSource(sourceUrl);lock.current=true;setLoading(true);onBusy(true);const controller=new AbortController();pending.current=controller;
 const response=await fetch("/api/product",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({url:sourceUrl})});const data=await response.json() as ProductDetails&{error?:string};if(controller.signal.aborted)return;if(!response.ok)throw new Error(data.error??"This product page could not be read.");onProduct(data);setMessage(data.warning);
 }catch(e){if((e as Error).name!=="AbortError")setError((e as Error).message);}
 finally{pending.current=null;lock.current=false;setLoading(false);onBusy(false);}};
 return <div className="goal-link-box"><label className="form-label" htmlFor="goal-link-url">Product Link<input id="goal-link-url" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus placeholder="Paste an Amazon or store link…" value={url} onChange={e=>{setUrl(e.target.value);setError("");setMessage("");}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void read();}}} maxLength={2048}/></label><button type="button" className="button secondary" disabled={loading||!url.trim()} onClick={()=>void read()}>{loading?"Reading link…":"Fill from Link"}</button>{message&&<p className="help-text" role="status">{message}</p>}{error&&<p className="form-error" role="alert">{error}</p>}</div>;
}
