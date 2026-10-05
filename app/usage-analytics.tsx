"use client";
import {useEffect} from "react";
import {eventNames, trafficSource, type AnalyticsEventName} from "@/lib/analytics-contract";

export default function UsageAnalytics() {
  useEffect(() => {
    if (location.pathname !== "/" || navigator.doNotTrack === "1" || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl) return;
    let visitorId = crypto.randomUUID();
    try { const saved = JSON.parse(localStorage.getItem("gullak-usage-visitor") || "null"); if (saved?.id && Date.now()-saved.at<90*86400000) visitorId=saved.id; localStorage.setItem("gullak-usage-visitor",JSON.stringify({id:visitorId,at:Date.now()})); } catch {}
    const initialSource = trafficSource(document.referrer, new URLSearchParams(location.search).get("utm_source") || "", location.origin);
    let sessionId = crypto.randomUUID(), source = initialSource, last = Date.now();
    try { const saved=JSON.parse(localStorage.getItem("gullak-usage-session") || "null"); if(saved?.id && Date.now()-saved.at<1800000 && (initialSource==="direct" || saved.source===initialSource)) {sessionId=saved.id;source=saved.source;} } catch {}
    let queue:{id:string;name:AnalyticsEventName;engine:"none"|"built-in"|"ai"}[] = [], timer:ReturnType<typeof setTimeout>|undefined;
    const saveSession=()=>{try {localStorage.setItem("gullak-usage-visitor",JSON.stringify({id:visitorId,at:last}));localStorage.setItem("gullak-usage-session",JSON.stringify({id:sessionId,source,at:last}));}catch{}};
    const flush=(beacon=false)=>{
      clearTimeout(timer); if(!queue.length)return;
      const events=queue.splice(0,12), standalone=window.matchMedia("(display-mode: standalone)").matches || !!(navigator as Navigator & {standalone?:boolean}).standalone;
      const body=JSON.stringify({visitorId,sessionId,source,standalone,events});
      if(beacon && navigator.sendBeacon?.("/api/analytics",new Blob([body],{type:"application/json"})))return;
      void fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>{});
    };
    const add=(name:AnalyticsEventName,engine:"none"|"built-in"|"ai"="none")=>{
      if(Date.now()-last>1800000) {flush();sessionId=crypto.randomUUID();source=initialSource;}
      last=Date.now();saveSession();queue.push({id:crypto.randomUUID(),name,engine});
      if(queue.length>=12)flush();else {clearTimeout(timer);timer=setTimeout(()=>flush(),600);}
    };
    const onUsage=(e:Event)=>{const detail=(e as CustomEvent).detail;if(detail && eventNames.includes(detail.name))add(detail.name,["none","built-in","ai"].includes(detail.engine)?detail.engine:"none");};
    const onHide=()=>{if(document.visibilityState==="hidden")flush(true);};
    const onPageHide=()=>flush(true);
    window.addEventListener("gullak:usage",onUsage);document.addEventListener("visibilitychange",onHide);window.addEventListener("pagehide",onPageHide);
    add("page_view");
    return()=>{flush(true);window.removeEventListener("gullak:usage",onUsage);document.removeEventListener("visibilitychange",onHide);window.removeEventListener("pagehide",onPageHide);};
  },[]);
  return null;
}
