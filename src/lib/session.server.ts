// Cookie-backed sessions stored in our own Postgres tables.
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { db } from "./db.server";

export const SESSION_COOKIE = "cac_session";
const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "staff";
};

async function sha256(value: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function newToken(): Promise<string> {
  const { randomBytes } = await import("node:crypto");
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = await newToken();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db()`
    INSERT INTO public.app_sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    // Local development runs over plain http; everything else is https.
    secure: process.env["NODE_ENV"] !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await sha256(token);
  const rows = await db()<Array<SessionUser>>`
    SELECT u.id, u.email, u.role
    FROM public.app_sessions s
    JOIN public.app_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > now()
      AND u.is_active
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function destroySession(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256(token);
    await db()`DELETE FROM public.app_sessions WHERE token_hash = ${tokenHash}`;
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export async function requireUser(): Promise<SessionUser> {
  const user = await readSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}
