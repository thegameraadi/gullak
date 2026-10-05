export const trafficClasses = ["human", "bot", "unknown"] as const;
export type TrafficClass = typeof trafficClasses[number];
export type TrafficSignals = { automation: boolean; interaction: boolean };
export type TrafficClassification = { category: TrafficClass; signal: string };

// Names are claims made by the requester, not independently verified identities.
const aiAgents = [
  ["GPTBot", "openai-training"], ["OAI-SearchBot", "openai-search"], ["ChatGPT-User", "openai-assistant"],
  ["Claude-SearchBot", "claude-search"], ["Claude-User", "claude-assistant"], ["ClaudeBot", "claude-training"],
  ["PerplexityBot", "perplexity-search"], ["Perplexity-User", "perplexity-assistant"],
  ["meta-externalagent", "meta-ai"], ["meta-externalfetcher", "meta-ai"], ["CCBot", "common-crawl"],
] as const;

export function classifyTraffic(userAgent: string, signals?: TrafficSignals, edgeVerifiedBot = false): TrafficClassification {
  const agent = userAgent.slice(0, 2000);
  for (const [token, label] of aiAgents) {
    if (new RegExp(`(?:^|[\\s;(])${token}(?:[\\s/;)]|$)`, "i").test(agent)) {
      return { category: "bot", signal: `${edgeVerifiedBot ? "verified" : "declared"}:${label}` };
    }
  }
  if (/\b(?:Googlebot|Google-InspectionTool|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot)\b/i.test(agent)) {
    return { category: "bot", signal: edgeVerifiedBot ? "verified:search-crawler" : "declared:search-crawler" };
  }
  if (edgeVerifiedBot) return { category: "bot", signal: "verified:other-bot" };
  if (/\b(?:HeadlessChrome|PhantomJS|Playwright|Puppeteer|Selenium)\b/i.test(agent) || signals?.automation) {
    return { category: "bot", signal: "browser-automation" };
  }
  if (/bot\b|crawler|spider|slurp|facebookexternalhit|preview|curl\/|wget\/|python-requests|python-urllib|httpx\/|Go-http-client|node-fetch|undici/i.test(agent)) {
    return { category: "bot", signal: "declared:other-automation" };
  }
  if (signals?.interaction && /Mozilla\/.+(?:Safari|Firefox|Chrome|Edg)/i.test(agent)) {
    return { category: "human", signal: "browser-interaction" };
  }
  return { category: "unknown", signal: agent ? "no-human-signal" : "missing-agent" };
}

export function trafficPage(request: Request): "home" | "privacy" | null {
  if (request.method !== "GET" || request.headers.get("RSC") === "1" || request.headers.has("next-router-prefetch") || /prefetch/i.test(request.headers.get("purpose") || request.headers.get("sec-purpose") || "")) return null;
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return null;
  const path = new URL(request.url).pathname;
  return path === "/" ? "home" : path === "/privacy" ? "privacy" : null;
}
