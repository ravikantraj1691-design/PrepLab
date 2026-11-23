// scripts/sync-schema-provider.mjs
//
// Rewrites the `provider = "..."` line in prisma/schema.prisma to match the
// DATABASE_URL scheme:
//   - DATABASE_URL starts with "file:"      → provider = "sqlite"
//   - DATABASE_URL starts with "postgres"    → provider = "postgresql"
//   - DATABASE_URL unset                     → keep "sqlite" (local dev default)
//
// Runs on `postinstall` (see package.json) so that when Vercel builds with a
// Postgres DATABASE_URL, Prisma generates the correct client automatically.
// Idempotent: safe to run any number of times.

import fs from "node:fs";
import path from "node:path";

const SCHEMA = path.resolve("prisma/schema.prisma");
const url = process.env.DATABASE_URL || "";

let provider = "sqlite";
if (url.startsWith("postgres")) {
  provider = "postgresql";
} else if (url.startsWith("file:")) {
  provider = "sqlite";
}
// Any other value (incl. empty): leave as sqlite (the local default).

const original = fs.readFileSync(SCHEMA, "utf8");
// Find the datasource block and replace its `provider = "..."` line only.
// We split into lines so the match is robust to comments and other fields
// appearing before/after the provider line.
const lines = original.split("\n");
let inDatasource = false;
let replaced = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^datasource\s+\w+\s*\{/.test(line)) {
    inDatasource = true;
    continue;
  }
  if (inDatasource) {
    if (line.includes("}")) {
      inDatasource = false;
      continue;
    }
    const m = line.match(/^(\s*provider\s*=\s*)"[^"]*"/);
    if (m) {
      lines[i] = `${m[1]}"${provider}"`;
      replaced = true;
      break;
    }
  }
}

if (!replaced) {
  console.error("[sync-provider] Could not find provider line in datasource block. Aborting.");
  process.exit(1);
}

fs.writeFileSync(SCHEMA, lines.join("\n"), "utf8");
console.log(`[sync-provider] schema.prisma provider set to "${provider}" (DATABASE_URL=${url ? url.slice(0, 15) + "..." : "<unset>"})`);
