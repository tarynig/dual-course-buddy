import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "item";

const courseSchema = z.object({
  id: z.string().max(80).nullable(),
  facultyId: z.string().min(1).max(40),
  name: z.string().trim().min(2).max(160),
  months: z.number().int().min(1).max(60),
  type: z.enum(["OC", "AOC", "HOC", "FETC", "SC"]),
  award: z.string().trim().min(2).max(200),
  saqa: z.string().trim().max(40).nullable(),
  description: z.string().trim().min(10).max(2000),
  details: z.string().trim().max(20000).nullable(),
  signature: z.boolean(),
});

export const saveCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => courseSchema.parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();
    const saqa = data.saqa || null;
    const details = data.details || null;

    if (data.id) {
      await sql`
        UPDATE public.courses SET
          faculty_id = ${data.facultyId}, name = ${data.name}, months = ${data.months},
          type = ${data.type}, award = ${data.award}, saqa = ${saqa},
          description = ${data.description}, details = ${details}, signature = ${data.signature}
        WHERE id = ${data.id}
      `;
      return { ok: true as const, id: data.id };
    }

    const base = slug(data.name);
    const taken = await sql<Array<{ id: string }>>`
      SELECT id FROM public.courses WHERE id = ${base} OR id LIKE ${base + "-%"}
    `;
    const ids = new Set(taken.map((r) => r.id));
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;

    await sql`
      INSERT INTO public.courses
        (id, faculty_id, name, months, type, award, saqa, description, details, signature, sort_order)
      VALUES (
        ${id}, ${data.facultyId}, ${data.name}, ${data.months}, ${data.type}, ${data.award},
        ${saqa}, ${data.description}, ${details}, ${data.signature},
        (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.courses)
      )
    `;
    return { ok: true as const, id };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();

    const [usage] = await sql<Array<{ duals: number; enquiries: number }>>`
      SELECT
        (SELECT COUNT(*)::int FROM public.dual_course_courses WHERE course_id = ${data.id}) AS duals,
        (SELECT COUNT(*)::int FROM public.enquiries WHERE course_id = ${data.id}) AS enquiries
    `;
    if (usage && usage.duals > 0)
      return { ok: false as const, error: "This course is part of a dual course. Remove it from those first." };
    if (usage && usage.enquiries > 0)
      return { ok: false as const, error: "Students have enquired about this course, so it can't be deleted." };

    await sql`DELETE FROM public.courses WHERE id = ${data.id}`;
    return { ok: true as const };
  });

const dualSchema = z.object({
  id: z.string().max(80).nullable(),
  title: z.string().trim().min(2).max(200),
  facultyId: z.string().min(1).max(40),
  months: z.number().int().min(1).max(60),
  courseIds: z.tuple([z.string().min(1).max(80), z.string().min(1).max(80)]),
});

export const saveDual = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => dualSchema.parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    if (data.courseIds[0] === data.courseIds[1])
      return { ok: false as const, error: "Pick two different courses." };
    const sql = db();

    let id = data.id;
    if (id) {
      await sql`
        UPDATE public.dual_courses
        SET title = ${data.title}, faculty_id = ${data.facultyId}, months = ${data.months}
        WHERE id = ${id}
      `;
    } else {
      id = `dual-${slug(data.courseIds.join("-"))}`;
      const exists = await sql`SELECT 1 FROM public.dual_courses WHERE id = ${id}`;
      if (exists.length) return { ok: false as const, error: "That combination already exists." };
      await sql`
        INSERT INTO public.dual_courses (id, title, faculty_id, months, sort_order)
        VALUES (${id}, ${data.title}, ${data.facultyId}, ${data.months},
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.dual_courses))
      `;
    }

    await sql`DELETE FROM public.dual_course_courses WHERE dual_id = ${id}`;
    await sql`
      INSERT INTO public.dual_course_courses (dual_id, course_id, position)
      VALUES (${id}, ${data.courseIds[0]}, 1), (${id}, ${data.courseIds[1]}, 2)
    `;
    return { ok: true as const, id };
  });

export const deleteDual = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const sql = db();
    const used = await sql`SELECT 1 FROM public.enquiries WHERE dual_course_id = ${data.id} LIMIT 1`;
    if (used.length)
      return { ok: false as const, error: "Students have enquired about this dual course, so it can't be deleted." };
    await sql`DELETE FROM public.dual_course_courses WHERE dual_id = ${data.id}`;
    await sql`DELETE FROM public.dual_courses WHERE id = ${data.id}`;
    return { ok: true as const };
  });
