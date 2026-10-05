import { env } from "cloudflare:workers";
import { initialState, type Snapshot } from "./domain";
export function database(){if(!env.DB)throw new Error("Gullak storage is unavailable.");return env.DB;}
export async function loadAccount(userId:string):Promise<Snapshot>{
 const db=database();await db.prepare("INSERT OR IGNORE INTO gullak_accounts (user_id,state_json,version,updated_at) VALUES (?,?,0,?)").bind(userId,JSON.stringify(initialState()),new Date().toISOString()).run();
 const r=await db.prepare("SELECT state_json,version,updated_at FROM gullak_accounts WHERE user_id=?").bind(userId).first<{state_json:string;version:number;updated_at:string}>();
 if(!r)throw new Error("Your gullaks could not be loaded.");return {state:JSON.parse(r.state_json),version:r.version,updatedAt:r.updated_at};
}
