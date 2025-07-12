-- Fix infinite recursion in user_roles RLS policy
-- Drop the problematic policy first
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Create a security definer function to safely check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = check_user_id 
    AND ur.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies that won't cause recursion
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Make sure users can view roles (needed for admin checks)
CREATE POLICY "Users can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (true);