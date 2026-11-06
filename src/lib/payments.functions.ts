import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BOOKING_FEE } from "./booking-fee";

/** Records the global booking fee; no course deposit can be charged online. */
export const startBookingPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseId: z.string().max(80).nullable(),
        dualCourseId: z.string().max(80).nullable(),
        planId: z.string().uuid().nullable(),
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200),
        phone: z.string().trim().max(40).refine((v) => v.replace(/\D/g, "").length >= 6),
      })
      .refine((d) => !!d.courseId !== !!d.dualCourseId)
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { buildCheckout } = await import("./payfast.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const sql = db();

    // Names and plan association come from the database; the fee is global.
    const rows = data.courseId
      ? await sql<Array<{ item: string; plan: string | null }>>`
          SELECT c.name AS item, p.name AS plan FROM public.courses c
          LEFT JOIN public.course_payment_plans l ON l.course_id = c.id AND l.plan_id = ${data.planId}
          LEFT JOIN public.payment_plans p ON p.id = l.plan_id
          WHERE c.id = ${data.courseId} AND c.is_active`
      : await sql<Array<{ item: string; plan: string | null }>>`
          SELECT d.title AS item, p.name AS plan FROM public.dual_courses d
          LEFT JOIN public.dual_payment_plans l ON l.dual_id = d.id AND l.plan_id = ${data.planId}
          LEFT JOIN public.payment_plans p ON p.id = l.plan_id
          WHERE d.id = ${data.dualCourseId} AND d.is_active`;
    const row = rows[0];
    if (!row || (data.planId && !row.plan)) throw new Error("That course or payment plan isn't available.");
    const amount = BOOKING_FEE;

    const inserted = await sql<Array<{ id: string }>>`
      INSERT INTO public.deposit_payments
        (course_id, dual_course_id, plan_id, item_name, plan_name, amount, full_name, email, phone, payment_kind)
      VALUES (${data.courseId}, ${data.dualCourseId}, ${data.planId}, ${row.item}, ${row.plan},
              ${amount}, ${data.fullName}, ${data.email.toLowerCase()}, ${data.phone}, 'booking')
      RETURNING id`;

    const siteUrl = (process.env["SITE_URL"] ?? new URL(getRequest().url).origin).replace(/\/$/, "");
    const payment = inserted[0];
    if (!payment) throw new Error("Couldn't record your booking fee.");
    return buildCheckout({
      paymentId: payment.id,
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
  paymentKind: string;
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
         created_at: Date; paid_at: Date | null; payment_kind: string;
      }>
    >`SELECT id, item_name, plan_name, amount::text AS amount, full_name, email, phone, status,
              created_at, paid_at, payment_kind
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
      paymentKind: r.payment_kind,
    }));
  },
);
