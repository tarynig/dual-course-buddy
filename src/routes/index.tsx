import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CourseCard, DualCard } from "@/components/course-cards";
import { FacultyBar, FacultyPhoto } from '@/components/brochure-visuals';
import { brochureHeroDancer, brochureHeadphones } from '@/lib/brochure-images';
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      ...(brochureHeroDancer.startsWith("https://") ? [
        { property: "og:image", content: brochureHeroDancer },
        { name: "twitter:image", content: brochureHeroDancer },
      ] : []),
      { title: "Creative Arts College | Where Education & Industry Meet" },
      {
        name: "description",
        content:
          "Accredited qualifications and skills programmes in film, audio, design, fashion, IT and business. Practical, industry-based study in 10–15 months, plus great-value dual courses.",
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
    ["d-graphic-animation-101", "d-film-content", "d-music-dj", "d-fashion-dd"].includes(d.id),
  );

  return (
    <div>
      <section className="surface-deep relative overflow-hidden">
        <img src={brochureHeroDancer} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-25" fetchPriority="high" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-black tracking-[0.2em] text-secondary-foreground uppercase">
              2027 Prospectus
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] font-black text-balance-tight md:text-7xl">
              Creative Arts College
            </h1>
            <p className="mt-6 max-w-xl text-base opacity-85">
              Creative Arts College is a division of the South African Film Institute Group. Real
              industry, relevant education — accredited qualifications and skills programmes completed in 10 to
              15 months, with hands-on work on industry equipment.
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

          <figure className="hero-figure">
            <img
              src={brochureHeadphones}
              alt="Student wearing red studio headphones, listening intently"
              className="hero-cutout"
              fetchPriority="high"
            />
          </figure>

          <dl className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
            <HeroStat value="30+" label="SAQA qualifications" />
            <HeroStat value="10–15" label="Months to qualify" />
            <HeroStat value={`${catalogue.duals.length}`} label="Dual pairings" />
            <HeroStat value="99%" label="Pass rate" />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <FacultyBar title="Seven faculties" />
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {catalogue.courses.length} individual courses across the creative, media, communication
          and technology sectors.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogue.faculties.map((f) => (
            <Link
              key={f.id}
              to="/courses"
              className="brochure-faculty-link group"
            >
              <FacultyPhoto faculty={f.id} />
              <div>
              <h3 className="font-display text-lg font-black text-primary">{f.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.tagline}</p>
              <p className="mt-4 text-xs font-black tracking-widest text-secondary uppercase">
                {catalogue.courses.filter((c) => c.faculty === f.id).length} courses →
              </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <FacultyBar title="Single courses" />
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Our signature courses — click any course for the full details, fees and deposit.
            </p>
          </div>
          <Link
            to="/courses"
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            See all {catalogue.courses.length} courses
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(catalogue.courses.some((c) => c.signature)
            ? catalogue.courses.filter((c) => c.signature)
            : catalogue.courses
          )
            .slice(0, 6)
            .map((c, index) => (
              <CourseCard key={c.id} course={c} number={index + 1} />
            ))}
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <FacultyBar title="Dual courses" />
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
            {featuredDuals.map((d, index) => (
              <DualCard key={d.id} dual={d} courses={catalogue.courses} number={index + 1} />
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
            training, development and support puts you on your way to success in 10 to 15 months —
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
