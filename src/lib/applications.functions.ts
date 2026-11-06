import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applicationSchema, FIELD_LABELS } from "./applications.schema";

export type { ApplicationInput } from "./applications.schema";

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as Record<string, unknown>)
  .handler(async ({ data: raw }) => {
    const parsed = applicationSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = String(issue?.path[0] ?? "");
      return { ok: false as const, field, error: `Please check "${FIELD_LABELS[field] ?? field}".` };
    }
    const data = parsed.data;
    const { db } = await import("./db.server");
    const { sendMail, teamRecipients } = await import("./mail.server");
    const sql = db();
    try {
      const [kind, id] = data.interest?.includes(":") ? data.interest.split(":") : ["", ""];
      const courseId = kind === "course" ? id! : null;
      const dualId = kind === "dual" ? id! : null;
      let itemName: string | null = null;
      if (courseId) {
        const r = await sql<Array<{ name: string }>>`SELECT name FROM public.courses WHERE id = ${courseId}`;
        itemName = r[0]?.name ?? null;
      } else if (dualId) {
        const r = await sql<Array<{ title: string }>>`SELECT title FROM public.dual_courses WHERE id = ${dualId}`;
        itemName = r[0]?.title ?? null;
      }
      const elsewhere = data.studiedElsewhere === "yes";
      const inserted = await sql<Array<{ id: string }>>`
        INSERT INTO public.applications (
          course_id, dual_course_id, item_name, first_name, last_name, id_number, date_of_birth,
          gender, home_language, location, email, cell, last_school, highest_grade, grade_year,
          current_grade, studied_elsewhere, institution_name, institution_qualification,
          institution_completed, payer_first_name, payer_last_name, payer_phone, payer_email,
          payer_id_number, payer_relationship, payer_address, payer_employment)
        VALUES (
          ${itemName ? courseId : null}, ${itemName ? dualId : null}, ${itemName},
          ${data.firstName}, ${data.lastName}, ${data.idNumber}, ${data.dateOfBirth},
          ${data.gender}, ${data.homeLanguage}, ${data.location}, ${data.email.toLowerCase()}, ${data.cell},
          ${data.lastSchool}, ${data.highestGrade}, ${data.gradeYear}, ${data.currentGrade || null},
          ${data.studiedElsewhere === null ? null : elsewhere}, ${elsewhere ? data.institutionName : null},
          ${elsewhere ? data.institutionQualification : null},
          ${elsewhere ? data.institutionCompleted === "yes" : null},
          ${data.payerFirstName}, ${data.payerLastName}, ${data.payerPhone}, ${data.payerEmail.toLowerCase()},
          ${data.payerIdNumber}, ${data.payerRelationship}, ${data.payerAddress}, ${data.payerEmployment})
        RETURNING id`;
      const ref = (inserted[0]?.id ?? "").slice(0, 8).toUpperCase();
      const name = `${data.firstName} ${data.lastName}`;
      const course = itemName ?? "Not chosen yet";

      // Saved already — mail is a bonus and never fails the application.
      const teamText = [
        `New application ${ref}`,
        `Applicant: ${name} (${data.email}, ${data.cell})`,
        `Course: ${course}`,
        `Campus: ${data.location}`,
        `Payer: ${data.payerFirstName} ${data.payerLastName} (${data.payerRelationship}), ${data.payerPhone}`,
        "Full details are in the staff dashboard under Applications.",
      ].join("\n");
      const studentText = [
        `Hi ${data.firstName},`,
        `Thank you for applying to Creative Arts College for ${course}. Your reference is ${ref}.`,
        "Our admissions team will review your application and contact you shortly.",
      ].join("\n\n");
      const html = (t: string) =>
        `<div style="font-family:Arial,Helvetica,sans-serif;color:#29174a">${t
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>")}</div>`;
      await Promise.allSettled([
        sendMail({ to: data.email, subject: "We've received your application", text: studentText, html: html(studentText) }),
        ...teamRecipients().map((to) =>
          sendMail({ to, subject: `New application: ${name} — ${course}`, text: teamText, html: html(teamText) }),
        ),
      ]);
      return { ok: true as const, reference: ref };
    } catch (error) {
      console.error("Application insert failed:", error);
      return { ok: false as const, error: "We couldn't submit your application — please try again or call us." };
    }
  });

export type AdminApplication = Record<string, string | number | boolean | null> & {
  id: string;
  status: string;
  created_at: string;
};

export const getAdminApplications = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<AdminApplication>> => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const rows = await db()<Array<Record<string, unknown>>>`
      SELECT *, date_of_birth::text AS date_of_birth, created_at::text AS created_at
      FROM public.applications ORDER BY created_at DESC LIMIT 500`;
    return rows.map((r) => {
      const out: Record<string, string | number | boolean | null> = {};
      for (const [k, v] of Object.entries(r)) {
        out[k] = v === null || typeof v === "number" || typeof v === "boolean" ? (v as never) : String(v);
      }
      return out as AdminApplication;
    });
  },
);

export const setApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "accepted", "enrolled", "declined"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    await db()`UPDATE public.applications SET status = ${data.status} WHERE id = ${data.id}`;
    return { ok: true as const };
  });
