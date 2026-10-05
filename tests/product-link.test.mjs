import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {normalizeProductUrl,supportedProductUrl,parseProductHtml,plainText} from "../app/product-link.ts";
import {applyAction,validateBackup,initialState,classifyGoal} from "../app/domain.ts";
const source=ts.transpileModule(readFileSync(new URL("../app/product-fetch.ts",import.meta.url),"utf8").replace('"./product-link"',JSON.stringify(new URL("../app/product-link.ts",import.meta.url).href)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {fetchProductDetails,readLimitedText}=await import("data:text/javascript,"+encodeURIComponent(source));
const page=(data,extra="")=>'<script type="application/ld+json">'+JSON.stringify(data)+"</script>"+extra;
const product={ "@type":"Product",name:"Nintendo Game",description:"A fun <b>adventure</b> &amp; more.",offers:{"@type":"Offer",price:"49.99",priceCurrency:"USD"}};
const url="https://www.amazon.com/dp/GOALTEST";
test("public HTTPS links normalize and private, credentialed, and disguised endpoints fail",()=>{
 assert.equal(normalizeProductUrl("www.amazon.com/dp/GOALTEST#reviews"),url);
 for(const input of ["http://amazon.com/dp/x","https://localhost/x","https://127.0.0.1/x","https://0x7f000001/x","https://[::1]/x","https://user:pass@amazon.com/x","https://amazon.com:8080/x","file:///etc/passwd"])assert.throws(()=>normalizeProductUrl(input));
 assert.equal(supportedProductUrl("https://amazon.com.attacker.com/x"),false);
});
test("JSON-LD imports a clear price, currency, name, and safe plain-text details",()=>{
 const p=parseProductHtml(page(product),url);assert.equal(p.name,"Nintendo Game");assert.equal(p.price,49.99);assert.equal(p.currency,"USD");assert.equal(p.description,"A fun adventure & more.");assert.equal(p.sourceUrl,url);
 assert.equal(classifyGoal(p.name).icon,"gamepad");
 assert.equal(plainText("<script>bad()</script>Monitor &#x1f4b0; &amp; TV"),"Monitor 💰 & TV");
});
test("graph matching selects the linked product rather than recommended products",()=>{
 const p=parseProductHtml(page({"@graph":[{...product,name:"Another product",url:"https://www.amazon.com/dp/OTHER",offers:{price:999,priceCurrency:"USD"}},{...product,url}]}),url);
 assert.equal(p.price,49.99);
});
test("conflicting offers and price ranges require a manual amount",()=>{
 let p=parseProductHtml(page({...product,offers:[{price:40,priceCurrency:"USD"},{price:60,priceCurrency:"USD"}]}),url);assert.equal(p.price,null);assert.match(p.warning,/multiple prices/);
 p=parseProductHtml(page({...product,offers:{"@type":"AggregateOffer",lowPrice:40,highPrice:60,priceCurrency:"USD"}}),url);assert.equal(p.price,null);
});
test("Open Graph and Amazon's primary price support USD and INR without guessing",()=>{
 const html='<meta property="og:title" content="Game &amp; controller"><meta property="product:price:amount" content="4,999.00"><meta property="product:price:currency" content="INR">';
 const p=parseProductHtml(html,"https://www.amazon.in/dp/GOALTEST");assert.equal(p.name,"Game & controller");assert.equal(p.price,4999);assert.equal(p.currency,"INR");
 const amazon='<span id="productTitle">Nintendo Game</span><span class="a-price priceToPay"><span class="a-offscreen">$59.99</span></span>';
 assert.equal(parseProductHtml(amazon,url).price,59.99);
 assert.equal(parseProductHtml('<title>Game</title>',url).price,null);
 assert.throws(()=>parseProductHtml('<title>Robot Check</title>',url),/blocked/);
});
test("fetches follow approved short links without forwarding credentials",async()=>{
 let calls=0;const p=await fetchProductDetails("https://amzn.to/goal",async(u,options)=>{calls++;assert.equal(options.redirect,"manual");assert.equal(options.credentials,"omit");assert.equal(options.headers.Authorization,undefined);assert.equal(options.headers.Cookie,undefined);return calls===1?new Response(null,{status:302,headers:{location:url}}):new Response(page(product),{headers:{"content-type":"text/html"}});});assert.equal(calls,2);assert.equal(p.price,49.99);assert.equal(p.sourceUrl,url);
});
test("unsafe redirects, non-HTML bodies, large pages, and store blocks fail safely",async()=>{
 let calls=0;await assert.rejects(()=>fetchProductDetails(url,async()=>{calls++;return new Response(null,{status:302,headers:{location:"https://127.0.0.1/private"}});}),/public HTTPS/);assert.equal(calls,1);
 await assert.rejects(()=>fetchProductDetails(url,async()=>new Response("file",{headers:{"content-type":"application/pdf"}})),/product page/);
 await assert.rejects(()=>fetchProductDetails(url,async()=>new Response("blocked",{status:403})),/manually/);
 await assert.rejects(()=>readLimitedText(new Response("x".repeat(100)),50),/too large/);
});
test("unsupported stores keep a link and never trigger an arbitrary server request",async()=>{
 const p=await fetchProductDetails("https://shop.example.org/item",async()=>{throw new Error("Should not fetch");});assert.equal(p.price,null);assert.equal(p.sourceUrl,"https://shop.example.org/item");assert.match(p.warning,/aren’t available/);
});
test("product sources persist in backups, survive ordinary edits, and validate safely",()=>{
 let s={...initialState(),goals:[]};s=applyAction(s,"createGoal",{name:"Nintendo Game",targetCents:4999,category:"auto",sourceUrl:url,note:product.description},"link-goal-1");const id=s.goals[0].id;
 assert.equal(validateBackup(JSON.parse(JSON.stringify(s))).goals[0].sourceUrl,url);
 s=applyAction(s,"editGoal",{goalId:id,name:"Nintendo Game",targetCents:5999,category:"auto"},"link-goal-2");assert.equal(s.goals[0].sourceUrl,url);
 assert.throws(()=>applyAction(s,"editGoal",{goalId:id,name:"Game",targetCents:5999,sourceUrl:"javascript:alert(1)"},"link-goal-3"),/HTTPS/);
 s=applyAction(s,"editGoal",{goalId:id,name:"Game",targetCents:5999,sourceUrl:""},"link-goal-4");assert.equal(s.goals[0].sourceUrl,undefined);
});
