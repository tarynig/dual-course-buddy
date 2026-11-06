ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.dual_courses ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;