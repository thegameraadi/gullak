import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare,createFetchMock}=wranglerRequire('miniflare');
const fetchMock=createFetchMock();fetchMock.disableNetConnect();
fetchMock.get("https://api.frankfurter.dev").intercept({path:"/v2/rates?base=USD",method:"GET"}).reply(200,JSON.stringify([{base:"USD",quote:"INR",rate:90,date:new Date().toISOString().slice(0,10)},{base:"USD",quote:"EUR",rate:.9,date:new Date().toISOString().slice(0,10)}]),{headers:{"Content-Type":"application/json"}}).persist();
fetchMock.get("https://www.amazon.com").intercept({path:"/dp/GULLAKTEST",method:"GET"}).reply(200,'<script type="application/ld+json">'+JSON.stringify({"@type":"Product",name:"Nintendo Game",description:"Game details",offers:{price:49.99,priceCurrency:"USD"}})+'</script>',{headers:{"Content-Type":"text/html"}}).persist();
const workerOptions={modules:[{type:'ESModule',path:resolve('dist/server/index.js')},...readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js').map(p=>({type:'ESModule',path:resolve('dist/server',p)}))],modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'gullak-qa'},cf:false,fetchMock};
const mf=new Miniflare({...workerOptions,bindings:{GULLAK_MANAGE_OWNER_EMAIL:'qa@test.invalid'}});
try{
 const db=await mf.getD1Database('DB');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())for(const sql of readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint'))if(sql.trim())await db.exec(sql.replace(/\n/g,' '));
 const base='https://gullak.test';const headers={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'qa@test.invalid','Content-Type':'application/json'};
 const versionResponse=await mf.dispatchFetch(base+'/api/version');assert.equal(versionResponse.status,200);assert.match(versionResponse.headers.get('cache-control'),/no-store/);const release=(await versionResponse.json()).version;assert.match(release,/^[a-f0-9]{24}$/);assert.equal((await (await mf.dispatchFetch(base+'/api/version?t=2')).json()).version,release);assert.equal((await mf.dispatchFetch(base+'/')).headers.get('cache-control'),'private, no-store');
 const get=()=>mf.dispatchFetch(base+'/api/account',{headers});
 const post=(version,action,payload,requestId=crypto.randomUUID(),extra={})=>mf.dispatchFetch(base+'/api/account',{method:'POST',headers:{...headers,...extra},body:JSON.stringify({version,action,payload,requestId})});
 assert.equal((await mf.dispatchFetch(base+'/api/account')).status,401);
 assert.equal((await mf.dispatchFetch(base+'/api/rates')).status,401);
 const rateResponse=await mf.dispatchFetch(base+'/api/rates',{headers});assert.equal(rateResponse.status,200);assert.equal((await rateResponse.json()).rates.INR.rate,90);
 const anon=await mf.dispatchFetch(base+'/',{redirect:'manual'});assert.equal(anon.status,200);const welcome=await anon.text();assert.match(welcome,/Log In/);assert.match(welcome,/Create an Account/);assert.match(welcome,/Continue as a Guest/);assert.match(welcome,/signin-with-chatgpt/);assert.doesNotMatch(welcome,/qa@test.invalid/);assert.equal((await mf.dispatchFetch(base+'/api/gullie')).status,401);assert.equal((await mf.dispatchFetch(base+'/api/gullie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Summarize my goals',history:[],today:new Date().toISOString().slice(0,10)})})).status,401);const guestRates=await mf.dispatchFetch(base+'/api/guest-rates');assert.equal(guestRates.status,200);assert.equal((await guestRates.json()).rates.INR.rate,90);assert.equal((await db.prepare('SELECT count(*) AS n FROM gullak_accounts').first()).n,0);
 const readProduct=(url,extra={})=>mf.dispatchFetch(base+'/api/product',{method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify({url})});
 const importedProduct=await readProduct('https://www.amazon.com/dp/GULLAKTEST');assert.equal(importedProduct.status,200);assert.match(importedProduct.headers.get('cache-control'),/no-store/);const details=await importedProduct.json();assert.equal(details.name,'Nintendo Game');assert.equal(details.price,49.99);assert.equal(details.currency,'USD');assert.equal((await db.prepare('SELECT count(*) AS n FROM gullak_accounts').first()).n,0);
 assert.equal((await readProduct('https://127.0.0.1/x')).status,400);assert.equal((await readProduct('https://www.amazon.com/dp/GULLAKTEST',{Origin:'https://other.invalid'})).status,403);
 const page=await mf.dispatchFetch(base+'/',{headers});assert.equal(page.status,200);const html=await page.text();assert.match(html,/GOALS/);assert.match(html,/noindex/);assert.doesNotMatch(html,/Starter Project/);
 let r=await get();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);let s=await r.json();assert.equal(s.state.goals.length,5);assert.equal(s.state.entries.length,0);
 r=await post(s.version,'editGoal',{goalId:'monitor',name:'QA monitor',category:'Tech',targetCents:10000,date:'',note:''});assert.equal(r.status,200);s=await r.json();
 const id=crypto.randomUUID();r=await post(s.version,'income',{amountCents:20000,date:'2026-10-04',note:'QA deposit'},id);assert.equal(r.status,200);const income=await r.json();
 r=await post(s.version,'income',{amountCents:20000},id);assert.equal(r.status,200);assert.equal((await r.json()).state.entries.length,1);
 const concurrent=await Promise.all([post(income.version,'contribute',{goalId:'monitor',source:'pool',amountCents:7000}),post(income.version,'contribute',{goalId:'monitor',source:'pool',amountCents:8000})]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
 s=await(await get()).json();assert.equal(s.state.entries.length,2);
 r=await post(s.version,'income',{amountCents:100},crypto.randomUUID(),{Origin:'https://other.invalid'});assert.equal(r.status,403);
 r=await post(s.version,'contribute',{goalId:'monitor',source:'pool',amountCents:999999});assert.equal(r.status,400);assert.equal((await(await get()).json()).version,s.version);
 r=await post(s.version,'purchase',{goalId:'monitor',amountCents:5000,confirmed:true});assert.equal(r.status,400);
 const amountSaved=s.state.entries.filter(e=>e.goalId==='monitor').reduce((n,e)=>n+e.goalDeltaCents,0);
 r=await post(s.version,'contribute',{goalId:'monitor',source:'pool',amountCents:10000-amountSaved});assert.equal(r.status,200);s=await r.json();
 r=await post(s.version,'purchase',{goalId:'monitor',amountCents:9000,confirmed:false});assert.equal(r.status,400);
 r=await post(s.version,'purchase',{goalId:'monitor',amountCents:9000,confirmed:true});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.goals[0].status,'purchased');
 r=await post(s.version,'createGoal',{name:'Car',category:'auto',targetCents:360000,date:'',note:''});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.goals.at(-1).category,'Getting around');
 const carId=s.state.goals.at(-1).id;
 r=await post(s.version,'contribute',{goalId:carId,source:'external',amountCents:2000});assert.equal(r.status,200);s=await r.json();
 r=await post(s.version,'closeGoal',{goalId:carId});assert.equal(r.status,400);
 r=await post(s.version,'closeGoal',{goalId:carId,reason:'bought',amountCents:5000,confirmed:true,date:'2026-10-04'});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.losses[0].amountCents,3000);assert.equal(s.state.goals.some(g=>g.id===carId),false);
 const persisted=await(await get()).json();assert.deepEqual(persisted.state.losses,s.state.losses);
 const ask=(text,extra={})=>mf.dispatchFetch(base+'/api/gullie',{method:'POST',headers:{...headers,...extra},body:JSON.stringify({text,history:[],today:new Date().toISOString().slice(0,10)})});
 const beforeAssistant=s.version;let answer=await ask('Summarize my goals');assert.equal(answer.status,200);let reply=await answer.json();assert.equal(reply.mode,'built-in');assert.equal(reply.version,s.version);assert.match(reply.reply,/recorded as earned income/);answer=await ask('I earned $20');assert.equal(answer.status,200);reply=await answer.json();assert.equal(reply.plan.action,'income');assert.equal(reply.plan.payload.amountCents,2000);assert.equal((await(await get()).json()).version,beforeAssistant);
 assert.equal((await ask('Summarize my goals',{Origin:'https://other.invalid'})).status,403);assert.equal((await mf.dispatchFetch(base+'/api/gullie',{method:'POST',headers,body:'bad JSON'})).status,400);
 const otherAnswer=await ask('Summarize my goals',{'oai-authenticated-user-id':'qa-other-gullie'});assert.equal(otherAnswer.status,200);assert.doesNotMatch((await otherAnswer.json()).reply,/QA monitor/);
 r=await post(s.version,'settings',{currency:'INR',gullieEnabled:false});assert.equal(r.status,200);s=await r.json();assert.equal((await(await get()).json()).state.settings.currency,'INR');assert.equal((await ask('Summarize my goals')).status,403);r=await post(s.version,'settings',{gullieEnabled:true});assert.equal(r.status,200);s=await r.json();assert.equal((await ask('Summarize my goals')).status,200);const refreshed=await mf.dispatchFetch(base+'/api/rates?refresh=1',{headers});assert.equal(refreshed.status,200);

 const lossPurchase=s.state.entries.find(e=>e.goalId===carId&&e.kind==='purchase');
 r=await post(s.version,'editEntry',{entryId:lossPurchase.id,amountCents:4000,date:'2026-10-04',note:'Corrected price'});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.losses[0].amountCents,2000);
 r=await post(s.version,'deleteEntry',{entryId:lossPurchase.id});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.losses.length,0);assert.equal(s.state.goals.find(g=>g.id===carId).targetCents,360000);
 r=await post(s.version,'resetGoal',{goalId:carId,confirmed:false});assert.equal(r.status,400);
 r=await post(s.version,'resetGoal',{goalId:carId,confirmed:true,date:'2026-10-05'});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.entries.filter(e=>e.goalId===carId).reduce((n,e)=>n+e.goalDeltaCents,0),0);
 const incomeEntry=s.state.entries.find(e=>e.kind==='income');r=await post(s.version,'editEntry',{entryId:incomeEntry.id,amountCents:18000,date:'2026-10-04',note:'Updated income'});assert.equal(r.status,200);s=await r.json();
 const oldLast=s.state.entries.at(-1).id;r=await post(s.version,'reset',{scope:'earned',confirmed:true});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.earningsFromEntry,oldLast);assert.ok(s.state.entries.length>0);
 r=await post(s.version,'income',{amountCents:1000});assert.equal(r.status,200);s=await r.json();const newIncome=s.state.entries.at(-1);
 r=await post(s.version,'deleteEntry',{entryId:newIncome.id});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.entries.some(e=>e.id===newIncome.id),false);
 r=await post(s.version,'reset',{scope:'history',confirmed:false});assert.equal(r.status,400);
 r=await post(s.version,'reset',{scope:'history',confirmed:true});assert.equal(r.status,200);s=await r.json();assert.equal(s.state.entries.length,0);assert.equal(s.state.goals[0].status,'active');
 const resetId=crypto.randomUUID();const oldVersion=s.version;r=await post(s.version,'reset',{scope:'all',confirmed:true},resetId);assert.equal(r.status,200);s=await r.json();assert.equal(s.state.goals.length,0);
 r=await post(oldVersion,'reset',{scope:'all',confirmed:true},resetId);assert.equal(r.status,200);assert.equal((await r.json()).version,s.version);assert.deepEqual((await(await get()).json()).state.entries,[]);
 const other=await mf.dispatchFetch(base+'/api/account',{headers:{...headers,'oai-authenticated-user-id':'qa-other'}});assert.equal(other.status,200);assert.equal((await other.json()).state.entries.length,0);
 // Management stays private before and after the owner's identity is bound.
 const deniedHeaders={'oai-authenticated-user-id':'another-account','oai-authenticated-user-email':'other@test.invalid'};
 const anonManage=await mf.dispatchFetch(base+'/manage');assert.equal(anonManage.headers.get('x-robots-tag'),'noindex, nofollow');const loginPage=await anonManage.text();assert.match(loginPage,/Sign in with ChatGPT/);assert.doesNotMatch(loginPage,/How Gullak is being used/);
 assert.equal((await mf.dispatchFetch(base+'/api/manage')).status,401);
 assert.equal((await mf.dispatchFetch(base+'/api/manage',{headers:deniedHeaders})).status,403);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM gullak_manage_owner').first()).n,0);
 const deniedPage=await(await mf.dispatchFetch(base+'/manage',{headers:deniedHeaders})).text();assert.match(deniedPage,/Access restricted/);assert.doesNotMatch(deniedPage,/How Gullak is being used/);
 let reportResponse=await mf.dispatchFetch(base+'/api/manage?days=7',{headers});assert.equal(reportResponse.status,200);assert.match(reportResponse.headers.get('cache-control'),/no-store/);assert.equal((await reportResponse.json()).daily.length,7);assert.equal((await db.prepare('SELECT user_id FROM gullak_manage_owner WHERE id=1').first()).user_id,'qa-owner');
 assert.equal((await mf.dispatchFetch(base+'/api/manage',{headers:{...headers,'oai-authenticated-user-id':'other-with-same-email'}})).status,403);
 assert.equal((await mf.dispatchFetch(base+'/api/manage',{headers:{...headers,'oai-authenticated-user-email':'updated-email@test.invalid'}})).status,200);
 const ownerPage=await(await mf.dispatchFetch(base+'/manage?days=7',{headers})).text();assert.match(ownerPage,/How Gullak is being used/);assert.match(ownerPage,/Search visibility/);assert.match(ownerPage,/noindex/);
 const noConfig=new Miniflare(workerOptions);try{assert.equal((await noConfig.dispatchFetch(base+'/api/manage',{headers})).status,503);}finally{await noConfig.dispose();}
 // Deduplicated analytics, privacy controls, and real aggregate counts.
 const usage={visitorId:crypto.randomUUID(),sessionId:crypto.randomUUID(),source:'bay-area-builders',standalone:true,events:[{id:crypto.randomUUID(),name:'page_view',engine:'none'},{id:crypto.randomUUID(),name:'gullie_opened',engine:'none'},{id:crypto.randomUUID(),name:'goal_created',engine:'none'}]};
 const sendUsage=(body=usage,extra={})=>mf.dispatchFetch(base+'/api/analytics',{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0 (iPhone) Mobile Safari/605',...extra},body:JSON.stringify(body)});
 assert.equal((await sendUsage(usage,{Origin:'https://other.invalid'})).status,403);assert.equal((await sendUsage({...usage,email:'private@test.invalid'})).status,400);assert.equal((await sendUsage({...usage,events:[{...usage.events[0],text:'private conversation'}]})).status,400);
 assert.equal((await sendUsage(usage,{DNT:'1'})).status,204);assert.equal((await sendUsage(usage,{'Sec-GPC':'1'})).status,204);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM gullak_analytics_events').first()).n,0);
 assert.equal((await sendUsage()).status,204);assert.equal((await sendUsage()).status,204);
 const report=await(await mf.dispatchFetch(base+'/api/manage?days=7',{headers})).json();assert.equal(report.summary.visitors,1);assert.equal(report.summary.sessions,1);assert.equal(report.summary.pageViews,1);assert.equal(report.summary.goalsCreated,1);assert.equal(report.features.find(f=>f.label==='gullie_opened').events,1);assert.equal(report.sources[0].label,'bay-area-builders');assert.equal(report.devices[0].label,'Phone');assert.equal(report.installation[0].label,1);assert.equal(report.modes[0].label,'Guest');assert.equal(report.daily.length,7);assert.doesNotMatch(JSON.stringify(report),/qa-owner|qa@test|amountCents|state_json|Private goal/);
 assert.equal((await mf.dispatchFetch(base+'/api/manage?days=arbitrary',{headers})).status,200);
 // The split does not invent human evidence for legacy records.
 assert.equal(report.traffic.classes.find(x=>x.category==='unknown').activities,2);
 assert.equal(report.traffic.classes.find(x=>x.category==='human').activities,0);
 await db.exec('DELETE FROM gullak_analytics_events; DELETE FROM gullak_analytics_visits; DELETE FROM gullak_analytics_visitors;');
 const browser='Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
 const pageVisit=async(agent=browser,extra={})=>{
   const response=await mf.dispatchFetch(base+'/',{headers:{'User-Agent':agent,...extra}});assert.equal(response.status,200);
   const html=await response.text(),id=html.match(/data-gullak-visit="([a-f0-9-]+)"/)?.[1];assert.match(id,/^[a-f0-9-]{36}$/);
   // waitUntil persistence is asynchronous; await its observable completion.
   for(let attempt=0;attempt<20;attempt++){if(await db.prepare('SELECT id FROM gullak_analytics_visits WHERE id=?').bind(id).first())return id;await new Promise(r=>setTimeout(r,10));}
   assert.fail('Successful document request was not recorded');
 };
 const callerLoadId=crypto.randomUUID();
 const humanVisit=await pageVisit(browser,{'x-gullak-visit-id':callerLoadId,'cf-verified-bot':'true'});assert.notEqual(humanVisit,callerLoadId);
 assert.equal((await db.prepare('SELECT traffic_class FROM gullak_analytics_visits WHERE id=?').bind(humanVisit).first()).traffic_class,'unknown');
 const forVisit=(pageLoadId,names,signals)=>({...usage,visitorId:crypto.randomUUID(),sessionId:crypto.randomUUID(),pageLoadId,signals,events:names.map(name=>({id:crypto.randomUUID(),name,engine:'none'}))});
 const humanBatch=forVisit(humanVisit,['page_view','gullie_opened'],{automation:false,interaction:false});
 assert.equal((await sendUsage(humanBatch)).status,204);
 assert.equal((await sendUsage({...humanBatch,signals:{automation:false,interaction:true},events:[{id:crypto.randomUUID(),name:'visitor_engaged',engine:'none'}]})).status,204);
 assert.equal((await db.prepare('SELECT traffic_class FROM gullak_analytics_visits WHERE id=?').bind(humanVisit).first()).traffic_class,'human');
 assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM gullak_analytics_events WHERE page_load_id=? AND traffic_class='human'").bind(humanVisit).first()).n,3);
 const botVisit=await pageVisit('Mozilla/5.0 (compatible; GPTBot/1.3; +https://openai.com/gptbot)');
 const noScriptSearch=await pageVisit('Mozilla/5.0 (compatible; Googlebot/2.1; +https://www.google.com/bot.html)');
 assert.equal((await db.prepare('SELECT traffic_class FROM gullak_analytics_visits WHERE id=?').bind(noScriptSearch).first()).traffic_class,'bot');
 // A human claim cannot erase a declared bot on the original page request.
 assert.equal((await sendUsage(forVisit(botVisit,['goal_created'],{automation:false,interaction:true}))).status,204);
 const automationVisit=await pageVisit();
 const automationBatch=forVisit(automationVisit,['page_view','gullie_opened'],{automation:true,interaction:true});
 assert.equal((await sendUsage(automationBatch)).status,204);
 assert.equal((await sendUsage({...automationBatch,signals:{automation:false,interaction:true},events:[{id:crypto.randomUUID(),name:'income_recorded',engine:'none'}]})).status,204);
 assert.equal((await db.prepare('SELECT traffic_class FROM gullak_analytics_visits WHERE id=?').bind(automationVisit).first()).traffic_class,'bot');
 const passiveVisit=await pageVisit();
 assert.equal((await sendUsage(forVisit(passiveVisit,['page_view','goal_created'],{automation:false,interaction:false}))).status,204);
 const beforeExcluded=(await db.prepare('SELECT COUNT(*) AS n FROM gullak_analytics_visits').first()).n;
 for(const extra of [{DNT:'1'},{'Sec-GPC':'1'},{purpose:'prefetch'},{'next-router-prefetch':'1'}]){
   const response=await mf.dispatchFetch(base+'/',{headers:{'User-Agent':browser,...extra}});assert.doesNotMatch(await response.text(),/data-gullak-visit=/);
 }
 await(await mf.dispatchFetch(base+'/manage',{headers})).text();await mf.dispatchFetch(base+'/api/version');
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM gullak_analytics_visits').first()).n,beforeExcluded);
 const split=await(await mf.dispatchFetch(base+'/api/manage?days=7',{headers})).json();
 assert.deepEqual(split.traffic.classes,[{category:'human',visits:1,activities:1},{category:'bot',visits:3,activities:3},{category:'unknown',visits:1,activities:1}]);
 assert.deepEqual(split.traffic.automation.find(x=>x.signal==='declared:openai-training'),{signal:'declared:openai-training',visits:1,activities:1});
 assert.deepEqual(split.traffic.automation.find(x=>x.signal==='declared:search-crawler'),{signal:'declared:search-crawler',visits:1,activities:0});
 assert.deepEqual(split.traffic.automation.find(x=>x.signal==='browser-automation'),{signal:'browser-automation',visits:1,activities:2});
 assert.doesNotMatch(JSON.stringify(split),new RegExp([humanVisit,botVisit,passiveVisit,'Mozilla','qa@test.invalid'].join('|')));
 const splitPage=await(await mf.dispatchFetch(base+'/manage',{headers})).text();assert.match(splitPage,/Humans and AI/);assert.match(splitPage,/Likely humans/);assert.match(splitPage,/Estimated classification/);assert.match(splitPage,/OpenAI/);
 // Public SEO is indexable, while authenticated account content stays private.
 assert.match(welcome,/application\/ld\+json/);assert.match(welcome,/A simple savings goal tracker/);assert.doesNotMatch(welcome,/<meta name="robots" content="noindex/);assert.doesNotMatch(welcome,/href="\/manage/);
 const privateHome=await mf.dispatchFetch(base+'/',{headers});assert.equal(privateHome.headers.get('x-robots-tag'),'noindex, nofollow');
 const robots=await(await mf.dispatchFetch(base+'/robots.txt')).text();assert.match(robots,/Sitemap: https:\/\/gullak-aditya\.thegameraadi3\.chatgpt\.site\/sitemap.xml/);
 const sitemap=await(await mf.dispatchFetch(base+'/sitemap.xml')).text();assert.match(sitemap,/<loc>https:\/\/gullak-aditya\.thegameraadi3\.chatgpt\.site\/<\/loc>/);assert.doesNotMatch(sitemap,/\/manage|\/api\//);
 console.log('Passed built Worker: ledger/account invariants; owner-only access; privacy-safe analytics and opt-outs; legacy unknown activity; server visits without JavaScript; browser interaction upgrades; sticky bot signals; excluded management/API/prefetch traffic; exact visit/activity split and automation subtotals; public SEO and private account indexing protection.');
}finally{await mf.dispose();}
