import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CourseCard } from "@/components/course-cards";
import { courses, faculties, type FacultyId } from "@/data/courses";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses 2027 | Creative Arts College" },
      {
        name: "description",
        content:
          "Browse 30+ accredited SAQA qualifications and skills programmes across audio, film, performance, design, fashion, IT and business.",
      },
      { property: "og:title", content: "Courses 2027 | Creative Arts College" },
      {
        property: "og:description",
        content:
          "Accredited, practical, industry-based courses from 12 to 24 months across seven faculties.",
      },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const [faculty, setFaculty] = useState<FacultyId | "all">("all");
  const [maxMonths, setMaxMonths] = useState(24);

  const filtered = courses.filter(
    (c) => (faculty === "all" || c.faculty === faculty) && c.months <= maxMonths,
  );

  return (
    <div>
      <section className="surface-deep">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-bold tracking-[0.3em] text-secondary uppercase">
            2027 Prospectus
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-black md:text-5xl">
            Every course, one place
          </h1>
          <p className="mt-4 max-w-2xl text-sm opacity-85 md:text-base">
            Accredited qualifications and CAC skills programmes across seven faculties. Each course
            is practical, industry-based and completed in 12 to 24 months.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFaculty("all")}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              faculty === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            All faculties
          </button>
          {faculties.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFaculty(f.id)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                faculty === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <label htmlFor="duration" className="text-sm font-bold">
            Maximum duration
          </label>
          <input
            id="duration"
            type="range"
            min={12}
            max={24}
            step={3}
            value={maxMonths}
            onChange={(e) => setMaxMonths(Number(e.target.value))}
            className="h-2 w-56 cursor-pointer accent-[var(--color-secondary)]"
          />
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            up to {maxMonths} months
          </span>
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} course{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {faculties
          .filter((f) => faculty === "all" || f.id === faculty)
          .map((f) => {
            const list = filtered.filter((c) => c.faculty === f.id);
            if (list.length === 0) return null;
            return (
              <div key={f.id} className="mt-12">
                <h2 className="font-display text-2xl font-black">{f.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.tagline}</p>
                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {list.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              </div>
            );
          })}
      </section>
    </div>
  );
}
