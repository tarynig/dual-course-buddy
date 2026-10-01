--
-- PostgreSQL database dump
--

\restrict T0NfJ8ayeL8Mjr5S5ijkh0qrL21q1GGc8s3vBfmaY5W2uNXpeTJ7IsenAwvfZ91

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: hash_password(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hash_password(plain text) RETURNS text
    LANGUAGE sql
    SET search_path TO 'public', 'extensions'
    AS $$
  SELECT crypt(plain, gen_salt('bf', 10));
$$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: verify_password(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_password(plain text, hashed text) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'extensions'
    AS $$
  SELECT hashed = crypt(plain, hashed);
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'staff'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT app_users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'staff'::text])))
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id text NOT NULL,
    faculty_id text NOT NULL,
    name text NOT NULL,
    months integer NOT NULL,
    type text NOT NULL,
    award text NOT NULL,
    saqa text,
    description text NOT NULL,
    fee numeric,
    deposit numeric,
    signature boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: dual_course_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dual_course_courses (
    dual_id text NOT NULL,
    course_id text NOT NULL,
    "position" integer DEFAULT 1 NOT NULL
);


--
-- Name: dual_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dual_courses (
    id text NOT NULL,
    title text NOT NULL,
    faculty_id text NOT NULL,
    months integer NOT NULL,
    fee numeric,
    deposit numeric,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: enquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    course_id text,
    dual_course_id text,
    campus text NOT NULL,
    message text,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faculties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculties (
    id text NOT NULL,
    name text NOT NULL,
    tagline text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, faculty_id, name, months, type, award, saqa, description, fee, deposit, signature, sort_order) FROM stdin;
sound-engineering	audio	Sound Engineering	15	OC	OC: Sound Operator	120748	A comprehensive qualification covering sound setup, live recording and production. Includes work experience, giving the learner industry access while studying.	\N	\N	f	1
music-production	audio	Music Production	12	SC	SC: Music Production (CAC Skills Programme)	\N	A provider-based Skills Programme focused on Music Production and the Music Industry. It develops producers who understand how to make music and how to succeed in the global music business.	\N	\N	f	2
dj-mio	audio	DJ & MIO (Music Industry Operation)	12	SC	SC: DJ & MIO (CAC Skills Programme)	\N	DJing has become a high-paying career, with DJs becoming powerful global brands. This course goes beyond masterful mixing and covers key music industry operations.	\N	\N	f	3
radio-podcasting	audio	Radio Production & Podcasting	15	OC	OC: Radio & Multimedia Content Practitioner	122622	Develops practitioners in radio and multimedia development, broadcasting and streaming — a growing field incorporating audio-visual communication in the new age of technology.	\N	\N	f	4
content-production	content	Content Production	18	AOC	Advanced OC: Media Content Production Manager · NQF 6	121157	Our signature advanced qualification, including formal work experience with the South African Film Institute and its associate companies. Includes bonus modules in film, radio, photography and media design.	\N	\N	t	5
film-tv	content	Film & TV Production	12	SC	SC: Film & TV Production (CAC Skills Programme)	\N	The A to Z of filmmaking. Students gain knowledge of the various disciplines and specialise in a field such as camera, editing, lighting, production management or direction.	\N	\N	f	6
photography	content	Photography	12	SC	SC: Photography (CAC Skills Programme)	\N	A career-aligned programme, both theoretical and practical, covering cameras, lenses and equipment, with lighting, imaging and editing as key units.	\N	\N	f	7
scriptwriting	content	Scriptwriting	12	SC	SC: Scriptwriting (CAC Skills Programme)	\N	Creativity, format and technique drive this intense programme covering creative writing for film, television and other applications.	\N	\N	f	8
performing-arts	performance	Performing Arts	12	FETC	FETC: Performing Arts	48808	An in-depth programme covering acting and presenting techniques, choreography, direction and production across theatre, television, film and live segments.	\N	\N	f	9
dance	performance	Dance & Choreography	12	FETC	FETC: Dance Instruction	79986	Teaches dance, dance choreography and ultimately how to teach dance itself, incorporating various styles across foundations and practicals.	\N	\N	f	10
modelling	performance	Modelling & Image Consulting	12	SC	SC: Modelling & Image Consulting (CAC Skills Programme)	\N	Image and presentation are big business. Modelling now extends to influencing and brand ambassadorship — this course prepares you for success in the field.	\N	\N	f	11
graphic-media	visual	Graphic Design — Media	12	OC	OC: Graphic Media Designer	122663	Incorporates various techniques and software, preparing the student for a career as a Graphic Designer. Embodies both creativity and business.	\N	\N	f	12
motion-graphics	visual	Graphic Design — Motion	15	HOC	Higher OC: Motion Graphics Designer	122621	Expands graphic design into motion graphics, going beyond static corporate media designs into complex, dynamic and active work.	\N	\N	f	13
animation	visual	Animation	15	HOC	Higher OC: Animation Artist	122662	Animation remains a scarce, high-demand skill. Students critically apply animation principles across a range of applications to produce professional work.	\N	\N	f	14
interactive-media	visual	Interactive Media (Web Design)	15	HOC	Higher OC: Interactive Media Designer	122664	A fusion of creativity and technology that enhances user experience across platforms. Businesses depend on communicating with their market interactively.	\N	\N	f	15
graphic-animation	visual	Graphic Design & Animation	12	SC	SC: Graphic Design & Animation (CAC Skills Programme)	\N	A highly valued programme combining still and motion imagery in a practical, industry-aligned manner across various software applications.	\N	\N	f	16
fashion-development	fashion	Fashion Development	18	OC	OC: Apparel Pattern Maker & Grader	115455	A comprehensive qualification covering garment development, teaching the technicalities of pattern making and grading.	\N	\N	f	17
fashion-design	fashion	Fashion Design	12	SC	SC: Fashion Design (CAC Skills Programme)	\N	Equips the student to design a garment from beginning to end, including marketing a fashion brand.	\N	\N	f	18
sewing	fashion	Sewing	12	OC	OC: Sewing Machine Operator	97238	Covers the knowledge and skills of sewing at a commercial and industrial level — a fundamental part of the fashion industry.	\N	\N	f	19
ai-software-developer	tech	Artificial Intelligence Software Developer	24	OC	OC: Artificial Intelligence Software Developer	118792	Develops competencies in Artificial Intelligence. Learners study software development plus how to design code that can learn, adapt and grow. High global demand.	\N	\N	f	20
software-developer	tech	Software Developer	18	OC	OC: Software Developer	118707	Prepares a learner to analyse a set of requirements and translate these into a working software solution using a programming language.	\N	\N	f	21
data-science	tech	Data Science Practitioner	18	OC	OC: Data Science Practitioner	118708	Take custody of data and make it available in structured form — collecting, transforming and analysing data and communicating results to solve business problems.	\N	\N	f	22
cybersecurity	tech	Cybersecurity Analyst	15	OC	OC: Cybersecurity Analyst	118986	Protect assets such as networks, computer systems and information assets from malicious attacks and threats.	\N	\N	f	23
cloud-admin	tech	Cloud Administrator	12	OC	OC: Cloud Administrator	118699	Monitor, maintain, secure and troubleshoot networks of cloud platforms and computing resources — a new and emerging career.	\N	\N	f	24
design-thinking	tech	Design Thinking	12	OC	OC: Design Thinking Practitioner	118705	Apply approaches and methodologies to understand complex challenges and collaboratively create innovative solutions that address human needs.	\N	\N	f	25
marketing	business	Marketing	15	HOC	Higher OC: Advertiser	121447	Develops the skills to confidently support marketing activities in an organisation, covering all aspects of advertising.	\N	\N	f	26
market-research	business	Market Research Analyst	15	OC	OC: Market Research Analyst	119450	Unpacks the behavioural patterns of consumers — a critically important segment of effective marketing engagements.	\N	\N	f	27
journalism	business	Journalism	12	SC	SC: New-Age Journalism (CAC Skills Programme)	\N	A multifaceted look at journalism in the digital age: print, radio and television journalism, journalistic photography, online and interactive news media.	\N	\N	f	28
project-management	business	Project Management	15	OC	OC: Project Manager	101869	Initiate, plan, execute, control and close out projects. Comprehensively trains and develops executive project managers.	\N	\N	f	29
events-management	business	Events Management	12	SC	SC: Events Management (CAC Skills Programme)	\N	Formalises and develops knowledge in event management, preparing the student for the dynamic world of event co-ordination.	\N	\N	f	30
\.


--
-- Data for Name: dual_course_courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dual_course_courses (dual_id, course_id, "position") FROM stdin;
d-sound-music	sound-engineering	1
d-sound-music	music-production	2
d-sound-dj	sound-engineering	1
d-sound-dj	dj-mio	2
d-music-dj	music-production	1
d-music-dj	dj-mio	2
d-radio-music	radio-podcasting	1
d-radio-music	music-production	2
d-radio-dj	radio-podcasting	1
d-radio-dj	dj-mio	2
d-film-content	film-tv	1
d-film-content	content-production	2
d-music-content	music-production	1
d-music-content	content-production	2
d-photo-content	photography	1
d-photo-content	content-production	2
d-film-music	film-tv	1
d-film-music	music-production	2
d-perf-film	performing-arts	1
d-perf-film	film-tv	2
d-film-photo	film-tv	1
d-film-photo	photography	2
d-film-script	film-tv	1
d-film-script	scriptwriting	2
d-perf-model	performing-arts	1
d-perf-model	modelling	2
d-dance-model	dance	1
d-dance-model	modelling	2
d-perf-dance	performing-arts	1
d-perf-dance	dance	2
d-advanced-graphic	graphic-media	1
d-advanced-graphic	motion-graphics	2
d-graphic-animation	graphic-media	1
d-graphic-animation	animation	2
d-graphic-web	graphic-media	1
d-graphic-web	interactive-media	2
d-fashion-dd	fashion-development	1
d-fashion-dd	fashion-design	2
d-fashion-sewing	fashion-development	1
d-fashion-sewing	sewing	2
d-design-sewing	fashion-design	1
d-design-sewing	sewing	2
d-radio-journalism	radio-podcasting	1
d-radio-journalism	journalism	2
d-project-events	project-management	1
d-project-events	events-management	2
\.


--
-- Data for Name: dual_courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dual_courses (id, title, faculty_id, months, fee, deposit, sort_order) FROM stdin;
d-sound-dj	Sound Engineering + DJ & MIO	audio	15	\N	\N	2
d-music-dj	Music Production + DJ & MIO	audio	12	\N	\N	3
d-radio-music	Radio & Podcasting + Music Production	audio	15	\N	\N	4
d-radio-dj	Radio & Podcasting + DJ & MIO	audio	15	\N	\N	5
d-film-content	Film & TV + Media Content Production Manager	content	24	\N	\N	6
d-music-content	Music Production + Media Content Production Manager	content	24	\N	\N	7
d-photo-content	Photography + Media Content Production Manager	content	24	\N	\N	8
d-film-music	Film & TV + Music Production	content	18	\N	\N	9
d-perf-film	Performing Arts + Film & TV Production	content	18	\N	\N	10
d-film-photo	Film & TV + Photography	content	12	\N	\N	11
d-film-script	Film & TV + Scriptwriting	content	12	\N	\N	12
d-perf-model	Performing Arts + Modelling	performance	12	\N	\N	13
d-dance-model	Dance Instruction + Modelling	performance	12	\N	\N	14
d-perf-dance	Performing Arts + Dance	performance	12	\N	\N	15
d-advanced-graphic	Advanced Graphic Design	visual	24	\N	\N	16
d-graphic-animation	Advanced Graphic Design & Animation	visual	24	\N	\N	17
d-graphic-web	Graphic & Web Design	visual	24	\N	\N	18
d-fashion-dd	Fashion Design & Development	fashion	18	\N	\N	19
d-fashion-sewing	Fashion Development + Sewing	fashion	24	\N	\N	20
d-design-sewing	Fashion Design + Sewing	fashion	12	\N	\N	21
d-radio-journalism	Radio & Journalism	business	15	\N	\N	22
d-project-events	Project & Events Management	business	15	\N	\N	23
d-sound-music	Sound Engineering + Music Production	audio	15	8000	600	1
\.


--
-- Data for Name: faculties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.faculties (id, name, tagline, sort_order) FROM stdin;
audio	Audio Production	Sound, music, radio and the business behind them.	1
content	Content Production	Film, TV, photography and content management.	2
performance	Performance Art	Acting, dance, presenting, modelling and image.	3
visual	Visual Arts	Graphic design, motion, animation and web.	4
fashion	Fashion	Design, pattern making, grading and sewing.	5
tech	IT · 4IR Technology	AI, software, data, cloud and cybersecurity.	6
business	Communication & Business	Marketing, journalism, projects and events.	7
\.


--
-- Name: app_sessions app_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_sessions
    ADD CONSTRAINT app_sessions_pkey PRIMARY KEY (id);


--
-- Name: app_sessions app_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_sessions
    ADD CONSTRAINT app_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: app_users app_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: dual_course_courses dual_course_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dual_course_courses
    ADD CONSTRAINT dual_course_courses_pkey PRIMARY KEY (dual_id, course_id);


--
-- Name: dual_courses dual_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dual_courses
    ADD CONSTRAINT dual_courses_pkey PRIMARY KEY (id);


--
-- Name: enquiries enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);


