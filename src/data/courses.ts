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
  /** Full programme fee in ZAR. Set to null until the official fee is loaded. */
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

export const faculties: Faculty[] = [
  { id: "audio", name: "Audio Production", tagline: "Sound, music, radio and the business behind them." },
  { id: "content", name: "Content Production", tagline: "Film, TV, photography and content management." },
  { id: "performance", name: "Performance Art", tagline: "Acting, dance, presenting, modelling and image." },
  { id: "visual", name: "Visual Arts", tagline: "Graphic design, motion, animation and web." },
  { id: "fashion", name: "Fashion", tagline: "Design, pattern making, grading and sewing." },
  { id: "tech", name: "IT · 4IR Technology", tagline: "AI, software, data, cloud and cybersecurity." },
  { id: "business", name: "Communication & Business", tagline: "Marketing, journalism, projects and events." },
];

export const courses: Course[] = [
  // Audio
  {
    id: "sound-engineering",
    name: "Sound Engineering",
    faculty: "audio",
    months: 15,
    type: "OC",
    award: "OC: Sound Operator",
    saqa: "120748",
    description:
      "A comprehensive qualification covering sound setup, live recording and production. Includes work experience, giving the learner industry access while studying.",
    fee: null,
    deposit: null,
  },
  {
    id: "music-production",
    name: "Music Production",
    faculty: "audio",
    months: 12,
    type: "SC",
    award: "SC: Music Production (CAC Skills Programme)",
    description:
      "A provider-based Skills Programme focused on Music Production and the Music Industry. It develops producers who understand how to make music and how to succeed in the global music business.",
    fee: null,
    deposit: null,
  },
  {
    id: "dj-mio",
    name: "DJ & MIO (Music Industry Operation)",
    faculty: "audio",
    months: 12,
    type: "SC",
    award: "SC: DJ & MIO (CAC Skills Programme)",
    description:
      "DJing has become a high-paying career, with DJs becoming powerful global brands. This course goes beyond masterful mixing and covers key music industry operations.",
    fee: null,
    deposit: null,
  },
  {
    id: "radio-podcasting",
    name: "Radio Production & Podcasting",
    faculty: "audio",
    months: 15,
    type: "OC",
    award: "OC: Radio & Multimedia Content Practitioner",
    saqa: "122622",
    description:
      "Develops practitioners in radio and multimedia development, broadcasting and streaming — a growing field incorporating audio-visual communication in the new age of technology.",
    fee: null,
    deposit: null,
  },

  // Content
  {
    id: "content-production",
    name: "Content Production",
    faculty: "content",
    months: 18,
    type: "AOC",
    award: "Advanced OC: Media Content Production Manager · NQF 6",
    saqa: "121157",
    signature: true,
    description:
      "Our signature advanced qualification, including formal work experience with the South African Film Institute and its associate companies. Includes bonus modules in film, radio, photography and media design.",
    fee: null,
    deposit: null,
  },
  {
    id: "film-tv",
    name: "Film & TV Production",
    faculty: "content",
    months: 12,
    type: "SC",
    award: "SC: Film & TV Production (CAC Skills Programme)",
    description:
      "The A to Z of filmmaking. Students gain knowledge of the various disciplines and specialise in a field such as camera, editing, lighting, production management or direction.",
    fee: null,
    deposit: null,
  },
  {
    id: "photography",
    name: "Photography",
    faculty: "content",
    months: 12,
    type: "SC",
    award: "SC: Photography (CAC Skills Programme)",
    description:
      "A career-aligned programme, both theoretical and practical, covering cameras, lenses and equipment, with lighting, imaging and editing as key units.",
    fee: null,
    deposit: null,
  },
  {
    id: "scriptwriting",
    name: "Scriptwriting",
    faculty: "content",
    months: 12,
    type: "SC",
    award: "SC: Scriptwriting (CAC Skills Programme)",
    description:
      "Creativity, format and technique drive this intense programme covering creative writing for film, television and other applications.",
    fee: null,
    deposit: null,
  },

  // Performance
  {
    id: "performing-arts",
    name: "Performing Arts",
    faculty: "performance",
    months: 12,
    type: "FETC",
    award: "FETC: Performing Arts",
    saqa: "48808",
    description:
      "An in-depth programme covering acting and presenting techniques, choreography, direction and production across theatre, television, film and live segments.",
    fee: null,
    deposit: null,
  },
  {
    id: "dance",
    name: "Dance & Choreography",
    faculty: "performance",
    months: 12,
    type: "FETC",
    award: "FETC: Dance Instruction",
    saqa: "79986",
    description:
      "Teaches dance, dance choreography and ultimately how to teach dance itself, incorporating various styles across foundations and practicals.",
    fee: null,
    deposit: null,
  },
  {
    id: "modelling",
    name: "Modelling & Image Consulting",
    faculty: "performance",
    months: 12,
    type: "SC",
    award: "SC: Modelling & Image Consulting (CAC Skills Programme)",
    description:
      "Image and presentation are big business. Modelling now extends to influencing and brand ambassadorship — this course prepares you for success in the field.",
    fee: null,
    deposit: null,
  },

  // Visual
  {
    id: "graphic-media",
    name: "Graphic Design — Media",
    faculty: "visual",
    months: 12,
    type: "OC",
    award: "OC: Graphic Media Designer",
    saqa: "122663",
    description:
      "Incorporates various techniques and software, preparing the student for a career as a Graphic Designer. Embodies both creativity and business.",
    fee: null,
    deposit: null,
  },
  {
    id: "motion-graphics",
    name: "Graphic Design — Motion",
    faculty: "visual",
    months: 15,
    type: "HOC",
    award: "Higher OC: Motion Graphics Designer",
    saqa: "122621",
    description:
      "Expands graphic design into motion graphics, going beyond static corporate media designs into complex, dynamic and active work.",
    fee: null,
    deposit: null,
  },
  {
    id: "animation",
    name: "Animation",
    faculty: "visual",
    months: 15,
    type: "HOC",
    award: "Higher OC: Animation Artist",
    saqa: "122662",
    description:
      "Animation remains a scarce, high-demand skill. Students critically apply animation principles across a range of applications to produce professional work.",
    fee: null,
    deposit: null,
  },
  {
    id: "interactive-media",
    name: "Interactive Media (Web Design)",
    faculty: "visual",
    months: 15,
    type: "HOC",
    award: "Higher OC: Interactive Media Designer",
    saqa: "122664",
    description:
      "A fusion of creativity and technology that enhances user experience across platforms. Businesses depend on communicating with their market interactively.",
    fee: null,
    deposit: null,
  },
  {
    id: "graphic-animation",
    name: "Graphic Design & Animation",
    faculty: "visual",
    months: 12,
    type: "SC",
    award: "SC: Graphic Design & Animation (CAC Skills Programme)",
    description:
      "A highly valued programme combining still and motion imagery in a practical, industry-aligned manner across various software applications.",
    fee: null,
    deposit: null,
  },

  // Fashion
  {
    id: "fashion-development",
    name: "Fashion Development",
    faculty: "fashion",
    months: 18,
    type: "OC",
    award: "OC: Apparel Pattern Maker & Grader",
    saqa: "115455",
    description:
      "A comprehensive qualification covering garment development, teaching the technicalities of pattern making and grading.",
    fee: null,
    deposit: null,
  },
  {
    id: "fashion-design",
    name: "Fashion Design",
    faculty: "fashion",
    months: 12,
    type: "SC",
    award: "SC: Fashion Design (CAC Skills Programme)",
    description:
      "Equips the student to design a garment from beginning to end, including marketing a fashion brand.",
    fee: null,
    deposit: null,
  },
  {
    id: "sewing",
    name: "Sewing",
    faculty: "fashion",
    months: 12,
    type: "OC",
    award: "OC: Sewing Machine Operator",
    saqa: "97238",
    description:
      "Covers the knowledge and skills of sewing at a commercial and industrial level — a fundamental part of the fashion industry.",
    fee: null,
    deposit: null,
  },

  // Tech
  {
    id: "ai-software-developer",
    name: "Artificial Intelligence Software Developer",
    faculty: "tech",
    months: 24,
    type: "OC",
    award: "OC: Artificial Intelligence Software Developer",
    saqa: "118792",
    description:
      "Develops competencies in Artificial Intelligence. Learners study software development plus how to design code that can learn, adapt and grow. High global demand.",
    fee: null,
    deposit: null,
  },
  {
    id: "software-developer",
    name: "Software Developer",
    faculty: "tech",
    months: 18,
    type: "OC",
    award: "OC: Software Developer",
    saqa: "118707",
    description:
      "Prepares a learner to analyse a set of requirements and translate these into a working software solution using a programming language.",
    fee: null,
    deposit: null,
  },
  {
    id: "data-science",
    name: "Data Science Practitioner",
    faculty: "tech",
    months: 18,
    type: "OC",
    award: "OC: Data Science Practitioner",
    saqa: "118708",
    description:
      "Take custody of data and make it available in structured form — collecting, transforming and analysing data and communicating results to solve business problems.",
    fee: null,
    deposit: null,
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity Analyst",
    faculty: "tech",
    months: 15,
    type: "OC",
    award: "OC: Cybersecurity Analyst",
    saqa: "118986",
    description:
      "Protect assets such as networks, computer systems and information assets from malicious attacks and threats.",
    fee: null,
    deposit: null,
  },
  {
    id: "cloud-admin",
    name: "Cloud Administrator",
    faculty: "tech",
    months: 12,
    type: "OC",
    award: "OC: Cloud Administrator",
    saqa: "118699",
    description:
      "Monitor, maintain, secure and troubleshoot networks of cloud platforms and computing resources — a new and emerging career.",
    fee: null,
    deposit: null,
  },
  {
    id: "design-thinking",
    name: "Design Thinking",
    faculty: "tech",
    months: 12,
    type: "OC",
    award: "OC: Design Thinking Practitioner",
    saqa: "118705",
    description:
      "Apply approaches and methodologies to understand complex challenges and collaboratively create innovative solutions that address human needs.",
    fee: null,
    deposit: null,
  },

  // Business
  {
    id: "marketing",
    name: "Marketing",
    faculty: "business",
    months: 15,
    type: "HOC",
    award: "Higher OC: Advertiser",
    saqa: "121447",
    description:
      "Develops the skills to confidently support marketing activities in an organisation, covering all aspects of advertising.",
    fee: null,
    deposit: null,
  },
  {
    id: "market-research",
    name: "Market Research Analyst",
    faculty: "business",
    months: 15,
    type: "OC",
    award: "OC: Market Research Analyst",
    saqa: "119450",
    description:
      "Unpacks the behavioural patterns of consumers — a critically important segment of effective marketing engagements.",
    fee: null,
    deposit: null,
  },
  {
    id: "journalism",
    name: "Journalism",
    faculty: "business",
    months: 12,
    type: "SC",
    award: "SC: New-Age Journalism (CAC Skills Programme)",
    description:
      "A multifaceted look at journalism in the digital age: print, radio and television journalism, journalistic photography, online and interactive news media.",
    fee: null,
    deposit: null,
  },
  {
    id: "project-management",
    name: "Project Management",
    faculty: "business",
    months: 15,
    type: "OC",
    award: "OC: Project Manager",
    saqa: "101869",
    description:
      "Initiate, plan, execute, control and close out projects. Comprehensively trains and develops executive project managers.",
    fee: null,
    deposit: null,
  },
  {
    id: "events-management",
    name: "Events Management",
    faculty: "business",
    months: 12,
    type: "SC",
    award: "SC: Events Management (CAC Skills Programme)",
    description:
      "Formalises and develops knowledge in event management, preparing the student for the dynamic world of event co-ordination.",
    fee: null,
    deposit: null,
  },
];

