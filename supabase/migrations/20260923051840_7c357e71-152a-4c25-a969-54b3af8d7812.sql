GRANT EXECUTE ON FUNCTION public.hash_password(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_password(text, text) TO PUBLIC;
REVOKE EXECUTE ON FUNCTION public.hash_password(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_password(text, text) FROM anon, authenticated;
