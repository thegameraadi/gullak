import {getRates} from "../rates/route";
export const dynamic="force-dynamic";
// Public market rates contain no account data; guest finances never reach this endpoint.
export async function GET(request:Request){const headers={"Cache-Control":"public, max-age=300"};try{return Response.json(await getRates(new URL(request.url).searchParams.get("refresh")==="1"),{headers});}catch(e){return Response.json({error:(e as Error).message},{status:503,headers:{"Cache-Control":"no-store"}});}}
