import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  Catalogue,
  Course,
  CourseType,
  DualCourse,
  Faculty,
  FacultyId,
} from "@/data/courses";

/**
 * Publishable-key client for public catalogue reads and public enquiry writes.
 * Created per-call: process.env is only available server-side at call time,
 * and opaque sb_ keys must be sent via the apikey header, not a bearer token.
 */
function createPublicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type FacultyRow = { id: string; name: string; tagline: string; sort_order: number };
type CourseRow = {
  id: string;
  faculty_id: string;
  name: string;
  months: number;
  type: string;
  award: string;
  saqa: string | null;
  description: string;
  fee: number | string | null;
  deposit: number | string | null;
  signature: boolean;
  sort_order: number;
};
type DualRow = {
  id: string;
  title: string;
  faculty_id: string;
  months: number;
  fee: number | string | null;
  deposit: number | string | null;
  sort_order: number;
};
type DualItemRow = { dual_id: string; course_id: string; position: number };

const toNumber = (value: number | string | null): number | null =>
  value === null || value === undefined ? null : Number(value);

export const getCatalogue = createServerFn({ method: "GET" }).handler(
  async (): Promise<Catalogue> => {
    const client = createPublicClient();
    if (!client) return { faculties: [], courses: [], duals: [] };

    const [facultiesRes, coursesRes, dualsRes, itemsRes] = await Promise.all([
      client.from("faculties").select("id, name, tagline, sort_order"),
      client
        .from("courses")
        .select(
          "id, faculty_id, name, months, type, award, saqa, description, fee, deposit, signature, sort_order",
        ),
      client.from("dual_courses").select("id, title, faculty_id, months, fee, deposit, sort_order"),
      client.from("dual_course_courses").select("dual_id, course_id, position"),
    ]);

    if (facultiesRes.error || coursesRes.error || dualsRes.error || itemsRes.error) {
      console.error(
        "Catalogue read failed:",
        facultiesRes.error?.message ??
          coursesRes.error?.message ??
          dualsRes.error?.message ??
          itemsRes.error?.message,
      );
      return { faculties: [], courses: [], duals: [] };
    }

    const faculties: Faculty[] = (facultiesRes.data as FacultyRow[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({ id: f.id as FacultyId, name: f.name, tagline: f.tagline }));

    const courses: Course[] = (coursesRes.data as CourseRow[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        id: c.id,
        name: c.name,
        faculty: c.faculty_id as FacultyId,
        months: c.months,
        type: c.type as CourseType,
        award: c.award,
        ...(c.saqa ? { saqa: c.saqa } : {}),
        description: c.description,
        fee: toNumber(c.fee),
        deposit: toNumber(c.deposit),
        signature: c.signature,
      }));

    const itemsByDual = new Map<string, string[]>();
    for (const item of (itemsRes.data as DualItemRow[]).sort(
      (a, b) => a.position - b.position,
    )) {
      const list = itemsByDual.get(item.dual_id) ?? [];
      list.push(item.course_id);
      itemsByDual.set(item.dual_id, list);
    }

    const duals: DualCourse[] = (dualsRes.data as DualRow[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((d) => {
        const ids = itemsByDual.get(d.id) ?? [];
        return {
          id: d.id,
          title: d.title,
          faculty: d.faculty_id as FacultyId,
          courseIds: [ids[0] ?? "", ids[1] ?? ""] as [string, string],
          months: d.months,
          fee: toNumber(d.fee),
          deposit: toNumber(d.deposit),
        };
      });

    return { faculties, courses, duals };
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
    const client = createPublicClient();
    if (!client) {
      return {
        ok: false as const,
        error: "We couldn't send your enquiry right now — please call us instead.",
      };
    }

    const { error } = await client.from("enquiries").insert({
      full_name: data.fullName,
      phone: data.phone,
      email: data.email,
      course_id: data.courseId ?? null,
      dual_course_id: data.dualCourseId ?? null,
      campus: data.campus,
      message: data.message ?? null,
    });

    if (error) {
      console.error("Enquiry insert failed:", error.message);
      return {
        ok: false as const,
        error: "We couldn't send your enquiry — please try again or call us.",
      };
    }
    return { ok: true as const };
  });
