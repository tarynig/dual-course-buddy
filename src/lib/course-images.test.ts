import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { courseImageSchema, coursePhoto } from "./course-images";
import { facultyImages } from "./brochure-images";

describe("course photos", () => {
  it("uses the individual course image when set", () => {
    assert.equal(coursePhoto({ name: "Sound Engineering", faculty: "audio", imageUrl: "/brochure/dj.jpg" }).src, "/brochure/dj.jpg");
  });
  it("keeps the brochure photo when the field is empty", () => {
    assert.deepEqual(coursePhoto({ name: "Sound Engineering", faculty: "audio", imageUrl: "" }), facultyImages.audio);
  });
  it("only accepts secure image addresses or own-host paths", () => {
    assert.equal(courseImageSchema.safeParse("https://creativearts.co.za/images/course.jpg").success, true);
    for (const value of ["javascript:alert(1)", "//other.example/image.jpg", "http://other.example/image.jpg", "/\\other.example/image.jpg"]) {
      assert.equal(courseImageSchema.safeParse(value).success, false);
    }
  });
});