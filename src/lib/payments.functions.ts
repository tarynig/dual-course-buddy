import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BOOKING_FEE } from "./booking-fee";
import { callData } from "./data.server";

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
    const { buildCheckout } = await import("./payfast.server");
    const { getRequest } = await import("@tanstack/react-start/server");

    // Names and plan association come from the database; the fee is global.
    const booking = await callData<{
      ok: boolean;
      id?: string;
      item?: string;
      plan?: string | null;
      error?: string;
    }>("app_start_booking", { ...data, amount: BOOKING_FEE });

    if (!booking?.ok || !booking.id || !booking.item) {
      throw new Error(booking?.error ?? "That course or payment plan isn't available.");
    }

    const siteUrl = (process.env["SITE_URL"] ?? new URL(getRequest().url).origin).replace(/\/$/, "");
    return buildCheckout({
      paymentId: booking.id,
      itemName: booking.item,
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
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    return (await callData<AdminPayment[]>("app_list_payments")) ?? [];
  },
);
