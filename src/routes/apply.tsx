import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FacultyBar } from "@/components/brochure-visuals";
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { submitApplication } from "@/lib/applications.functions";
import { startDepositPayment } from "@/lib/payments.functions";
import { postToPayFast } from "@/components/deposit-panel";
import { formatZar, planTotal } from "@/data/courses";

const STEPS = ["Course", "The applicant", "Education", "Payment contact", "Review & submit"];

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

function Choice({ label, name, options, onChange, required = true }: { label: string; name: string; options: string[]; onChange?: (v: string) => void; required?: boolean }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">{label}{required && " *"}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input type="radio" name={name} value={o} required={required} onChange={() => onChange?.(o)} className="accent-primary" />
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
  const pay = useServerFn(startDepositPayment);
  const [elsewhere, setElsewhere] = useState(false);
  const [step, setStep] = useState(0);
  const [interest, setInterest] = useState(course ?? "");
  const [payNow, setPayNow] = useState(true);
  const [planId, setPlanId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, itemId] = interest.split(":");
  const item = kind === "course" ? catalogue.courses.find((c) => c.id === itemId) : kind === "dual" ? catalogue.duals.find((d) => d.id === itemId) : undefined;
  const payable = (item?.plans ?? []).filter((p) => p.deposit > 0);
  const chosenPlan = payable.find((p) => p.id === planId) ?? payable[0];
  const canPay = payable.length > 0;

  function stepValid(i: number) {
    const box = formRef.current?.querySelector<HTMLElement>(`[data-step="${i}"]`);
    if (!box) return true;
    for (const el of Array.from(box.querySelectorAll<HTMLInputElement>("input,select,textarea"))) {
      if (!el.checkValidity()) { el.reportValidity(); return false; }
    }
    return true;
  }
  function goToField(name: string, message: string) {
    const el = formRef.current?.querySelector<HTMLInputElement>(`[name="${name}"]`);
    const box = el?.closest<HTMLElement>("[data-step]");
    if (!el || !box) return;
    setStep(Number(box.dataset["step"]));
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
      el.setCustomValidity(message);
      el.reportValidity();
      el.addEventListener("input", () => el.setCustomValidity(""), { once: true });
      el.addEventListener("change", () => el.setCustomValidity(""), { once: true });
    }, 50);
  }
  function next() { if (stepValid(step)) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } }
  function back() { setStep(step - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  const [state, setState] = useState<{ status: "idle" | "sending" | "error"; message?: string } | { status: "sent"; reference: string }>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) { next(); return; }
    const bad = Array.from(formRef.current?.querySelectorAll<HTMLInputElement>("input,select,textarea") ?? []).find((el) => !el.checkValidity());
    if (bad) { goToField(bad.name, bad.validationMessage); return; }
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
          lastSchool: opt("lastSchool"), highestGrade: opt("highestGrade"), gradeYear: opt("gradeYear"),
          currentGrade: opt("currentGrade"),
          studiedElsewhere: f.get("studiedElsewhere") ? (g("studiedElsewhere") === "Yes" ? "yes" : "no") : null,
          institutionName: opt("institutionName"), institutionQualification: opt("institutionQualification"),
          institutionCompleted: (opt("institutionCompleted") as "yes" | "no" | null),
          payerFirstName: g("payerFirstName"), payerLastName: g("payerLastName"), payerPhone: g("payerPhone"),
          payerEmail: g("payerEmail"), payerIdNumber: g("payerIdNumber"), payerRelationship: g("payerRelationship"),
          payerAddress: g("payerAddress"), payerEmployment: g("payerEmployment") as "Employed",
        },
      });
      if (result.ok && canPay && payNow && chosenPlan) {
        try {
          const checkout = await pay({
            data: {
              courseId: kind === "course" ? itemId : null,
              dualCourseId: kind === "dual" ? itemId : null,
              planId: chosenPlan.id,
              fullName: `${g("firstName")} ${g("lastName")}`,
              email: g("email"),
              phone: g("cell"),
            },
          });
          postToPayFast(checkout);
          return;
        } catch {
          setState({ status: "sent", reference: result.reference + " — your application is saved, but the deposit payment couldn't start. Please speak to the college admin." });
          return;
        }
      }
      if (result.ok) {
        setState({ status: "sent", reference: result.reference });
        window.scrollTo({ top: 0 });
      } else {
        setState({ status: "error", message: result.error });
        if ("field" in result && result.field) goToField(result.field, result.error);
      }
    } catch {
      setState({ status: "error", message: "We couldn't submit your application just now — please try again, or call us on 081 589 1088." });
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

      <form ref={formRef} noValidate onSubmit={onSubmit} className="mx-auto max-w-4xl px-5 py-14">
        <ol className="mb-10 grid grid-cols-5 gap-2" aria-label="Application steps">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? "step" : undefined}>
              <span className={`block h-2 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`mt-2 hidden text-xs font-bold sm:block ${i === step ? "text-primary" : "text-muted-foreground"}`}>{i + 1}. {label}</span>
            </li>
          ))}
        </ol>
        <p className="mb-6 text-sm font-semibold text-muted-foreground sm:hidden">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        <div data-step="0" hidden={step !== 0}>
          <FacultyBar title="Your course" />
          <label htmlFor="interest" className="mt-6 block text-sm font-bold">Course you're applying for</label>
          <select id="interest" name="interest" value={interest} onChange={(e) => { setInterest(e.target.value); setPlanId(""); }} className={input}>
            <option value="">Not sure yet</option>
            <optgroup label="Single courses">
              {catalogue.courses.map((c) => <option key={c.id} value={`course:${c.id}`}>{c.name}</option>)}
            </optgroup>
            <optgroup label="Dual courses">
              {catalogue.duals.map((d) => <option key={d.id} value={`dual:${d.id}`}>{d.title}</option>)}
            </optgroup>
          </select>
        </div>

        <section data-step="1" hidden={step !== 1}>
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

        <section data-step="2" hidden={step !== 2}>
          <FacultyBar title="Applicant's education" />
          <p className="mt-3 text-sm text-muted-foreground">You can leave any of these blank.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Last school attended" name="lastSchool" required={false} className="sm:col-span-2" />
            <Field label="Highest grade passed" name="highestGrade" required={false} />
            <Field label="Year" name="gradeYear" type="number" required={false} />
            <Field label="Current grade" name="currentGrade" required={false} />
            <div />
            <Choice label="Studied at another institution?" name="studiedElsewhere" options={["Yes", "No"]} required={false} onChange={(v) => setElsewhere(v === "Yes")} />
            <div />
            {elsewhere && (
              <>
                <Field label="Name of institution" name="institutionName" required={false} />
                <Field label="Qualification" name="institutionQualification" required={false} />
                <fieldset>
                  <legend className="text-sm font-bold">Completed?</legend>
                  <div className="mt-2 flex gap-2">
                    {["yes", "no"].map((v) => (
                      <label key={v} className="flex cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-sm capitalize has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                        <input type="radio" name="institutionCompleted" value={v} className="accent-primary" />
                        {v}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
          </div>
        </section>

        <section data-step="3" hidden={step !== 3}>
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

        <section data-step="4" hidden={step !== 4}>
          <FacultyBar title="Review & submit" />
          <p className="mt-6 text-sm text-muted-foreground">
            Applying for: <strong className="text-foreground">{item ? ("name" in item ? item.name : item.title) : "Not sure yet"}</strong>
          </p>
          {canPay ? (
            <div className="brochure-frame mt-6 rounded-3xl p-6">
              <h2 className="font-display text-2xl font-black">Secure your placement</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Optionally pay the upfront deposit now through PayFast. Placement is subject to confirmation by the college.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[true, false].map((v) => (
                  <label key={String(v)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-input p-3 text-sm font-bold has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                    <input type="radio" name="payNow" checked={payNow === v} onChange={() => setPayNow(v)} className="accent-primary" />
                    {v ? `Apply and pay ${formatZar(chosenPlan?.deposit ?? 0)} deposit now` : "Apply only — I'll pay later"}
                  </label>
                ))}
              </div>
              {payNow && (
                <fieldset className="mt-6">
                  <legend className="font-display text-lg font-black">Choose your preferred payment plan</legend>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This is a selection only — you are not paying the plan amount now. Once your placement is confirmed, the college will arrange the remaining payments with you.
                  </p>
                  <ul className="mt-3 space-y-3">
                    {payable.map((p) => (
                      <li key={p.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary">
                          <input type="radio" name="planChoice" checked={chosenPlan?.id === p.id} onChange={() => setPlanId(p.id)} className="mt-1 accent-primary" />
                          <span className="text-sm">
                            <span className="block font-bold">{p.name}</span>
                            <span className="text-muted-foreground">After placement confirmation: {p.instalments} × {formatZar(p.instalmentAmount)}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">Upfront deposit: {formatZar(p.deposit)}</span>
                            <span className="mt-1 block font-bold text-primary">Total course fee: {formatZar(planTotal(p))}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Our admissions team will contact you about fees and securing your placement.</p>
          )}
        </section>

        {state.status === "error" && (
          <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{state.message}</p>
        )}
        <div className="mt-10 flex gap-3">
          {step > 0 && (
            <button type="button" onClick={back} className="rounded-full border border-input px-6 py-4 text-sm font-bold">← Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button key="next" type="button" onClick={next} className="flex-1 rounded-full bg-primary px-6 py-4 text-sm font-bold text-primary-foreground">Continue →</button>
          ) : (
            <button key="submit" type="button" onClick={() => formRef.current?.requestSubmit()} disabled={state.status === "sending"} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {canPay && payNow && <LockKeyhole aria-hidden="true" className="size-4" />}
              {state.status === "sending" ? "Submitting…" : canPay && payNow ? `Submit & pay ${formatZar(chosenPlan?.deposit ?? 0)} deposit` : "Submit application"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
