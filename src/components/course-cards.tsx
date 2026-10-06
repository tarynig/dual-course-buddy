import { Link } from "@tanstack/react-router";
import { NumberedBar } from '@/components/brochure-visuals';
import {
  dualSaving,
  formatZar,
  separateFeeTotalOf,
  separateMonths,
  type Course,
  type DualCourse,
} from "@/data/courses";

export function FeeLine({ fee, deposit }: { fee: number | null; deposit: number | null }) {
  if (fee === null) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">
        Fees on request — <Link to="/contact" className="text-primary underline">get the fee sheet</Link>
      </p>
    );
  }
  return (
    <p className="text-sm font-semibold">
      <span className="font-display text-xl font-black text-primary">{formatZar(fee)}</span>
      {deposit !== null && (
        <span className="ml-2 text-muted-foreground">
          · {formatZar(deposit)} deposit to secure your seat
        </span>
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
        <FeeLine fee={course.fee} deposit={course.deposit} />
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
  const saving = dualSaving(courses, dual);
  const separate = separateFeeTotalOf(courses, dual);

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
              <span className="font-semibold">{p.name}</span>
              <span className="text-muted-foreground"> · {p.award}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
          {monthsSaved > 0 ? `${monthsSaved} months faster than one after the other` : "Two qualifications, one timeline"}
        </span>
        {saving !== null && (
          <span className="rounded-full bg-gold px-3 py-1 text-gold-foreground">
            Save {formatZar(saving)}
          </span>
        )}
      </div>

      <div className="mt-auto border-t border-border pt-4">
        {dual.fee === null ? (
          <FeeLine fee={null} deposit={null} />
        ) : (
          <p className="text-sm font-semibold">
            <span className="font-display text-xl font-black text-primary">
              {formatZar(dual.fee)}
            </span>
            {separate !== null && (
              <span className="ml-2 text-muted-foreground line-through">
                {formatZar(separate)}
              </span>
            )}
            {dual.deposit !== null && (
              <span className="block text-muted-foreground">
                {formatZar(dual.deposit)} deposit to secure your seat
              </span>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
