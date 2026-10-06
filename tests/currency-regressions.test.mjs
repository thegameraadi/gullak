import test from 'node:test';
import assert from 'node:assert/strict';
import {switchCurrencyAmount} from '../app/currency.ts';
const fx={base:'USD',rates:{USD:{rate:1,date:'2026-10-05'},INR:{rate:96.2,date:'2026-10-05'}},fetchedAt:'2026-10-05T00:00:00Z',source:'Regression fixture'};
test('edit currency switches convert INR 96200 to USD 1000 and back using current rates',()=>{assert.equal(switchCurrencyAmount('96200','INR','USD',fx),'1000');assert.equal(switchCurrencyAmount('1000','USD','INR',fx),'96200');assert.equal(switchCurrencyAmount('','INR','USD',fx),'');assert.throws(()=>switchCurrencyAmount('96200','INR','USD',null),/rate/);assert.throws(()=>switchCurrencyAmount('-50','INR','USD',fx));});

import {initialState,applyAction} from '../app/domain.ts';
test('goal target dates reject the past on create and edit while old backups remain readable',()=>{const payload={name:'Date goal',targetCents:10000,category:'auto',date:'2020-01-01',note:''};assert.throws(()=>applyAction(initialState(),'createGoal',payload,'past-date-create','2026-10-05T23:00:00Z'),/today or a future/);let s=applyAction(initialState(),'createGoal',{...payload,date:'2026-10-05'},'today-date-create','2026-10-05T23:00:00Z');assert.throws(()=>applyAction(s,'editGoal',{...payload,goalId:'today-date-create'},'past-date-edit','2026-10-05T23:00:00Z'),/today or a future/);s=applyAction(s,'editGoal',{...payload,goalId:'today-date-create',date:'2026-10-06'},'future-date-edit','2026-10-05T23:00:00Z');assert.equal(s.goals.at(-1).date,'2026-10-06');const local=applyAction(initialState(),'createGoal',{...payload,date:'2026-10-05',today:'2026-10-05'},'local-today-create','2026-10-06T01:00:00Z');assert.equal(local.goals.at(-1).date,'2026-10-05');});

import {displayMinorUnits,formatCurrency,inputFromUsd} from '../app/currency.ts';
test('release header, initial amount and maximum share one display-currency rounding point',()=>{assert.equal(displayMinorUnits(104,'INR',fx),10005);assert.equal(formatCurrency(104,'INR',fx),'₹100.05');assert.equal(inputFromUsd(104,'INR',fx),'100.05');});

