import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAction,initialState,available,balance,reserved,earnedIncome,losses,validateBackup,assertAccounting,purchaseForEntry} from '../app/domain.ts';
let n=0;const act=(s,a,p)=>applyAction(s,a,p,'history-test-'+(++n),'2026-10-05T07:00:00Z');
const start=()=>act(initialState(),'editGoal',{goalId:'monitor',name:'Monitor',category:'auto',targetCents:10000,date:'',note:''});
const deposit=(s,amt=10000)=>act(s,'contribute',{goalId:'monitor',amountCents:amt,source:'external'});
const check=s=>{assertAccounting(s);const restored=validateBackup(JSON.parse(JSON.stringify(s)));assert.equal(available(restored),available(s));assert.equal(reserved(restored),reserved(s));assert.equal(losses(restored),losses(s));};
const edit=(s,e,amt,note='Edited')=>act(s,'editEntry',{entryId:e.id,amountCents:amt,date:'2026-10-04',note});
test('edit and delete income, deposits, allocations, releases and withdrawals update exact balances',()=>{
 let s=act(start(),'income',{amountCents:10000}),income=s.entries.at(-1);s=edit(s,income,12000);assert.equal(earnedIncome(s),12000);
 s=act(s,'contribute',{goalId:'monitor',source:'pool',amountCents:5000});let e=s.entries.at(-1);s=edit(s,e,6000);assert.equal(balance(s,'monitor'),6000);assert.equal(available(s),6000);
 s=act(s,'release',{goalId:'monitor',amountCents:2000});e=s.entries.at(-1);s=edit(s,e,1000);assert.equal(reserved(s),5000);assert.equal(available(s),7000);
 s=act(s,'withdraw',{amountCents:500});e=s.entries.at(-1);s=edit(s,e,1000);assert.equal(available(s),6000);s=act(s,'deleteEntry',{entryId:e.id});assert.equal(available(s),7000);
 s=deposit(s,500);e=s.entries.at(-1);s=edit(s,e,1000);assert.equal(reserved(s),6000);s=act(s,'deleteEntry',{entryId:e.id});assert.equal(reserved(s),5000);check(s);
});
test('history changes cannot remove money used by dependent entries',()=>{
 let s=act(start(),'income',{amountCents:10000}),income=s.entries.at(-1);s=act(s,'contribute',{goalId:'monitor',source:'pool',amountCents:8000});assert.throws(()=>edit(s,income,5000),/later allocation/);assert.throws(()=>act(s,'deleteEntry',{entryId:income.id}),/later allocation/);assert.equal(earnedIncome(s),10000);
 s=deposit(s,1000);const dep=s.entries.at(-1);s=act(s,'release',{goalId:'monitor',amountCents:8500});assert.throws(()=>act(s,'deleteEntry',{entryId:dep.id}),/later release/);check(s);
});
test('editing a purchase adjusts paired leftovers and deleting either purchase part reopens the goal',()=>{
 let s=deposit(start(),12000);s=act(s,'purchase',{goalId:'monitor',amountCents:9000,confirmed:true});const purchase=s.entries.find(e=>e.kind==='purchase');const release=s.entries.at(-1);assert.equal(purchaseForEntry(s,release).id,purchase.id);
 s=edit(s,purchase,11000);assert.equal(available(s),1000);assert.equal(s.entries.at(-1).amountCents,1000);assert.equal(s.goals[0].status,'purchased');check(s);
 s=act(s,'deleteEntry',{entryId:s.entries.at(-1).id});assert.equal(reserved(s),12000);assert.equal(available(s),0);assert.equal(s.goals[0].status,'active');assert.equal(s.entries.some(e=>e.kind==='purchase'),false);check(s);
});
test('editing a purchase upward creates a loss; reducing its cost restores a win',()=>{
 let s=deposit(start());s=act(s,'purchase',{goalId:'monitor',amountCents:9000,confirmed:true});const e=s.entries.find(e=>e.kind==='purchase');s=edit(s,e,13000);assert.equal(losses(s),3000);assert.equal(s.goals.some(g=>g.id==='monitor'),false);assert.equal(available(s),0);check(s);
 s=edit(s,e,9500);assert.equal(losses(s),0);assert.equal(s.goals.find(g=>g.id==='monitor').status,'purchased');assert.equal(available(s),500);check(s);
});
test('editing an earlier deposit recalculates an actual purchase and its loss',()=>{
 let s=deposit(start(),10000);const dep=s.entries.at(-1);s=act(s,'purchase',{goalId:'monitor',amountCents:9000,confirmed:true});s=edit(s,dep,5000);assert.equal(losses(s),4000);assert.equal(available(s),0);assert.equal(s.goals.some(g=>g.id==='monitor'),false);check(s);
 s=edit(s,dep,12000);assert.equal(losses(s),0);assert.equal(available(s),3000);assert.equal(s.goals.find(g=>g.id==='monitor').status,'purchased');check(s);
});
test('deleting a loss purchase restores the original target, including a zero-funded goal',()=>{
 for(const funding of [0,2000]){let s=start();if(funding)s=deposit(s,funding);s=act(s,'closeGoal',{goalId:'monitor',reason:'bought',amountCents:5000,confirmed:true});const e=s.entries.find(e=>e.kind==='purchase');s=act(s,'deleteEntry',{entryId:e.id});assert.equal(losses(s),0);assert.equal(balance(s,'monitor'),funding);assert.equal(s.goals.find(g=>g.id==='monitor').targetCents,10000);check(s);}
});
test('legacy purchase leftovers are linked without requiring a migration',()=>{
 let s=deposit(start(),12000);s=act(s,'purchase',{goalId:'monitor',amountCents:9000,confirmed:true});delete s.entries.at(-1).relatedEntryId;s=edit(s,s.entries.find(e=>e.kind==='purchase'),10000);assert.equal(available(s),2000);check(s);
});
test('reset confirmations are required and goal funding returns money without erasing earnings',()=>{
 let s=act(start(),'income',{amountCents:10000});s=act(s,'contribute',{goalId:'monitor',source:'pool',amountCents:8000});assert.throws(()=>act(s,'reset',{scope:'all'}),/Confirm/);assert.throws(()=>act(s,'resetGoal',{goalId:'monitor'}),/Confirm/);
 s=act(s,'resetGoal',{goalId:'monitor',confirmed:true,date:'2026-10-05'});assert.equal(reserved(s),0);assert.equal(available(s),10000);assert.equal(earnedIncome(s),10000);assert.equal(s.goals[0].earned,0);assert.equal(s.goals[0].etaFromEntry,s.entries.at(-1).id);check(s);
});
test('each reset scope has exactly its promised effect and duplicate retries do not reset twice',()=>{
 let s=act(start(),'income',{amountCents:10000});s=act(s,'contribute',{goalId:'monitor',source:'pool',amountCents:8000});
 const funding=act(s,'reset',{scope:'allocations',confirmed:true});assert.equal(reserved(funding),0);assert.equal(earnedIncome(funding),10000);assert.equal(available(funding),10000);assert.equal(funding.goals.length,5);check(funding);
 const goals=act(s,'reset',{scope:'goals',confirmed:true});assert.equal(goals.goals.length,0);assert.equal(available(goals),10000);assert.equal(earnedIncome(goals),10000);assert.equal(goals.entries.length,3);check(goals);
 const history=act(s,'reset',{scope:'history',confirmed:true});assert.equal(history.entries.length,0);assert.equal(earnedIncome(history),0);assert.equal(history.goals.length,5);assert.equal(reserved(history),0);check(history);
 const id='reset-retry-request';const all=applyAction(s,'reset',{scope:'all',confirmed:true},id);assert.equal(all.goals.length,0);assert.equal(all.entries.length,0);assert.equal(applyAction(all,'reset',{scope:'all',confirmed:true},id),all);check(all);
});
test('resetting history clears wins and losses while keeping visible goal budgets',()=>{
 let s=deposit(start());s=act(s,'purchase',{goalId:'monitor',amountCents:9000,confirmed:true});s=act(s,'createGoal',{name:'Car',category:'auto',targetCents:100000,date:'',note:''});const car=s.goals.at(-1);s=act(s,'closeGoal',{goalId:car.id,reason:'bought',amountCents:30000,confirmed:true});assert.equal(losses(s),30000);
 s=act(s,'reset',{scope:'history',confirmed:true});assert.equal(s.goals[0].status,'active');assert.equal(s.goals[0].targetCents,10000);assert.equal(losses(s),0);assert.equal(available(s),0);assert.equal(s.archivedGoals.length,0);check(s);
});

test('resetting Earned preserves every dollar and counts only subsequent income',()=>{
 let s=act(start(),'income',{amountCents:10000});const old=s.entries.at(-1);s=act(s,'contribute',{goalId:'monitor',source:'pool',amountCents:5000});const marker=s.entries.at(-1);
 s=act(s,'reset',{scope:'earned',confirmed:true});assert.equal(earnedIncome(s),0);assert.equal(available(s),5000);assert.equal(reserved(s),5000);assert.equal(s.entries.length,2);check(s);
 s=act(s,'income',{amountCents:2000});assert.equal(earnedIncome(s),2000);s=edit(s,old,12000);assert.equal(earnedIncome(s),2000);assert.equal(available(s),9000);
 s=act(s,'deleteEntry',{entryId:marker.id});assert.equal(earnedIncome(s),2000);assert.equal(s.earningsFromEntry,old.id);assert.equal(available(s),14000);check(s);
});
