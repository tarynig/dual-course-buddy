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
import { callData } from "./data.server";

// Shapes returned by the saved catalogue operation (database/app-data-functions.sql).
type PlanPayload = {
  id: string;
  name: string;
  deposit: string | number;
  instalments: number;
  instalmentAmount: string | number;
  notes: string | null;
};
type CoursePayload = {
  id: string;
  facultyId: string;
  name: string;
  months: number;
  type: string;
  award: string;
  saqa: string | null;
  nqfLevel: string | null;
  credits: number | null;
  accreditation: string | null;
  courseCode: string | null;
  description: string;
  signature: boolean;
  details: string | null;
  certification: string | null;
  careers: string | null;
  outline: string | null;
  requirements: string | null;
  imageUrl: string | null;
  planIds: string[];
};
type DualPayload = {
  id: string;
  title: string;
  facultyId: string;
  months: number;
  saving: string | number | null;
  courseIds: string[];
  planIds: string[];
};
type FacultyPayload = { id: string; name: string; tagline: string };
type CataloguePayload = {
  faculties: FacultyPayload[];
  courses: CoursePayload[];
  duals: DualPayload[];
  plans: PlanPayload[];
};

const toNumber = (value: string | number | null): number | null =>
  value === null || value === undefined ? null : Number(value);

export const getCatalogue = createServerFn({ method: "GET" }).handler(
  async (): Promise<Catalogue> => {
    try {
      const raw = await callData<CataloguePayload>("app_get_catalogue");

      const plans: Array<PaymentPlan> = (raw?.plans ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        deposit: Number(p.deposit),
        instalments: p.instalments,
        instalmentAmount: Number(p.instalmentAmount),
        notes: p.notes,
      }));
      const pick = (ids: string[]) => plans.filter((p) => ids.includes(p.id));

      const faculties: Array<Faculty> = (raw?.faculties ?? []).map((f) => ({
        id: f.id as FacultyId,
        name: f.name,
        tagline: f.tagline,
      }));

      const courses: Array<Course> = (raw?.courses ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        faculty: c.facultyId as FacultyId,
        months: c.months,
        type: c.type as CourseType,
        award: c.award,
        ...(c.saqa ? { saqa: c.saqa } : {}),
        ...(c.nqfLevel ? { nqfLevel: c.nqfLevel } : {}),
        ...(c.credits ? { credits: c.credits } : {}),
        ...(c.accreditation ? { accreditation: c.accreditation } : {}),
        ...(c.courseCode ? { courseCode: c.courseCode } : {}),
        description: c.description,
        plans: pick(c.planIds),
        signature: c.signature,
        ...(c.details ? { details: c.details } : {}),
        ...(c.certification ? { certification: c.certification } : {}),
        ...(c.careers ? { careers: c.careers } : {}),
        ...(c.outline ? { outline: c.outline } : {}),
        ...(c.requirements ? { requirements: c.requirements } : {}),
        ...(c.imageUrl ? { imageUrl: c.imageUrl } : {}),
      }));

      const duals: Array<DualCourse> = (raw?.duals ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        faculty: d.facultyId as FacultyId,
        courseIds: [d.courseIds[0] ?? "", d.courseIds[1] ?? ""] as [string, string],
        months: d.months,
        plans: pick(d.planIds),
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
    const { sendMail, teamRecipients } = await import("./mail.server");
    const { applicantEnquiryEmail, teamEnquiryEmail } = await import(
      "./emails/enquiry-emails"
    );

    try {
      const saved = await callData<{ id: string; courseName: string | null; dualName: string | null }>(
        "app_add_enquiry",
        { ...data },
      );
      if (!saved?.id) throw new Error("Enquiry was not saved");

      const enquiry = {
        reference: saved.id.slice(0, 8).toUpperCase(),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        campus: data.campus,
        // Name the course they picked so the notification is useful at a glance.
        interest: saved.courseName ?? saved.dualName ?? "Not sure yet",
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
