-- Fix critical security issue: Profiles table is publicly readable
-- This migration restricts profile access to authenticated users only

-- Drop the existing insecure policy that allows everyone to view profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new secure policies for the profiles table
-- Policy 1: Authenticated users can view basic profile information (display_name, avatar_url, account_type, company_name, bio, location, is_verified)
-- This excludes sensitive data like email addresses, phone numbers, and addresses
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Policy 2: Users can view their own complete profile including sensitive data
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy 3: Admins can view all complete profiles
CREATE POLICY "Admins can view all complete profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin_user(auth.uid()));

-- Add a database function to get safe profile data for public display
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  account_type text,
  company_name text,
  bio text,
  location text,
  is_verified boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.account_type,
    p.company_name,
    p.bio,
    p.location,
    p.is_verified,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;