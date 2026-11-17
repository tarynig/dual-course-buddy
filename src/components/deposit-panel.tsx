import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { formatZar, publicPlanName, type PaymentPlan } from "@/data/courses";
import { startBookingPayment } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";
import { BOOKING_TERMS, DIRECT_PAYMENT_TERMS } from "@/lib/booking-fee";

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

/** Course-page panel: pick a payment option, then register (apply flow) or just book with basic details. */
export function DepositPanel({ plans, courseId, dualCourseId }: Props) {
  const start = useServerFn(startBookingPayment);
  const BOOKING_FEE = useQuery(catalogueQueryOptions).data?.bookingFee ?? 500;
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [bookOnly, setBookOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interest = courseId ? `course:${courseId}` : `dual:${dualCourseId}`;

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
      <h2 className="font-display text-2xl font-black">Register now</h2>

      {plans.length > 0 && (
        <fieldset className="mt-4">
          <legend className="font-display text-lg font-black">Choose your payment option</legend>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pick the option that suits you best — you can pay the Due now amount online when you register.
          </p>
          <ul className="mt-4 space-y-3">
            {plans.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary">
                  <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => setPlanId(p.id)} className="mt-1 accent-primary" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-bold">{publicPlanName(p.name)}</span>
                    {p.instalments > 1 ? (
                      <>
                        <span className="font-bold text-primary">Due now: {formatZar(p.deposit)}</span>
                        <span className="mt-1 block text-muted-foreground">Due after deposit: {p.instalments} × {formatZar(p.instalmentAmount)} pm</span>
                      </>
                    ) : (
                      <span className="font-bold text-primary">Due now: {formatZar(p.instalmentAmount)}</span>
                    )}
                    {p.notes && <span className="mt-1 block text-xs text-muted-foreground">{p.notes}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <Button asChild className="mt-6 h-auto w-full whitespace-normal rounded-full px-5 py-3 text-sm font-bold">
        <Link to="/apply" search={{ course: interest, plan: planId || undefined }}>Continue to register</Link>
      </Button>

      <div className="mt-6 border-t border-border pt-5">
        <p className="font-display text-lg font-black">Not ready to register?</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Book your spot with a {formatZar(BOOKING_FEE)} booking fee — just your name, email and phone. {BOOKING_TERMS}
        </p>
        {!bookOnly ? (
          <Button type="button" variant="outline" onClick={() => setBookOnly(true)} className="mt-4 h-auto w-full whitespace-normal rounded-full px-5 py-3 text-sm font-bold">
            Just book my spot
          </Button>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 grid gap-3">
            <input name="fullName" aria-label="Full name" required minLength={2} placeholder="Full name" className={field} />
            <input name="email" aria-label="Email" type="email" required placeholder="Email" className={field} />
            <input name="phone" aria-label="Phone" type="tel" required minLength={6} placeholder="Phone" className={field} />
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-auto w-full whitespace-normal rounded-full px-5 py-3 text-sm font-bold">
              <LockKeyhole aria-hidden="true" />
              {busy ? "Opening PayFast…" : `Pay ${formatZar(BOOKING_FEE)} booking fee`}
            </Button>
          </form>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{DIRECT_PAYMENT_TERMS}</p>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Prefer to talk first?{" "}
        <Link to="/contact" className="font-bold text-primary underline">Speak to the college admin</Link>
      </p>
    </div>
  );
}
