import type {AnalyticsEventName} from "./analytics-contract";
export function trackUsage(name:AnalyticsEventName, engine:"none"|"built-in"|"ai" = "none") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("gullak:usage", {detail:{name,engine}}));
}
