import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CurrentUser = { id: string; email: string; role: "admin" | "staff" } | null;

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser> => {
    const { readSession } = await import("./session.server");
    return await readSession();
  },
);

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(200),
        password: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { createSession } = await import("./session.server");

    const rows = await db()<Array<{ id: string }>>`
      SELECT id FROM public.app_users
      WHERE lower(email) = lower(${data.email})
        AND is_active
        AND public.verify_password(${data.password}, password_hash)
      LIMIT 1
    `;
    const user = rows[0];
    if (!user) {
      return { ok: false as const, error: "That email and password don't match." };
    }

    await createSession(user.id);
    return { ok: true as const };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { destroySession } = await import("./session.server");
  await destroySession();
  return { ok: true as const };
});

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        currentPassword: z.string().min(1).max(200),
        newPassword: z.string().min(10).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireUser } = await import("./session.server");
    const user = await requireUser();

    const rows = await db()<Array<{ id: string }>>`
      UPDATE public.app_users
      SET password_hash = public.hash_password(${data.newPassword}),
          updated_at = now()
      WHERE id = ${user.id}
        AND public.verify_password(${data.currentPassword}, password_hash)
      RETURNING id
    `;
    if (!rows[0]) return { ok: false as const, error: "Your current password isn't correct." };
    return { ok: true as const };
  });

export type StaffUser = { id: string; email: string; role: "admin" | "staff"; isActive: boolean };

export const listStaff = createServerFn({ method: "GET" }).handler(async (): Promise<StaffUser[]> => {
  const { db } = await import("./db.server");
  const { requireAdmin } = await import("./session.server");
  await requireAdmin();
  const rows = await db()<Array<{ id: string; email: string; role: "admin" | "staff"; is_active: boolean }>>`
    SELECT id::text AS id, email, role, is_active FROM public.app_users ORDER BY created_at
  `;
  return rows.map((r) => ({ id: r.id, email: r.email, role: r.role, isActive: r.is_active }));
});

export const createStaff = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(200),
        password: z.string().min(8).max(200),
        role: z.enum(["admin", "staff"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();
    const exists = await sql`SELECT 1 FROM public.app_users WHERE lower(email) = lower(${data.email})`;
    if (exists.length) return { ok: false as const, error: "An account with that email already exists." };
    await sql`
      INSERT INTO public.app_users (email, password_hash, role)
      VALUES (${data.email}, public.hash_password(${data.password}), ${data.role})
    `;
    return { ok: true as const };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(8).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();
    const rows = await sql`
      UPDATE public.app_users
      SET password_hash = public.hash_password(${data.password}), updated_at = now()
      WHERE id = ${data.id} RETURNING id
    `;
    if (!rows[0]) return { ok: false as const, error: "Account not found." };
    // Sign the person out everywhere so the old password stops working immediately.
    await sql`DELETE FROM public.app_sessions WHERE user_id = ${data.id}`;
    return { ok: true as const };
  });

export const setStaffActive = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    const me = await requireAdmin();
    if (me.id === data.id && !data.active)
      return { ok: false as const, error: "You can't switch off your own account." };
    const sql = db();
    await sql`UPDATE public.app_users SET is_active = ${data.active}, updated_at = now() WHERE id = ${data.id}`;
    if (!data.active) await sql`DELETE FROM public.app_sessions WHERE user_id = ${data.id}`;
    return { ok: true as const };
  });
