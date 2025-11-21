-- Make arnoudtaminiau@gmail.com an administrator
-- First, delete any existing roles for this user
DELETE FROM public.user_roles WHERE user_id = 'ef0e9886-bd40-4403-99ea-f62ebb3a995c';

-- Insert administrator role
INSERT INTO public.user_roles (user_id, role)
VALUES ('ef0e9886-bd40-4403-99ea-f62ebb3a995c', 'administrator');