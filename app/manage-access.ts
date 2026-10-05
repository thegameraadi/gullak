import { env } from "cloudflare:workers";
import { getChatGPTUser } from "./chatgpt-auth";
import { database } from "./store";

export async function manageAccess(): Promise<"owner" | "anonymous" | "denied" | "unavailable"> {
  const user = await getChatGPTUser();
  if (!user) return "anonymous";
  const ownerEmail = (env as unknown as Record<string, unknown>).GULLAK_MANAGE_OWNER_EMAIL;
  if (typeof ownerEmail !== "string" || !ownerEmail.trim()) return "unavailable";
  const db = database();
  const existing = await db.prepare("SELECT user_id FROM gullak_manage_owner WHERE id=1").first<{user_id:string}>();
  if (existing) return existing.user_id === user.userId ? "owner" : "denied";
  // Bootstrap only from the Site owner's verified SIWC email, supplied as a
  // production secret. Never let an arbitrary first signed-in visitor claim it.
  if (user.email.trim().toLowerCase() !== ownerEmail.trim().toLowerCase()) return "denied";
  await db.prepare("INSERT OR IGNORE INTO gullak_manage_owner (id,user_id,bound_at) VALUES (1,?,?)")
    .bind(user.userId, new Date().toISOString()).run();
  const bound = await db.prepare("SELECT user_id FROM gullak_manage_owner WHERE id=1").first<{user_id:string}>();
  return bound?.user_id === user.userId ? "owner" : "denied";
}
