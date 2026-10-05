import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";
import Dashboard from "./dashboard";
import Welcome from "./welcome";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user=await getChatGPTUser();
  if(!user)return <Welcome signInPath={chatGPTSignInPath("/")}/>;
  return <Dashboard accountName={user.fullName || user.email} signOutPath={chatGPTSignOutPath("/")} />;
}
