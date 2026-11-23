import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) { if (r.key === "sessionSecret") continue; map[r.key] = r.value; }
  return NextResponse.json({ settings: map });
}

export async function PUT(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.settings !== "object" || body.settings === null) {
    return NextResponse.json({ error: "Body must be { settings: {...} }" }, { status: 400 });
  }
  const entries = Object.entries(body.settings) as [string, string][];
  for (const [key, value] of entries) {
    if (key === "sessionSecret") continue;
    await db.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } });
  }
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) { if (r.key === "sessionSecret") continue; map[r.key] = r.value; }
  return NextResponse.json({ settings: map });
}
