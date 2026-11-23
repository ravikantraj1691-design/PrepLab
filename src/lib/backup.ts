import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

const BACKUP_DIR = process.env.BACKUP_DIR || "./download/backups";
const MAX_BACKUPS = 10;

const IS_SERVERLESS =
  process.env.VERCEL === "1" ||
  (process.env.NODE_ENV === "production" && !BACKUP_DIR.startsWith("./download") && !BACKUP_DIR.startsWith("/home/z/my-project"));

export interface BackupData {
  version: 1;
  exportedAt: string;
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

async function ensureBackupDir(): Promise<boolean> {
  if (IS_SERVERLESS) return false;
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    return true;
  } catch {
    return true;
  }
}

export async function createBackup(): Promise<{ filename: string; path: string; candidates: number; users: number }> {
  const [candidates, users, settings] = await Promise.all([
    db.candidate.findMany(),
    db.user.findMany(),
    db.setting.findMany(),
  ]);

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    candidates: candidates.map((c) => ({ ...c, dbCreatedAt: undefined, dbUpdatedAt: undefined })),
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      expertEmail: u.expertEmail,
      passwordHash: u.passwordHash,
      createdAt: u.createdAt.toISOString(),
    })),
    settings: settings.filter((s) => s.key !== "sessionSecret").map((s) => ({ key: s.key, value: s.value })),
  };

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${ts}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  const writable = await ensureBackupDir();
  if (writable) {
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf8");
    await rotateBackups();
  }

  return { filename, path: writable ? filepath : "(serverless: skipped)", candidates: candidates.length, users: users.length };
}

export async function listBackups(): Promise<Array<{ filename: string; size: number; mtime: string; candidates?: number }>> {
  if (IS_SERVERLESS) return [];
  const writable = await ensureBackupDir();
  if (!writable) return [];
  const entries = await fs.readdir(BACKUP_DIR);
  const backups: Array<{ filename: string; size: number; mtime: string; candidates?: number }> = [];
  for (const filename of entries) {
    if (!filename.endsWith(".json")) continue;
    const filepath = path.join(BACKUP_DIR, filename);
    try {
      const stat = await fs.stat(filepath);
      const content = await fs.readFile(filepath, "utf8");
      const data = JSON.parse(content) as BackupData;
      backups.push({
        filename,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        candidates: data.candidates?.length || 0,
      });
    } catch {
      backups.push({ filename, size: 0, mtime: new Date().toISOString() });
    }
  }
  backups.sort((a, b) => b.mtime.localeCompare(a.mtime));
  return backups;
}

async function rotateBackups(): Promise<void> {
  const backups = await listBackups();
  if (backups.length <= MAX_BACKUPS) return;
  const toDelete = backups.slice(MAX_BACKUPS);
  for (const b of toDelete) {
    try {
      await fs.unlink(path.join(BACKUP_DIR, b.filename));
    } catch {
      // ignore
    }
  }
}

async function getLatestBackupPath(): Promise<string | null> {
  const backups = await listBackups();
  if (backups.length === 0) return null;
  return path.join(BACKUP_DIR, backups[0].filename);
}

export async function restoreFromBackup(filepath: string): Promise<{ candidates: number; users: number; settings: number }> {
  const content = await fs.readFile(filepath, "utf8");
  const data = JSON.parse(content) as BackupData;
  if (!data || data.version !== 1) {
    throw new Error("Invalid backup file format");
  }

  await db.candidate.deleteMany({});
  await db.user.deleteMany({});
  const existingSecret = await db.setting.findUnique({ where: { key: "sessionSecret" } });
  await db.setting.deleteMany({});
  if (existingSecret) {
    await db.setting.create({ data: { key: "sessionSecret", value: existingSecret.value } });
  }

  for (const s of data.settings) {
    if (s.key === "sessionSecret") continue;
    await db.setting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value },
      update: { value: s.value },
    });
  }

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
    } catch {
      // Skip duplicates.
    }
  }

  for (const c of data.candidates) {
    try {
      const { dbCreatedAt, dbUpdatedAt, ...rest } = c as Record<string, unknown>;
      await db.candidate.create({ data: rest as never });
    } catch {
      // Skip duplicates.
    }
  }

  return {
    candidates: data.candidates.length,
    users: data.users.length,
    settings: data.settings.length,
  };
}

export async function autoRestoreOnStartup(): Promise<{ restored: boolean; from?: string; candidates?: number; users?: number } | null> {
  try {
    const count = await db.candidate.count();
    if (count > 0) {
      return { restored: false };
    }
    const latestPath = await getLatestBackupPath();
    if (!latestPath) {
      return null;
    }
    const result = await restoreFromBackup(latestPath);
    return {
      restored: true,
      from: path.basename(latestPath),
      candidates: result.candidates,
      users: result.users,
    };
  } catch (e) {
    console.error("[auto-restore] Failed:", e);
    return null;
  }
}
