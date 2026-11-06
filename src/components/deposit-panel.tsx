import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { formatZar, planTotal, type PaymentPlan } from "@/data/courses";
import { startBookingPayment } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";
import { BOOKING_FEE, BOOKING_TERMS, DIRECT_PAYMENT_TERMS } from "@/lib/booking-fee";

/** Sends the browser to PayFast's hosted payment page with the signed fields from the server. */
export function postToPayFast(checkout: { action: string; fields: [string, string][] }) {
  const out = document.createElement("form");
  out.method = "POST";
  out.action = checkout.action;
  for (const [name, value] of checkout.fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    out.appendChild(input);
  }
  document.body.appendChild(out);
  out.submit();
}

type Props = { plans: PaymentPlan[]; courseId?: string; dualCourseId?: string };

/** Shows the payment plans and lets a student pay the deposit via PayFast, or talk to admissions instead. */
export function DepositPanel({ plans, courseId, dualCourseId }: Props) {
  const start = useServerFn(startBookingPayment);
  const payable = plans;
  const [planId, setPlanId] = useState(payable[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const checkout = await start({
        data: {
          courseId: courseId ?? null,
          dualCourseId: dualCourseId ?? null,
          planId: planId || null,
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
        },
      });
      postToPayFast(checkout);
    } catch {
      setError("We couldn't start the payment. Check your details, or speak to the college admin.");
      setBusy(false);
    }
  }

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm";
  

  return (
    <div className="brochure-frame rounded-3xl p-6">
      <h2 className="font-display text-2xl font-black">Secure your booking</h2>
      {(
        <div className="mt-4">
          <p className="text-sm font-semibold text-muted-foreground">Refundable booking fee</p>
          <p className="mt-1 font-display text-3xl font-black text-primary">{formatZar(BOOKING_FEE)}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {BOOKING_TERMS}
          </p>
        </div>
      )}

      {(
        <form id={`deposit-${courseId ?? dualCourseId}`} onSubmit={onSubmit} className="mt-5 grid gap-3">
          <input name="fullName" aria-label="Full name" required minLength={2} placeholder="Full name" className={field} />
          <input name="email" aria-label="Email" type="email" required placeholder="Email" className={field} />
          <input name="phone" aria-label="Phone" type="tel" required minLength={7} placeholder="Phone" className={field} />
        </form>
      )}

      {plans.length > 0 && <fieldset className="mt-6 border-t border-border pt-5">
      <legend className="pt-5 font-display text-lg font-black">Choose your preferred payment plan</legend>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This is a selection only — you are not paying the plan amount now. The college admin will arrange all deposit and course payments directly with you.
      </p>
      <ul className="mt-4 space-y-3">
        {plans.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary">
              <input
                type="radio"
                name="plan"
                value={p.id}
                checked={planId === p.id}
                onChange={() => setPlanId(p.id)}
                className="mt-1 accent-primary"
              />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-bold">{p.name}</span>
                <span className="text-muted-foreground">
                  After placement confirmation: {p.instalments} × {formatZar(p.instalmentAmount)}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">Deposit arranged with admin: {formatZar(p.deposit)}</span>
                <span className="mt-2 block font-bold text-primary">Total course fee: {formatZar(planTotal(p))}</span>
                {p.notes && <span className="mt-1 block text-xs text-muted-foreground">{p.notes}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      </fieldset>}

      {(
        <div className="mt-6 grid gap-3">
          <p className="text-sm font-semibold">Only the {formatZar(BOOKING_FEE)} booking fee is payable today.</p>
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button
            type="submit"
            form={`deposit-${courseId ?? dualCourseId}`}
            disabled={busy}
            className="h-auto w-full whitespace-normal rounded-full px-5 py-3 text-sm font-bold"
          >
            <LockKeyhole aria-hidden="true" />
            {busy ? "Opening PayFast…" : `Pay ${formatZar(BOOKING_FEE)} booking fee`}
          </Button>
        </div>
      )}
      <p className="mt-4 text-sm text-muted-foreground">{DIRECT_PAYMENT_TERMS}</p>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Prefer to talk first?{" "}
        <Link to="/contact" className="font-bold text-primary underline">Speak to the college admin</Link>
      </p>
    </div>
  );
}
