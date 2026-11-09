import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applicationSchema, FIELD_LABELS } from "./applications.schema";
import { callData } from "./data.server";

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
    const { sendMail, teamRecipients } = await import("./mail.server");
    try {
      const [kind, id] = data.interest?.includes(":") ? data.interest.split(":") : ["", ""];
      const saved = await callData<{ id: string }>("app_add_application", {
        ...data,
        courseId: kind === "course" ? id : null,
        dualCourseId: kind === "dual" ? id : null,
      });
      if (!saved?.id) throw new Error("Application was not saved");

      const ref = saved.id.slice(0, 8).toUpperCase();
      const name = `${data.firstName} ${data.lastName}`;
      const course = data.interest ? "your chosen course" : "Not chosen yet";

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

// The saved operation returns one tidy record per application; the applications
// screen reads the plain column names, so they are spelled out here.
type ApplicationPayload = Record<string, string | number | boolean | null> & {
  id: string;
  status: string;
  createdAt: string;
};

const SNAKE: Record<string, string> = {
  courseId: "course_id",
  dualCourseId: "dual_course_id",
  itemName: "item_name",
  firstName: "first_name",
  lastName: "last_name",
  idNumber: "id_number",
  dateOfBirth: "date_of_birth",
  homeLanguage: "home_language",
  lastSchool: "last_school",
  highestGrade: "highest_grade",
  gradeYear: "grade_year",
  currentGrade: "current_grade",
  studiedElsewhere: "studied_elsewhere",
  institutionName: "institution_name",
  institutionQualification: "institution_qualification",
  institutionCompleted: "institution_completed",
  payerFirstName: "payer_first_name",
  payerLastName: "payer_last_name",
  payerPhone: "payer_phone",
  payerEmail: "payer_email",
  payerIdNumber: "payer_id_number",
  payerRelationship: "payer_relationship",
  payerAddress: "payer_address",
  payerEmployment: "payer_employment",
  createdAt: "created_at",
};

export const getAdminApplications = createServerFn({ method: "GET" }).handler(
  async (): Promise<Array<AdminApplication>> => {
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const rows = (await callData<ApplicationPayload[]>("app_list_applications")) ?? [];
    return rows.map((row) => {
      const out: Record<string, string | number | boolean | null> = {};
      for (const [key, value] of Object.entries(row)) {
        out[SNAKE[key] ?? key] = value;
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
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    await callData("app_set_application_status", { ...data });
    return { ok: true as const };
  });
