-- Fix the completed_services view security definer issue
-- Drop the existing view completely
DROP VIEW IF EXISTS public.completed_services;

-- Recreate the view without any security definer property
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

-- Grant appropriate permissions to the view
GRANT SELECT ON public.completed_services TO authenticated;
GRANT SELECT ON public.completed_services TO anon;