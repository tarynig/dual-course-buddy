ALTER TABLE public.applications
  ALTER COLUMN last_school DROP NOT NULL,
  ALTER COLUMN highest_grade DROP NOT NULL,
  ALTER COLUMN grade_year DROP NOT NULL,
  ALTER COLUMN studied_elsewhere DROP NOT NULL;

COMMENT ON COLUMN public.applications.last_school IS 'Optional: applicants may leave the education section blank';
COMMENT ON COLUMN public.applications.highest_grade IS 'Optional: applicants may leave the education section blank';
COMMENT ON COLUMN public.applications.grade_year IS 'Optional: applicants may leave the education section blank';
COMMENT ON COLUMN public.applications.studied_elsewhere IS 'Optional: NULL means the applicant did not answer';