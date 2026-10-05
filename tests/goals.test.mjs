import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {initialState,applyAction,balance,reserved,available,classifyGoal,categoryForGoal,symbolForGoal,validateBackup,goalTotals,earnedIncome,losses,spent,received,assertAccounting} from '../app/domain.ts';
const moduleFrom=async name=>{const code=ts.transpileModule(readFileSync(new URL('../app/'+name+'.ts',import.meta.url),'utf8').replace('"./domain"',JSON.stringify(new URL('../app/domain.ts',import.meta.url).href)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript,'+encodeURIComponent(code));};
const {goalEta}=await moduleFrom('eta');const {convertInput,formatCurrency,detectCurrency}=await moduleFrom('currency');
let seq=0;const apply=(s,a,p)=>applyAction(s,a,p,'new-request-'+(++seq),'2026-10-05T00:00:00Z');
const create=(s,name='Car',targetCents=10000)=>apply(s,'createGoal',{name,targetCents,category:'auto',startedOn:'2026-10-01',date:'',note:''});
const fx={base:'USD',rates:{USD:{rate:1,date:'2026-10-05'},INR:{rate:90,date:'2026-10-05'},EUR:{rate:.9,date:'2026-10-05'}},fetchedAt:'2026-10-05T00:00:00Z',source:'Test fixture'};
test('automatic categories and specific icons correct old cars and append new goals',()=>{
 assert.deepEqual(classifyGoal('Car'),{category:'Getting around',icon:'car'});
 assert.equal(classifyGoal('MacBook Pro').icon,'laptop');assert.equal(classifyGoal('4K TV').category,'Home');assert.equal(classifyGoal('A trip to Japan').icon,'plane');assert.equal(classifyGoal('New shoes').category,'Lifestyle');
 const old={...initialState().goals[0],name:'Car',category:'Tech'};assert.equal(categoryForGoal(old),'Getting around');assert.equal(symbolForGoal(old),'car');
 assert.equal(symbolForGoal({...old,name:'Something unusual'}),'target');
 let s=create(initialState());const car=s.goals.at(-1);s=create(s,'Honda Civic');assert.equal(s.goals.at(-2).id,car.id);assert.equal(s.goals.at(-1).category,'Getting around');
 s=apply(s,'editGoal',{goalId:car.id,name:'Car',category:'Lifestyle',targetCents:10000,date:'',note:''});assert.equal(categoryForGoal(s.goals.find(g=>g.id===car.id)),'Lifestyle');
});
test('currency conversion is exact to USD cents and preserves original amounts in backups',()=>{
 assert.equal(detectCurrency('₹9,000'),'INR');assert.equal(detectCurrency('$100','INR'),'USD');assert.equal(detectCurrency('CAD 100','INR'),'CAD');assert.equal(detectCurrency('1000INR'),'INR');assert.equal(detectCurrency('EUR 90'),'EUR');
 const c=convertInput('₹9,000','INR',fx);assert.equal(c.cents,10000);assert.equal(convertInput('90 EUR','EUR',fx).cents,10000);assert.equal(formatCurrency(10000,'INR',fx),'₹9,000');
 assert.throws(()=>convertInput('1000','INR',null),/exchange rate/);assert.throws(()=>convertInput('0.01','INR',fx),/Converted amount/);assert.throws(()=>convertInput('-100','USD',fx));
 let s=create(initialState());const id=s.goals.at(-1).id;s=apply(s,'contribute',{goalId:id,source:'external',amountCents:c.cents,conversion:c.conversion,date:'2026-10-05'});assert.equal(reserved(s),10000);
 const restored=validateBackup(JSON.parse(JSON.stringify(s)));assert.equal(restored.entries[0].conversion.originalAmount,9000);assert.equal(restored.goals.at(-1).startedOn,'2026-10-01');
 assert.throws(()=>apply(s,'income',{amountCents:1,conversion:c.conversion}),/converted amount/);
});
test('ETA starts after a deposit and uses amount, goal start date, and elapsed calendar days',()=>{
 let s=create(initialState(),'Car',20000);const g=s.goals.at(-1);assert.equal(goalEta(s,g,'2026-10-05'),null);
 s=apply(s,'contribute',{goalId:g.id,source:'external',amountCents:10000,date:'2026-10-05'});
 let eta=goalEta(s,g,'2026-10-05');assert.equal(eta.start,'2026-10-01');assert.equal(eta.dailyCents,2000);assert.equal(eta.days,5);assert.equal(eta.date,'2026-10-10');
 s=apply(s,'contribute',{goalId:g.id,source:'external',amountCents:5000,date:'2026-10-10'});eta=goalEta(s,g,'2026-10-10');assert.equal(eta.averageDepositCents,7500);assert.equal(eta.averageIntervalDays,5);assert.equal(eta.days,4);
 const legacy={...g,startedOn:undefined};eta=goalEta(s,legacy,'2026-10-05');assert.equal(eta.days,1);assert.equal(eta.dailyCents,10000);
});
test('purchases require full funding and explicit confirmation; only then become wins',()=>{
 let s=create(initialState());const g=s.goals.at(-1);
 s=apply(s,'contribute',{goalId:g.id,source:'external',amountCents:5000});assert.throws(()=>apply(s,'purchase',{goalId:g.id,amountCents:5000,confirmed:true}),/Reach the Set Goal/);assert.equal(s.goals.at(-1).status,'active');
 s=apply(s,'contribute',{goalId:g.id,source:'external',amountCents:5000});assert.equal(s.goals.at(-1).status,'active');assert.throws(()=>apply(s,'purchase',{goalId:g.id,amountCents:9000}),/Confirm that/);
 s=apply(s,'purchase',{goalId:g.id,amountCents:9000,confirmed:true});assert.equal(s.goals.at(-1).status,'purchased');assert.equal(balance(s,g.id),0);assert.equal(available(s),1000);assert.equal(goalEta(s,s.goals.at(-1),'2026-10-05'),null);
});

test('goal targets and funded totals remain distinct from recorded earnings',()=>{
 let s=create(initialState());const id=s.goals.at(-1).id;
 const target=goalTotals(s).targetCents;s=apply(s,'income',{amountCents:8000});s=apply(s,'contribute',{goalId:id,source:'pool',amountCents:2000});s=apply(s,'contribute',{goalId:id,source:'external',amountCents:3000});
 assert.deepEqual(goalTotals(s),{targetCents:target,fundedCents:5000});assert.equal(earnedIncome(s),8000);assert.equal(available(s),6000);
});
test('deleting asks why and safely releases reserved money for a changed goal',()=>{
 let s=create(initialState());const id=s.goals.at(-1).id;s=apply(s,'contribute',{goalId:id,source:'external',amountCents:2000});
 assert.throws(()=>apply(s,'closeGoal',{goalId:id}),/Choose why/);assert.equal(balance(s,id),2000);
 const closed=apply(s,'closeGoal',{goalId:id,reason:'changed'});assert.equal(closed.goals.some(g=>g.id===id),false);assert.equal(available(closed),2000);assert.equal(reserved(closed),0);assert.equal(losses(closed),0);assertAccounting(closed);validateBackup(closed);
});
test('$50 paid with $20 funded records a negative $30 loss without inventing income',()=>{
 let s=create(initialState());const id=s.goals.at(-1).id;s=apply(s,'contribute',{goalId:id,source:'external',amountCents:2000});
 assert.throws(()=>apply(s,'closeGoal',{goalId:id,reason:'bought',amountCents:5000}),/Confirm/);
 s=apply(s,'closeGoal',{goalId:id,reason:'bought',amountCents:5000,confirmed:true,date:'2026-10-04'});
 assert.equal(s.goals.some(g=>g.id===id),false);assert.equal(s.losses.length,1);assert.equal(s.losses[0].amountCents,3000);assert.equal(s.losses[0].costCents,5000);assert.equal(s.losses[0].fundedCents,2000);assert.equal(losses(s),3000);
 assert.equal(balance(s,id),0);assert.equal(reserved(s),0);assert.equal(available(s),0);assert.equal(received(s),2000);assert.equal(earnedIncome(s),0);assert.equal(spent(s),5000);assertAccounting(s);
 const copy=validateBackup(JSON.parse(JSON.stringify(s)));assert.deepEqual(copy.losses,s.losses);assert.equal(copy.entries.at(-1).shortfallCents,3000);
 const bad=structuredClone(s);bad.losses[0].amountCents=1;assert.throws(()=>validateBackup(bad),/inconsistent loss/);
});
test('a fully funded bought goal lands in wins and leftovers become available',()=>{
 let s=create(initialState());const id=s.goals.at(-1).id;s=apply(s,'contribute',{goalId:id,source:'external',amountCents:12000});s=apply(s,'closeGoal',{goalId:id,reason:'bought',amountCents:9000,confirmed:true});
 assert.equal(s.goals.at(-1).status,'purchased');assert.equal(available(s),3000);assert.equal(losses(s),0);assert.equal(balance(s,id),0);validateBackup(s);
});
test('purchases with no funding can be restored; below-target purchases do not become wins',()=>{
 let s=create(initialState());let id=s.goals.at(-1).id;s=apply(s,'closeGoal',{goalId:id,reason:'bought',amountCents:5000,confirmed:true});assert.equal(losses(s),5000);assert.equal(validateBackup(s).losses[0].fundedCents,0);assertAccounting(s);
 s=create(s);id=s.goals.at(-1).id;s=apply(s,'contribute',{goalId:id,source:'external',amountCents:6000});s=apply(s,'closeGoal',{goalId:id,reason:'bought',amountCents:5000,confirmed:true});assert.equal(s.goals.some(g=>g.id===id),false);assert.equal(losses(s),5000);assert.equal(available(s),1000);assertAccounting(s);validateBackup(s);
});

test('setting an initial draft establishes its start date without resetting later edits',()=>{
 let s=apply(initialState(),'editGoal',{goalId:'monitor',name:'Monitor',category:'auto',targetCents:10000,date:'',note:'',startedOn:'2026-10-01'});assert.equal(s.goals[0].startedOn,'2026-10-01');
 s=apply(s,'editGoal',{goalId:'monitor',name:'Monitor',category:'auto',targetCents:20000,date:'',note:'',startedOn:'2026-10-05'});assert.equal(s.goals[0].startedOn,'2026-10-01');
});

test('resetting goal funding hides ETA until a new deposit arrives',()=>{
 let s=create(initialState(),'Car',10000);const id=s.goals.at(-1).id;s=apply(s,'contribute',{goalId:id,source:'external',amountCents:2000,date:'2026-10-04'});
 s=apply(s,'resetGoal',{goalId:id,confirmed:true,date:'2026-10-05'});assert.equal(goalEta(s,s.goals.at(-1),'2026-10-05'),null);
 s=apply(s,'contribute',{goalId:id,source:'external',amountCents:2000,date:'2026-10-06'});const eta=goalEta(s,s.goals.at(-1),'2026-10-06');assert.equal(eta.deposits,1);assert.equal(eta.start,'2026-10-05');
});
