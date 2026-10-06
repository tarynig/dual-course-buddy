import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { deletePlan, savePlan, setItemPlans } from "@/lib/admin.functions";
import { formatZar, fromPrice, planTotal, type PaymentPlan } from "@/data/courses";

const field =
  "mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground";
const label = "block text-xs font-bold tracking-widest uppercase text-muted-foreground";

export function FeesPanel() {
  const catalogue = useQuery(catalogueQueryOptions);
  const [editing, setEditing] = useState<PaymentPlan | "new" | null>(null);

  if (catalogue.isLoading || !catalogue.data)
    return <p className="text-sm text-muted-foreground">Loading fees…</p>;
  const { plans, courses, duals } = catalogue.data;

  if (editing) return <PlanForm plan={editing === "new" ? null : editing} onDone={() => setEditing(null)} />;

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-black">Payment plans</h2>
            <p className="text-sm text-muted-foreground">
              Amounts live on the plan. Then tick which plans each course offers below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
          >
            Add plan
          </button>
        </div>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {plans.length === 0 && <p className="p-4 text-sm text-muted-foreground">No plans yet.</p>}
          {plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{describePlan(p)}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-black">Dual courses</h2>
        <div className="mt-4 space-y-3">
          {duals.map((d) => (
            <AssignRow key={d.id} kind="dual" id={d.id} title={d.title} chosen={d.plans} plans={plans} saving={d.saving} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-black">Single courses</h2>
        <div className="mt-4 space-y-3">
          {courses.map((c) => (
            <AssignRow key={c.id} kind="course" id={c.id} title={c.name} chosen={c.plans} plans={plans} />
          ))}
        </div>
      </section>
    </div>
  );
}

function describePlan(p: PaymentPlan) {
  const parts = [];
  if (p.deposit > 0) parts.push(`${formatZar(p.deposit)} deposit`);
  parts.push(
    p.instalments === 1
      ? `${formatZar(p.instalmentAmount)} once-off`
      : `${p.instalments} × ${formatZar(p.instalmentAmount)}`,
  );
  return `${parts.join(" + ")} · total ${formatZar(planTotal(p))}`;
}

function AssignRow({
  kind,
  id,
  title,
  chosen,
  plans,
  saving,
}: {
  kind: "course" | "dual";
  id: string;
  title: string;
  chosen: PaymentPlan[];
  plans: PaymentPlan[];
  saving?: number | null;
}) {
  const save = useServerFn(setItemPlans);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(chosen.map((p) => p.id));
  const [savingValue, setSavingValue] = useState(saving == null ? "" : String(saving));
  const [state, setState] = useState<"idle" | "busy" | "saved" | "error">("idle");
  const from = fromPrice(plans.filter((p) => selected.includes(p.id)));

  async function handleSave() {
    setState("busy");
    try {
      await save({
        data: {
          kind,
          id,
          planIds: selected,
          ...(kind === "dual" ? { saving: savingValue.trim() === "" ? null : Number(savingValue) } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["catalogue"] });
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">
          {from === null ? "Shows “Fees on request”" : `Shows “From ${formatZar(from)}”`}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {plans.length === 0 && <span className="text-xs text-muted-foreground">Add a plan first.</span>}
        {plans.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                on ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {on ? "✓ " : ""}
              {p.name}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {kind === "dual" && (
          <label className={label}>
            Save amount (R)
            <input
              type="number"
              min={0}
              value={savingValue}
              onChange={(e) => setSavingValue(e.target.value)}
              className="mt-1 block w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
            />
          </label>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={state === "busy"}
          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          {state === "saved" ? "Saved" : state === "busy" ? "Saving…" : "Save"}
        </button>
        {state === "error" && <span className="text-xs font-semibold text-destructive">Couldn't save.</span>}
      </div>
    </div>
  );
}

function PlanForm({ plan, onDone }: { plan: PaymentPlan | null; onDone: () => void }) {
  const save = useServerFn(savePlan);
  const remove = useServerFn(deletePlan);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    deposit: String(plan?.deposit ?? 0),
    instalments: String(plan?.instalments ?? 1),
    instalmentAmount: String(plan?.instalmentAmount ?? ""),
    notes: plan?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const total =
    (Number(form.deposit) || 0) + (Number(form.instalments) || 0) * (Number(form.instalmentAmount) || 0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          id: plan?.id ?? null,
          name: form.name,
          deposit: Number(form.deposit) || 0,
          instalments: Number(form.instalments),
          instalmentAmount: Number(form.instalmentAmount) || 0,
          notes: form.notes.trim() || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["catalogue"] });
      onDone();
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("permission denied")
          ? "This preview can't change saved records. Saving works on your own server."
          : "Couldn't save. Check the name and amounts are filled in.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!plan || !confirm(`Delete "${plan.name}"? Courses using it will no longer offer it.`)) return;
    await remove({ data: { id: plan.id } });
    await queryClient.invalidateQueries({ queryKey: ["catalogue"] });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <button type="button" onClick={onDone} className="text-sm font-bold text-primary underline">
        ← Back to fees
      </button>
      <h2 className="font-display text-2xl font-black">{plan ? `Edit ${plan.name}` : "Add a payment plan"}</h2>
      <label className={label}>
        Plan name (e.g. “Pay once-off – 12 month course” or “12 monthly payments”)
        <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={field} />
      </label>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className={label}>
          Deposit (R)
          <input type="number" min={0} value={form.deposit} onChange={(e) => set("deposit", e.target.value)} className={field} />
        </label>
        <label className={label}>
          Number of payments
          <input type="number" min={1} max={60} required value={form.instalments} onChange={(e) => set("instalments", e.target.value)} className={field} />
        </label>
        <label className={label}>
          Amount per payment (R)
          <input type="number" min={0} required value={form.instalmentAmount} onChange={(e) => set("instalmentAmount", e.target.value)} className={field} />
        </label>
      </div>
      <p className="text-sm font-semibold">Plan total: {formatZar(total)}</p>
      <label className={label}>
        Notes (optional)
        <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={field} />
      </label>
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "Saving…" : "Save plan"}
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-border px-6 py-2 text-sm font-bold">
          Cancel
        </button>
        {plan && (
          <button type="button" onClick={handleDelete} className="ml-auto text-sm font-bold text-destructive underline">
            Delete plan
          </button>
        )}
      </div>
    </form>
  );
}
