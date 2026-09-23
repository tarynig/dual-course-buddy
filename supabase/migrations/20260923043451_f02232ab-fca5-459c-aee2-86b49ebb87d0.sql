create table public.faculties (
  id text primary key,
  name text not null,
  tagline text not null,
  sort_order int not null default 0
);

create table public.courses (
  id text primary key,
  faculty_id text not null references public.faculties(id),
  name text not null,
  months int not null,
  type text not null,
  award text not null,
  saqa text,
  description text not null,
  fee numeric,
  deposit numeric,
  signature boolean not null default false,
  sort_order int not null default 0
);

create table public.dual_courses (
  id text primary key,
  title text not null,
  faculty_id text not null references public.faculties(id),
  months int not null,
  fee numeric,
  deposit numeric,
  sort_order int not null default 0
);

create table public.dual_course_courses (
  dual_id text not null references public.dual_courses(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  position int not null default 1,
  primary key (dual_id, course_id)
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  course_id text references public.courses(id),
  dual_course_id text references public.dual_courses(id),
  campus text not null,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- Access grants
grant select on public.faculties, public.courses, public.dual_courses, public.dual_course_courses to anon, authenticated;
grant all on public.faculties, public.courses, public.dual_courses, public.dual_course_courses to service_role;
grant insert on public.enquiries to anon;
grant select on public.enquiries to authenticated;
grant all on public.enquiries to service_role;

-- Row level security
alter table public.faculties enable row level security;
alter table public.courses enable row level security;
alter table public.dual_courses enable row level security;
alter table public.dual_course_courses enable row level security;
alter table public.enquiries enable row level security;

create policy "Public catalogue read: faculties" on public.faculties for select to anon, authenticated using (true);
create policy "Public catalogue read: courses" on public.courses for select to anon, authenticated using (true);
create policy "Public catalogue read: dual courses" on public.dual_courses for select to anon, authenticated using (true);
create policy "Public catalogue read: dual course items" on public.dual_course_courses for select to anon, authenticated using (true);
create policy "Anyone can submit an enquiry" on public.enquiries for insert to anon with check (true);

-- Seed data: faculties
insert into public.faculties (id, name, tagline, sort_order) values
  ('audio', 'Audio Production', 'Sound, music, radio and the business behind them.', 1),
  ('content', 'Content Production', 'Film, TV, photography and content management.', 2),
  ('performance', 'Performance Art', 'Acting, dance, presenting, modelling and image.', 3),
  ('visual', 'Visual Arts', 'Graphic design, motion, animation and web.', 4),
  ('fashion', 'Fashion', 'Design, pattern making, grading and sewing.', 5),
  ('tech', 'IT · 4IR Technology', 'AI, software, data, cloud and cybersecurity.', 6),
  ('business', 'Communication & Business', 'Marketing, journalism, projects and events.', 7);

-- Seed data: courses
insert into public.courses (id, faculty_id, name, months, type, award, saqa, description, fee, deposit, signature, sort_order) values
  ('sound-engineering', 'audio', 'Sound Engineering', 15, 'OC', 'OC: Sound Operator', '120748', 'A comprehensive qualification covering sound setup, live recording and production. Includes work experience, giving the learner industry access while studying.', null, null, false, 1),
  ('music-production', 'audio', 'Music Production', 12, 'SC', 'SC: Music Production (CAC Skills Programme)', null, 'A provider-based Skills Programme focused on Music Production and the Music Industry. It develops producers who understand how to make music and how to succeed in the global music business.', null, null, false, 2),
  ('dj-mio', 'audio', 'DJ & MIO (Music Industry Operation)', 12, 'SC', 'SC: DJ & MIO (CAC Skills Programme)', null, 'DJing has become a high-paying career, with DJs becoming powerful global brands. This course goes beyond masterful mixing and covers key music industry operations.', null, null, false, 3),
  ('radio-podcasting', 'audio', 'Radio Production & Podcasting', 15, 'OC', 'OC: Radio & Multimedia Content Practitioner', '122622', 'Develops practitioners in radio and multimedia development, broadcasting and streaming — a growing field incorporating audio-visual communication in the new age of technology.', null, null, false, 4),
  ('content-production', 'content', 'Content Production', 18, 'AOC', 'Advanced OC: Media Content Production Manager · NQF 6', '121157', 'Our signature advanced qualification, including formal work experience with the South African Film Institute and its associate companies. Includes bonus modules in film, radio, photography and media design.', null, null, true, 5),
  ('film-tv', 'content', 'Film & TV Production', 12, 'SC', 'SC: Film & TV Production (CAC Skills Programme)', null, 'The A to Z of filmmaking. Students gain knowledge of the various disciplines and specialise in a field such as camera, editing, lighting, production management or direction.', null, null, false, 6),
  ('photography', 'content', 'Photography', 12, 'SC', 'SC: Photography (CAC Skills Programme)', null, 'A career-aligned programme, both theoretical and practical, covering cameras, lenses and equipment, with lighting, imaging and editing as key units.', null, null, false, 7),
  ('scriptwriting', 'content', 'Scriptwriting', 12, 'SC', 'SC: Scriptwriting (CAC Skills Programme)', null, 'Creativity, format and technique drive this intense programme covering creative writing for film, television and other applications.', null, null, false, 8),
  ('performing-arts', 'performance', 'Performing Arts', 12, 'FETC', 'FETC: Performing Arts', '48808', 'An in-depth programme covering acting and presenting techniques, choreography, direction and production across theatre, television, film and live segments.', null, null, false, 9),
  ('dance', 'performance', 'Dance & Choreography', 12, 'FETC', 'FETC: Dance Instruction', '79986', 'Teaches dance, dance choreography and ultimately how to teach dance itself, incorporating various styles across foundations and practicals.', null, null, false, 10),
  ('modelling', 'performance', 'Modelling & Image Consulting', 12, 'SC', 'SC: Modelling & Image Consulting (CAC Skills Programme)', null, 'Image and presentation are big business. Modelling now extends to influencing and brand ambassadorship — this course prepares you for success in the field.', null, null, false, 11),
  ('graphic-media', 'visual', 'Graphic Design — Media', 12, 'OC', 'OC: Graphic Media Designer', '122663', 'Incorporates various techniques and software, preparing the student for a career as a Graphic Designer. Embodies both creativity and business.', null, null, false, 12),
  ('motion-graphics', 'visual', 'Graphic Design — Motion', 15, 'HOC', 'Higher OC: Motion Graphics Designer', '122621', 'Expands graphic design into motion graphics, going beyond static corporate media designs into complex, dynamic and active work.', null, null, false, 13),
  ('animation', 'visual', 'Animation', 15, 'HOC', 'Higher OC: Animation Artist', '122662', 'Animation remains a scarce, high-demand skill. Students critically apply animation principles across a range of applications to produce professional work.', null, null, false, 14),
  ('interactive-media', 'visual', 'Interactive Media (Web Design)', 15, 'HOC', 'Higher OC: Interactive Media Designer', '122664', 'A fusion of creativity and technology that enhances user experience across platforms. Businesses depend on communicating with their market interactively.', null, null, false, 15),
  ('graphic-animation', 'visual', 'Graphic Design & Animation', 12, 'SC', 'SC: Graphic Design & Animation (CAC Skills Programme)', null, 'A highly valued programme combining still and motion imagery in a practical, industry-aligned manner across various software applications.', null, null, false, 16),
  ('fashion-development', 'fashion', 'Fashion Development', 18, 'OC', 'OC: Apparel Pattern Maker & Grader', '115455', 'A comprehensive qualification covering garment development, teaching the technicalities of pattern making and grading.', null, null, false, 17),
  ('fashion-design', 'fashion', 'Fashion Design', 12, 'SC', 'SC: Fashion Design (CAC Skills Programme)', null, 'Equips the student to design a garment from beginning to end, including marketing a fashion brand.', null, null, false, 18),
  ('sewing', 'fashion', 'Sewing', 12, 'OC', 'OC: Sewing Machine Operator', '97238', 'Covers the knowledge and skills of sewing at a commercial and industrial level — a fundamental part of the fashion industry.', null, null, false, 19),
  ('ai-software-developer', 'tech', 'Artificial Intelligence Software Developer', 24, 'OC', 'OC: Artificial Intelligence Software Developer', '118792', 'Develops competencies in Artificial Intelligence. Learners study software development plus how to design code that can learn, adapt and grow. High global demand.', null, null, false, 20),
  ('software-developer', 'tech', 'Software Developer', 18, 'OC', 'OC: Software Developer', '118707', 'Prepares a learner to analyse a set of requirements and translate these into a working software solution using a programming language.', null, null, false, 21),
  ('data-science', 'tech', 'Data Science Practitioner', 18, 'OC', 'OC: Data Science Practitioner', '118708', 'Take custody of data and make it available in structured form — collecting, transforming and analysing data and communicating results to solve business problems.', null, null, false, 22),
  ('cybersecurity', 'tech', 'Cybersecurity Analyst', 15, 'OC', 'OC: Cybersecurity Analyst', '118986', 'Protect assets such as networks, computer systems and information assets from malicious attacks and threats.', null, null, false, 23),
  ('cloud-admin', 'tech', 'Cloud Administrator', 12, 'OC', 'OC: Cloud Administrator', '118699', 'Monitor, maintain, secure and troubleshoot networks of cloud platforms and computing resources — a new and emerging career.', null, null, false, 24),
  ('design-thinking', 'tech', 'Design Thinking', 12, 'OC', 'OC: Design Thinking Practitioner', '118705', 'Apply approaches and methodologies to understand complex challenges and collaboratively create innovative solutions that address human needs.', null, null, false, 25),
  ('marketing', 'business', 'Marketing', 15, 'HOC', 'Higher OC: Advertiser', '121447', 'Develops the skills to confidently support marketing activities in an organisation, covering all aspects of advertising.', null, null, false, 26),
  ('market-research', 'business', 'Market Research Analyst', 15, 'OC', 'OC: Market Research Analyst', '119450', 'Unpacks the behavioural patterns of consumers — a critically important segment of effective marketing engagements.', null, null, false, 27),
  ('journalism', 'business', 'Journalism', 12, 'SC', 'SC: New-Age Journalism (CAC Skills Programme)', null, 'A multifaceted look at journalism in the digital age: print, radio and television journalism, journalistic photography, online and interactive news media.', null, null, false, 28),
  ('project-management', 'business', 'Project Management', 15, 'OC', 'OC: Project Manager', '101869', 'Initiate, plan, execute, control and close out projects. Comprehensively trains and develops executive project managers.', null, null, false, 29),
  ('events-management', 'business', 'Events Management', 12, 'SC', 'SC: Events Management (CAC Skills Programme)', null, 'Formalises and develops knowledge in event management, preparing the student for the dynamic world of event co-ordination.', null, null, false, 30);

-- Seed data: dual courses and their two component courses
insert into public.dual_courses (id, title, faculty_id, months, fee, deposit, sort_order) values
  ('d-sound-music', 'Sound Engineering + Music Production', 'audio', 15, null, null, 1),
  ('d-sound-dj', 'Sound Engineering + DJ & MIO', 'audio', 15, null, null, 2),
  ('d-music-dj', 'Music Production + DJ & MIO', 'audio', 12, null, null, 3),
  ('d-radio-music', 'Radio & Podcasting + Music Production', 'audio', 15, null, null, 4),
  ('d-radio-dj', 'Radio & Podcasting + DJ & MIO', 'audio', 15, null, null, 5),
  ('d-film-content', 'Film & TV + Media Content Production Manager', 'content', 24, null, null, 6),
  ('d-music-content', 'Music Production + Media Content Production Manager', 'content', 24, null, null, 7),
  ('d-photo-content', 'Photography + Media Content Production Manager', 'content', 24, null, null, 8),
  ('d-film-music', 'Film & TV + Music Production', 'content', 18, null, null, 9),
  ('d-perf-film', 'Performing Arts + Film & TV Production', 'content', 18, null, null, 10),
  ('d-film-photo', 'Film & TV + Photography', 'content', 12, null, null, 11),
  ('d-film-script', 'Film & TV + Scriptwriting', 'content', 12, null, null, 12),
  ('d-perf-model', 'Performing Arts + Modelling', 'performance', 12, null, null, 13),
  ('d-dance-model', 'Dance Instruction + Modelling', 'performance', 12, null, null, 14),
  ('d-perf-dance', 'Performing Arts + Dance', 'performance', 12, null, null, 15),
  ('d-advanced-graphic', 'Advanced Graphic Design', 'visual', 24, null, null, 16),
  ('d-graphic-animation', 'Advanced Graphic Design & Animation', 'visual', 24, null, null, 17),
  ('d-graphic-web', 'Graphic & Web Design', 'visual', 24, null, null, 18),
  ('d-fashion-dd', 'Fashion Design & Development', 'fashion', 18, null, null, 19),
  ('d-fashion-sewing', 'Fashion Development + Sewing', 'fashion', 24, null, null, 20),
  ('d-design-sewing', 'Fashion Design + Sewing', 'fashion', 12, null, null, 21),
  ('d-radio-journalism', 'Radio & Journalism', 'business', 15, null, null, 22),
  ('d-project-events', 'Project & Events Management', 'business', 15, null, null, 23);

insert into public.dual_course_courses (dual_id, course_id, position) values
  ('d-sound-music', 'sound-engineering', 1), ('d-sound-music', 'music-production', 2),
  ('d-sound-dj', 'sound-engineering', 1), ('d-sound-dj', 'dj-mio', 2),
  ('d-music-dj', 'music-production', 1), ('d-music-dj', 'dj-mio', 2),
  ('d-radio-music', 'radio-podcasting', 1), ('d-radio-music', 'music-production', 2),
  ('d-radio-dj', 'radio-podcasting', 1), ('d-radio-dj', 'dj-mio', 2),
  ('d-film-content', 'film-tv', 1), ('d-film-content', 'content-production', 2),
  ('d-music-content', 'music-production', 1), ('d-music-content', 'content-production', 2),
  ('d-photo-content', 'photography', 1), ('d-photo-content', 'content-production', 2),
  ('d-film-music', 'film-tv', 1), ('d-film-music', 'music-production', 2),
  ('d-perf-film', 'performing-arts', 1), ('d-perf-film', 'film-tv', 2),
  ('d-film-photo', 'film-tv', 1), ('d-film-photo', 'photography', 2),
  ('d-film-script', 'film-tv', 1), ('d-film-script', 'scriptwriting', 2),
  ('d-perf-model', 'performing-arts', 1), ('d-perf-model', 'modelling', 2),
  ('d-dance-model', 'dance', 1), ('d-dance-model', 'modelling', 2),
  ('d-perf-dance', 'performing-arts', 1), ('d-perf-dance', 'dance', 2),
  ('d-advanced-graphic', 'graphic-media', 1), ('d-advanced-graphic', 'motion-graphics', 2),
  ('d-graphic-animation', 'graphic-media', 1), ('d-graphic-animation', 'animation', 2),
  ('d-graphic-web', 'graphic-media', 1), ('d-graphic-web', 'interactive-media', 2),
  ('d-fashion-dd', 'fashion-development', 1), ('d-fashion-dd', 'fashion-design', 2),
  ('d-fashion-sewing', 'fashion-development', 1), ('d-fashion-sewing', 'sewing', 2),
  ('d-design-sewing', 'fashion-design', 1), ('d-design-sewing', 'sewing', 2),
  ('d-radio-journalism', 'radio-podcasting', 1), ('d-radio-journalism', 'journalism', 2),
  ('d-project-events', 'project-management', 1), ('d-project-events', 'events-management', 2);