CREATE TABLE public.payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deposit numeric NOT NULL DEFAULT 0,
  instalments integer NOT NULL DEFAULT 1,
  instalment_amount numeric NOT NULL DEFAULT 0,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.course_payment_plans (
  course_id text NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, plan_id)
);
CREATE TABLE public.dual_payment_plans (
  dual_id text NOT NULL REFERENCES public.dual_courses(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  PRIMARY KEY (dual_id, plan_id)
);
ALTER TABLE public.dual_courses ADD COLUMN saving numeric;
GRANT ALL ON public.payment_plans, public.course_payment_plans, public.dual_payment_plans TO service_role;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dual_payment_plans ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.courses.fee IS 'DEPRECATED: replaced by payment plans';
COMMENT ON COLUMN public.courses.deposit IS 'DEPRECATED: replaced by payment plans';
COMMENT ON COLUMN public.dual_courses.fee IS 'DEPRECATED: replaced by payment plans';
COMMENT ON COLUMN public.dual_courses.deposit IS 'DEPRECATED: replaced by payment plans';