export const dualCourses: DualCourse[] = [
  // Audio
  { id: "d-sound-music", title: "Sound Engineering + Music Production", faculty: "audio", courseIds: ["sound-engineering", "music-production"], months: 15, fee: null, deposit: null },
  { id: "d-sound-dj", title: "Sound Engineering + DJ & MIO", faculty: "audio", courseIds: ["sound-engineering", "dj-mio"], months: 15, fee: null, deposit: null },
  { id: "d-music-dj", title: "Music Production + DJ & MIO", faculty: "audio", courseIds: ["music-production", "dj-mio"], months: 12, fee: null, deposit: null },
  { id: "d-radio-music", title: "Radio & Podcasting + Music Production", faculty: "audio", courseIds: ["radio-podcasting", "music-production"], months: 15, fee: null, deposit: null },
  { id: "d-radio-dj", title: "Radio & Podcasting + DJ & MIO", faculty: "audio", courseIds: ["radio-podcasting", "dj-mio"], months: 15, fee: null, deposit: null },

  // Content
  { id: "d-film-content", title: "Film & TV + Media Content Production Manager", faculty: "content", courseIds: ["film-tv", "content-production"], months: 24, fee: null, deposit: null },
  { id: "d-music-content", title: "Music Production + Media Content Production Manager", faculty: "content", courseIds: ["music-production", "content-production"], months: 24, fee: null, deposit: null },
  { id: "d-photo-content", title: "Photography + Media Content Production Manager", faculty: "content", courseIds: ["photography", "content-production"], months: 24, fee: null, deposit: null },
  { id: "d-film-music", title: "Film & TV + Music Production", faculty: "content", courseIds: ["film-tv", "music-production"], months: 18, fee: null, deposit: null },
  { id: "d-perf-film", title: "Performing Arts + Film & TV Production", faculty: "content", courseIds: ["performing-arts", "film-tv"], months: 18, fee: null, deposit: null },
  { id: "d-film-photo", title: "Film & TV + Photography", faculty: "content", courseIds: ["film-tv", "photography"], months: 12, fee: null, deposit: null },
  { id: "d-film-script", title: "Film & TV + Scriptwriting", faculty: "content", courseIds: ["film-tv", "scriptwriting"], months: 12, fee: null, deposit: null },

  // Performance
  { id: "d-perf-model", title: "Performing Arts + Modelling", faculty: "performance", courseIds: ["performing-arts", "modelling"], months: 12, fee: null, deposit: null },
  { id: "d-dance-model", title: "Dance Instruction + Modelling", faculty: "performance", courseIds: ["dance", "modelling"], months: 12, fee: null, deposit: null },
  { id: "d-perf-dance", title: "Performing Arts + Dance", faculty: "performance", courseIds: ["performing-arts", "dance"], months: 12, fee: null, deposit: null },

  // Visual
  { id: "d-advanced-graphic", title: "Advanced Graphic Design", faculty: "visual", courseIds: ["graphic-media", "motion-graphics"], months: 24, fee: null, deposit: null },
  { id: "d-graphic-animation", title: "Advanced Graphic Design & Animation", faculty: "visual", courseIds: ["graphic-media", "animation"], months: 24, fee: null, deposit: null },
  { id: "d-graphic-web", title: "Graphic & Web Design", faculty: "visual", courseIds: ["graphic-media", "interactive-media"], months: 24, fee: null, deposit: null },

  // Fashion
  { id: "d-fashion-dd", title: "Fashion Design & Development", faculty: "fashion", courseIds: ["fashion-development", "fashion-design"], months: 18, fee: null, deposit: null },
  { id: "d-fashion-sewing", title: "Fashion Development + Sewing", faculty: "fashion", courseIds: ["fashion-development", "sewing"], months: 24, fee: null, deposit: null },
  { id: "d-design-sewing", title: "Fashion Design + Sewing", faculty: "fashion", courseIds: ["fashion-design", "sewing"], months: 12, fee: null, deposit: null },

  // Business
  { id: "d-radio-journalism", title: "Radio & Journalism", faculty: "business", courseIds: ["radio-podcasting", "journalism"], months: 15, fee: null, deposit: null },
  { id: "d-project-events", title: "Project & Events Management", faculty: "business", courseIds: ["project-management", "events-management"], months: 15, fee: null, deposit: null },
];

