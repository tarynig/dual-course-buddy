export type CourseType = "OC" | "AOC" | "HOC" | "FETC" | "SC";

export interface Course {
  id: string;
  name: string;
  faculty: FacultyId;
  months: number;
  type: CourseType;
  award: string;
  saqa?: string;
  description: string;
  /** Full programme fee in ZAR. Null until the official fee is loaded. */
  fee: number | null;
  /** Deposit payable on registration, in ZAR. */
  deposit: number | null;
  signature?: boolean;
}

export interface DualCourse {
  id: string;
  title: string;
  faculty: FacultyId;
  courseIds: [string, string];
  months: number;
  /** Combined dual-course fee in ZAR (lower than the two individual fees). */
  fee: number | null;
  deposit: number | null;
}

export type FacultyId =
  | "audio"
  | "content"
  | "performance"
  | "visual"
  | "fashion"
  | "tech"
  | "business";

export interface Faculty {
  id: FacultyId;
  name: string;
  tagline: string;
}

/** Everything the site renders about the college's offering, loaded from the database. */
export interface Catalogue {
  faculties: Faculty[];
  courses: Course[];
  duals: DualCourse[];
}

export const emptyCatalogue: Catalogue = { faculties: [], courses: [], duals: [] };

export const courseById = (catalogue: Catalogue, id: string) =>
  catalogue.courses.find((c) => c.id === id);

export const facultyById = (catalogue: Catalogue, id: FacultyId) =>
  catalogue.faculties.find((f) => f.id === id);

export const dualsForCourse = (catalogue: Catalogue, id: string) =>
  catalogue.duals.filter((d) => d.courseIds.includes(id));

export const formatZar = (value: number) =>
  `R\u00a0${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;

/** Individual fees added together, if both are known. */
export const separateFeeTotalOf = (courses: Course[], dual: DualCourse): number | null => {
  const parts = dual.courseIds.map((id) => courses.find((c) => c.id === id)?.fee ?? null);
  if (parts.some((p) => p === null)) return null;
  return (parts as number[]).reduce((a, b) => a + b, 0);
};

export const dualSaving = (courses: Course[], dual: DualCourse): number | null => {
  const total = separateFeeTotalOf(courses, dual);
  if (total === null || dual.fee === null) return null;
  return total - dual.fee;
};

/** Longest individual duration, i.e. what back-to-back study would take. */
export const separateMonths = (courses: Course[], dual: DualCourse): number =>
  dual.courseIds.reduce((sum, id) => sum + (courses.find((c) => c.id === id)?.months ?? 0), 0);

export const contact = {
  phone: "081 589 1088",
  website: "www.creativearts.co.za",
  campuses: [
    { city: "Durban", phone: "031 301 3313", address: "86 Stephen Dlamini Road, Musgrave" },
    { city: "Pietermaritzburg", phone: "033 342 2720", address: "157 Victoria Road, Victoria Shopping Centre" },
  ],
};
