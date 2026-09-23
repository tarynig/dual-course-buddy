import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { submitEnquiry } from "@/lib/catalogue.functions";
import { contact } from "@/data/courses";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Apply & Enquire — Limited Seats | Creative Arts College" },
      {
        name: "description",
        content:
          "Reserve your 2027 seat at Creative Arts College. Durban and Pietermaritzburg campuses — call us or send an enquiry for the full fee sheet.",
      },
      { property: "og:title", content: "Apply & Enquire | Creative Arts College" },
      {
        property: "og:description",
        content: "Limited seats for 2027. Speak to an advisor about courses, dual courses and fees.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  errorComponent: ({ error }) => <CatalogueError error={error} />,
  notFoundComponent: () => <CatalogueNotFound />,
  component: ContactPage,
});

function ContactPage() {
  const { data: catalogue } = useSuspenseQuery(catalogueQueryOptions);
  const submitFn = useServerFn(submitEnquiry);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const interest = String(data.get("interest") ?? "");
    const [kind, id] = interest.includes(":") ? interest.split(":") : ["", ""];

    setStatus("sending");
    const result = await submitFn({
      data: {
        fullName: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        email: String(data.get("email") ?? ""),
        courseId: kind === "course" ? id : null,
        dualCourseId: kind === "dual" ? id : null,
        campus: String(data.get("campus") ?? ""),
        message: String(data.get("message") ?? "") || null,
      },
    });

    if (result.ok) {
      setStatus("sent");
      form.reset();
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  };

  return (
    <div>
      <section className="surface-deep dot-grid">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-bold tracking-[0.3em] text-secondary uppercase">
            Limited seats
          </p>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">
            Apply for 2027
          </h1>
          <p className="mt-4 max-w-2xl text-sm opacity-85 md:text-base">
            Tell us which course or dual course you're after and an advisor will come back to you
            with the fee sheet, intake dates and registration deposit.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-14 lg:grid-cols-[1.1fr_0.9fr]">
        {status === "sent" ? (
          <div className="flex flex-col items-start justify-center rounded-2xl border-2 border-secondary bg-card p-8">
            <h2 className="font-display text-2xl font-black text-primary">
              Enquiry received
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Thank you — an advisor will contact you with the fee sheet, intake dates and
              registration deposit. If you'd like to speak to someone sooner, call us on{" "}
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="font-bold text-secondary">
                {contact.phone}
              </a>
              .
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-6 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              Send another enquiry
            </button>
          </div>
        ) : (
          <form className="rounded-2xl border border-border bg-card p-6" onSubmit={onSubmit}>
            <h2 className="font-display text-xl font-black">Enquiry</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" required />
              <Field label="Mobile number" name="phone" type="tel" required />
              <Field label="Email address" name="email" type="email" required className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <label htmlFor="interest" className="text-sm font-bold">
                  Course of interest
                </label>
                <select
                  id="interest"
                  name="interest"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                >
                  <option value="">Not sure yet</option>
                  <optgroup label="Dual courses">
                    {catalogue.duals.map((d) => (
                      <option key={d.id} value={`dual:${d.id}`}>
                        {d.title} (dual)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Individual courses">
                    {catalogue.courses.map((c) => (
                      <option key={c.id} value={`course:${c.id}`}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="campus" className="text-sm font-bold">
                  Preferred campus
                </label>
                <select
                  id="campus"
                  name="campus"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                >
                  {contact.campuses.map((c) => (
                    <option key={c.city}>{c.city}</option>
                  ))}
                  <option>Blended / online</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className="text-sm font-bold">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                />
              </div>
            </div>
            {status === "error" && (
              <p className="mt-4 rounded-xl bg-gold/20 px-4 py-3 text-sm font-semibold text-gold-foreground">
                {errorMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send enquiry"}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Registration deposits will be payable online once payments go live.
            </p>
          </form>
        )}

        <div className="space-y-5">
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-70">Call us</p>
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="mt-2 block font-display text-3xl font-black"
            >
              {contact.phone}
            </a>
            <p className="mt-2 text-sm opacity-80">{contact.website}</p>
          </div>

          {contact.campuses.map((c) => (
            <div key={c.city} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-black">{c.city}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.address}</p>
              <a
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                className="mt-2 inline-block text-sm font-bold text-secondary"
              >
                {c.phone}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-bold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
      />
    </div>
  );
}
