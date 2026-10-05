import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyAction, available, reserved, balance, received, spent, suggestSplit, dollars, validateBackup, assertAccounting } from '../app/domain.ts';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../app/statement.ts',import.meta.url),'utf8').replace('"./domain"',JSON.stringify(new URL('../app/domain.ts',import.meta.url).href)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseCsv,extractCandidates,statementDate}=await import('data:text/javascript,'+encodeURIComponent(code));
let sequence=0;
const apply=(s,a,p,id='request-'+String(++sequence).padStart(8,'0'))=>applyAction(s,a,p,id,'2026-10-04T23:00:00Z');
const confirm=(s,id='monitor',targetCents=40000)=>apply(s,'editGoal',{goalId:id,name:id,category:'Tech',targetCents,date:'',note:''});
test('manual income, allocation, existing savings, release, purchase preserve every cent',()=>{
 let s=confirm(initialState());s=apply(s,'income',{amountCents:50000,date:'2026-10-04',note:'Freelance'});
 s=apply(s,'contribute',{goalId:'monitor',amountCents:35000,source:'pool'});
 assert.equal(available(s),15000);assert.equal(reserved(s),35000);assert.equal(received(s),50000);
 s=apply(s,'contribute',{goalId:'monitor',amountCents:10000,source:'external'});
 assert.equal(received(s),60000);assert.equal(reserved(s),45000);assert.equal(s.goals[0].earned,4);
 s=apply(s,'release',{goalId:'monitor',amountCents:5000});assert.equal(available(s),20000);
 s=apply(s,'purchase',{goalId:'monitor',amountCents:37500,confirmed:true});assert.equal(available(s),22500);assert.equal(balance(s,'monitor'),0);assert.equal(spent(s),37500);assert.equal(s.goals[0].status,'purchased');assertAccounting(s);
 s=apply(s,'withdraw',{amountCents:2000});assert.equal(available(s),20500);assert.equal(spent(s),39500);assertAccounting(s);
});
test('unconfirmed budgets and overspending fail without changing state',()=>{
 const s=initialState();assert.throws(()=>apply(s,'contribute',{goalId:'monitor',amountCents:100,source:'external'}),/Confirm/);assert.equal(s.entries.length,0);
 const c=confirm(s);assert.throws(()=>apply(c,'contribute',{goalId:'monitor',amountCents:100,source:'pool'}),/enough/);assert.throws(()=>apply(c,'release',{goalId:'monitor',amountCents:1}),/only release/);
 for(const amountCents of [-1,0,1.01,Infinity,100000001])assert.throws(()=>apply(c,'income',{amountCents}));
 assert.throws(()=>apply(c,'income',{amountCents:100,date:'2026-02-31'}),/date/);
 assert.throws(()=>apply(c,'contribute',{goalId:'monitor',amountCents:100,source:'unknown'}),/comes from/);
});
test('retries are idempotent and batch split is atomic',()=>{
 let s=confirm(initialState());s=confirm(s,'tv',50000);s=apply(s,'income',{amountCents:10001},'same-request-123');const same=apply(s,'income',{amountCents:10001},'same-request-123');assert.equal(same,s);
 const split=suggestSplit(s,10001);assert.equal(split.reduce((n,x)=>n+x.amountCents,0),10001);s=apply(s,'split',{allocations:split});assert.equal(available(s),0);assert.equal(reserved(s),10001);
 assert.throws(()=>apply(s,'split',{allocations:[{goalId:'monitor',amountCents:1}]}),/larger/);
 assert.throws(()=>apply(s,'deleteGoal',{goalId:'monitor'}),/Release/);assertAccounting(s);
});
test('even split caps completed targets and leaves excess unassigned',()=>{
 let s=confirm(initialState(),'monitor',2);s=confirm(s,'tv',1);const a=suggestSplit(s,100);assert.deepEqual(a,[{goalId:'monitor',amountCents:2},{goalId:'tv',amountCents:1}]);assert.deepEqual(suggestSplit(initialState(),100),[]);
});
test('backup validation rejects corruption and round-trips balances',()=>{
 let s=confirm(initialState());s=apply(s,'contribute',{goalId:'monitor',amountCents:12345,source:'external'});assert.equal(reserved(validateBackup(JSON.parse(JSON.stringify(s)))),12345);
 const bad=structuredClone(s);bad.entries[0].poolDeltaCents=100;assert.throws(()=>validateBackup(bad),/inconsistent/);
 const missing=structuredClone(s);missing.goals=[];assert.throws(()=>validateBackup(missing),/missing/);
 const negative=structuredClone(s);negative.entries.push({...negative.entries[0],id:'negative',kind:'release',amountCents:12346,goalDeltaCents:-12346,poolDeltaCents:12346});assert.throws(()=>validateBackup(negative),/balances/);
});
test('CSV quoted fields, sign convention, invalid dates and duplicates are handled',async()=>{
 const rows=parseCsv('Date,Description,Amount\r\n10/04/2026,"Freelance, project",500.25\r\n10/04/2026,Refund,-25\r\n02/31/2026,Bad date,9\r\n10/04/2026,"Quote ""inside""",10');
 assert.equal(rows[1][1],'Freelance, project');assert.equal(rows[4][1],'Quote "inside"');
 const a=await extractCandidates(rows,{date:0,description:1,amount:2,sign:'positive'});assert.equal(a.candidates.length,2);assert.equal(a.invalid,1);assert.equal(a.candidates[0].amountCents,50025);
 const b=await extractCandidates(rows,{date:0,description:1,amount:2,sign:'negative'});assert.equal(b.candidates.length,1);assert.equal(b.candidates[0].amountCents,2500);
 const again=await extractCandidates(rows,{date:0,description:1,amount:2,sign:'positive'});assert.equal(again.candidates[0].id,a.candidates[0].id);
 assert.throws(()=>parseCsv('Date,Name,Amount\n"broken'),/unclosed/);assert.throws(()=>statementDate('31/12/2026'));
 let s=initialState();const entries=a.candidates.map(c=>({sourceId:c.id,note:c.description,date:c.date,amountCents:c.amountCents}));s=apply(s,'importIncome',{entries});assert.equal(available(s),51025);assert.throws(()=>apply(s,'importIncome',{entries}),/already/);assertAccounting(s);
});
test('decimal parsing stays exact and disallows ambiguous amounts',()=>{assert.equal(dollars('$1,234.56'),123456);assert.equal(dollars('0.01'),1);assert.equal(dollars('1.1'),110);for(const v of ['-10','1.001','1e3','','$','NaN'])assert.throws(()=>dollars(v));});
const milestoneCode=ts.transpileModule(readFileSync(new URL('../app/milestones.ts',import.meta.url),'utf8').replace('"./domain"',JSON.stringify(new URL('../app/domain.ts',import.meta.url).href)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {firstCompletions}=await import('data:text/javascript,'+encodeURIComponent(milestoneCode));
test('completion fires at the target once, with no replay after a release, retry or restore',()=>{
 const before=confirm(initialState(),'monitor',10000);
 const halfway=apply(before,'contribute',{goalId:'monitor',amountCents:5000,source:'external'});
 assert.deepEqual(firstCompletions(before,halfway,'contribute'),[]);
 const completed=apply(halfway,'contribute',{goalId:'monitor',amountCents:5000,source:'external'});
 assert.deepEqual(firstCompletions(halfway,completed,'contribute'),['monitor']);
 assert.deepEqual(firstCompletions(completed,completed,'contribute'),[]);
 assert.deepEqual(firstCompletions(halfway,completed,'restore'),[]);
 const released=apply(completed,'release',{goalId:'monitor',amountCents:2000});
 const refilled=apply(released,'contribute',{goalId:'monitor',amountCents:2000,source:'pool'});
 assert.deepEqual(firstCompletions(released,refilled,'contribute'),[]);
});
test('split completion and purchase confirmation respect funding',()=>{
 let before=confirm(initialState(),'monitor',10000);before=confirm(before,'tv',10000);
 before=apply(before,'income',{amountCents:20000});
 const after=apply(before,'split',{allocations:[{goalId:'monitor',amountCents:10000},{goalId:'tv',amountCents:10000}]});
 assert.deepEqual(firstCompletions(before,after,'split'),['monitor','tv']);
 const saved=apply(confirm(initialState(),'monitor',10000),'contribute',{goalId:'monitor',amountCents:8000,source:'external'});
 assert.throws(()=>apply(saved,'purchase',{goalId:'monitor',amountCents:8000,confirmed:true}),/Reach the Set Goal/);
 const funded=apply(saved,'contribute',{goalId:'monitor',amountCents:2000,source:'external'});
 const bought=apply(funded,'purchase',{goalId:'monitor',amountCents:8000,confirmed:true});
 assert.equal(bought.goals[0].status,'purchased');
 assert.deepEqual(firstCompletions(funded,bought,'purchase'),[]);
});
