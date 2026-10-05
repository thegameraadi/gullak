export const eventNames = ["page_view", "guest_started", "sign_in_started", "dashboard_opened", "goal_created", "income_recorded", "contribution_saved", "purchase_recorded", "history_edited", "backup_restored", "import_completed", "currency_changed", "gullie_opened", "gullie_message_sent", "gullie_reply_received", "app_error"] as const;
export type AnalyticsEventName = typeof eventNames[number];
export const sources = ["direct", "google", "bing", "github", "social", "friends", "bay-area-builders", "other"] as const;
export const engines = ["none", "built-in", "ai"] as const;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const onlyKeys = (value:object, keys:string[]) => Object.keys(value).every(k => keys.includes(k));
export function parseAnalyticsBatch(value:unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  if (!onlyKeys(b,["visitorId","sessionId","source","standalone","events"]) || typeof b.visitorId !== "string" || !uuid.test(b.visitorId) || typeof b.sessionId !== "string" || !uuid.test(b.sessionId) || !sources.includes(b.source as typeof sources[number]) || typeof b.standalone !== "boolean" || !Array.isArray(b.events) || b.events.length < 1 || b.events.length > 12) return null;
  const events: {id:string;name:AnalyticsEventName;engine:typeof engines[number]}[] = [];
  for (const item of b.events) {
    if (!item || typeof item !== "object" || Array.isArray(item) || !onlyKeys(item,["id","name","engine"]) || typeof item.id !== "string" || !uuid.test(item.id) || !eventNames.includes(item.name) || !engines.includes(item.engine)) return null;
    events.push({id:item.id,name:item.name,engine:item.name === "gullie_reply_received" ? item.engine : "none"});
  }
  return {visitorId:b.visitorId,sessionId:b.sessionId,source:b.source as typeof sources[number],standalone:b.standalone,events};
}
export function trafficSource(referrer:string, campaign:string, ownOrigin="") {
  if (campaign === "friends" || campaign === "bay-area-builders") return campaign;
  if (campaign) return "other";
  try {
    const url = new URL(referrer);
    if (url.origin === ownOrigin) return "direct";
    const host = url.hostname.toLowerCase();
    if (/(^|\.)google\.(com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host)) return "google";
    if (host === "bing.com" || host.endsWith(".bing.com")) return "bing";
    if (host === "github.com" || host.endsWith(".github.com")) return "github";
    if (/^(www\.|m\.|l\.)?(instagram.com|facebook.com|linkedin.com|t.co|reddit.com)$/.test(host)) return "social";
    return "other";
  } catch { return "direct"; }
}
export function clientPlatform(userAgent:string) {
  const tablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent);
  const mobile = /iPhone|iPod|Android.*Mobile|Mobile/i.test(userAgent);
  const os = /iPhone|iPad|iPod/i.test(userAgent) ? "iOS" : /Android/i.test(userAgent) ? "Android" : /Windows/i.test(userAgent) ? "Windows" : /Macintosh|Mac OS/i.test(userAgent) ? "macOS" : /Linux/i.test(userAgent) ? "Linux" : "Other";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Firefox|FxiOS/.test(userAgent) ? "Firefox" : /Chrome|CriOS/.test(userAgent) ? "Chrome" : /Safari/.test(userAgent) ? "Safari" : "Other";
  return {device:tablet ? "Tablet" : mobile ? "Phone" : "Desktop",os,browser};
}
export function actionAnalyticsEvent(action:string, payload:unknown): AnalyticsEventName | null {
  const names: Record<string,AnalyticsEventName> = {createGoal:"goal_created",income:"income_recorded",contribute:"contribution_saved",split:"contribution_saved",purchase:"purchase_recorded",closeGoal:"purchase_recorded",editEntry:"history_edited",deleteEntry:"history_edited",restore:"backup_restored",importIncome:"import_completed"};
  if (action === "closeGoal" && (payload as {reason?:string})?.reason !== "bought") return null;
  if (action === "settings") return (payload as {currency?:string})?.currency ? "currency_changed" : null;
  return Object.hasOwn(names,action) ? names[action] : null;
}
