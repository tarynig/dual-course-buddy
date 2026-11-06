import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FacultyPhoto, NumberedBar } from "@/components/brochure-visuals";
import { FeeLine } from "@/components/course-cards";
import { DepositPanel } from "@/components/deposit-panel";
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { facultyById, formatZar, separateMonths, type Course } from "@/data/courses";

export const Route = createFileRoute("/dual-courses_/$dualId")({
  loader: async ({ context, params }) => {
    const catalogue = await context.queryClient.ensureQueryData(catalogueQueryOptions);
    const dual = catalogue.duals.find((d) => d.id === params.dualId);
    if (!dual) throw notFound();
    return { title: dual.title };
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.title ?? "Dual course"} | Creative Arts College`;
    const description = `Study ${loaderData?.title ?? "two courses"} together in one year at Creative Arts College — faster and at a lower combined rate.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ({ error }) => <CatalogueError error={error} />,
  notFoundComponent: () => <CatalogueNotFound />,
  component: DualPage,
});

function DualPage() {
  const { dualId } = Route.useParams();
  const { data: catalogue } = useSuspenseQuery(catalogueQueryOptions);
  const dual = catalogue.duals.find((d) => d.id === dualId);
  if (!dual) return <CatalogueNotFound />;
  const faculty = facultyById(catalogue, dual.faculty);
  const parts = dual.courseIds
    .map((id) => catalogue.courses.find((c) => c.id === id))
    .filter(Boolean) as Course[];
  const monthsSaved = Math.max(separateMonths(catalogue.courses, dual) - dual.months, 0);

  return (
    <div>
      <section className="surface-deep">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <Link to="/dual-courses" className="text-sm font-bold text-secondary">← All dual courses</Link>
          <p className="mt-6 text-sm font-bold tracking-[0.3em] text-secondary uppercase">
            Dual course · {faculty?.name}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-black md:text-5xl">{dual.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">{dual.months} months</span>
            {monthsSaved > 0 && (
              <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
                {monthsSaved} months faster than one after the other
              </span>
            )}
            {dual.saving !== null && dual.saving > 0 && (
              <span className="rounded-full bg-gold px-3 py-1 text-gold-foreground">Save {formatZar(dual.saving)}</span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <p className="text-lg leading-relaxed">
            Two complementary courses studied in the same year — two qualifications, one timeline, at a lower combined rate.
          </p>
          {parts.map((c, i) => (
            <article key={c.id} className="brochure-course">
              <NumberedBar number={i + 1} title={c.name} />
              <p className="mt-3 font-semibold text-secondary">{c.award}</p>
              {c.saqa && <p className="text-xs text-muted-foreground">SAQA ID: {c.saqa}</p>}
              <p className="mt-1 text-xs font-bold text-muted-foreground">{c.months} months on its own</p>
              <p className="mt-3 text-sm leading-relaxed">{c.description}</p>
              <Link
                to="/courses/$courseId"
                params={{ courseId: c.id }}
                className="mt-3 inline-block text-sm font-bold text-primary underline"
              >
                Full {c.name} course info →
              </Link>
            </article>
          ))}
          <div className="border-t border-border pt-5">
            <FeeLine plans={dual.plans} />
            <Link to="/contact" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
              Enquire about this dual course
            </Link>
          </div>
        </div>
        <div className="space-y-8">
          <FacultyPhoto faculty={dual.faculty} />
          <DepositPanel plans={dual.plans} dualCourseId={dual.id} />
        </div>
      </section>
    </div>
  );
}
