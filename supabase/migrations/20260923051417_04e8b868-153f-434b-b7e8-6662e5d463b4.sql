DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Public catalogue read: courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update dual courses" ON public.dual_courses;
DROP POLICY IF EXISTS "Public catalogue read: dual courses" ON public.dual_courses;
DROP POLICY IF EXISTS "Public catalogue read: dual course items" ON public.dual_course_courses;
DROP POLICY IF EXISTS "Public catalogue read: faculties" ON public.faculties;
DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can view enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

REVOKE ALL ON public.courses FROM anon, authenticated;
REVOKE ALL ON public.dual_courses FROM anon, authenticated;
REVOKE ALL ON public.dual_course_courses FROM anon, authenticated;
REVOKE ALL ON public.faculties FROM anon, authenticated;
REVOKE ALL ON public.enquiries FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP TABLE IF EXISTS public.user_roles;
DROP TYPE IF EXISTS public.app_role;
