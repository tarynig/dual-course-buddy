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
  /** Payment plans offered for this course (amounts live on the plan). */
  plans: PaymentPlan[];
  signature?: boolean;
  /** Long-form course information shown on the course's own page. */
  details?: string;
}

export const COURSE_TYPES: CourseType[] = ["OC", "AOC", "HOC", "FETC", "SC"];

export interface DualCourse {
  id: string;
  title: string;
  faculty: FacultyId;
  courseIds: [string, string];
  months: number;
  /** Payment plans offered for this dual course. */
  plans: PaymentPlan[];
  /** Saving shown on the dual course, entered by the college. */
  saving: number | null;
}

export interface PaymentPlan {
  id: string;
  name: string;
  deposit: number;
  instalments: number;
  instalmentAmount: number;
  notes: string | null;
}

export const planTotal = (p: PaymentPlan) => p.deposit + p.instalments * p.instalmentAmount;

/** Lowest total across the given plans — the "from" price. */
export const fromPrice = (plans: PaymentPlan[]): number | null =>
  plans.length ? Math.min(...plans.map(planTotal)) : null;

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
  plans: PaymentPlan[];
}

export const emptyCatalogue: Catalogue = { faculties: [], courses: [], duals: [], plans: [] };

export const courseById = (catalogue: Catalogue, id: string) =>
  catalogue.courses.find((c) => c.id === id);

export const facultyById = (catalogue: Catalogue, id: FacultyId) =>
  catalogue.faculties.find((f) => f.id === id);

export const dualsForCourse = (catalogue: Catalogue, id: string) =>
  catalogue.duals.filter((d) => d.courseIds.includes(id));

export const formatZar = (value: number) =>
  `R\u00a0${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;

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
