import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FacultyPhoto } from "@/components/brochure-visuals";
import { DualCard, FeeLine } from "@/components/course-cards";
import { DepositPanel } from "@/components/deposit-panel";
import { CatalogueError, CatalogueNotFound } from "@/components/route-fallbacks";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { courseById, dualsForCourse, facultyById } from "@/data/courses";

export const Route = createFileRoute("/courses_/$courseId")({
  loader: async ({ context, params }) => {
    const catalogue = await context.queryClient.ensureQueryData(catalogueQueryOptions);
    const course = courseById(catalogue, params.courseId);
    if (!course) throw notFound();
    return { name: course.name, description: course.description };
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.name ?? "Course"} | Creative Arts College`;
    const description = loaderData?.description ?? "Course information from Creative Arts College.";
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
  component: CoursePage,
});

/** Inline formatting: **bold** and [text](/internal or https://external). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        const m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (m) {
          const href = m[2];
          const safe = href.startsWith("/") || /^https?:\/\//.test(href) || href.startsWith("mailto:");
          if (!safe) return m[1];
          const external = !href.startsWith("/");
          return (
            <a key={i} href={href} className="font-semibold text-primary underline" {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
              {m[1]}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

/** Blank lines split paragraphs; lines starting with "- " become bullet lists. */
function Details({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed md:text-base">
      {text.split(/\n\s*\n/).map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length && lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}><Inline text={l.slice(2)} /></li>)}
            </ul>
          );
        return <p key={i} className="whitespace-pre-line"><Inline text={block.trim()} /></p>;
      })}
    </div>
  );
}

function CoursePage() {
  const { courseId } = Route.useParams();
  const { data: catalogue } = useSuspenseQuery(catalogueQueryOptions);
  const course = courseById(catalogue, courseId);
  if (!course) return <CatalogueNotFound />;
  const faculty = facultyById(catalogue, course.faculty);
  const duals = dualsForCourse(catalogue, course.id);

  return (
    <div>
      <section className="surface-deep">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <Link to="/courses" className="text-sm font-bold text-secondary">← All courses</Link>
          <p className="mt-6 text-sm font-bold tracking-[0.3em] text-secondary uppercase">
            {faculty?.name}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-black md:text-5xl">{course.name}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">{course.months} months</span>
            {course.signature && (
              <span className="rounded-full bg-gold px-3 py-1 text-gold-foreground uppercase tracking-widest">Signature course</span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-semibold text-secondary">{course.award}</p>
          {course.saqa && <p className="text-xs text-muted-foreground">SAQA ID: {course.saqa}</p>}
          <p className="mt-4 text-lg leading-relaxed">{course.description}</p>
          {[course.details, course.certification, course.careers, course.outline, course.requirements].some(Boolean) ? (
            <div className="mt-8 space-y-8">
              {([
                ["Description", course.details],
                ["Certification", course.certification],
                ["Careers", course.careers],
              ] as const).map(([title, text]) => text && (
                <section key={title}>
                  <h2 className="mb-3 font-display text-xl font-black text-primary">{title}</h2>
                  <Details text={text} />
                </section>
              ))}
              {course.outline && (
                <section>
                  <h2 className="mb-3 font-display text-xl font-black text-primary">Course outline</h2>
                  <ol className="list-decimal space-y-1 pl-5 text-sm md:text-base">
                    {course.outline.split("\n").map((l) => l.trim().replace(/^-\s*/, "")).filter(Boolean).map((l, i) => <li key={i}><Inline text={l} /></li>)}
                  </ol>
                </section>
              )}
              {course.requirements && (
                <section>
                  <h2 className="mb-3 font-display text-xl font-black text-primary">Minimum requirements</h2>
                  <Details text={course.requirements} />
                </section>
              )}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              Full course information is coming soon. <Link to="/contact" className="text-primary underline">Ask us</Link> for the course outline in the meantime.
            </p>
          )}
          <div className="mt-8 border-t border-border pt-5">
            <FeeLine plans={course.plans} />
            <Link to="/contact" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
              Enquire about this course
            </Link>
            <Link to="/apply" search={{ course: `course:${course.id}` }} className="mt-5 ml-3 inline-block rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground">
              Apply now
            </Link>
          </div>
        </div>
        <div className="space-y-8">
          <FacultyPhoto faculty={course.faculty} />
          <DepositPanel plans={course.plans} courseId={course.id} />
        </div>
      </section>

      {duals.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="font-display text-2xl font-black">Study it as a dual course</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pair it with a second course in the same year — faster and at a lower combined rate.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {duals.map((d, i) => (
              <DualCard key={d.id} dual={d} courses={catalogue.courses} number={i + 1} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
