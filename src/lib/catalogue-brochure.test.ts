import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";

test("November brochure durations, replacements and pairings match the stored catalogue", async () => {
  const url = process.env["DATABASE_URL"];
  assert.ok(url, "DATABASE_URL is required for the catalogue regression test");
  const sql = postgres(url, { ssl: "require", prepare: false, fetch_types: false, max: 1 });
  try {
    const courses = await sql`SELECT id, months, is_active FROM public.courses`;
    const expected = {
      "sound-engineering": 12, "dj-mio": 10, "radio-podcasting": 12,
      "content-production": 15, "motion-graphics": 12, animation: 12,
      "interactive-media": 12, "fashion-development": 15, "ai-software-developer": 15,
      "software-developer": 12, "data-science": 12, cybersecurity: 12, marketing: 12,
      "graphic-design-101": 12, "animation-101": 12,
    };
    for (const [id, months] of Object.entries(expected)) {
      assert.equal(courses.find(c => c.id === id)?.months, months, id);
    }
    assert.equal(courses.find(c => c.id === "graphic-animation")?.is_active, false);
    assert.equal(courses.filter(c => c.is_active).length, 31);
    const duals = await sql`SELECT id, months, is_active FROM public.dual_courses`;
    assert.equal(duals.filter(d => d.is_active).length, 22);
    for (const id of ["d-advanced-graphic", "d-graphic-animation", "d-graphic-web", "d-fashion-sewing"])
      assert.equal(duals.find(d => d.id === id)?.is_active, false, id);
    const links = await sql`SELECT dual_id, course_id FROM public.dual_course_courses`;
    for (const [id, ids] of Object.entries({
      "d-graphic-animation-101": ["graphic-media", "animation-101"],
      "d-animation-graphic-101": ["animation", "graphic-design-101"],
      "d-interactive-graphic-101": ["interactive-media", "graphic-design-101"],
    })) {
      assert.deepEqual(links.filter(l => l.dual_id === id).map(l => l.course_id).sort(), ids.sort());
      assert.equal(duals.find(d => d.id === id)?.months, 12);
    }
  } finally {
    await sql.end();
  }
});