CREATE OR REPLACE FUNCTION public.hash_password(plain text)
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, extensions
AS $$
  SELECT crypt(plain, gen_salt('bf', 10));
$$;

CREATE OR REPLACE FUNCTION public.verify_password(plain text, hashed text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT hashed = crypt(plain, hashed);
$$;

REVOKE ALL ON FUNCTION public.hash_password(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_password(text, text) FROM PUBLIC, anon, authenticated;

UPDATE public.app_users
SET password_hash = public.hash_password('CreativeArts2027!')
WHERE lower(email) = 'taryn.wdb@gmail.com';
