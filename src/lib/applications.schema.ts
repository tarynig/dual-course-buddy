import { z } from "zod";

const text = (max = 120) => z.string().trim().min(1).max(max);
// Anything the applicant may skip: blank or missing becomes null.
const optional = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v && v.length ? v : null));
const phone = z
  .string()
  .trim()
  .refine((v) => v.replace(/\D/g, "").length >= 6, "Enter a phone number")
  .pipe(z.string().max(40));
const yes = z.enum(["yes", "no"]);
const year = z
  .string()
  .trim()
  .max(4)
  .nullable()
  .transform((v) => (v && v.length ? Number(v) : null))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 1900 && v <= 2100), "Enter a year like 2025");

/**
 * The education section (last school, highest grade, year, current grade, studied
 * elsewhere and the institution follow-ups) is entirely optional — an applicant who
 * leaves it blank must still be able to submit.
 */
export const applicationSchema = z.object({
  interest: z.string().max(100).nullable(),
  firstName: text(),
  lastName: text(),
  idNumber: text(60),
  dateOfBirth: z.string().trim().min(1).max(20),
  gender: z.enum(["Female", "Male"]),
  homeLanguage: text(60),
  location: z.enum(["Durban/Musgrave", "Pietermaritzburg"]),
  email: z.string().trim().email().max(200),
  cell: phone,
  lastSchool: optional(160),
  highestGrade: optional(60),
  gradeYear: year,
  currentGrade: optional(30),
  studiedElsewhere: yes.nullable(),
  institutionName: optional(160),
  institutionQualification: optional(160),
  institutionCompleted: yes.nullable(),
  payerFirstName: text(),
  payerLastName: text(),
  payerPhone: phone,
  payerEmail: z.string().trim().email().max(200),
  payerIdNumber: text(60),
  payerRelationship: text(60),
  payerAddress: text(400),
  payerEmployment: z.enum(["Employed", "Self-employed", "Funding"]),
});

export const FIELD_LABELS: Record<string, string> = {
  firstName: "First name", lastName: "Last name", idNumber: "ID number", dateOfBirth: "Date of birth",
  gender: "Gender", homeLanguage: "Home language", location: "Location", email: "Email", cell: "Cell number",
  lastSchool: "Last school attended", highestGrade: "Highest grade passed", gradeYear: "Year",
  currentGrade: "Current grade", studiedElsewhere: "Studied at another institution?", institutionName: "Name of institution",
  institutionQualification: "Qualification", institutionCompleted: "Completed?", payerFirstName: "Payer first name",
  payerLastName: "Payer last name", payerPhone: "Payer phone", payerEmail: "Payer email address",
  payerIdNumber: "Payer ID number", payerRelationship: "Relationship", payerAddress: "Address", payerEmployment: "Employment status",
};

export type ApplicationInput = z.infer<typeof applicationSchema>;
