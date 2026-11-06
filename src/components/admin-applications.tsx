import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminApplications, setApplicationStatus, type AdminApplication } from "@/lib/applications.functions";

const STATUSES = ["new", "contacted", "accepted", "enrolled", "declined"] as const;
const yn = (v: unknown) => (v === true ? "Yes" : v === false ? "No" : "—");
const v = (x: unknown) => (x === null || x === undefined || x === "" ? "—" : String(x));

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{v(value)}</dd>
    </div>
  );
}

export function ApplicationsPanel() {
  const fetchAll = useServerFn(getAdminApplications);
  const update = useServerFn(setApplicationStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchAll() });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error) return <p className="text-sm text-destructive">Couldn't load applications.</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">No applications yet.</p>;

  return (
    <div className="space-y-4">
      {q.data.map((a: AdminApplication) => (
        <details key={a.id} className="rounded-2xl border border-border p-5">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
            <span>
              <span className="font-bold">{v(a["first_name"])} {v(a["last_name"])}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {v(a["item_name"] ?? "Course not chosen")} · {v(a["location"])} · {new Date(a.created_at).toLocaleString("en-ZA")}
              </span>
            </span>
            <select
              value={a.status}
              onClick={(e) => e.stopPropagation()}
              onChange={async (e) => {
                await update({ data: { id: a.id, status: e.target.value as (typeof STATUSES)[number] } });
                qc.invalidateQueries({ queryKey: ["admin-applications"] });
              }}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold capitalize"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </summary>
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <dl className="space-y-1">
              <p className="mb-2 font-display font-black text-primary">Applicant</p>
              <Row label="ID number" value={a["id_number"]} />
              <Row label="Date of birth" value={a["date_of_birth"]} />
              <Row label="Gender" value={a["gender"]} />
              <Row label="Home language" value={a["home_language"]} />
              <Row label="Email" value={a["email"]} />
              <Row label="Cell" value={a["cell"]} />
            </dl>
            <dl className="space-y-1">
              <p className="mb-2 font-display font-black text-primary">Education</p>
              <Row label="Last school" value={a["last_school"]} />
              <Row label="Highest grade" value={a["highest_grade"]} />
              <Row label="Year" value={a["grade_year"]} />
              <Row label="Current grade" value={a["current_grade"]} />
              <Row label="Other institution" value={yn(a["studied_elsewhere"])} />
              {a["studied_elsewhere"] === true && (
                <>
                  <Row label="Institution" value={a["institution_name"]} />
                  <Row label="Qualification" value={a["institution_qualification"]} />
                  <Row label="Completed" value={yn(a["institution_completed"])} />
                </>
              )}
            </dl>
            <dl className="space-y-1">
              <p className="mb-2 font-display font-black text-primary">Responsible for payments</p>
              <Row label="Name" value={`${v(a["payer_first_name"])} ${v(a["payer_last_name"])}`} />
              <Row label="Phone" value={a["payer_phone"]} />
              <Row label="Email" value={a["payer_email"]} />
              <Row label="ID number" value={a["payer_id_number"]} />
              <Row label="Relationship" value={a["payer_relationship"]} />
              <Row label="Address" value={a["payer_address"]} />
              <Row label="Employment" value={a["payer_employment"]} />
            </dl>
          </div>
        </details>
      ))}
    </div>
  );
}
