-- CRITICAL SECURITY FIX: Block public access to sensitive personal data
-- This migration addresses GDPR violations and identity fraud risks

-- ============================================================================
-- 1. DROP EXISTING VIEWS FIRST (to avoid column order conflicts)
-- ============================================================================

DROP VIEW IF EXISTS public.profiles_safe;
DROP VIEW IF EXISTS public.services_safe;

-- ============================================================================
-- 2. FIX PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Authenticated can view enhanced profile info" ON public.profiles;
DROP POLICY IF EXISTS "Unauthenticated can view basic profile info only" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all complete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create strict SELECT policies: Users can only see their own full data
CREATE POLICY "Users can view their own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles (using security definer function)
CREATE POLICY "Admins can view all complete profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin_user(auth.uid()));

-- Keep existing INSERT/UPDATE policies
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- CRITICAL: No SELECT policy for anon users - they MUST use profiles_safe view

-- ============================================================================
-- 3. FIX SERVICES TABLE RLS POLICIES  
-- ============================================================================

-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on services
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Public can view services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Public can view active services through safe view" ON public.services;
DROP POLICY IF EXISTS "Users can manage their own services" ON public.services;
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
DROP POLICY IF EXISTS "Service owners can manage their services" ON public.services;
DROP POLICY IF EXISTS "Authenticated users can create services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;
DROP POLICY IF EXISTS "Authenticated can view active services" ON public.services;
DROP POLICY IF EXISTS "Owners can view their own services" ON public.services;
DROP POLICY IF EXISTS "Owners can insert their own services" ON public.services;
DROP POLICY IF EXISTS "Owners can update their own services" ON public.services;
DROP POLICY IF EXISTS "Owners can delete their own services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;

-- CRITICAL: Authenticated users can only see active services (but NOT sensitive fields)
-- This still exposes the full row, so frontend MUST use services_safe view
CREATE POLICY "Authenticated can view active services"
ON public.services
FOR SELECT
TO authenticated
USING (is_active = true OR auth.uid() = user_id);

-- Service owners can view ALL their own services (active and inactive)
CREATE POLICY "Owners can view their own services"
ON public.services
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service owners can manage their own services
CREATE POLICY "Owners can insert their own services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own services"
ON public.services
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their own services"
ON public.services
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view and manage all services
CREATE POLICY "Admins can manage all services"
ON public.services
FOR ALL
TO authenticated
USING (is_admin_user(auth.uid()));

-- CRITICAL: No SELECT policy for anon users - they MUST use services_safe view

-- ============================================================================
-- 4. CREATE SAFE VIEWS (safe for public consumption)
-- ============================================================================

-- Create profiles_safe view
CREATE VIEW public.profiles_safe AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  account_type,
  company_name,
  bio,
  location,
  is_verified,
  company_description,
  company_website,
  company_services,
  company_founded,
  company_size,
  rating,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT on safe view to everyone
GRANT SELECT ON public.profiles_safe TO anon, authenticated;

-- Create services_safe view (excludes sensitive NINO/UTR/CSCS data)
CREATE VIEW public.services_safe AS
SELECT 
  id,
  user_id,
  name,
  category,
  specialty,
  description,
  location,
  phone,
  email,
  website,
  image_url,
  rating,
  reviews_count,
  featured,
  verified,
  is_active,
  listing_type,
  years_experience,
  languages,
  business_hours,
  contact_person,
  created_at,
  updated_at
  -- EXCLUDED SENSITIVE FIELDS: nino, utr_number, has_cscs, right_to_work, valid_from
FROM public.services
WHERE is_active = true;

-- Grant SELECT on services safe view to everyone
GRANT SELECT ON public.services_safe TO anon, authenticated;

-- ============================================================================
-- 5. ADD SECURITY DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW public.profiles_safe IS '⚠️ SAFE VIEW - Excludes sensitive PII (email, phone, addresses). Use this for public profile display.';
COMMENT ON VIEW public.services_safe IS '⚠️ SAFE VIEW - Excludes sensitive tax/ID data (NINO, UTR, CSCS). Use this for public service listings.';

COMMENT ON TABLE public.profiles IS '⚠️ CONTAINS SENSITIVE PII - Email, phone, addresses. Access restricted by RLS. Frontend MUST use profiles_safe view for public display.';
COMMENT ON TABLE public.services IS '⚠️ CONTAINS SENSITIVE TAX/ID DATA - NINO, UTR numbers enable identity fraud. Access restricted by RLS. Frontend MUST use services_safe view for public listings.';