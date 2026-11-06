import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FacultyBar } from "@/components/brochure-visuals";
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { submitApplication } from "@/lib/applications.functions";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply for 2027 | Creative Arts College" },
      { name: "description", content: "Apply online for a 2027 course or dual course at Creative Arts College, Durban and Pietermaritzburg." },
      { property: "og:title", content: "Apply for 2027 | Creative Arts College" },
      { property: "og:description", content: "Complete your Creative Arts College application online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ course: typeof s["course"] === "string" ? s["course"] : undefined }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  errorComponent: ({ error }) => <CatalogueError error={error} />,
  notFoundComponent: () => <CatalogueNotFound />,
  component: ApplyPage,
});

const input = "mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm";

function Field({ label, name, type = "text", required = true, className = "" }: { label: string; name: string; type?: string; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-bold">{label}{required && " *"}</label>
      <input id={name} name={name} type={type} required={required} className={input} />
    </div>
  );
}

function Choice({ label, name, options, onChange }: { label: string; name: string; options: string[]; onChange?: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">{label} *</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input type="radio" name={name} value={o} required onChange={() => onChange?.(o)} className="accent-primary" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ApplyPage() {
  const { data: catalogue } = useSuspenseQuery(catalogueQueryOptions);
  const { course } = Route.useSearch();
  const submit = useServerFn(submitApplication);
  const [elsewhere, setElsewhere] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "sending" | "error"; message?: string } | { status: "sent"; reference: string }>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const opt = (k: string) => g(k) || null;
    setState({ status: "sending" });
    try {
      const result = await submit({
        data: {
          interest: opt("interest"),
          firstName: g("firstName"), lastName: g("lastName"), idNumber: g("idNumber"),
          dateOfBirth: g("dateOfBirth"), gender: g("gender") as "Female", homeLanguage: g("homeLanguage"),
          location: g("location") as "Pietermaritzburg", email: g("email"), cell: g("cell"),
          lastSchool: g("lastSchool"), highestGrade: g("highestGrade"), gradeYear: Number(g("gradeYear")),
          currentGrade: opt("currentGrade"), studiedElsewhere: elsewhere ? "yes" : "no",
          institutionName: opt("institutionName"), institutionQualification: opt("institutionQualification"),
          institutionCompleted: (opt("institutionCompleted") as "yes" | "no" | null),
          payerFirstName: g("payerFirstName"), payerLastName: g("payerLastName"), payerPhone: g("payerPhone"),
          payerEmail: g("payerEmail"), payerIdNumber: g("payerIdNumber"), payerRelationship: g("payerRelationship"),
          payerAddress: g("payerAddress"), payerEmployment: g("payerEmployment") as "Employed",
        },
      });
      if (result.ok) {
        setState({ status: "sent", reference: result.reference });
        window.scrollTo({ top: 0 });
      } else setState({ status: "error", message: result.error });
    } catch {
      setState({ status: "error", message: "Some details look incomplete or invalid — please check the form and try again." });
    }
  }

  if (state.status === "sent")
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl font-black">Application received!</h1>
        <p className="mt-4 text-muted-foreground">
          Your reference is <strong className="text-foreground">{state.reference}</strong>. Our admissions team will review it and be in touch shortly.
        </p>
        <Link to="/courses" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Back to courses</Link>
      </section>
    );

  return (
    <div>
      <section className="surface-deep dot-grid">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-bold tracking-[0.3em] text-secondary uppercase">2027 intake · limited seats</p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">Apply online</h1>
          <p className="mt-4 max-w-2xl text-sm opacity-85 md:text-base">
            Fields marked * are required. Prefer to talk first? <Link to="/contact" className="font-bold text-secondary underline">Send an enquiry</Link>.
          </p>
        </div>
      </section>

      <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-12 px-5 py-14">
        <div>
          <label htmlFor="interest" className="text-sm font-bold">Course you're applying for</label>
          <select id="interest" name="interest" defaultValue={course ?? ""} className={input}>
            <option value="">Not sure yet</option>
            <optgroup label="Single courses">
              {catalogue.courses.map((c) => <option key={c.id} value={`course:${c.id}`}>{c.name}</option>)}
            </optgroup>
            <optgroup label="Dual courses">
              {catalogue.duals.map((d) => <option key={d.id} value={`dual:${d.id}`}>{d.title}</option>)}
            </optgroup>
          </select>
        </div>

        <section>
          <FacultyBar title="The applicant" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="First name" name="firstName" />
            <Field label="Last name" name="lastName" />
            <Field label="ID number" name="idNumber" />
            <Field label="Date of birth" name="dateOfBirth" type="date" />
            <Choice label="Gender" name="gender" options={["Female", "Male"]} />
            <Field label="Home language" name="homeLanguage" />
            <Choice label="Location" name="location" options={["Durban/Musgrave", "Pietermaritzburg"]} />
            <div />
            <Field label="Email" name="email" type="email" />
            <Field label="Cell number" name="cell" type="tel" />
          </div>
        </section>

        <section>
          <FacultyBar title="Applicant's education" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Last school attended" name="lastSchool" className="sm:col-span-2" />
            <Field label="Highest grade passed" name="highestGrade" />
            <Field label="Year" name="gradeYear" type="number" />
            <Field label="Current grade (optional)" name="currentGrade" required={false} />
            <div />
            <Choice label="Studied at another institution?" name="studiedElsewhere" options={["Yes", "No"]} onChange={(v) => setElsewhere(v === "Yes")} />
            <div />
            {elsewhere && (
              <>
                <Field label="Name of institution" name="institutionName" />
                <Field label="Qualification" name="institutionQualification" />
                <fieldset>
                  <legend className="text-sm font-bold">Completed? *</legend>
                  <div className="mt-2 flex gap-2">
                    {["yes", "no"].map((v) => (
                      <label key={v} className="flex cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-sm capitalize has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                        <input type="radio" name="institutionCompleted" value={v} required className="accent-primary" />
                        {v}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
          </div>
        </section>

        <section>
          <FacultyBar title="Person responsible for payments" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="First name" name="payerFirstName" />
            <Field label="Last name" name="payerLastName" />
            <Field label="Phone" name="payerPhone" type="tel" />
            <Field label="Email address" name="payerEmail" type="email" />
            <Field label="ID number" name="payerIdNumber" />
            <Field label="Relationship" name="payerRelationship" />
            <div className="sm:col-span-2">
              <label htmlFor="payerAddress" className="text-sm font-bold">Address *</label>
              <textarea id="payerAddress" name="payerAddress" required rows={3} className={input} />
            </div>
            <Choice label="Employment status" name="payerEmployment" options={["Employed", "Self-employed", "Funding"]} />
          </div>
        </section>

        {state.status === "error" && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{state.message}</p>
        )}
        <button type="submit" disabled={state.status === "sending"} className="w-full rounded-full bg-primary px-6 py-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {state.status === "sending" ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}
