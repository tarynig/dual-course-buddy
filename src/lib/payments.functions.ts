import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Records a pending deposit and returns the form the browser posts to PayFast. */
export const startDepositPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseId: z.string().max(80).nullable(),
        dualCourseId: z.string().max(80).nullable(),
        planId: z.string().uuid(),
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200),
        phone: z.string().trim().min(7).max(30),
      })
      .refine((d) => !!d.courseId !== !!d.dualCourseId)
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { buildCheckout } = await import("./payfast.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const sql = db();

    // Amount and names always come from the database, never the browser.
    const rows = data.courseId
      ? await sql<Array<{ item: string; plan: string; deposit: string }>>`
          SELECT c.name AS item, p.name AS plan, p.deposit::text AS deposit
          FROM public.course_payment_plans l
          JOIN public.courses c ON c.id = l.course_id AND c.is_active
          JOIN public.payment_plans p ON p.id = l.plan_id
          WHERE l.course_id = ${data.courseId} AND l.plan_id = ${data.planId}`
      : await sql<Array<{ item: string; plan: string; deposit: string }>>`
          SELECT d.title AS item, p.name AS plan, p.deposit::text AS deposit
          FROM public.dual_payment_plans l
          JOIN public.dual_courses d ON d.id = l.dual_id AND d.is_active
          JOIN public.payment_plans p ON p.id = l.plan_id
          WHERE l.dual_id = ${data.dualCourseId} AND l.plan_id = ${data.planId}`;
    const row = rows[0];
    if (!row) throw new Error("That payment plan isn't available for this course.");
    const amount = Number(row.deposit);
    if (!(amount > 0)) throw new Error("This plan has no deposit to pay online.");

    const inserted = await sql<Array<{ id: string }>>`
      INSERT INTO public.deposit_payments
        (course_id, dual_course_id, plan_id, item_name, plan_name, amount, full_name, email, phone)
      VALUES (${data.courseId}, ${data.dualCourseId}, ${data.planId}, ${row.item}, ${row.plan},
              ${amount}, ${data.fullName}, ${data.email.toLowerCase()}, ${data.phone})
      RETURNING id`;

    const siteUrl = (process.env["SITE_URL"] ?? new URL(getRequest().url).origin).replace(/\/$/, "");
    return buildCheckout({
      paymentId: inserted[0]!.id,
      amount,
      itemName: row.item,
      fullName: data.fullName,
      email: data.email,
      siteUrl,
    });
  });

export type AdminPayment = {
  id: string;
  itemName: string;
  planName: string | null;
  amount: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
};

export const getAdminPayments = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<AdminPayment>> => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const rows = await db()<
      Array<{
        id: string; item_name: string; plan_name: string | null; amount: string;
        full_name: string; email: string; phone: string; status: string;
        created_at: Date; paid_at: Date | null;
      }>
    >`SELECT id, item_name, plan_name, amount::text AS amount, full_name, email, phone, status,
             created_at, paid_at
      FROM public.deposit_payments ORDER BY created_at DESC LIMIT 300`;
    return rows.map((r) => ({
      id: r.id,
      itemName: r.item_name,
      planName: r.plan_name,
      amount: Number(r.amount),
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : null,
    }));
  },
);
