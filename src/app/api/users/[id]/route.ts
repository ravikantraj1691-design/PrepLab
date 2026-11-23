import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, forbidden, unauthorized } from "@/lib/auth";
import { createBackup } from "@/lib/backup";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const data: { email?: string; passwordHash?: string; role?: string; expertEmail?: string | null } = {};
  if (typeof body.email === "string" && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    if (email !== existing.email) {
      const clash = await db.user.findUnique({ where: { email } });
      if (clash) return NextResponse.json({ error: "That email is already in use" }, { status: 400 });
      data.email = email;
    }
  }
  if (typeof body.password === "string" && body.password.trim()) {
    if (body.password.length < 4) return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    data.passwordHash = hashPassword(body.password);
  }
  if (typeof body.role === "string") {
    const role = body.role.toLowerCase();
    if (role !== "admin" && role !== "expert") return NextResponse.json({ error: "Role must be 'admin' or 'expert'" }, { status: 400 });
    data.role = role;
    if (role === "admin") data.expertEmail = null;
  }
  if (typeof body.expertEmail !== "undefined") {
    const ee = body.expertEmail ? String(body.expertEmail).trim() : null;
    if (data.role === "admin" || (data.role === undefined && existing.role === "admin")) {
      // admins have no expertEmail
    } else if (!ee) {
      return NextResponse.json({ error: "Expert users must have an expertEmail" }, { status: 400 });
    } else {
      data.expertEmail = ee;
    }
  }
  if (existing.role === "admin" && data.role === "expert") {
    const adminCount = await db.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) return NextResponse.json({ error: "Cannot demote the last admin user" }, { status: 400 });
  }
  if (existing.role === "admin" && me.id === existing.id && data.role === "expert") {
    return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 });
  }
  const updated = await db.user.update({ where: { id }, data });
  createBackup().catch((e) => console.error("[backup] failed after user PUT:", e));
  return NextResponse.json({ user: { id: updated.id, email: updated.email, role: updated.role, expertEmail: updated.expertEmail } });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const { id } = await ctx.params;
  if (id === me.id) return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (existing.role === "admin") {
    const adminCount = await db.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 });
  }
  await db.user.delete({ where: { id } });
  createBackup().catch((e) => console.error("[backup] failed after user DELETE:", e));
  return NextResponse.json({ ok: true });
}
