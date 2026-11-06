import { describe, expect, it } from "bun:test";
import { courseImageSchema, coursePhoto } from "./course-images";
import { facultyImages } from "./brochure-images";

describe("course photos", () => {
  it("uses the individual course image when set", () => {
    expect(coursePhoto({ name: "Sound Engineering", faculty: "audio", imageUrl: "/brochure/dj.jpg" }).src).toBe("/brochure/dj.jpg");
  });
  it("keeps the brochure photo when the field is empty", () => {
    expect(coursePhoto({ name: "Sound Engineering", faculty: "audio", imageUrl: "" })).toEqual(facultyImages.audio);
  });
  it("only accepts secure image addresses or own-host paths", () => {
    expect(courseImageSchema.safeParse("https://creativearts.co.za/images/course.jpg").success).toBe(true);
    for (const value of ["javascript:alert(1)", "//other.example/image.jpg", "http://other.example/image.jpg", "/\\other.example/image.jpg"]) {
      expect(courseImageSchema.safeParse(value).success).toBe(false);
    }
  });
});