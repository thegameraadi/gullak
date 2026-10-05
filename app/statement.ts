import { DomainError, dollars } from "./domain";
export type Candidate={id:string;date:string;description:string;amountCents:number};
export function parseCsv(text:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],field="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(quoted||field==="")quoted=!quoted;else throw new DomainError("Check the quotation marks in this CSV.");}else if(c===","&&!quoted){row.push(field.trim());field="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(field.trim());if(row.some(x=>x!==""))rows.push(row);row=[];field="";}else field+=c;}
 if(quoted)throw new DomainError("This CSV has an unclosed quotation mark.");row.push(field.trim());if(row.some(x=>x!==""))rows.push(row);return rows;
}
export function statementDate(value:string):string{
 let y:number,m:number,d:number;let match=value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
 if(match){[,y,m,d]=match.map(Number);}else{match=value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);if(!match)throw new DomainError("Use dates as YYYY-MM-DD or MM/DD/YYYY.");m=Number(match[1]);d=Number(match[2]);y=Number(match[3]);}
 const formatted=`${y!}-${String(m!).padStart(2,"0")}-${String(d!).padStart(2,"0")}`;const parsed=new Date(formatted+"T12:00:00Z");if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==formatted||y!<2000||y!>2100)throw new DomainError("The CSV contains an invalid date.");return formatted;
}
export async function extractCandidates(rows:string[][],mapping:{date:number;description:number;amount:number;sign:"positive"|"negative"}):Promise<{candidates:Candidate[];ignored:number;invalid:number}>{
 const candidates:Candidate[]=[];let ignored=0,invalid=0;const duplicateCount=new Map<string,number>();
 for(const row of rows.slice(1)){
  const raw=(row[mapping.amount]??"").trim().replace(/[$,\s]/g,"");const negative=raw.startsWith("-")||/^\(.*\)$/.test(raw);
  const clean=raw.replace(/^[-+]/,"").replace(/^\((.*)\)$/, "$1");
  if(!/^\d+(\.\d{1,2})?$/.test(clean)||Number(clean)===0){ignored++;continue;}
  if((mapping.sign==="positive"&&negative)||(mapping.sign==="negative"&&!negative)){ignored++;continue;}
  try{const date=statementDate(row[mapping.date]??""),description=(row[mapping.description]??"").trim().slice(0,200)||"Statement deposit",amountCents=dollars(clean);const key=`${date}|${description.toLowerCase()}|${amountCents}`;const occurrence=duplicateCount.get(key)??0;duplicateCount.set(key,occurrence+1);const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key+"|"+occurrence));const id="csv-"+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");candidates.push({id,date,description,amountCents});}catch{invalid++;}
 }
 return {candidates,ignored,invalid};
}
