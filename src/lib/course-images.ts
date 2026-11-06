import { z } from "zod";
import type { Course } from "@/data/courses";
import { facultyImages } from "@/lib/brochure-images";

export const courseImageSchema = z.string().trim().max(2000).refine((value) => {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use an https:// image address or a path starting with /.");

export function coursePhoto(course: Pick<Course, "name" | "faculty" | "imageUrl">) {
  const result = courseImageSchema.safeParse(course.imageUrl ?? "");
  return result.success && result.data
    ? { src: result.data, alt: course.name }
    : facultyImages[course.faculty];
}