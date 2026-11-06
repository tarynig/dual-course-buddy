import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { formatZar, planTotal, type PaymentPlan } from "@/data/courses";
import { startDepositPayment } from "@/lib/payments.functions";

type Props = { plans: PaymentPlan[]; courseId?: string; dualCourseId?: string };

/** Shows the payment plans and lets a student pay the deposit via PayFast, or talk to admissions instead. */
export function DepositPanel({ plans, courseId, dualCourseId }: Props) {
  const start = useServerFn(startDepositPayment);
  const payable = plans.filter((p) => p.deposit > 0);
  const [planId, setPlanId] = useState(payable[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plans.length) return null;

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
          planId,
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
        },
      });
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
    } catch {
      setError("We couldn't start the payment. Check your details, or speak to the college admin.");
      setBusy(false);
    }
  }

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm";

  return (
    <div className="brochure-frame rounded-3xl p-6">
      <h2 className="font-display text-2xl font-black">Fees & payment plans</h2>
      <ul className="mt-4 space-y-3">
        {plans.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 has-[:checked]:border-primary">
              <input
                type="radio"
                name="plan"
                value={p.id}
                checked={planId === p.id}
                disabled={p.deposit <= 0}
                onChange={() => setPlanId(p.id)}
                className="mt-1 accent-primary"
              />
              <span className="flex-1 text-sm">
                <span className="block font-bold">{p.name}</span>
                <span className="text-muted-foreground">
                  {formatZar(p.deposit)} deposit + {p.instalments} × {formatZar(p.instalmentAmount)}
                </span>
                {p.notes && <span className="mt-1 block text-xs text-muted-foreground">{p.notes}</span>}
              </span>
              <span className="font-display font-black text-primary">{formatZar(planTotal(p))}</span>
            </label>
          </li>
        ))}
      </ul>

      {payable.length > 0 && (
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <p className="text-sm font-semibold">Secure your place — pay the deposit online with PayFast</p>
          <input name="fullName" required minLength={2} placeholder="Full name" className={field} />
          <input name="email" type="email" required placeholder="Email" className={field} />
          <input name="phone" type="tel" required minLength={7} placeholder="Phone" className={field} />
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy || !planId}
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Opening PayFast…" : `Pay ${formatZar(payable.find((p) => p.id === planId)?.deposit ?? 0)} deposit`}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Prefer to talk first?{" "}
        <Link to="/contact" className="font-bold text-primary underline">Speak to the college admin</Link>
      </p>
    </div>
  );
}
