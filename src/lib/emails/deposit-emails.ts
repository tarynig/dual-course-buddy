// Messages sent once PayFast confirms a deposit: one to admissions, one receipt to the student.
import { BOOKING_TERMS, DIRECT_PAYMENT_TERMS } from "../booking-fee";
type Paid = {
  reference: string;
  item_name: string;
  plan_name: string | null;
  amount: number;
  full_name: string;
  email: string;
  phone: string;
  payment_kind?: string;
};

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const zar = (n: number) => `R ${n.toFixed(2)}`;

function wrap(title: string, lines: Array<string>) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#29174a;max-width:560px">
<div style="background:#441282;color:#ffffff;padding:18px 22px;font-weight:bold;font-size:18px">${esc(title)}</div>
<div style="padding:18px 22px;border:1px solid #e6e0f2;border-top:4px solid #24a044">
${lines.map((l) => `<p style="margin:0 0 10px">${esc(l)}</p>`).join("")}
</div></div>`;
}

export function depositEmails(p: Paid) {
  const label = p.payment_kind === "booking" ? "Booking fee" : "Deposit";
  const details = [
    `Course: ${p.item_name}`,
    `Payment plan: ${p.plan_name ?? "—"}`,
    `${label} paid: ${zar(p.amount)}`,
    `Reference: ${p.reference}`,
  ];
  const team = [`Student: ${p.full_name}`, `Email: ${p.email}`, `Phone: ${p.phone}`, ...details];
  const student = [
    `Hi ${p.full_name},`,
    `Thank you — we've received your ${label.toLowerCase()} via PayFast.`,
    ...details,
    ...(p.payment_kind === "booking" ? [BOOKING_TERMS, DIRECT_PAYMENT_TERMS] : []),
    "Our admissions team will contact you shortly with the next steps.",
  ];
  return {
    team: {
      subject: `${label} paid: ${p.item_name} — ${p.full_name}`,
      text: team.join("\n"),
      html: wrap(`${label} received`, team),
    },
    student: {
      subject: `Your Creative Arts College ${label.toLowerCase()} receipt`,
      text: student.join("\n"),
      html: wrap(`${label} received`, student),
    },
  };
}
