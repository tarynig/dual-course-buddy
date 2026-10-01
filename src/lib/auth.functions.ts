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
