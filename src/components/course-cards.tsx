import { Link } from "@tanstack/react-router";
import { NumberedBar } from '@/components/brochure-visuals';
import {
  formatZar,
  fromPrice,
  separateMonths,
  type PaymentPlan,
  type Course,
  type DualCourse,
} from "@/data/courses";

export function FeeLine({ plans }: { plans: PaymentPlan[] }) {
  const from = fromPrice(plans);
  if (from === null) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">
        Fees on request — <Link to="/contact" className="text-primary underline">get the fee sheet</Link>
      </p>
    );
  }
  return (
    <p className="text-sm font-semibold">
      <span className="text-muted-foreground">From </span>
      <span className="font-display text-xl font-black text-primary">{formatZar(from)}</span>
      {plans.length > 1 && (
        <span className="ml-2 text-muted-foreground">· {plans.length} payment plans</span>
      )}
    </p>
  );
}

export function CourseCard({ course, number = 1 }: { course: Course; number?: number }) {
  return (
    <article className="brochure-course flex h-full flex-col">
      <NumberedBar number={number} title={course.name} />
      <div className="flex items-start justify-between gap-3">
        <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
          {course.months} months
        </span>
      </div>

      {course.signature && (
        <span className="mt-2 w-fit rounded-full bg-gold px-3 py-1 text-[0.65rem] font-black tracking-widest text-gold-foreground uppercase">
          Signature course
        </span>
      )}

      <p className="mt-3 text-sm font-semibold text-secondary">{course.award}</p>
      {course.saqa && (
        <p className="text-xs text-muted-foreground">SAQA ID: {course.saqa}</p>
      )}

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {course.description}
      </p>

      <div className="mt-5 border-t border-border pt-4">
        <FeeLine plans={course.plans} />
        <Link
          to="/courses/$courseId"
          params={{ courseId: course.id }}
          className="mt-3 inline-block text-sm font-bold text-primary underline"
        >
          View full course info →
        </Link>
      </div>
    </article>
  );
}

export function DualCard({ dual, courses, number = 1 }: { dual: DualCourse; courses: Course[]; number?: number }) {
  const parts = dual.courseIds
    .map((id) => courses.find((c) => c.id === id))
    .filter(Boolean) as Course[];
  const apart = separateMonths(courses, dual);
  const monthsSaved = Math.max(apart - dual.months, 0);
  const saving = dual.saving;

  return (
    <article className="brochure-course flex h-full flex-col">
      <NumberedBar number={number} title={dual.title} dual />
      <div className="flex items-start justify-between gap-3">
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          {dual.months} months
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {parts.map((p) => (
          <li key={p.id} className="flex items-start gap-2 text-sm">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-secondary" />
            <span>
              <Link to="/courses/$courseId" params={{ courseId: p.id }} className="font-semibold underline-offset-2 hover:underline">{p.name}</Link>
              <span className="text-muted-foreground"> · {p.award}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
          {monthsSaved > 0 ? `${monthsSaved} months faster than one after the other` : "Two qualifications, one timeline"}
        </span>
        {saving !== null && saving > 0 && (
          <span className="rounded-full bg-gold px-3 py-1 text-gold-foreground">
            Save {formatZar(saving)}
          </span>
        )}
      </div>

      <div className="mt-auto border-t border-border pt-4">
        <FeeLine plans={dual.plans} />
      </div>
    </article>
  );
}
