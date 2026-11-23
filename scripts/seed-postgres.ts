/// scripts/seed-postgres.ts
///
/// Seeds a Postgres database (pointed at by DATABASE_URL) with the current
/// local data: all candidates, users, and non-secret settings. Idempotent —
/// safe to run multiple times (uses upsert / deletes existing rows first).
///
/// Usage:
///   1. Set DATABASE_URL to your Postgres connection string:
///        export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
///   2. Push the schema to Postgres:
///        bunx prisma db push
///   3. Run the seed:
///        bun scripts/seed-postgres.ts [path-to-backup.json]
///
/// If no backup JSON path is given, it uses the newest backup in
/// ./download/backups/.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

interface BackupData {
  version: 1;
  candidates: Array<Record<string, unknown>>;
  users: Array<{
    id: string;
    email: string;
    role: string;
    expertEmail: string | null;
    passwordHash: string;
    createdAt: string;
  }>;
  settings: Array<{ key: string; value: string }>;
}

const BACKUP_DIR = process.env.BACKUP_DIR || "./download/backups";

function findLatestBackup(explicit?: string): string {
  if (explicit && fs.existsSync(explicit)) return explicit;
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (files.length === 0) {
    throw new Error(`No backup files found in ${BACKUP_DIR}. Pass an explicit path.`);
  }
  return path.join(BACKUP_DIR, files[0].f);
}

async function main() {
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("postgres")) {
    console.error(`ERROR: DATABASE_URL must be a Postgres connection string (got "${url.slice(0, 20)}...").`);
    console.error("Set it first, e.g.:");
    console.error('  export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"');
    process.exit(1);
  }

  const backupPath = findLatestBackup(process.argv[2]);
  console.log(`Reading backup from: ${backupPath}`);
  const data: BackupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));

  const db = new PrismaClient({ log: ["error"] });

  console.log(`Target DB: ${url.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`Backup contains: ${data.candidates.length} candidates, ${data.users.length} users, ${data.settings.length} settings`);

  // Wipe target (replace mode).
  console.log("Wiping target DB...");
  await db.candidate.deleteMany({});
  await db.user.deleteMany({});
  // Preserve sessionSecret if it already exists on the target.
  const existingSecret = await db.setting.findUnique({ where: { key: "sessionSecret" } });
  await db.setting.deleteMany({});
  if (existingSecret) {
    await db.setting.create({ data: { key: "sessionSecret", value: existingSecret.value } });
  }

  // Settings (preserve a fresh sessionSecret if none carried over).
  let secretSet = !!existingSecret;
  for (const s of data.settings) {
    if (s.key === "sessionSecret") continue;
    await db.setting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value },
      update: { value: s.value },
    });
  }
  if (!secretSet) {
    // Generate a new session secret so cookies work.
    const crypto = await import("crypto");
    await db.setting.create({
      data: { key: "sessionSecret", value: crypto.randomBytes(32).toString("hex") },
    });
    console.log("  generated a new sessionSecret on the target DB");
  }

  // Users.
  let userCount = 0;
  for (const u of data.users) {
    try {
      await db.user.create({
        data: {
          id: u.id,
          email: u.email,
          role: u.role,
          expertEmail: u.expertEmail,
          passwordHash: u.passwordHash,
          createdAt: new Date(u.createdAt),
        },
      });
      userCount++;
    } catch (e) {
      console.error(`  failed to insert user ${u.email}:`, e instanceof Error ? e.message : e);
    }
  }

  // Candidates.
  let candCount = 0;
  for (const c of data.candidates) {
    try {
      const { dbCreatedAt, dbUpdatedAt, ...rest } = c as Record<string, unknown>;
      await db.candidate.create({ data: rest as never });
      candCount++;
    } catch (e) {
      console.error(`  failed to insert candidate ${c.candidateName}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`\n=== Seed complete ===`);
  console.log(`  users inserted: ${userCount}/${data.users.length}`);
  console.log(`  candidates inserted: ${candCount}/${data.candidates.length}`);
  console.log(`\nThe Postgres DB is now ready. Point the app at it with DATABASE_URL and deploy.`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
