import type {Metadata} from "next";
import {manageAccess} from "../manage-access";
import {analyticsDays,analyticsReport} from "../analytics-report";
import {chatGPTSignInPath,chatGPTSignOutPath} from "../chatgpt-auth";
import ManageDashboard from "./report";
import "./manage.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Private analytics",robots:{index:false,follow:false},alternates:{canonical:"/manage"}};

export default async function Manage({searchParams}:{searchParams:Promise<{days?:string}>}) {
  const params=await searchParams;
  return <ProtectedManage days={analyticsDays(params.days)}/>;
}
async function ProtectedManage({days}:{days:number}) {
  try {
    const access=await manageAccess();
    if(access==="anonymous")return <Gate title="Gullak management" message="Sign in with the owner's ChatGPT account to view private analytics."><a className="button primary" href={chatGPTSignInPath("/manage")} target="_top">Sign in with ChatGPT</a></Gate>;
    if(access==="denied")return <Gate title="Access restricted" message="This dashboard is available only to Gullak's owner."><a className="button secondary" href={chatGPTSignOutPath("/manage")} target="_top">Use a different ChatGPT account</a></Gate>;
    if(access==="unavailable")return <Gate title="Management unavailable" message="The owner access configuration is not ready. Please try again later."/>;
    return <ManageDashboard report={await analyticsReport(days)}/>;
  } catch {return <Gate title="Analytics unavailable" message="Your app is still available. Refresh this page to try loading analytics again."/>;}
}
function Gate({title,message,children}:{title:string;message:string;children?:React.ReactNode}) {
  return <main className="manage-gate"><span className="manage-wordmark">gullak <small>manage</small></span><h1>{title}</h1><p>{message}</p>{children}<a href="/" className="manage-back">Back to Gullak</a></main>;
}
