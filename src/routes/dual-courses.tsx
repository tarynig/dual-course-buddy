import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DualCard } from "@/components/course-cards";
import { FacultyBar, FacultyPhoto } from '@/components/brochure-visuals';
import { Button } from '@/components/ui/button';
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { dualsForCourse, separateMonths } from "@/data/courses";

export const Route = createFileRoute("/dual-courses")({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: "Dual Courses — Two Qualifications, One Timeline | Creative Arts College" },
      {
        name: "description",
        content:
          "Pair two complementary courses at a lower combined rate and finish far sooner than studying them one after the other. Find your pairing.",
      },
      { property: "og:title", content: "Dual Courses | Creative Arts College" },
      {
        property: "og:description",
        content:
          "Strategically paired qualifications at better value and in less time. Use the dual-course finder.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  errorComponent: ({ error }) => <CatalogueError error={error} />,
  notFoundComponent: () => <CatalogueNotFound />,
  component: DualPage,
});

function DualPage() {
  const { data: catalogue } = useSuspenseQuery(catalogueQueryOptions);
  const [selected, setSelected] = useState<string>("");

  const results = useMemo(
    () => (selected ? dualsForCourse(catalogue, selected) : catalogue.duals),
    [catalogue, selected],
  );

  const pairableCourses = catalogue.courses.filter(
    (c) => dualsForCourse(catalogue, c.id).length > 0,
  );

  return (
    <div>
      <section className="surface-deep">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-bold tracking-[0.3em] text-secondary uppercase">
            Greater value · Competitive advantage
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black md:text-5xl">
            Creative Arts College dual courses
          </h1>
          <p className="mt-4 max-w-2xl text-sm opacity-85 md:text-base">
            Our dual programmes strategically pair complementary courses. Because the two run
            alongside each other, you finish significantly faster than doing them back to back —
            and the combined fee is lower than paying for both separately.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="border-b border-border pb-8">
          <h2 className="font-display text-xl font-black">Dual-course finder</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the course you already have in mind and we'll show everything it pairs with.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              aria-label="Choose a course"
              className="min-w-64 rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold"
            >
              <option value="">Show all dual courses</option>
              {catalogue.faculties.map((f) => (
                <optgroup key={f.id} label={f.name}>
                  {pairableCourses
                    .filter((c) => c.faculty === f.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            {selected && (
              <Button variant="outline"
                type="button"
                onClick={() => setSelected("")}
                className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-muted"
              >
                Clear
              </Button>
            )}

            <span className="ml-auto text-sm font-semibold text-muted-foreground">
              {results.length} pairing{results.length === 1 ? "" : "s"}
            </span>
          </div>

          {results.length > 0 && (
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat
                label="Shortest pairing"
                value={`${Math.min(...results.map((d) => d.months))} months`}
              />
              <Stat
                label="Most time saved"
                value={`${Math.max(
                  ...results.map((d) => separateMonths(catalogue.courses, d) - d.months),
                )} months`}
              />
              <Stat label="Qualifications earned" value="2 per pairing" />
            </dl>
          )}
        </div>

        {results.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            This course is currently offered on its own. Speak to us about a custom combination.
          </p>
        ) : (
          <div className="mt-10 space-y-12">
            {catalogue.faculties.map(f => {
              const list = results.filter(d => d.faculty === f.id);
              if (!list.length) return null;
              return <section key={f.id} className="border-b border-border pb-12">
                <FacultyBar faculty={f.id} title={f.name} />
                <div className="brochure-faculty-layout mt-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    {list.map((d, index) => <DualCard key={d.id} dual={d} courses={catalogue.courses} number={index + 1} />)}
                  </div>
                  <FacultyPhoto faculty={f.id} />
                </div>
              </section>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-display text-xl font-black text-primary">{value}</dd>
    </div>
  );
}
