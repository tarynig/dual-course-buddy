import { createFileRoute } from "@tanstack/react-router";

// PayFast calls this after every payment (its "ITN"). Nothing is trusted until
// the signature checks out and PayFast confirms the notification itself.
export const Route = createFileRoute("/api/public/payfast/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyNotification } = await import("@/lib/payfast.server");
        const data = await verifyNotification(await request.text());
        if (!data) return new Response("invalid", { status: 400 });

        const id = data["m_payment_id"] ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("ok");

        const { db } = await import("@/lib/db.server");
        const sql = db();
        const rows = await sql<Array<{ amount: string; status: string; item_name: string; full_name: string; email: string; phone: string; plan_name: string | null }>>`
          SELECT amount::text AS amount, status, item_name, full_name, email, phone, plan_name
          FROM public.deposit_payments WHERE id = ${id}`;
        const payment = rows[0];
        if (!payment || payment.status === "paid") return new Response("ok");

        const gross = Number(data["amount_gross"]);
        const state = data["payment_status"];
        let status = "failed";
        if (state === "COMPLETE" && Math.abs(gross - Number(payment.amount)) < 0.01) status = "paid";
        else if (state === "CANCELLED") status = "cancelled";

        await sql`
          UPDATE public.deposit_payments
          SET status = ${status}, provider_ref = ${data["pf_payment_id"] ?? null},
              amount_paid = ${Number.isFinite(gross) ? gross : null},
              paid_at = ${status === "paid" ? new Date() : null}
          WHERE id = ${id}`;

        if (status === "paid") {
          const { sendMail, teamRecipients } = await import("@/lib/mail.server");
          const { depositEmails } = await import("@/lib/emails/deposit-emails");
          const mails = depositEmails({ ...payment, amount: Number(payment.amount), reference: id.slice(0, 8).toUpperCase() });
          await Promise.allSettled([
            ...teamRecipients().map((to) => sendMail({ to, ...mails.team })),
            sendMail({ to: payment.email, ...mails.student }),
          ]);
        }
        return new Response("ok");
      },
    },
  },
});
