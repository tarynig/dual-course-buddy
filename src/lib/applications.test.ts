import { test } from "node:test";
import assert from "node:assert/strict";
import { applicationSchema } from "./applications.schema";

const complete = {
  interest: "course:sound-engineering",
  firstName: "Thabo", lastName: "Dlamini", idNumber: "0201015009087", dateOfBirth: "2002-01-01",
  gender: "Male", homeLanguage: "isiZulu", location: "Durban/Musgrave",
  email: "thabo@example.co.za", cell: "081 589 1088",
  lastSchool: "Westville High", highestGrade: "12", gradeYear: "2024", currentGrade: "",
  studiedElsewhere: "no", institutionName: null, institutionQualification: null, institutionCompleted: null,
  payerFirstName: "Mary", payerLastName: "Dlamini", payerPhone: "0821234567", payerEmail: "mary@example.co.za",
  payerIdNumber: "7001010001085", payerRelationship: "Parent", payerAddress: "12 Hill Road, Durban",
  payerEmployment: "Employed",
};

test("an application with the whole education section left blank is accepted", () => {
  const parsed = applicationSchema.safeParse({
    ...complete,
    lastSchool: "", highestGrade: "", gradeYear: "", currentGrade: "",
    studiedElsewhere: null, institutionName: null, institutionQualification: null, institutionCompleted: null,
  });
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues ?? null));
  if (parsed.success) {
    assert.equal(parsed.data.lastSchool, null);
    assert.equal(parsed.data.highestGrade, null);
    assert.equal(parsed.data.gradeYear, null);
    assert.equal(parsed.data.studiedElsewhere, null);
  }
});

test("a filled-in education section still keeps its values", () => {
  const parsed = applicationSchema.safeParse(complete);
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues ?? null));
  if (parsed.success) {
    assert.equal(parsed.data.lastSchool, "Westville High");
    assert.equal(parsed.data.gradeYear, 2024);
  }
});

test("a blank payer first name is still rejected", () => {
  const parsed = applicationSchema.safeParse({ ...complete, payerFirstName: "" });
  assert.equal(parsed.success, false);
});

test("a year that is not a real year is rejected", () => {
  assert.equal(applicationSchema.safeParse({ ...complete, gradeYear: "18" }).success, false);
  assert.equal(applicationSchema.safeParse({ ...complete, gradeYear: "2025" }).success, true);
});
