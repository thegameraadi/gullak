import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wranglerRequire('miniflare');
const mf=new Miniflare({modules:[{type:'ESModule',path:resolve('dist/server/index.js')},...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js').map(p=>({type:'ESModule',path:resolve('dist/server',p)}))],modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'gullak-qa'},cf:false});
try{
 const db=await mf.getD1Database('DB');await db.exec(readFileSync('drizzle/0000_worried_microbe.sql','utf8').replace(/\n/g,' '));
 const base='https://gullak.test';const headers={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'qa@test.invalid','Content-Type':'application/json'};
 const get=()=>mf.dispatchFetch(base+'/api/account',{headers});
 const post=(version,action,payload,requestId=crypto.randomUUID(),extra={})=>mf.dispatchFetch(base+'/api/account',{method:'POST',headers:{...headers,...extra},body:JSON.stringify({version,action,payload,requestId})});
 assert.equal((await mf.dispatchFetch(base+'/api/account')).status,401);
 const anon=await mf.dispatchFetch(base+'/',{redirect:'manual'});assert.equal(anon.status,307);assert.match(anon.headers.get('location'),/signin-with-chatgpt/);
 const page=await mf.dispatchFetch(base+'/',{headers});assert.equal(page.status,200);const html=await page.text();assert.match(html,/Your goals/);assert.match(html,/noindex/);assert.doesNotMatch(html,/Starter Project/);
 let r=await get();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);let s=await r.json();assert.equal(s.state.goals.length,5);assert.equal(s.state.entries.length,0);
 r=await post(s.version,'editGoal',{goalId:'monitor',name:'QA monitor',category:'Tech',targetCents:10000,date:'',note:''});assert.equal(r.status,200);s=await r.json();
 const id=crypto.randomUUID();r=await post(s.version,'income',{amountCents:20000,date:'2026-10-04',note:'QA deposit'},id);assert.equal(r.status,200);const income=await r.json();
 r=await post(s.version,'income',{amountCents:20000},id);assert.equal(r.status,200);assert.equal((await r.json()).state.entries.length,1);
 const concurrent=await Promise.all([post(income.version,'contribute',{goalId:'monitor',source:'pool',amountCents:7000}),post(income.version,'contribute',{goalId:'monitor',source:'pool',amountCents:8000})]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
 s=await(await get()).json();assert.equal(s.state.entries.length,2);
 r=await post(s.version,'income',{amountCents:100},crypto.randomUUID(),{Origin:'https://other.invalid'});assert.equal(r.status,403);
 r=await post(s.version,'contribute',{goalId:'monitor',source:'pool',amountCents:999999});assert.equal(r.status,400);assert.equal((await(await get()).json()).version,s.version);
 const other=await mf.dispatchFetch(base+'/api/account',{headers:{...headers,'oai-authenticated-user-id':'qa-other'}});assert.equal(other.status,200);assert.equal((await other.json()).state.entries.length,0);
 console.log('Passed built Worker: SSR, sign-in gate, no-store, persistence, user isolation, idempotent retries, concurrent update conflicts, CSRF and overspend rejection.');
}finally{await mf.dispose();}
