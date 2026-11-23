import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie, SessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const sessionUser: SessionUser = { id: user.id, email: user.email, role: user.role as "admin" | "expert", expertEmail: user.expertEmail };
  await setSessionCookie(sessionUser);
  return NextResponse.json({ user: sessionUser });
}
