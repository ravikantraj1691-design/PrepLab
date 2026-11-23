import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow, normalizeInput } from "../route";
import { parseFlexibleDate } from "@/lib/dates";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";
import { createBackup } from "@/lib/backup";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id } = await ctx.params;
  const c = await db.candidate.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role !== "admin" && c.expert !== me.expertEmail) return forbidden();
  return NextResponse.json({ row: toRow(c) });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id } = await ctx.params;
  const existing = await db.candidate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role !== "admin" && existing.expert !== me.expertEmail) return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (me.role !== "admin" && typeof body.expert === "string" && body.expert.trim() !== existing.expert) {
    return NextResponse.json({ error: "Experts cannot reassign a candidate to a different expert" }, { status: 403 });
  }
  const data = normalizeInput(body);
  const updated = await db.candidate.update({ where: { id }, data });
  createBackup().catch((e) => console.error("[backup] failed after candidate PUT:", e));
  return NextResponse.json({ row: toRow(updated) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const { id } = await ctx.params;
  try {
    await db.candidate.delete({ where: { id } });
    createBackup().catch((e) => console.error("[backup] failed after candidate DELETE:", e));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id } = await ctx.params;
  const existing = await db.candidate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role !== "admin" && existing.expert !== me.expertEmail) return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const str = (v: unknown) => { if (v === null || v === undefined) return null; const s = String(v).trim(); return s === "" ? null : s; };
  const allowed: Record<string, unknown> = {};
  if ("mock2DelayReason" in body) allowed.mock2DelayReason = str(body.mock2DelayReason);
  if ("mock3DelayReason" in body) allowed.mock3DelayReason = str(body.mock3DelayReason);
  if ("mock1NextDate" in body) allowed.mock1NextDate = parseFlexibleDate(body.mock1NextDate);
  if ("mock2NextDate" in body) allowed.mock2NextDate = parseFlexibleDate(body.mock2NextDate);
  if ("mock3NextDate" in body) allowed.mock3NextDate = parseFlexibleDate(body.mock3NextDate);
  if (Object.keys(allowed).length === 0) return NextResponse.json({ error: "No patchable fields supplied" }, { status: 400 });
  const updated = await db.candidate.update({ where: { id }, data: allowed });
  createBackup().catch((e) => console.error("[backup] failed after candidate PATCH:", e));
  return NextResponse.json({ row: toRow(updated) });
}
