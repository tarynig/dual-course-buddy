import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Emails that are automatically granted admin on first sign-in. */
const FOUNDING_ADMINS = ["taryn.wdb@gmail.com"];

type AuthedContext = {
  supabase: {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    from: (table: string) => any;
  };
  userId: string;
  claims: Record<string, unknown>;
};

async function isAdmin(context: AuthedContext): Promise<boolean> {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data === true) return true;

  const email = String(context.claims["email"] ?? "").toLowerCase();
  if (!email || !FOUNDING_ADMINS.includes(email)) return false;

  // First-time bootstrap for the founding admin account.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
  if (error) {
    console.error("Admin bootstrap failed:", error.message);
    return false;
  }
  return true;
}

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({
    isAdmin: await isAdmin(context as unknown as AuthedContext),
    email: String((context.claims as Record<string, unknown>)["email"] ?? ""),
  }));

export type AdminEnquiry = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  courseId: string | null;
  dualCourseId: string | null;
  campus: string;
  message: string | null;
  status: string;
  createdAt: string;
};

export const getAdminEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminEnquiry[]> => {
    const ctx = context as unknown as AuthedContext;
    if (!(await isAdmin(ctx))) throw new Error("Forbidden");

    const { data, error } = await ctx.supabase
      .from("enquiries")
      .select(
        "id, full_name, phone, email, course_id, dual_course_id, campus, message, status, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      courseId: row.course_id,
      dualCourseId: row.dual_course_id,
      campus: row.campus,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    }));
  });

export const setEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "enrolled", "closed"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    if (!(await isAdmin(ctx))) throw new Error("Forbidden");

    const { error } = await ctx.supabase
      .from("enquiries")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setFees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["course", "dual"]),
        id: z.string().min(1).max(80),
        fee: z.number().min(0).max(10000000).nullable(),
        deposit: z.number().min(0).max(10000000).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    if (!(await isAdmin(ctx))) throw new Error("Forbidden");

    const table = data.kind === "course" ? "courses" : "dual_courses";
    const { error } = await ctx.supabase
      .from(table)
      .update({ fee: data.fee, deposit: data.deposit })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
