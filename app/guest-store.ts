import { initialState, validateBackup, applyAction, type Snapshot } from "./domain";
export const GUEST_KEY="gullak-guest-dashboard-v1";
type LocalStore=Pick<Storage,"getItem"|"setItem">;
export class GuestConflict extends Error {snapshot:Snapshot;constructor(snapshot:Snapshot){super("Your guest dashboard changed in another tab. Review the updated balances and try again.");this.snapshot=snapshot;}}
export function loadGuest(storage:LocalStore):Snapshot{
 const raw=storage.getItem(GUEST_KEY);if(!raw){const snapshot:Snapshot={state:{...initialState(),goals:[],losses:[],archivedGoals:[]},version:0,updatedAt:new Date().toISOString()};storage.setItem(GUEST_KEY,JSON.stringify(snapshot));return snapshot;}
 try{const b=JSON.parse(raw);if(!Number.isSafeInteger(b.version)||b.version<0||typeof b.updatedAt!=="string"||Number.isNaN(Date.parse(b.updatedAt)))throw new Error("Invalid snapshot");const state=validateBackup(b.state);state.appliedRequests=Array.isArray(b.state.appliedRequests)?b.state.appliedRequests.filter((id:unknown)=>typeof id==="string"&&/^[a-zA-Z0-9_-]{8,80}$/.test(id)).slice(-200):[];return {state,version:b.version,updatedAt:b.updatedAt};}catch{throw new Error("Your saved guest dashboard couldn’t be read. It has not been replaced. Export a copy before resetting it.");}
}
export function saveGuest(storage:LocalStore,version:number,action:string,payload:unknown,requestId:string):Snapshot{
 const current=loadGuest(storage);if(current.state.appliedRequests.includes(requestId))return current;if(current.version!==version)throw new GuestConflict(current);
 const state=applyAction(current.state,action,payload,requestId),next={state,version:current.version+1,updatedAt:new Date().toISOString()};storage.setItem(GUEST_KEY,JSON.stringify(next));return next;
}
