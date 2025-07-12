-- Create a function to assign admin role to a specific email
CREATE OR REPLACE FUNCTION public.assign_admin_role_to_email(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = user_email;
  
  -- If user exists, create profile if not exists
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (
      user_id,
      account_type,
      display_name,
      contact_email
    ) VALUES (
      target_user_id,
      'user',
      'Admin User',
      user_email
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign admin role
    INSERT INTO public.user_roles (
      user_id,
      role,
      granted_at
    ) VALUES (
      target_user_id,
      'admin',
      now()
    ) ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user: %', user_email;
  ELSE
    RAISE NOTICE 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign admin role to the specified email
SELECT public.assign_admin_role_to_email('fpopescum@gmail.com');