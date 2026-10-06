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

const money = z.number().min(0).max(10000000);

export const savePlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable(),
        name: z.string().trim().min(2).max(120),
        deposit: money,
        instalments: z.number().int().min(1).max(60),
        instalmentAmount: money,
        notes: z.string().trim().max(500).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();
    const notes = data.notes || null;
    if (data.id) {
      await sql`
        UPDATE public.payment_plans SET name = ${data.name}, deposit = ${data.deposit},
          instalments = ${data.instalments}, instalment_amount = ${data.instalmentAmount},
          notes = ${notes}
        WHERE id = ${data.id}
      `;
    } else {
      await sql`
        INSERT INTO public.payment_plans (name, deposit, instalments, instalment_amount, notes, sort_order)
        VALUES (${data.name}, ${data.deposit}, ${data.instalments}, ${data.instalmentAmount}, ${notes},
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.payment_plans))
      `;
    }
    return { ok: true as const };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    await db()`DELETE FROM public.payment_plans WHERE id = ${data.id}`;
    return { ok: true as const };
  });

/** Chooses which plans a course or dual course offers (and, for duals, the saving). */
export const setItemPlans = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["course", "dual"]),
        id: z.string().min(1).max(80),
        planIds: z.array(z.string().uuid()).max(50),
        saving: money.nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();
    await sql.begin(async (tx) => {
      if (data.kind === "course") {
        await tx`DELETE FROM public.course_payment_plans WHERE course_id = ${data.id}`;
        for (const planId of data.planIds)
          await tx`INSERT INTO public.course_payment_plans (course_id, plan_id) VALUES (${data.id}, ${planId})`;
      } else {
        await tx`DELETE FROM public.dual_payment_plans WHERE dual_id = ${data.id}`;
        for (const planId of data.planIds)
          await tx`INSERT INTO public.dual_payment_plans (dual_id, plan_id) VALUES (${data.id}, ${planId})`;
        await tx`UPDATE public.dual_courses SET saving = ${data.saving ?? null} WHERE id = ${data.id}`;
      }
    });
    return { ok: true as const };
  });

/** Sends the admissions notification template to the signed-in admin's own inbox. */
export const sendTestEmail = createServerFn({ method: "POST" }).handler(
  async () => {
    const { requireAdmin } = await import("./session.server");
    const user = await requireAdmin();
    const { mailConfigured, sendMail } = await import("./mail.server");
    const { teamEnquiryEmail } = await import("./emails/enquiry-emails");

    if (!mailConfigured()) {
      return {
        ok: false as const,
        error:
          "Mail isn't set up on this server yet — the mail account settings are missing.",
      };
    }

    const sample = {
      reference: "SAMPLE01",
      fullName: "Jane Learner",
      email: "jane.learner@example.com",
      phone: "082 555 0134",
      campus: "Durban",
      interest: "Dual: Graphic Design + Photography",
      message: "This is a sample message so you can see how a real enquiry will look.",
      receivedAt: new Date(),
    };

    const result = await sendMail({ to: user.email, ...teamEnquiryEmail(sample) });

    if (!result.sent) {
      return {
        ok: false as const,
        error:
          result.reason === "not_configured"
            ? "Mail isn't set up on this server yet — the mail account settings are missing."
            : "The mail server refused the message — please check the mail account settings.",
      };
    }

    return { ok: true as const };
  },
);
