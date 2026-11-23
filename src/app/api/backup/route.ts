import { NextResponse } from "next/server";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";
import { createBackup, listBackups } from "@/lib/backup";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  return NextResponse.json({ backups: await listBackups() });
}

export async function POST() {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  try {
    const result = await createBackup();
    return NextResponse.json({ ok: true, filename: result.filename, candidates: result.candidates, users: result.users });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
