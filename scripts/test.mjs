import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = readdirSync("tests").filter(name => name.endsWith(".test.mjs") && name !== "worker.test.mjs").sort().map(name => `tests/${name}`);
const result = spawnSync(process.execPath, ["--experimental-strip-types", "--test", ...files], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
