import {fetchProductDetails,readLimitedText} from "../../product-fetch";
import {ProductLinkError} from "../../product-link";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const attempts=new Map<string,{start:number;count:number}>();
// Reads only public store metadata; never reads or saves any guest or account finances.
export async function POST(request:Request){
 const origin=request.headers.get("origin");if((origin&&origin!==new URL(request.url).origin)||request.headers.get("sec-fetch-site")==="cross-site")return Response.json({error:"This request could not be verified."},{status:403,headers});
 if(!request.headers.get("content-type")?.includes("application/json"))return Response.json({error:"Use a JSON request."},{status:415,headers});
 const key=request.headers.get("oai-authenticated-user-id")??request.headers.get("cf-connecting-ip")??"guest",now=Date.now(),old=attempts.get(key),rate=old&&now-old.start<60000?old:{start:now,count:0};
 rate.count++;attempts.set(key,rate);if(attempts.size>2000){for(const [id,r] of attempts)if(now-r.start>=60000)attempts.delete(id);if(attempts.size>2000)attempts.delete(attempts.keys().next().value!);}
 if(rate.count>12)return Response.json({error:"Please wait a minute before reading another link."},{status:429,headers});
 try{const body=JSON.parse(await readLimitedText(new Response(request.body,{headers:request.headers}),4096));if(!body||typeof body.url!=="string")throw new ProductLinkError("Paste a product link.",400);return Response.json(await fetchProductDetails(body.url),{headers});}
 catch(e){return Response.json({error:e instanceof ProductLinkError?e.message:e instanceof SyntaxError?"This link request could not be read.":"The product page is unavailable. Enter the details manually."},{status:e instanceof ProductLinkError?e.status:400,headers});}
}
