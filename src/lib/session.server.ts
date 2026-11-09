// Cookie-backed sessions stored in our own Postgres tables.
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { callData } from "./data.server";

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

  await callData("app_add_session", {
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
  });

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    // The editor preview embeds the site in a frame on another domain, so the
    // cookie must be cross-site capable (SameSite=None + Secure + Partitioned).
    // Server functions are still protected by the CSRF middleware.
    secure: true,
    sameSite: "none",
    partitioned: true,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await sha256(token);
  return await callData<SessionUser | null>("app_read_session", { tokenHash });
}

export async function destroySession(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256(token);
    await callData("app_delete_session", { tokenHash });
  }
  deleteCookie(SESSION_COOKIE, { path: "/", secure: true, sameSite: "none", partitioned: true });
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
