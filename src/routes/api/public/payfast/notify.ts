import { createFileRoute } from "@tanstack/react-router";
import { callData } from "@/lib/data.server";

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

        const payment = await callData<{
          amount: number;
          status: string;
          itemName: string;
          fullName: string;
          email: string;
          phone: string;
          planName: string | null;
          paymentKind: string;
        } | null>("app_payment_record", { id });
        if (!payment || payment.status === "paid") return new Response("ok");

        const gross = Number(data["amount_gross"]);
        const state = data["payment_status"];
        let status = "failed";
        if (state === "COMPLETE" && Math.abs(gross - Number(payment.amount)) < 0.01) status = "paid";
        else if (state === "CANCELLED") status = "cancelled";

        await callData("app_apply_payment_result", {
          id,
          status,
          providerRef: data["pf_payment_id"] ?? "",
          amountPaid: Number.isFinite(gross) ? String(gross) : "",
          paidAt: status === "paid" ? new Date().toISOString() : "",
        });

        if (status === "paid") {
          const { sendMail, teamRecipients } = await import("@/lib/mail.server");
          const { depositEmails } = await import("@/lib/emails/deposit-emails");
          const mails = depositEmails({
            reference: id.slice(0, 8).toUpperCase(),
            item_name: payment.itemName,
            plan_name: payment.planName,
            amount: Number(payment.amount),
            full_name: payment.fullName,
            email: payment.email,
            phone: payment.phone,
            payment_kind: payment.paymentKind,
          });
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
