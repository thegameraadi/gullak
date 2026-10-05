import {normalizeProductUrl,supportedProductUrl,parseProductHtml,ProductLinkError,type ProductDetails} from "./product-link";
export async function readLimitedText(response:Response,limit:number){
 const length=Number(response.headers.get("content-length"));if(length>limit){await response.body?.cancel();throw new ProductLinkError("This page is too large to read automatically.",413);}
 if(!response.body)return "";const reader=response.body.getReader(),decoder=new TextDecoder();let size=0,text="";
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw new ProductLinkError("This page is too large to read automatically.",413);text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
 finally{await reader.cancel().catch(()=>{});}
}
export async function fetchProductDetails(input:string,fetcher:typeof fetch=fetch):Promise<ProductDetails>{
 let url=normalizeProductUrl(input);
 if(!supportedProductUrl(url))return {sourceUrl:url,name:"",description:"",category:"",price:null,currency:null,warning:"Automatic details aren’t available for this store yet. The link is kept; enter the name and price manually."};
 const signal=AbortSignal.timeout(12000);
 try{for(let hops=0;hops<4;hops++){
  if(!supportedProductUrl(url))throw new ProductLinkError("This link redirects to an unsupported store. Enter the details manually.");
  const response=await fetcher(url,{method:"GET",redirect:"manual",signal,headers:{"Accept":"text/html,application/xhtml+xml","Accept-Language":"en-US,en;q=0.9","User-Agent":"Gullak/1.0 (product goal preview)"},credentials:"omit"});
  if([301,302,303,307,308].includes(response.status)){const location=response.headers.get("location");await response.body?.cancel();if(!location)throw new ProductLinkError("The store returned an incomplete link.");url=normalizeProductUrl(new URL(location,url).href);continue;}
  if(!response.ok){await response.body?.cancel();throw new ProductLinkError("This store couldn’t share its product page. Keep the link and enter the name and price manually.");}
  if(!/text\/html|application\/xhtml\+xml/i.test(response.headers.get("content-type")??"")){await response.body?.cancel();throw new ProductLinkError("Use a product page link rather than a file.");}
  return parseProductHtml(await readLimitedText(response,1500000),url);
 }throw new ProductLinkError("This link has too many redirects. Paste the final product page link.");}
 catch(e){if(e instanceof ProductLinkError)throw e;throw new ProductLinkError("The store didn’t respond in time. Try again or enter the details manually.",504);}
}