--
-- Name: faculties faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (id);


--
-- Name: app_sessions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX app_sessions_user_id_idx ON public.app_sessions USING btree (user_id);


--
-- Name: app_users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX app_users_email_key ON public.app_users USING btree (lower(email));


--
-- Name: app_users app_users_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER app_users_touch_updated_at BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: app_sessions app_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_sessions
    ADD CONSTRAINT app_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;


--
-- Name: courses courses_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id);


--
-- Name: dual_course_courses dual_course_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dual_course_courses
    ADD CONSTRAINT dual_course_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: dual_course_courses dual_course_courses_dual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dual_course_courses
    ADD CONSTRAINT dual_course_courses_dual_id_fkey FOREIGN KEY (dual_id) REFERENCES public.dual_courses(id) ON DELETE CASCADE;


--
-- Name: dual_courses dual_courses_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dual_courses
    ADD CONSTRAINT dual_courses_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id);


--
-- Name: enquiries enquiries_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: enquiries enquiries_dual_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_dual_course_id_fkey FOREIGN KEY (dual_course_id) REFERENCES public.dual_courses(id);


--
-- Name: app_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: app_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: dual_course_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dual_course_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: dual_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dual_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: enquiries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

--
-- Name: faculties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict T0NfJ8ayeL8Mjr5S5ijkh0qrL21q1GGc8s3vBfmaY5W2uNXpeTJ7IsenAwvfZ91

