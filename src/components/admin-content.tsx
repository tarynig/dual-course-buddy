import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { catalogueQueryOptions } from "@/lib/catalogue-queries";
import { deleteCourse, deleteDual, saveCourse, saveDual } from "@/lib/content.functions";
import { COURSE_TYPES, type Course, type CourseType, type DualCourse } from "@/data/courses";

const field =
  "mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground";
const label = "block text-xs font-bold tracking-widest uppercase text-muted-foreground";

export function CoursesContentPanel() {
  const catalogue = useQuery(catalogueQueryOptions);
  const [editing, setEditing] = useState<Course | "new" | null>(null);

  if (catalogue.isLoading || !catalogue.data)
    return <p className="text-sm text-muted-foreground">Loading courses…</p>;
  const { faculties, courses } = catalogue.data;

  if (editing)
    return (
      <CourseForm
        course={editing === "new" ? null : editing}
        faculties={faculties}
        onDone={() => setEditing(null)}
      />
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Edit what each course page says. Fees are managed in the Fees tab.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
        >
          Add course
        </button>
      </div>
      {faculties.map((f) => (
        <section key={f.id}>
          <h2 className="font-display text-lg font-black">{f.name}</h2>
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
            {courses
              .filter((c) => c.faculty === f.id)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.months} months · {c.award}
                      {c.details ? "" : " · full info not added yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="rounded-full border border-border px-4 py-2 text-xs font-bold"
                  >
                    Edit
                  </button>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CourseForm({
  course,
  faculties,
  onDone,
}: {
  course: Course | null;
  faculties: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const save = useServerFn(saveCourse);
  const remove = useServerFn(deleteCourse);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    facultyId: course?.faculty ?? faculties[0]?.id ?? "",
    name: course?.name ?? "",
    months: String(course?.months ?? 12),
    type: (course?.type ?? "OC") as CourseType,
    award: course?.award ?? "",
    saqa: course?.saqa ?? "",
    description: course?.description ?? "",
    details: course?.details ?? "",
    signature: course?.signature ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          id: course?.id ?? null,
          facultyId: form.facultyId,
          name: form.name,
          months: Number(form.months),
          type: form.type,
          award: form.award,
          saqa: form.saqa.trim() || null,
          description: form.description,
          details: form.details.trim() || null,
          signature: form.signature,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["catalogue"] });
      onDone();
    } catch {
      setError("Couldn't save. Check every required field is filled in (summary needs 10+ characters).");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!course || !confirm(`Delete "${course.name}"? This can't be undone.`)) return;
    const result = await remove({ data: { id: course.id } });
    if (!result.ok) return setError(result.error);
    await queryClient.invalidateQueries({ queryKey: ["catalogue"] });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <button type="button" onClick={onDone} className="text-sm font-bold text-primary underline">
        ← Back to all courses
      </button>
      <h2 className="font-display text-2xl font-black">{course ? `Edit ${course.name}` : "Add a course"}</h2>

      <label className={label}>
        Course name
        <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={field} />
      </label>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className={label}>
          Faculty
          <select value={form.facultyId} onChange={(e) => set("facultyId", e.target.value)} className={field}>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Duration (months)
          <input type="number" min={1} max={60} required value={form.months} onChange={(e) => set("months", e.target.value)} className={field} />
        </label>
        <label className={label}>
          Type
          <select value={form.type} onChange={(e) => set("type", e.target.value)} className={field}>
            {COURSE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <label className={label}>
          Award / qualification
          <input required value={form.award} onChange={(e) => set("award", e.target.value)} className={field} />
        </label>
        <label className={label}>
          SAQA ID (optional)
          <input value={form.saqa} onChange={(e) => set("saqa", e.target.value)} className={field} />
        </label>
      </div>
      <label className={label}>
        Short summary (shown on course cards)
        <textarea required rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={field} />
      </label>
      <label className={label}>
        Full course information (shown on the course's own page)
        <textarea
          rows={12}
          value={form.details}
          onChange={(e) => set("details", e.target.value)}
          placeholder={"What you'll learn, modules, entry requirements, careers…\n\nLeave a blank line between paragraphs. Start a line with \"- \" for a bullet point."}
          className={field}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={form.signature} onChange={(e) => set("signature", e.target.checked)} />
        Mark as a signature course
      </label>

      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "Saving…" : "Save course"}
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-border px-6 py-2 text-sm font-bold">
          Cancel
        </button>
        {course && (
          <button type="button" onClick={handleDelete} className="ml-auto text-sm font-bold text-destructive underline">
            Delete course
          </button>
        )}
      </div>
    </form>
  );
}

export function DualsContentPanel() {
  const catalogue = useQuery(catalogueQueryOptions);
  const [editing, setEditing] = useState<DualCourse | "new" | null>(null);

  if (catalogue.isLoading || !catalogue.data)
    return <p className="text-sm text-muted-foreground">Loading dual courses…</p>;
  const { faculties, courses, duals } = catalogue.data;
  const name = (id: string) => courses.find((c) => c.id === id)?.name ?? "—";

  if (editing)
    return (
      <DualForm
        dual={editing === "new" ? null : editing}
        faculties={faculties}
        courses={courses}
        onDone={() => setEditing(null)}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-xl text-sm text-muted-foreground">
          A dual course pairs two single courses studied in the same year. Course content comes
          from the single courses, so here you only choose the pair, its name and timeline.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
        >
          Add dual course
        </button>
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {duals.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">{d.title}</p>
              <p className="text-xs text-muted-foreground">
                {name(d.courseIds[0])} + {name(d.courseIds[1])} · {d.months} months
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(d)}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DualForm({
  dual,
  faculties,
  courses,
  onDone,
}: {
  dual: DualCourse | null;
  faculties: Array<{ id: string; name: string }>;
  courses: Course[];
  onDone: () => void;
}) {
  const save = useServerFn(saveDual);
  const remove = useServerFn(deleteDual);
  const queryClient = useQueryClient();
  const [first, setFirst] = useState(dual?.courseIds[0] ?? "");
  const [second, setSecond] = useState(dual?.courseIds[1] ?? "");
  const [title, setTitle] = useState(dual?.title ?? "");
  const [facultyId, setFacultyId] = useState<string>(dual?.faculty ?? faculties[0]?.id ?? "");
  const [months, setMonths] = useState(String(dual?.months ?? 12));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const course = (id: string) => courses.find((c) => c.id === id);
  // When the pair changes, suggest a name, faculty and the longer of the two durations.
  function pick(which: 1 | 2, id: string) {
    const a = which === 1 ? id : first;
    const b = which === 2 ? id : second;
    which === 1 ? setFirst(id) : setSecond(id);
    const ca = course(a);
    const cb = course(b);
    if (ca && cb && !dual) {
      setTitle(`${ca.name} + ${cb.name}`);
      setFacultyId(ca.faculty);
      setMonths(String(Math.max(ca.months, cb.months)));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await save({
        data: { id: dual?.id ?? null, title, facultyId, months: Number(months), courseIds: [first, second] },
      });
      if (!result.ok) return setError(result.error);
      await queryClient.invalidateQueries({ queryKey: ["catalogue"] });
      onDone();
    } catch {
      setError("Couldn't save. Make sure both courses are chosen and a name is filled in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!dual || !confirm(`Delete "${dual.title}"? The single courses stay.`)) return;
    const result = await remove({ data: { id: dual.id } });
    if (!result.ok) return setError(result.error);
    await queryClient.invalidateQueries({ queryKey: ["catalogue"] });
    onDone();
  }

  const options = (
    <>
      <option value="">Choose a course…</option>
      {faculties.map((f) => (
        <optgroup key={f.id} label={f.name}>
          {courses.filter((c) => c.faculty === f.id).map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.months} months)</option>
          ))}
        </optgroup>
      ))}
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <button type="button" onClick={onDone} className="text-sm font-bold text-primary underline">
        ← Back to all dual courses
      </button>
      <h2 className="font-display text-2xl font-black">{dual ? `Edit ${dual.title}` : "Add a dual course"}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          First course
          <select required value={first} onChange={(e) => pick(1, e.target.value)} className={field}>{options}</select>
        </label>
        <label className={label}>
          Second course
          <select required value={second} onChange={(e) => pick(2, e.target.value)} className={field}>{options}</select>
        </label>
      </div>
      <label className={label}>
        Dual course name
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Listed under faculty
          <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className={field}>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Combined duration (months)
          <input type="number" min={1} max={60} required value={months} onChange={(e) => setMonths(e.target.value)} className={field} />
        </label>
      </div>
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "Saving…" : "Save dual course"}
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-border px-6 py-2 text-sm font-bold">
          Cancel
        </button>
        {dual && (
          <button type="button" onClick={handleDelete} className="ml-auto text-sm font-bold text-destructive underline">
            Delete dual course
          </button>
        )}
      </div>
    </form>
  );
}
