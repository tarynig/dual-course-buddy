import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { changePassword, signOut } from "@/lib/auth.functions";
import {
  getAdminEnquiries,
  getAdminSession,
  sendTestEmail,
  setEnquiryStatus,
} from "@/lib/admin.functions";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { FeesPanel } from "@/components/admin-fees";
import { CoursesContentPanel, DualsContentPanel } from "@/components/admin-content";
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
const TABS = ["enquiries", "courses", "dual courses", "fees", "account"] as const;

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
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
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

          <div className="mt-8">
            {tab === "enquiries" && <EnquiriesPanel />}
            {tab === "courses" && <CoursesContentPanel />}
            {tab === "dual courses" && <DualsContentPanel />}
            {tab === "fees" && <FeesPanel />}
            {tab === "account" && (
              <div className="space-y-12">
                <AccountPanel />
                <EmailPanel />
              </div>
            )}
          </div>
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

function AccountPanel() {
  const update = useServerFn(changePassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const result = await update({ data: { currentPassword, newPassword } });
      if (!result.ok) return setError(result.error);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch {
      setError("Couldn't update your password. Please try again.");
    }
  }

  return (
    <section className="max-w-md">
      <h2 className="font-display text-xl font-black">Change your password</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Use at least 10 characters. You'll stay signed in on this device.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground">
          Current password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground">
          New password
          <input
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
          />
        </label>
        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        {message && <p className="text-sm font-semibold text-primary">{message}</p>}
        <button
          type="submit"
          className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground"
        >
          Update password
        </button>
      </form>
    </section>
  );
}

function EmailPanel() {
  const sendSample = useServerFn(sendTestEmail);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSend() {
    setState("sending");
    setError("");
    try {
      const result = await sendSample({});
      if (result.ok) {
        setState("sent");
        return;
      }
      setError(result.error);
      setState("error");
    } catch {
      setError("Couldn't reach the mail server. Please try again.");
      setState("error");
    }
  }

  return (
    <section className="max-w-md">
      <h2 className="font-display text-xl font-black">Enquiry emails</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Each enquiry is emailed to the admissions inbox and confirmed back to the applicant.
        Send yourself a sample to check the settings and see exactly what arrives.
      </p>
      <button
        type="button"
        onClick={handleSend}
        disabled={state === "sending"}
        className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send me a sample enquiry email"}
      </button>
      {state === "sent" && (
        <p className="mt-3 text-sm font-semibold text-primary">
          Sample sent — check your inbox.
        </p>
      )}
      {state === "error" && (
        <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>
      )}
    </section>
  );
}
