import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DualCard } from "@/components/course-cards";
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creative Arts College | Where Education & Industry Meet" },
      {
        name: "description",
        content:
          "30+ accredited SAQA qualifications in film, audio, design, fashion, IT and business. Practical, industry-based study in 12–24 months, plus great-value dual courses.",
      },
      { property: "og:title", content: "Creative Arts College | 2027 Prospectus" },
      {
        property: "og:description",
        content:
          "Accredited, practical, industry-owned education in South Africa. Explore courses and money-saving dual programmes for 2027.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  errorComponent: ({ error }) => <CatalogueError error={error} />,
  notFoundComponent: () => <CatalogueNotFound />,
  component: Home,
});

function Home() {
  const { data: catalogue } = useSuspenseQuery(catalogueQueryOptions);

  const featuredDuals = catalogue.duals.filter((d) =>
    ["d-advanced-graphic", "d-film-content", "d-music-dj", "d-fashion-dd"].includes(d.id),
  );

  return (
    <div>
      <section className="surface-deep dot-grid">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-black tracking-[0.2em] text-secondary-foreground uppercase">
              2027 Prospectus
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] font-black text-balance-tight md:text-7xl">
              Where education &amp; industry meet
            </h1>
            <p className="mt-6 max-w-xl text-base opacity-85">
              Creative Arts College is a division of the South African Film Institute Group. Real
              industry, relevant education — 30+ accredited SAQA qualifications completed in 12 to
              24 months, with hands-on work on industry equipment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="rounded-full bg-secondary px-6 py-3 text-sm font-black text-secondary-foreground transition-opacity hover:opacity-90"
              >
                Explore all courses
              </Link>
              <Link
                to="/dual-courses"
                className="rounded-full border-2 border-primary-foreground/40 px-6 py-3 text-sm font-black transition-colors hover:bg-primary-foreground/10"
              >
                Find a dual course
              </Link>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <HeroStat value="30+" label="SAQA qualifications" />
            <HeroStat value="12–24" label="Months to qualify" />
            <HeroStat value={`${catalogue.duals.length}`} label="Dual pairings" />
            <HeroStat value="99%" label="Pass rate" />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-black">Seven faculties</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {catalogue.courses.length} individual courses across the creative, media, communication
          and technology sectors.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogue.faculties.map((f) => (
            <Link
              key={f.id}
              to="/courses"
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-secondary"
            >
              <h3 className="font-display text-lg font-black text-primary">{f.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.tagline}</p>
              <p className="mt-4 text-xs font-black tracking-widest text-secondary uppercase">
                {catalogue.courses.filter((c) => c.faculty === f.id).length} courses →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-black">Dual courses</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Pair two complementary courses, pay a lower combined rate, and finish far sooner
                than studying them one after the other.
              </p>
            </div>
            <Link
              to="/dual-courses"
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
            >
              See all {catalogue.duals.length} pairings
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {featuredDuals.map((d) => (
              <DualCard key={d.id} dual={d} courses={catalogue.courses} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-3xl border-2 border-secondary bg-card p-8 md:p-12">
          <h2 className="font-display text-3xl font-black">
            You don't need 3–4 years to build a career
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            At Creative Arts College you join the industry from day one. Focused, career-aligned
            training, development and support puts you on your way to success in 12 to 24 months —
            with a portfolio, an industry reference and real work experience behind you.
          </p>
          <Link
            to="/contact"
            className="mt-8 inline-block rounded-full bg-secondary px-6 py-3 text-sm font-black text-secondary-foreground"
          >
            Limited seats — enquire now
          </Link>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur">
      <dt className="font-display text-4xl font-black text-secondary">{value}</dt>
      <dd className="mt-1 text-xs font-bold tracking-widest uppercase opacity-75">{label}</dd>
    </div>
  );
}
