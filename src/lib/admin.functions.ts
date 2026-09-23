import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const { readSession } = await import("./session.server");
  const user = await readSession();
  return {
    isAdmin: user?.role === "admin",
    email: user?.email ?? "",
  };
});

export const getAdminEnquiries = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<AdminEnquiry>> => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();

    const rows = await db()<
      Array<{
        id: string;
        full_name: string;
        phone: string;
        email: string;
        course_id: string | null;
        dual_course_id: string | null;
        campus: string;
        message: string | null;
        status: string;
        created_at: Date;
      }>
    >`
      SELECT id, full_name, phone, email, course_id, dual_course_id, campus,
             message, status, created_at
      FROM public.enquiries
      ORDER BY created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      courseId: row.course_id,
      dualCourseId: row.dual_course_id,
      campus: row.campus,
      message: row.message,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  },
);

export const setEnquiryStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "contacted", "enrolled", "closed"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();

    await db()`
      UPDATE public.enquiries SET status = ${data.status} WHERE id = ${data.id}
    `;
    return { ok: true as const };
  });

export const setFees = createServerFn({ method: "POST" })
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
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();

    if (data.kind === "course") {
      await sql`
        UPDATE public.courses SET fee = ${data.fee}, deposit = ${data.deposit}
        WHERE id = ${data.id}
      `;
    } else {
      await sql`
        UPDATE public.dual_courses SET fee = ${data.fee}, deposit = ${data.deposit}
        WHERE id = ${data.id}
      `;
    }
    return { ok: true as const };
  });
