import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";
import { restoreFromBackup, listBackups } from "@/lib/backup";

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.filename !== "string") return NextResponse.json({ error: "Body must include 'filename'" }, { status: 400 });
  const backups = await listBackups();
  const target = backups.find((b) => b.filename === body.filename);
  if (!target) return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
  try {
    const BACKUP_DIR = process.env.BACKUP_DIR || "./download/backups";
    const filepath = path.join(BACKUP_DIR, target.filename);
    const result = await restoreFromBackup(filepath);
    return NextResponse.json({ ok: true, restored: result, from: target.filename });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
