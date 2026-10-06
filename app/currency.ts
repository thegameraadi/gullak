import { roundMoney, subtractMoney } from "./money.mjs";
export type RatePoint={rate:number;date:string;source?:string};
export type Rates={base:"USD";rates:Record<string,RatePoint>;fetchedAt:string;source:string};
export type Conversion={currency:string;originalAmount:number;usdRate:number;rateDate:string;source:string;roundingCents?:number};
export function currencyRate(currency:string,fx:Rates|null){const rate=currency==="USD"?1:fx?.rates[currency]?.rate;if(!rate||!Number.isFinite(rate)||rate<=0)throw new Error(`An exchange rate for ${currency} is needed. Retry or enter a rate.`);return rate;}
export function switchCurrencyAmount(input:string,from:string,to:string,fx:Rates|null){if(!input.trim())return "";const value=parseCurrencyAmount(input,from)/currencyRate(from,fx)*currencyRate(to,fx);return value.toFixed(2).replace(/\.00$/,"");}
export const displayMinorUnits=(cents:number,currency:string,fx:Rates|null)=>Math.round(cents*currencyRate(currency,fx));
export function detectCurrency(input:string,fallback="USD"){const code=input.match(/^\s*([A-Za-z]{3})(?=\s|\d)|([A-Za-z]{3})\s*$/);if(code)return (code[1]??code[2]).toUpperCase();if(input.includes("₹"))return "INR";if(input.includes("$"))return "USD";if(input.includes("€"))return "EUR";if(input.includes("£"))return "GBP";return fallback;}
export function parseCurrencyAmount(input:string,currency:string){const s=input.trim().replace(new RegExp(currency,"ig"),"").replace(/[$₹€£¥,\s]/g,"");if(s.startsWith("-"))throw new Error("Enter a positive amount.");if(!/^\d+(\.\d{1,2})?$/.test(s))throw new Error("Enter an amount with up to two decimal places.");const [w,f=""]=s.split(".");const cents=Number(w)*100+Number(f.padEnd(2,"0"));if(!Number.isSafeInteger(cents)||cents<1)throw new Error("Enter a positive amount.");return cents/100;}
export function convertInput(input:string,currency:string,fx:Rates|null){const originalAmount=parseCurrencyAmount(input,currency);const point:RatePoint|undefined=currency==="USD"?{rate:1,date:new Date().toISOString().slice(0,10)}:fx?.rates[currency];if(!point||!Number.isFinite(point.rate)||point.rate<=0)throw new Error(`An exchange rate for ${currency} is needed. Retry or enter a rate.`);const cents=roundMoney(originalAmount/point.rate*100);if(!Number.isFinite(cents)||cents<=0||cents>100000000)throw new Error("Converted amount must be positive and no greater than $1,000,000.");return {cents,conversion:currency==="USD"?undefined:{currency,originalAmount,usdRate:1/point.rate,rateDate:point.date,source:point.source??fx?.source??"Manual"} as Conversion};}
export function formatCurrency(cents:number,currency:string,fx:Rates|null){if(currency!=="USD"&&!fx?.rates[currency])return formatCurrency(cents,"USD",fx);const minor=displayMinorUnits(cents,currency,fx);return new Intl.NumberFormat(currency==="INR"?"en-IN":"en-US",{style:"currency",currency,minimumFractionDigits:minor%100?2:0,maximumFractionDigits:2}).format(minor/100);}
export function inputFromUsd(cents:number,currency:string,fx:Rates|null){try{return (displayMinorUnits(cents,currency,fx)/100).toFixed(2).replace(/\.00$/,"");}catch{return "";}}

// A full release uses the actual ledger balance, even when its visible currency rounds up.
export function convertBoundedInput(input:string,currency:string,fx:Rates|null,maxCents?:number){
 const value=convertInput(input,currency,fx);
 if(maxCents!==undefined&&maxCents>0&&Math.round(parseCurrencyAmount(input,currency)*100)===displayMinorUnits(maxCents,currency,fx)){
  const adjustment=subtractMoney(maxCents,value.cents);
  if(adjustment===0)return value;
  if(Math.abs(adjustment)<=0.5/currencyRate(currency,fx)+1e-6)return {cents:maxCents,conversion:{...(value.conversion??{currency,originalAmount:parseCurrencyAmount(input,currency),usdRate:1,rateDate:new Date().toISOString().slice(0,10),source:"Display rounding"}),roundingCents:adjustment}};
 }
 return value;
}
