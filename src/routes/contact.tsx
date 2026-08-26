import { createFileRoute } from "@tanstack/react-router";
import { contact, courses, dualCourses } from "@/data/courses";

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
  component: ContactPage,
});

function ContactPage() {
  const mailto = (subject: string) =>
    `mailto:info@creativearts.co.za?subject=${encodeURIComponent(subject)}`;

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
        <form
          className="rounded-2xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const body = [...data.entries()]
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n");
            window.location.href = `${mailto("2027 course enquiry")}&body=${encodeURIComponent(body)}`;
          }}
        >
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
                <optgroup label="Dual courses">
                  {dualCourses.map((d) => (
                    <option key={d.id}>{d.title} (dual)</option>
                  ))}
                </optgroup>
                <optgroup label="Individual courses">
                  {courses.map((c) => (
                    <option key={c.id}>{c.name}</option>
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
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Send enquiry
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Registration deposits will be payable online once payments go live.
          </p>
        </form>

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
