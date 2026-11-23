import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, 64);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function getSessionSecret(): Promise<string> {
  const existing = await db.setting.findUnique({ where: { key: "sessionSecret" } });
  if (existing) return existing.value;
  const secret = crypto.randomBytes(32).toString("hex");
  await db.setting.create({ data: { key: "sessionSecret", value: secret } });
  return secret;
}

export interface SessionUser {
  id: string;
  email: string;
  role: "admin" | "expert";
  expertEmail: string | null;
}

const COOKIE_NAME = "mt_session";

async function signSession(user: SessionUser): Promise<string> {
  const secret = await getSessionSecret();
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    expertEmail: user.expertEmail,
  });
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

async function verifySession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const secret = await getSessionSecret();
  const expectedSig = crypto.createHmac("sha256", secret).update(b64).digest("base64url");
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (payload.role !== "admin" && payload.role !== "expert") return null;
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      expertEmail: payload.expertEmail ?? null,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(token);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized — please log in." }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden — you do not have permission to do this." }, { status: 403 });
}
