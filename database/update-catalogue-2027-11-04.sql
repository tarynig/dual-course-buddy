-- Updated 2027 brochure, 4 November 2026. No fees are supplied in this brochure.
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.dual_courses ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
UPDATE public.courses SET months = 12 WHERE id = 'sound-engineering';
UPDATE public.courses SET months = 10 WHERE id = 'dj-mio';
UPDATE public.courses SET months = 12 WHERE id = 'radio-podcasting';
UPDATE public.courses SET months = 15 WHERE id = 'content-production';
UPDATE public.courses SET months = 12 WHERE id = 'motion-graphics';
UPDATE public.courses SET months = 12 WHERE id = 'animation';
UPDATE public.courses SET months = 12 WHERE id = 'interactive-media';
UPDATE public.courses SET months = 15 WHERE id = 'fashion-development';
UPDATE public.courses SET months = 15 WHERE id = 'ai-software-developer';
UPDATE public.courses SET months = 12 WHERE id = 'software-developer';
UPDATE public.courses SET months = 12 WHERE id = 'data-science';
UPDATE public.courses SET months = 12 WHERE id = 'cybersecurity';
UPDATE public.courses SET months = 12 WHERE id = 'marketing';
UPDATE public.courses SET name = 'Interactive Media' WHERE id = 'interactive-media';
UPDATE public.courses SET description = 'This qualification equips the student to design a garment from beginning to end, including marketing a fashion brand. Fashion crosses over cultural boundaries and extends itself globally, creating more career opportunities.' WHERE id = 'fashion-design';
UPDATE public.courses SET is_active = false WHERE id = 'graphic-animation';
INSERT INTO public.courses (id, faculty_id, name, months, type, award, description, sort_order) VALUES
('graphic-design-101', 'visual', 'Graphic Design 101', 12, 'SC', 'SC: Graphic Design 101 (CAC Skills Programme)', 'A highly valued programme that unpacks static and commercial media in a practical and industry-aligned manner. The learner will quickly learn to produce graphic content across various applications.', 16),
('animation-101', 'visual', 'Animation 101', 12, 'SC', 'SC: Animation 101 (CAC Skills Programme)', 'A highly valued programme that teaches motion imagery in a practical and industry-aligned manner. The learner will quickly learn to produce animation for various applications.', 17)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, award = EXCLUDED.award, description = EXCLUDED.description, months = EXCLUDED.months, sort_order = EXCLUDED.sort_order, is_active = true;
UPDATE public.dual_courses SET is_active = false WHERE id IN ('d-advanced-graphic', 'd-graphic-animation', 'd-graphic-web', 'd-fashion-sewing');
UPDATE public.dual_courses SET months = 12 WHERE id IN ('d-sound-music', 'd-sound-dj', 'd-music-dj', 'd-radio-music', 'd-radio-dj', 'd-film-music', 'd-perf-film', 'd-film-photo', 'd-film-script', 'd-perf-model', 'd-dance-model', 'd-perf-dance', 'd-design-sewing', 'd-radio-journalism');
UPDATE public.dual_courses SET months = 15 WHERE id IN ('d-film-content', 'd-music-content', 'd-photo-content', 'd-fashion-dd', 'd-project-events');
INSERT INTO public.dual_courses (id, title, faculty_id, months, sort_order) VALUES
('d-graphic-animation-101', 'Graphic Design — Media + Animation 101', 'visual', 12, 16),
('d-animation-graphic-101', 'Animation + Graphic Design 101', 'visual', 12, 17),
('d-interactive-graphic-101', 'Interactive Media + Graphic Design 101', 'visual', 12, 18)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, months = EXCLUDED.months, sort_order = EXCLUDED.sort_order, is_active = true;
INSERT INTO public.dual_course_courses (dual_id, course_id, position) VALUES
('d-graphic-animation-101', 'graphic-media', 1), ('d-graphic-animation-101', 'animation-101', 2),
('d-animation-graphic-101', 'animation', 1), ('d-animation-graphic-101', 'graphic-design-101', 2),
('d-interactive-graphic-101', 'interactive-media', 1), ('d-interactive-graphic-101', 'graphic-design-101', 2)
ON CONFLICT (dual_id, course_id) DO UPDATE SET position = EXCLUDED.position;
