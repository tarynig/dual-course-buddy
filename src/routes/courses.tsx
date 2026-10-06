import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CourseCard } from "@/components/course-cards";
import { FacultyBar, FacultyPhoto } from '@/components/brochure-visuals';
import { Button } from '@/components/ui/button';
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import type { FacultyId } from "@/data/courses";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
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
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  errorComponent: ({ error }) => <CatalogueError error={error} />,
  notFoundComponent: () => <CatalogueNotFound />,
  component: CoursesPage,
});

function CoursesPage() {
  const { data: catalogue } = useSuspenseQuery(catalogueQueryOptions);
  const [faculty, setFaculty] = useState<FacultyId | "all">("all");
  const [maxMonths, setMaxMonths] = useState(24);

  const filtered = catalogue.courses.filter(
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
            Creative Arts College courses
          </h1>
          <p className="mt-4 max-w-2xl text-sm opacity-85 md:text-base">
            Accredited qualifications and CAC skills programmes across seven faculties. Each course
            is practical, industry-based and completed in 12 to 24 months.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setFaculty("all")}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              faculty === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            All faculties
          </Button>
          {catalogue.faculties.map((f) => (
            <Button
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
            </Button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-border py-5">
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

        {catalogue.faculties
          .filter((f) => faculty === "all" || f.id === faculty)
          .map((f) => {
            const list = filtered.filter((c) => c.faculty === f.id);
            if (list.length === 0) return null;
            return (
              <section key={f.id} className="mt-12 border-b border-border pb-12">
                <FacultyBar faculty={f.id} title={f.name} />
                <p className="mt-4 text-sm text-muted-foreground">{f.tagline}</p>
                <div className="brochure-faculty-layout mt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {list.map((c, index) => (
                      <CourseCard key={c.id} course={c} number={catalogue.courses.filter(course => course.faculty === f.id).findIndex(course => course.id === c.id) + 1} />
                    ))}
                  </div>
                  <FacultyPhoto faculty={f.id} />
                </div>
              </section>
            );
          })}
      </section>
    </div>
  );
}
