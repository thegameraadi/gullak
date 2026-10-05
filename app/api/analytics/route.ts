import {getChatGPTUser} from "../../chatgpt-auth";
import {database} from "../../store";
import {parseAnalyticsBatch,clientPlatform} from "@/lib/analytics-contract";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"};
const response=(status:number)=>new Response(null,{status,headers});
const limits=new Map<string,{at:number;count:number}>();
export async function POST(request:Request) {
  const origin=request.headers.get("origin");
  if((origin && origin!==new URL(request.url).origin)||request.headers.get("sec-fetch-site")==="cross-site")return response(403);
  if(!request.headers.get("content-type")?.includes("application/json"))return response(415);
  if(request.headers.get("dnt")==="1"||request.headers.get("sec-gpc")==="1"||/bot|crawler|spider/i.test(request.headers.get("user-agent")||""))return response(204);
  if(Number(request.headers.get("content-length")||0)>6000)return response(413);
  let batch:ReturnType<typeof parseAnalyticsBatch>;
  try {const body=await request.text();if(body.length>6000)return response(413);batch=parseAnalyticsBatch(JSON.parse(body));}catch{return response(400);}
  if(!batch)return response(400);
  const now=Date.now(), throttleKey=request.headers.get("cf-connecting-ip")||batch.visitorId;
  // Transient abuse guard only; IP addresses never enter analytics storage.
  const old=limits.get(throttleKey),limit=old && now-old.at<60000 ? old : {at:now,count:0};limit.count+=batch.events.length;
  if(limits.size>2000)for(const [key,value] of limits)if(now-value.at>=60000)limits.delete(key);
  if(limits.size>5000 && !limits.has(throttleKey))return response(429);
  limits.set(throttleKey,limit);if(limit.count>120)return response(429);
  try {
    const user=await getChatGPTUser(), mode=user?"Signed in":"Guest", platform=clientPlatform(request.headers.get("user-agent")||""), at=new Date(now).toISOString(),db=database();
    await db.batch([
      db.prepare("INSERT INTO gullak_analytics_visitors (id,first_seen,last_seen) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen").bind(batch.visitorId,at,at),
      ...batch.events.map(e=>db.prepare("INSERT OR IGNORE INTO gullak_analytics_events (id,visitor_id,session_id,name,occurred_at,mode,device,os,browser,standalone,source,engine) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(e.id,batch.visitorId,batch.sessionId,e.name,at,mode,platform.device,platform.os,platform.browser,batch.standalone?1:0,batch.source,e.engine)),
    ]);
    // Bounded maintenance; never delay product actions or delete account data.
    if(Math.random()<1/32) {
      const cutoff=new Date(now-90*86400000).toISOString();
      await db.batch([
        db.prepare("DELETE FROM gullak_analytics_events WHERE id IN (SELECT id FROM gullak_analytics_events WHERE occurred_at < ? LIMIT 1000)").bind(cutoff),
        db.prepare("DELETE FROM gullak_analytics_visitors WHERE id IN (SELECT id FROM gullak_analytics_visitors WHERE last_seen < ? LIMIT 1000)").bind(cutoff),
      ]);
    }
    return response(204);
  } catch {console.error("Usage analytics storage unavailable");return response(503);}
}
