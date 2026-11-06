CREATE TABLE public.deposit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text REFERENCES public.courses(id),
  dual_course_id text REFERENCES public.dual_courses(id),
  plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  plan_name text,
  amount numeric NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_ref text,
  amount_paid numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT ALL ON public.deposit_payments TO service_role;
ALTER TABLE public.deposit_payments ENABLE ROW LEVEL SECURITY;