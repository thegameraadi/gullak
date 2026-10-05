import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Hash the actual build inputs, including edits that are not committed yet.
export function releaseFingerprint(root = process.cwd()) {
  const hash = createHash("sha256");
  const add = (path) => {
    hash.update(path + "\0");
    hash.update(readFileSync(join(root, path)));
    hash.update("\0");
  };
  const visit = (path) => {
    for (const entry of readdirSync(join(root, path), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) add(child);
    }
  };
  for (const directory of ["app", "components", "lib", "db", "drizzle", "public", "build", "scripts"]) visit(directory);
  for (const file of ["package.json", "pnpm-lock.yaml", "vite.config.ts", "tsconfig.json", ".openai/hosting.json"]) add(file);
  return hash.digest("hex").slice(0, 24);
}
