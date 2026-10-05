import { getChatGPTUser } from "../../chatgpt-auth";
import type { Rates } from "../../currency";
export const dynamic="force-dynamic";
let cache:Rates|null=null;
export async function getRates(force=false):Promise<Rates>{
 if(!force&&cache&&Date.now()-Date.parse(cache.fetchedAt)<3600000)return cache;
 try{
  const response=await fetch("https://api.frankfurter.dev/v2/rates?base=USD",{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error("Rate provider unavailable");
  const rows:unknown=await response.json();if(!Array.isArray(rows))throw new Error("Invalid rates");
  const rates:Rates["rates"]={USD:{rate:1,date:new Date().toISOString().slice(0,10)}};
  for(const r of rows){if(r&&r.base==="USD"&&/^[A-Z]{3}$/.test(r.quote)&&Number.isFinite(r.rate)&&r.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&Date.now()-Date.parse(r.date)<1209600000)rates[r.quote]={rate:r.rate,date:r.date};}
  if(!rates.INR)throw new Error("INR unavailable");
  cache={base:"USD",rates,fetchedAt:new Date().toISOString(),source:"Frankfurter"};return cache;
 }catch{throw new Error("Exchange rates are unavailable. USD still works; you can enter a rate for other currencies.");}
}
export async function GET(request:Request){
 const headers={"Cache-Control":"private, no-store"};
 if(!await getChatGPTUser())return Response.json({error:"Sign in to load rates."},{status:401,headers});
 try{return Response.json(await getRates(new URL(request.url).searchParams.get("refresh")==="1"),{headers});}catch(e){return Response.json({error:(e as Error).message},{status:503,headers});}
}
