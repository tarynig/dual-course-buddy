CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_role_check CHECK (role IN ('admin','staff'))
);

CREATE UNIQUE INDEX app_users_email_key ON public.app_users (lower(email));

CREATE TABLE public.app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX app_sessions_user_id_idx ON public.app_sessions (user_id);

GRANT ALL ON public.app_users TO service_role;
GRANT ALL ON public.app_sessions TO service_role;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER app_users_touch_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_users (email, password_hash, role)
VALUES ('taryn.wdb@gmail.com', crypt('CreativeArts2027!', gen_salt('bf', 10)), 'admin');
