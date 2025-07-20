-- Fix Supabase Security Advisor errors

-- 1. Enable RLS on services table (Policy Exists RLS Disabled error)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 2. Fix the completed_services view to remove security definer issue
-- Drop the existing view
DROP VIEW IF EXISTS public.completed_services;

-- Recreate the view without security definer (let it use invoker's rights)
CREATE VIEW public.completed_services AS
SELECT 
  sr.id as service_response_id,
  sr.request_id,
  si.inquiry_type as service_type,
  si.message as service_description,
  si.created_at as service_date,
  sr.response_message,
  sr.estimated_cost,
  sr.created_at as completion_date,
  p.company_name,
  p.display_name as company_display_name,
  sr.company_id
FROM service_request_responses sr
JOIN service_inquiries si ON sr.request_id = si.id
JOIN profiles p ON sr.company_id = p.id
WHERE sr.response_status = 'completed';

-- 3. Create proper RLS policies for services table if they don't exist
CREATE POLICY IF NOT EXISTS "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Companies can manage their own services" 
ON public.services 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE id = services.company_id AND account_type = 'company'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE id = services.company_id AND account_type = 'company'
  )
);