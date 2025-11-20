-- Add administrator role for gvaneverdingen@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrator'::user_role
FROM public.profiles
WHERE email = 'gvaneverdingen@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;