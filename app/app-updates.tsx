"use client";

import { useEffect } from "react";
import { createReleaseUpdater } from "../lib/release-updates.mjs";
import { releaseVersion } from "./release-version";

export default function AppUpdates() {
  useEffect(() => {
    let lastInteraction = Date.now();
    let retry: ReturnType<typeof setTimeout>;
    const canReload = () => {
      const focused = document.activeElement;
      return document.visibilityState === "visible" && navigator.onLine &&
        Date.now() - lastInteraction >= 5000 &&
        !document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [data-update-blocked="true"]') &&
        !(focused instanceof HTMLElement && (focused.matches("input, textarea, select") || focused.isContentEditable));
    };
    const updater = createReleaseUpdater({
      currentVersion: releaseVersion,
      canReload,
      fetchVersion: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const response = await fetch(`/api/version?t=${Date.now()}`, {
            cache: "no-store", credentials: "same-origin", signal: controller.signal,
          });
          if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Version unavailable");
          const data = await response.json() as { version?: unknown };
          if (typeof data.version !== "string") throw new Error("Version unavailable");
          return data.version;
        } finally { clearTimeout(timeout); }
      },
      reload: () => window.location.reload(),
    });
    const check = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void updater.check();
    };
    const schedule = () => {
      clearTimeout(retry);
      retry = setTimeout(() => updater.apply(), 5100);
    };
    const interaction = () => { lastInteraction = Date.now(); schedule(); };
    const resume = () => { check(); schedule(); };
    const timer = setInterval(check, 60000);
    // Poll pending releases cheaply while a dialog closes or a save finishes.
    const pendingTimer = setInterval(() => updater.apply(), 5000);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
    window.addEventListener("online", resume);
    document.addEventListener("pointerdown", interaction, true);
    document.addEventListener("keydown", interaction, true);
    document.addEventListener("input", interaction, true);
    check();
    schedule();
    return () => {
      updater.dispose();
      clearTimeout(retry);
      clearInterval(timer);
      clearInterval(pendingTimer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("online", resume);
      document.removeEventListener("pointerdown", interaction, true);
      document.removeEventListener("keydown", interaction, true);
      document.removeEventListener("input", interaction, true);
    };
  }, []);
  return null;
}
