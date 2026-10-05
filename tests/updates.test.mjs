import test from "node:test";
import assert from "node:assert/strict";
import { createReleaseUpdater } from "../lib/release-updates.mjs";

const oldVersion = "a".repeat(24), newVersion = "b".repeat(24);

test("changed release waits for an idle app, then reloads exactly once", async () => {
  let safe = false, reloads = 0;
  const updater = createReleaseUpdater({ currentVersion: oldVersion, fetchVersion: async () => newVersion, canReload: () => safe, reload: () => reloads++ });
  await updater.check();
  updater.apply();
  assert.equal(reloads, 0);
  safe = true;
  updater.apply();
  updater.apply();
  await updater.check();
  assert.equal(reloads, 1);
});

test("same release, failed connectivity, and malformed responses do not reload", async () => {
  let version = oldVersion, fail = false, reloads = 0;
  const updater = createReleaseUpdater({ currentVersion: oldVersion, fetchVersion: async () => { if (fail) throw new Error("Offline"); return version; }, canReload: () => true, reload: () => reloads++ });
  await updater.check();
  version = "login page";
  await updater.check();
  fail = true;
  await updater.check();
  updater.apply();
  assert.equal(reloads, 0);
  fail = false;
  version = newVersion;
  await updater.check();
  assert.equal(reloads, 1);
});

test("overlapping resume events make one request and unmount cancels its effect", async () => {
  let requests = 0, reloads = 0, complete;
  const updater = createReleaseUpdater({ currentVersion: oldVersion, fetchVersion: () => { requests++; return new Promise(resolve => { complete = resolve; }); }, canReload: () => true, reload: () => reloads++ });
  const pending = updater.check();
  await updater.check();
  assert.equal(requests, 1);
  updater.dispose();
  complete(newVersion);
  await pending;
  updater.apply();
  assert.equal(reloads, 0);
});

test("a release rolled back before a safe reload keeps the current app", async () => {
  let version = newVersion, safe = false, reloads = 0;
  const updater = createReleaseUpdater({ currentVersion: oldVersion, fetchVersion: async () => version, canReload: () => safe, reload: () => reloads++ });
  await updater.check();
  version = oldVersion;
  await updater.check();
  safe = true;
  updater.apply();
  assert.equal(reloads, 0);
});
