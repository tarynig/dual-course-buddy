import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { changePassword, signOut } from "@/lib/auth.functions";
import {
  getAdminEnquiries,
  getAdminSession,
  setEnquiryStatus,
  setFees,
} from "@/lib/admin.functions";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { formatZar } from "@/data/courses";
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff dashboard | Creative Arts College" },
      {
        name: "description",
        content: "Manage student enquiries and course fees for Creative Arts College.",
      },
      { property: "og:title", content: "Staff dashboard | Creative Arts College" },
      {
        property: "og:description",
        content: "Internal dashboard for enquiries and course fees.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: CatalogueError,
  notFoundComponent: CatalogueNotFound,
  component: AdminPage,
});

const STATUSES = ["new", "contacted", "enrolled", "closed"] as const;
const TABS = ["enquiries", "fees", "account"] as const;

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("enquiries");

  const fetchSession = useServerFn(getAdminSession);
  const endSession = useServerFn(signOut);
  const session = useQuery({ queryKey: ["admin-session"], queryFn: () => fetchSession() });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await endSession({});
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="surface-deep">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <div>
            <Link to="/" className="text-xs font-bold tracking-[0.3em] text-secondary uppercase">
              Creative Arts College
            </Link>
            <h1 className="mt-1 font-display text-2xl font-black">Staff dashboard</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {session.data?.email && <span className="opacity-70">{session.data.email}</span>}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-white/25 px-4 py-2 text-xs font-bold"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {session.isLoading && (
        <p className="mx-auto max-w-6xl px-5 py-16 text-sm text-muted-foreground">Loading…</p>
      )}

      {session.data && !session.data.isAdmin && (
        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <h2 className="font-display text-2xl font-black">No access yet</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            This account isn't an administrator. Ask an existing admin to grant you access.
          </p>
        </div>
      )}

      {session.data?.isAdmin && (
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex gap-2">
            {(["enquiries", "fees"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-5 py-2 text-sm font-bold capitalize ${
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-8">{tab === "enquiries" ? <EnquiriesPanel /> : <FeesPanel />}</div>
        </div>
      )}
    </div>
  );
}

function EnquiriesPanel() {
  const fetchEnquiries = useServerFn(getAdminEnquiries);
  const updateStatus = useServerFn(setEnquiryStatus);
  const enquiries = useQuery({ queryKey: ["admin-enquiries"], queryFn: () => fetchEnquiries() });
  const catalogue = useQuery(catalogueQueryOptions);
  const queryClient = useQueryClient();

  const label = (courseId: string | null, dualId: string | null) => {
    const data = catalogue.data;
    if (courseId) return data?.courses.find((c) => c.id === courseId)?.name ?? courseId;
    if (dualId) return data?.duals.find((d) => d.id === dualId)?.title ?? dualId;
    return "Not sure yet";
  };

  if (enquiries.isLoading) return <p className="text-sm text-muted-foreground">Loading enquiries…</p>;
  if (enquiries.error)
    return <p className="text-sm text-destructive">Couldn't load enquiries. Please refresh.</p>;
  if (!enquiries.data?.length)
    return <p className="text-sm text-muted-foreground">No enquiries yet.</p>;

  return (
    <div className="space-y-4">
      {enquiries.data.map((e) => (
        <div key={e.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold">{e.fullName}</p>
              <p className="text-sm text-muted-foreground">
                <a href={`mailto:${e.email}`} className="underline">
                  {e.email}
                </a>{" "}
                ·{" "}
                <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="underline">
                  {e.phone}
                </a>
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">{label(e.courseId, e.dualCourseId)}</span> ·{" "}
                {e.campus} campus
              </p>
              {e.message && <p className="mt-2 text-sm text-muted-foreground">{e.message}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleString("en-ZA")}
              </p>
              <select
                value={e.status}
                onChange={async (event) => {
                  await updateStatus({
                    data: { id: e.id, status: event.target.value as (typeof STATUSES)[number] },
                  });
                  queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
                }}
                className="mt-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeesPanel() {
  const catalogue = useQuery(catalogueQueryOptions);
  const save = useServerFn(setFees);
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(
    kind: "course" | "dual",
    id: string,
    fee: string,
    deposit: string,
  ) {
    setError(null);
    try {
      await save({
        data: {
          kind,
          id,
          fee: fee.trim() === "" ? null : Number(fee),
          deposit: deposit.trim() === "" ? null : Number(deposit),
        },
      });
      setSaved(id);
      queryClient.invalidateQueries({ queryKey: ["catalogue"] });
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError("Couldn't save that fee. Please try again.");
    }
  }

  if (catalogue.isLoading) return <p className="text-sm text-muted-foreground">Loading courses…</p>;

  return (
    <div className="space-y-10">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <section>
        <h2 className="font-display text-xl font-black">Dual course fees</h2>
        <div className="mt-4 space-y-3">
          {catalogue.data?.duals.map((d) => (
            <FeeRow
              key={d.id}
              title={d.title}
              fee={d.fee}
              deposit={d.deposit}
              saved={saved === d.id}
              onSave={(fee, deposit) => handleSave("dual", d.id, fee, deposit)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-black">Individual course fees</h2>
        <div className="mt-4 space-y-3">
          {catalogue.data?.courses.map((c) => (
            <FeeRow
              key={c.id}
              title={c.name}
              fee={c.fee}
              deposit={c.deposit}
              saved={saved === c.id}
              onSave={(fee, deposit) => handleSave("course", c.id, fee, deposit)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FeeRow({
  title,
  fee,
  deposit,
  saved,
  onSave,
}: {
  title: string;
  fee: number | null;
  deposit: number | null;
  saved: boolean;
  onSave: (fee: string, deposit: string) => void;
}) {
  const [feeValue, setFeeValue] = useState(fee === null ? "" : String(fee));
  const [depositValue, setDepositValue] = useState(deposit === null ? "" : String(deposit));

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-[14rem] flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">
          Currently {fee === null ? "fees on request" : formatZar(fee)}
        </p>
      </div>
      <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
        Total fee
        <input
          type="number"
          min={0}
          value={feeValue}
          onChange={(e) => setFeeValue(e.target.value)}
          className="mt-1 block w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
        />
      </label>
      <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
        Deposit
        <input
          type="number"
          min={0}
          value={depositValue}
          onChange={(e) => setDepositValue(e.target.value)}
          className="mt-1 block w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
        />
      </label>
      <button
        type="button"
        onClick={() => onSave(feeValue, depositValue)}
        className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
      >
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
