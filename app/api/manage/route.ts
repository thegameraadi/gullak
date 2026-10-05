import {manageAccess} from "../../manage-access";
import {analyticsDays,analyticsReport} from "../../analytics-report";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Vary":"oai-authenticated-user-id","X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request) {
  try {
    const access=await manageAccess();
    if(access!=="owner")return Response.json({error:access==="anonymous"?"Sign in to continue.":access==="denied"?"This account cannot access management.":"Management is temporarily unavailable."},{status:access==="anonymous"?401:access==="denied"?403:503,headers});
    return Response.json(await analyticsReport(analyticsDays(new URL(request.url).searchParams.get("days"))),{headers});
  } catch {console.error("Management report unavailable");return Response.json({error:"Analytics could not be loaded. Please try again."},{status:503,headers});}
}
