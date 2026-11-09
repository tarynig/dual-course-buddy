import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { courseImageSchema } from "./course-images";
import { callData } from "./data.server";

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
  certification: z.string().trim().max(10000).nullable(),
  careers: z.string().trim().max(10000).nullable(),
  outline: z.string().trim().max(20000).nullable(),
  requirements: z.string().trim().max(10000).nullable(),
  signature: z.boolean(),
  imageUrl: courseImageSchema.nullable().optional(),
});

export const saveCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => courseSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const result = await callData<{ ok: boolean; id?: string; error?: string }>(
      "app_save_course",
      { ...data },
    );
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Couldn't save the course." };
    return { ok: true as const, id: result.id ?? "" };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const result = await callData<{ ok: boolean; error?: string }>("app_delete_course", { ...data });
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Couldn't delete the course." };
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
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    if (data.courseIds[0] === data.courseIds[1])
      return { ok: false as const, error: "Pick two different courses." };
    const result = await callData<{ ok: boolean; id?: string; error?: string }>(
      "app_save_dual",
      { ...data },
    );
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Couldn't save the dual course." };
    return { ok: true as const, id: result.id ?? "" };
  });

export const deleteDual = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./session.server");
    await requireAdmin();
    const result = await callData<{ ok: boolean; error?: string }>("app_delete_dual", { ...data });
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Couldn't delete the dual course." };
    return { ok: true as const };
  });
