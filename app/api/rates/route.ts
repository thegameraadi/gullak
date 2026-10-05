import { getChatGPTUser } from "../../chatgpt-auth";
import type { Rates } from "../../currency";
export const dynamic="force-dynamic";
let cache:Rates|null=null;
export async function GET(){
 if(!await getChatGPTUser())return Response.json({error:"Sign in to load rates."},{status:401});
 const headers={"Cache-Control":"private, no-store"};
 if(cache&&Date.now()-Date.parse(cache.fetchedAt)<21600000)return Response.json(cache,{headers});
 try{
  const response=await fetch("https://api.frankfurter.dev/v2/rates?base=USD",{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error("Rate provider unavailable");
  const rows:unknown=await response.json();if(!Array.isArray(rows))throw new Error("Invalid rates");
  const rates:Rates["rates"]={USD:{rate:1,date:new Date().toISOString().slice(0,10)}};
  for(const r of rows){if(r&&r.base==="USD"&&/^[A-Z]{3}$/.test(r.quote)&&Number.isFinite(r.rate)&&r.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&Date.now()-Date.parse(r.date)<1209600000)rates[r.quote]={rate:r.rate,date:r.date};}
  if(!rates.INR)throw new Error("INR unavailable");
  cache={base:"USD",rates,fetchedAt:new Date().toISOString(),source:"Frankfurter"};return Response.json(cache,{headers});
 }catch{return Response.json({error:"Exchange rates are unavailable. USD still works; you can enter a rate for other currencies."},{status:503,headers});}
}
