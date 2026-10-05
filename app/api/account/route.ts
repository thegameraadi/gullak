import { getChatGPTUser } from "../../chatgpt-auth";
import { loadAccount, database } from "../../store";
import { applyAction, DomainError } from "../../domain";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Vary":"oai-authenticated-user-id","X-Content-Type-Options":"nosniff"};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
export async function GET(){const user=await getChatGPTUser();if(!user)return json({error:"Sign in to load your gullaks."},401);try{return json(await loadAccount(user.userId));}catch(e){console.error("Account load failed",e);return json({error:"Your gullaks could not be loaded. Please try again."},503);}}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:"Sign in before saving."},401);
 const origin=request.headers.get("origin");if((origin&&origin!==new URL(request.url).origin)||request.headers.get("sec-fetch-site")==="cross-site")return json({error:"This request could not be verified."},403);
 if(!request.headers.get("content-type")?.includes("application/json"))return json({error:"Use a valid JSON request."},415);
 try{const bodyText=await request.text();if(bodyText.length>2500000)return json({error:"This backup is too large."},413);const b=JSON.parse(bodyText),current=await loadAccount(user.userId);
 if(typeof b.requestId!=="string"||typeof b.action!=="string")return json({error:"Check the action and try again."},400);
 if(current.state.appliedRequests.includes(b.requestId))return json(current);
 if(b.version!==current.version)return json({error:"Your gullaks changed on another device. Review the refreshed balances and try again.",snapshot:current},409);
 const state=applyAction(current.state,b.action,b.payload,b.requestId),now=new Date().toISOString();
 const result=await database().prepare("UPDATE gullak_accounts SET state_json=?,version=version+1,updated_at=? WHERE user_id=? AND version=?").bind(JSON.stringify(state),now,user.userId,current.version).run();
 if(result.meta.changes!==1)return json({error:"Another update was saved first. Review the refreshed balances and try again.",snapshot:await loadAccount(user.userId)},409);
 return json({state,version:current.version+1,updatedAt:now});
 }catch(e){if(e instanceof DomainError)return json({error:e.message},400);if(e instanceof SyntaxError)return json({error:"This data could not be read."},400);console.error("Account save failed",e);return json({error:"Your change could not be saved. Your input is still here; please retry."},503);}
}