import {convertInput,convertBoundedInput} from '../app/currency.ts';
import {available,balance,reserved,validateBackup,assertAccounting,suggestSplit,losses} from '../app/domain.ts';
let seq=0;
const act=(s,a,p)=>applyAction(s,a,p,'fx-regression-'+(++seq),'2026-10-05T12:00:00Z');
const empty=()=>act(initialState(),'reset',{scope:'all',confirmed:true});
const goal=s=>act(s,'createGoal',{name:'Paise goal',targetCents:convertInput('96200','INR',fx).cents,targetConversion:convertInput('96200','INR',fx).conversion,category:'auto',date:'',note:''});
const moneyPayload=value=>({amountCents:value.cents,conversion:value.conversion,date:'2026-10-05',note:''});
const inr=n=>formatCurrency(n,'INR',fx);
test('INR add 100, release 40, and release remaining 60 keep every paise and round-trip JSON',()=>{
 let s=goal(empty()),id=s.goals[0].id;
 s=act(s,'contribute',{goalId:id,source:'external',...moneyPayload(convertInput('100','INR',fx))});
 assert.equal(inr(balance(s,id)),'₹100');assert.equal(s.entries[0].conversion.originalAmount,100);
 s=act(s,'release',{goalId:id,...moneyPayload(convertInput('40','INR',fx))});
 assert.equal(inr(s.entries.at(-1).amountCents),'₹40');assert.equal(inr(balance(s,id)),'₹60');assert.equal(inr(available(s)),'₹40');
 s=validateBackup(JSON.parse(JSON.stringify(s)));assert.equal(inr(balance(s,id)),'₹60');
 s=act(s,'release',{goalId:id,...moneyPayload(convertBoundedInput('60','INR',fx,balance(s,id)))});
 assert.equal(balance(s,id),0);assert.equal(inr(available(s)),'₹100');assertAccounting(s);
});
test('one-paise deposits and repeated cycles retain precision without accepting negative or malformed inputs',()=>{
 let s=goal(empty()),id=s.goals[0].id;
 for(let i=0;i<100;i++)s=act(s,'contribute',{goalId:id,source:'external',...moneyPayload(convertInput('0.01','INR',fx))});
 assert.equal(inr(balance(s,id)),'₹1');
 for(const value of ['-50','0','1.001'])assert.throws(()=>convertInput(value,'INR',fx));
 const original=structuredClone(s);assert.throws(()=>act(s,'release',{goalId:id,amountCents:-50}));assert.deepEqual(s,original);
 s=act(s,'release',{goalId:id,...moneyPayload(convertBoundedInput('1','INR',fx,balance(s,id)))});assert.equal(balance(s,id),0);assert.equal(inr(available(s)),'₹1');
});
test('legacy rounded balances release in full with the same displayed maximum, in INR and USD',()=>{
 for(const currency of ['INR','USD']){
  let s=goal(empty()),id=s.goals[0].id;s=act(s,'contribute',{goalId:id,source:'external',amountCents:104});
  const input=inputFromUsd(balance(s,id),currency,fx),value=convertBoundedInput(input,currency,fx,balance(s,id));assert.equal(value.cents,104);
  s=act(s,'release',{goalId:id,...moneyPayload(value)});assert.equal(balance(s,id),0);assert.equal(available(s),104);validateBackup(JSON.parse(JSON.stringify(s)));
 }
 let s=goal(empty()),id=s.goals[0].id;s=act(s,'contribute',{goalId:id,source:'external',...moneyPayload(convertInput('100','INR',fx))});
 const value=convertBoundedInput(inputFromUsd(balance(s,id),'USD',fx),'USD',fx,balance(s,id));
 s=act(s,'release',{goalId:id,...moneyPayload(value)});assert.equal(balance(s,id),0);validateBackup(JSON.parse(JSON.stringify(s)));
});
test('FX allocation, history edit/delete, purchase shortfalls and backups keep the ledger consistent',()=>{
 let s=goal(empty()),id=s.goals[0].id;
 s=act(s,'income',moneyPayload(convertInput('100','INR',fx)));
 s=act(s,'split',{allocations:[{goalId:id,...moneyPayload(convertInput('60','INR',fx))}],date:'2026-10-05',note:'Chosen split'});
 assert.equal(inr(balance(s,id)),'₹60');assert.equal(inr(available(s)),'₹40');assert.equal(s.entries.at(-1).conversion.originalAmount,60);
 const allocation=s.entries.at(-1).id;s=act(s,'editEntry',{entryId:allocation,...moneyPayload(convertInput('50','INR',fx))});
 assert.equal(inr(balance(s,id)),'₹50');assert.equal(inr(available(s)),'₹50');
 s=act(s,'deleteEntry',{entryId:allocation});assert.equal(reserved(s),0);assert.equal(inr(available(s)),'₹100');
 const split=suggestSplit(s,available(s));s=act(s,'split',{allocations:split});assert.equal(inr(reserved(s)),'₹100');assert.equal(available(s),0);
 s=act(s,'closeGoal',{goalId:id,reason:'bought',confirmed:true,...moneyPayload(convertInput('120','INR',fx))});assert.equal(inr(losses(s)),'₹20');
 const restored=validateBackup(JSON.parse(JSON.stringify(s)));assertAccounting(restored);assert.equal(inr(losses(restored)),'₹20');
 s=act(restored,'deleteEntry',{entryId:restored.entries.at(-1).id});assert.equal(inr(balance(s,id)),'₹100');assert.equal(losses(s),0);assertAccounting(s);
});
test('note-only history edits retain the existing base amount, and oversized rounding adjustments fail',()=>{
 let s=goal(empty()),id=s.goals[0].id;s=act(s,'contribute',{goalId:id,source:'external',amountCents:104});
 const value=convertBoundedInput('100.05','INR',fx,104);s=act(s,'editEntry',{entryId:s.entries[0].id,...moneyPayload(value),note:'Only a note'});assert.equal(balance(s,id),104);
 const backup=JSON.parse(JSON.stringify(s));backup.entries[0].conversion.roundingCents=10;assert.throws(()=>validateBackup(backup),/converted/);
});
