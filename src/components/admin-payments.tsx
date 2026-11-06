import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatZar } from "@/data/courses";
import { getAdminPayments } from "@/lib/payments.functions";

const BADGE: Record<string, string> = {
  paid: "bg-accent text-accent-foreground",
  pending: "bg-gold text-gold-foreground",
  failed: "bg-destructive text-destructive-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function PaymentsPanel() {
  const fetchPayments = useServerFn(getAdminPayments);
  const q = useQuery({ queryKey: ["admin-payments"], queryFn: () => fetchPayments() });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error) return <p className="text-sm text-destructive">Couldn't load payments.</p>;
  if (!q.data?.length)
    return <p className="text-sm text-muted-foreground">No deposit payments yet. They appear here as soon as a student starts paying online.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        "Pending" means the student opened PayFast but it hasn't confirmed payment (yet). Only "paid" deposits have been received.
      </p>
      {q.data.map((p) => (
        <article key={p.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border p-5">
          <div className="text-sm">
            <p className="font-bold">{p.fullName}</p>
            <p>
              <a href={`mailto:${p.email}`} className="text-primary underline">{p.email}</a> ·{" "}
              <a href={`tel:${p.phone}`} className="text-primary underline">{p.phone}</a>
            </p>
            <p className="mt-2">{p.itemName}</p>
            <p className="text-muted-foreground">{p.planName ?? ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ref {p.id.slice(0, 8).toUpperCase()} · started {new Date(p.createdAt).toLocaleString("en-ZA")}
              {p.paidAt && ` · paid ${new Date(p.paidAt).toLocaleString("en-ZA")}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-black">{formatZar(p.amount)}</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${BADGE[p.status] ?? BADGE["cancelled"]}`}>
              {p.status}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
