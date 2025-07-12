-- Create admin user and assign admin role
-- First, we need to create the user account using Supabase's admin functions

-- Insert the user into auth.users table (this requires admin privileges)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'fpopescum@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create profile for the admin user
INSERT INTO public.profiles (
  user_id,
  account_type,
  display_name,
  contact_email
)
SELECT 
  id,
  'user',
  'Admin User',
  'fpopescum@gmail.com'
FROM auth.users 
WHERE email = 'fpopescum@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Assign admin role to the user
INSERT INTO public.user_roles (
  user_id,
  role,
  granted_by,
  granted_at
)
SELECT 
  id,
  'admin',
  NULL,
  now()
FROM auth.users 
WHERE email = 'fpopescum@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;