export const courseById = (id: string) => courses.find((c) => c.id === id);

export const facultyById = (id: FacultyId) => faculties.find((f) => f.id === id)!;

export const dualsForCourse = (id: string) =>
  dualCourses.filter((d) => d.courseIds.includes(id));

export const formatZar = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

/** Individual fees added together, if both are known. */
export const separateFeeTotal = (dual: DualCourse): number | null => {
  const parts = dual.courseIds.map((id) => courseById(id)?.fee ?? null);
  if (parts.some((p) => p === null)) return null;
  return (parts as number[]).reduce((a, b) => a + b, 0);
};

export const dualSaving = (dual: DualCourse): number | null => {
  const total = separateFeeTotal(dual);
  if (total === null || dual.fee === null) return null;
  return total - dual.fee;
};

/** Longest individual duration, i.e. what back-to-back study would take. */
export const separateMonths = (dual: DualCourse): number =>
  dual.courseIds.reduce((sum, id) => sum + (courseById(id)?.months ?? 0), 0);

export const contact = {
  phone: "081 589 1088",
  website: "www.creativearts.co.za",
  campuses: [
    { city: "Durban", phone: "031 301 3313", address: "86 Stephen Dlamini Road, Musgrave" },
    { city: "Pietermaritzburg", phone: "033 342 2720", address: "157 Victoria Road, Victoria Shopping Centre" },
  ],
};
