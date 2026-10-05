import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";
import Dashboard from "./dashboard";
import Welcome from "./welcome";
import type {Metadata} from "next";
import {applicationSchema} from "./seo";
export const dynamic = "force-dynamic";
export async function generateMetadata():Promise<Metadata>{const user=await getChatGPTUser();return {robots:{index:!user,follow:!user}};}
export default async function Home() {
  const user=await getChatGPTUser();
  if(!user)return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(applicationSchema).replace(/</g,"\\u003c")}}/><Welcome signInPath={chatGPTSignInPath("/")}/></>;
  return <Dashboard accountName={user.fullName || user.email} signOutPath={chatGPTSignOutPath("/")} />;
}
