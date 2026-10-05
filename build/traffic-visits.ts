import {classifyTraffic, trafficPage} from "../lib/traffic-classification";

// Only read the platform-owned request.cf object. Caller-supplied "verified
// bot" headers are not trusted. Sites may not expose Bot Management metadata.
export function edgeVerifiedBot(request: Request): boolean {
  return (request as Request & {cf?: {botManagement?: {verifiedBot?: boolean}}}).cf?.botManagement?.verifiedBot === true;
}

export function visitRequest(request: Request) {
  const headers = new Headers(request.headers);
  headers.delete("x-gullak-visit-id");
  const page = trafficPage(request);
  const id = page ? crypto.randomUUID() : null;
  if (id) headers.set("x-gullak-visit-id", id);
  return {request: new Request(request, {headers}), id, page};
}

export async function recordVisit(db: D1Database, original: Request, id: string, page: string) {
  const traffic = classifyTraffic(original.headers.get("user-agent") || "", undefined, edgeVerifiedBot(original));
  const at = new Date().toISOString();
  await db.prepare("INSERT OR IGNORE INTO gullak_analytics_visits (id,occurred_at,page,traffic_class,traffic_signal) VALUES (?,?,?,?,?)")
    .bind(id, at, page, traffic.category, traffic.signal).run();
  if (Math.random() < 1 / 32) {
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    await db.prepare("DELETE FROM gullak_analytics_visits WHERE id IN (SELECT id FROM gullak_analytics_visits WHERE occurred_at<? LIMIT 1000)").bind(cutoff).run();
  }
}
