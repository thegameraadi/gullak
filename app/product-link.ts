export type ProductDetails = {sourceUrl:string; name:string; description:string; category:string; price:number|null; currency:string|null; warning:string};
export class ProductLinkError extends Error {status:number;constructor(message:string,status=422){super(message);this.name="ProductLinkError";this.status=status;}}
export function normalizeProductUrl(input:string):string {
 if(typeof input!=="string"||!input.trim()||input.length>2048||/[\u0000-\u001f\u007f]/.test(input))throw new ProductLinkError("Paste a product link.",400);
 let url:URL;try{url=new URL(input.trim().match(/^https?:\/\//i)?input.trim():"https://"+input.trim());}catch{throw new ProductLinkError("Check the product link and try again.",400);}
 const host=url.hostname.toLowerCase();
 if(url.protocol!=="https:"||url.username||url.password||url.port||!host.includes(".")||host.includes(":")||/^\d+(\.|$)/.test(host)||/\.(localhost|local|internal|test|invalid|example)$/.test(host)||host.endsWith(".arpa"))throw new ProductLinkError("Use a public HTTPS product link.",400);
 url.hash="";return url.href;
}
const stores=["amazon.com","amazon.in","amazon.co.uk","amazon.ca","amazon.com.au","amazon.de","amazon.fr","amazon.it","amazon.es","amazon.co.jp","amzn.to","a.co","apple.com","bestbuy.com","walmart.com","target.com","costco.com","gamestop.com","store.steampowered.com","store.epicgames.com","store.playstation.com","xbox.com","microsoft.com","nintendo.com","ebay.com","ikea.com","nike.com","adidas.com","rei.com","bhphotovideo.com","newegg.com"];
export const supportedProductUrl=(url:string)=>{const h=new URL(normalizeProductUrl(url)).hostname;return stores.some(s=>h===s||h.endsWith("."+s));};
const entities:Record<string,string>={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" ",ndash:"–",mdash:"—",rsquo:"’",lsquo:"‘",rdquo:"”",ldquo:"“",hellip:"…",dollar:"$",euro:"€",pound:"£",yen:"¥",trade:"™",reg:"®",copy:"©"};
export function plainText(value:unknown,max=300):string {
 if(typeof value!=="string")return "";
 return value.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi," ").replace(/<[^>]*>/g," ").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(whole,key:string)=>{if(key[0]!=="#")return entities[key.toLowerCase()]??whole;const n=key[1].toLowerCase()==="x"?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):" ";}).replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
function attributes(tag:string){const attrs:Record<string,string>={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/g))attrs[m[1].toLowerCase()]=plainText(m[2]??m[3]??m[4],5000);return attrs;}
function numberPrice(value:unknown,currency:string):number|null {
 if(typeof value==="number")return Number.isFinite(value)&&value>0&&value<=1e9?Math.round(value*100)/100:null;
 if(typeof value!=="string")return null;
 let s=plainText(value,100).replace(/USD|INR|EUR|GBP|CAD|AUD|JPY|Rs\.?/gi,"").replace(/[$₹€£¥\s]/g,"");
 if(["EUR","BRL"].includes(currency)&&s.includes(",")&&(!s.includes(".")||s.lastIndexOf(",")>s.lastIndexOf(".")))s=s.replace(/\./g,"").replace(",",".");else s=s.replace(/,/g,"");
 if(!/^\d+(\.\d{1,2})?$/.test(s))return null;const n=Number(s);return n>0&&n<=1e9?n:null;
}
const types=(node:Record<string,unknown>,type:string)=>[node["@type"]].flat().some(t=>typeof t==="string"&&t.split(/[\/#]/).at(-1)===type);
export function parseProductHtml(html:string,sourceUrl:string):ProductDetails {
 const url=normalizeProductUrl(sourceUrl),meta:Record<string,string>={};
 for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const a=attributes(m[0]),key=(a.property??a.name??a.itemprop??"").toLowerCase();if(key&&a.content&&!meta[key])meta[key]=a.content;}
 const products:Record<string,unknown>[]=[];let visited=0;
 function walk(node:unknown,depth=0){if(depth>8||++visited>250||!node||typeof node!=="object")return;if(Array.isArray(node)){node.forEach(n=>walk(n,depth+1));return;}const n=node as Record<string,unknown>;if(types(n,"Product"))products.push(n);walk(n["@graph"],depth+1);walk(n.mainEntity,depth+1);}
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){if(attributes(m[1]).type?.toLowerCase().split(";")[0]==="application/ld+json"&&m[2].length<500000)try{walk(JSON.parse(m[2].trim()));}catch{}}
 const samePage=(v:unknown)=>{try{return typeof v==="string"&&new URL(v,url).pathname.replace(/\/$/,"")===new URL(url).pathname.replace(/\/$/,"");}catch{return false;}};
 const matching=products.filter(p=>samePage(p.url)||samePage(p["@id"]));
 const titled=products.filter(p=>typeof p.name==="string"&&meta["og:title"]?.toLowerCase().includes(plainText(p.name,500).toLowerCase()));
 const product=matching.length===1?matching[0]:products.length===1?products[0]:titled.length===1?titled[0]:undefined;
 const rawTitle=plainText(product?.name??meta["og:title"]??html.match(/<span\b[^>]*id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]??html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1],500);
 if(/robot check|captcha|access denied|just a moment|verify you are human|sign in to continue/i.test(rawTitle))throw new ProductLinkError("This store blocked automatic reading. You can still enter the name and price manually.");
 const name=rawTitle.replace(/^Amazon\.[^:]+:\s*/i,"").replace(/\s*[:|–-]\s*(Amazon\.[a-z.]+|Best Buy|Walmart|Target|Apple|Steam|Video Games)(\s*:.*)?$/i,"").trim().slice(0,60);
 const description=plainText(product?.description??meta["og:description"]??meta.description);
 const offers=[product?.offers].flat().filter(o=>o&&typeof o==="object") as Record<string,unknown>[];
 const values:{price:number;currency:string}[]=[];let variablePrice=false;
 for(const offer of offers){const c=plainText(offer.priceCurrency??product?.priceCurrency,3).toUpperCase();if(!/^[A-Z]{3}$/.test(c))continue;const specification=offer.priceSpecification as Record<string,unknown>|undefined;const raw=offer.price??(specification&&!Array.isArray(specification)&&!specification.priceType?specification.price:undefined);const n=numberPrice(raw,c);if(n!==null)values.push({price:n,currency:c});else if(offer.lowPrice!==undefined){const low=numberPrice(offer.lowPrice,c),high=numberPrice(offer.highPrice,c);if(low!==null&&low===high)values.push({price:low,currency:c});else variablePrice=true;}}
 const unique=[...new Map(values.map(v=>[v.currency+":"+v.price,v])).values()];if(unique.length>1)variablePrice=true;
 let chosen=!variablePrice&&unique.length===1?unique[0]:null;
 if(!chosen&&!variablePrice){const c=(meta["product:price:currency"]??meta["og:price:currency"]??meta.pricecurrency??"").toUpperCase();if(/^[A-Z]{3}$/.test(c)){const n=numberPrice(meta["product:price:amount"]??meta["og:price:amount"]??meta.price,c);if(n!==null)chosen={price:n,currency:c};}}
 if(!chosen&&!variablePrice&&/(^|\.)amazon\./.test(new URL(url).hostname)){
  const priceMarkup=html.match(/<(?:span|div)\b[^>]*id=["'](?:priceblock_ourprice|priceblock_dealprice)["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i)?.[1]??html.match(/<span\b[^>]*class=["'][^"']*\bpriceToPay\b[^"']*["'][^>]*>([\s\S]{0,4000}?)<span\b[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[2];
  const text=plainText(priceMarkup,100),host=new URL(url).hostname;
  const c=/amazon\.in$/.test(host)?"INR":/amazon\.com$/.test(host)?"USD":/amazon\.co\.uk$/.test(host)?"GBP":/amazon\.(de|fr|it|es)$/.test(host)?"EUR":null;
  if(c){const n=numberPrice(text,c);if(n!==null)chosen={price:n,currency:c};}
 }
 if(!name&&!description)throw new ProductLinkError("No product details were found. Enter the name and price manually.");
 const category=plainText(product?.category??meta["product:category"],100);
 return {sourceUrl:url,name,description,category,price:chosen?.price??null,currency:chosen?.currency??null,warning:variablePrice?"This page has multiple prices. Enter the price for the version you want.":!chosen?"The store didn’t share a clear price. Enter it manually.":!name?"Enter a name for this goal.":"Review the product price; tax and shipping may be extra."};
}
