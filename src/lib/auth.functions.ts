import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callData } from "./data.server";

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
    const { createSession } = await import("./session.server");

    const user = await callData<{ id: string } | null>("app_sign_in", {
      email: data.email,
      password: data.password,
    });
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
    const { requireUser } = await import("./session.server");
    const user = await requireUser();

    const changed = await callData<{ ok: boolean } | null>("app_change_password", {
      userId: user.id,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    if (!changed) return { ok: false as const, error: "Your current password isn't correct." };
    return { ok: true as const };
  });

export type StaffUser = { id: string; email: string; role: "admin" | "staff"; isActive: boolean };

export const listStaff = createServerFn({ method: "GET" }).handler(async (): Promise<StaffUser[]> => {
  const { requireAdmin } = await import("./session.server");
  await requireAdmin();
  return (await callData<StaffUser[]>("app_list_staff")) ?? [];
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
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const result = await callData<{ ok: boolean; error?: string }>("app_add_staff", { ...data });
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Couldn't create the account." };
    return { ok: true as const };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(8).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const result = await callData<{ ok: boolean; error?: string }>("app_reset_staff_password", { ...data });
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Account not found." };
    return { ok: true as const };
  });

export const setStaffActive = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./session.server");
    const me = await requireAdmin();
    if (me.id === data.id && !data.active)
      return { ok: false as const, error: "You can't switch off your own account." };
    const result = await callData<{ ok: boolean; error?: string }>("app_set_staff_active", {
      ...data,
      actorId: me.id,
    });
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Couldn't update the account." };
    return { ok: true as const };
  });
