import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, forbidden, unauthorized } from "@/lib/auth";
import { createBackup } from "@/lib/backup";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ users: users.map((u) => ({ id: u.id, email: u.email, role: u.role, expertEmail: u.expertEmail, createdAt: u.createdAt.toISOString() })) });
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "expert").toLowerCase();
  const expertEmail = body.expertEmail ? String(body.expertEmail).trim() : null;
  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  if (password.length < 4) return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  if (role !== "admin" && role !== "expert") return NextResponse.json({ error: "Role must be 'admin' or 'expert'" }, { status: 400 });
  if (role === "expert" && !expertEmail) return NextResponse.json({ error: "Expert users must have an expertEmail" }, { status: 400 });
  if (role === "admin" && expertEmail) return NextResponse.json({ error: "Admin users should not have an expertEmail" }, { status: 400 });
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 400 });
  const created = await db.user.create({ data: { email, role, expertEmail: role === "expert" ? expertEmail : null, passwordHash: hashPassword(password) } });
  createBackup().catch((e) => console.error("[backup] failed after user POST:", e));
  return NextResponse.json({ user: { id: created.id, email: created.email, role: created.role, expertEmail: created.expertEmail } });
}
