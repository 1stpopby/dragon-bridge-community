-- Assign admin role to the user account
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT u.id, 'admin', now()
FROM auth.users u
WHERE u.email = 'fpopescum@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;