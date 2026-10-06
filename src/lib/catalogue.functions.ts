import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  Catalogue,
  Course,
  CourseType,
  DualCourse,
  Faculty,
  PaymentPlan,
  FacultyId,
} from "@/data/courses";

type FacultyRow = { id: string; name: string; tagline: string };
type CourseRow = {
  id: string;
  faculty_id: string;
  name: string;
  months: number;
  type: string;
  award: string;
  saqa: string | null;
  description: string;
  signature: boolean;
  details: string | null;
  plan_ids: string;
};
type PlanRow = {
  id: string;
  name: string;
  deposit: string | number;
  instalments: number;
  instalment_amount: string | number;
  notes: string | null;
};
type DualRow = {
  id: string;
  title: string;
  faculty_id: string;
  months: number;
  saving: string | number | null;
  plan_ids: string;
  course_ids: string;
};

const toNumber = (value: string | number | null): number | null =>
  value === null || value === undefined ? null : Number(value);

// Run one query at a time over the single connection rather than pipelining them.
async function sequential<T extends ReadonlyArray<unknown>>(
  queries: { [K in keyof T]: PromiseLike<T[K]> },
): Promise<T> {
  const out: unknown[] = [];
  for (const q of queries as ReadonlyArray<PromiseLike<unknown>>) out.push(await q);
  return out as unknown as T;
}

export const getCatalogue = createServerFn({ method: "GET" }).handler(
  async (): Promise<Catalogue> => {
    const { db } = await import("./db.server");
    const sql = db();

    try {
      const [facultyRows, courseRows, dualRows, planRows] = await sequential([
        sql<Array<FacultyRow>>`
          SELECT id, name, tagline FROM public.faculties ORDER BY sort_order
        `,
        sql<Array<CourseRow>>`
          SELECT id, faculty_id, name, months, type, award, saqa, description,
                 signature, details,
                 COALESCE((SELECT string_agg(p.plan_id::text, ',') FROM public.course_payment_plans p
                           WHERE p.course_id = courses.id), '') AS plan_ids
          FROM public.courses
          ORDER BY sort_order
        `,
        sql<Array<DualRow>>`
          SELECT d.id, d.title, d.faculty_id, d.months, d.saving,
                 COALESCE((SELECT string_agg(p.plan_id::text, ',') FROM public.dual_payment_plans p
                           WHERE p.dual_id = d.id), '') AS plan_ids,
                 COALESCE(
                   (SELECT string_agg(i.course_id, ',' ORDER BY i.position)
                    FROM public.dual_course_courses i
                    WHERE i.dual_id = d.id),
                   ''
                 ) AS course_ids
          FROM public.dual_courses d
          ORDER BY d.sort_order
        `,
        sql<Array<PlanRow>>`
          SELECT id::text AS id, name, deposit, instalments, instalment_amount, notes
          FROM public.payment_plans ORDER BY sort_order, created_at
        `,
      ]);

      const plans: Array<PaymentPlan> = planRows.map((p) => ({
        id: p.id,
        name: p.name,
        deposit: Number(p.deposit),
        instalments: p.instalments,
        instalmentAmount: Number(p.instalment_amount),
        notes: p.notes,
      }));
      // Lists arrive as comma-joined text so they parse the same on every Postgres driver setup.
      const list = (text: string) => (text ? text.split(",") : []);
      const pick = (ids: string) => plans.filter((p) => list(ids).includes(p.id));

      const faculties: Array<Faculty> = facultyRows.map((f) => ({
        id: f.id as FacultyId,
        name: f.name,
        tagline: f.tagline,
      }));

      const courses: Array<Course> = courseRows.map((c) => ({
        id: c.id,
        name: c.name,
        faculty: c.faculty_id as FacultyId,
        months: c.months,
        type: c.type as CourseType,
        award: c.award,
        ...(c.saqa ? { saqa: c.saqa } : {}),
        description: c.description,
        plans: pick(c.plan_ids),
        signature: c.signature,
        ...(c.details ? { details: c.details } : {}),
      }));

      const duals: Array<DualCourse> = dualRows.map((d) => ({
        id: d.id,
        title: d.title,
        faculty: d.faculty_id as FacultyId,
        courseIds: [list(d.course_ids)[0] ?? "", list(d.course_ids)[1] ?? ""] as [string, string],
        months: d.months,
        plans: pick(d.plan_ids),
        saving: toNumber(d.saving),
      }));

      return { faculties, courses, duals, plans };
    } catch (error) {
      console.error("Catalogue read failed:", error);
      return { faculties: [], courses: [], duals: [], plans: [] };
    }
  },
);

const enquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(200),
  courseId: z.string().max(80).nullable().optional(),
  dualCourseId: z.string().max(80).nullable().optional(),
  campus: z.string().trim().min(1).max(80),
  message: z.string().trim().max(2000).nullable().optional(),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => enquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { sendMail, teamRecipients } = await import("./mail.server");
    const { applicantEnquiryEmail, teamEnquiryEmail } = await import(
      "./emails/enquiry-emails"
    );

    const sql = db();

    try {
      // Name the course they picked so the notification is useful at a glance.
      let interest = "Not sure yet";
      if (data.courseId) {
        const rows = await sql<Array<{ name: string }>>`
          SELECT name FROM public.courses WHERE id = ${data.courseId} LIMIT 1
        `;
        interest = rows[0]?.name ?? interest;
      } else if (data.dualCourseId) {
        const rows = await sql<Array<{ title: string }>>`
          SELECT title FROM public.dual_courses WHERE id = ${data.dualCourseId} LIMIT 1
        `;
        interest = rows[0]?.title ?? interest;
      }

      const inserted = await sql<Array<{ id: string }>>`
        INSERT INTO public.enquiries
          (full_name, phone, email, course_id, dual_course_id, campus, message)
        VALUES (
          ${data.fullName},
          ${data.phone},
          ${data.email},
          ${data.courseId ?? null},
          ${data.dualCourseId ?? null},
          ${data.campus},
          ${data.message ?? null}
        )
        RETURNING id
      `;

      const enquiry = {
        reference: (inserted[0]?.id ?? "").slice(0, 8).toUpperCase(),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        campus: data.campus,
        interest,
        message: data.message ?? null,
        receivedAt: new Date(),
      };

      // The enquiry is already saved, so mail is a bonus on top of it: a failed
      // or unconfigured send must never turn a good submission into an error.
      const team = teamRecipients();
      if (team.length === 0) {
        console.warn("[mail] ADMISSIONS_EMAIL is not set — no admissions inbox to notify");
      }

      await Promise.all([
        sendMail({ to: enquiry.email, ...applicantEnquiryEmail(enquiry) }),
        ...team.map((address) =>
          sendMail({ to: address, ...teamEnquiryEmail(enquiry) }),
        ),
      ]);

      return { ok: true as const };
    } catch (error) {
      console.error("Enquiry insert failed:", error);
      return {
        ok: false as const,
        error: "We couldn't send your enquiry — please try again or call us.",
      };
    }
  });
