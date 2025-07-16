-- Fix Service Response System
-- Run this script in your Supabase SQL editor

-- First, ensure the service_request_responses table exists
CREATE TABLE IF NOT EXISTS public.service_request_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_message TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  estimated_cost TEXT,
  availability TEXT,
  response_status TEXT NOT NULL DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_request_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for service_request_responses
CREATE POLICY "Companies can view responses to their requests" 
ON public.service_request_responses 
FOR SELECT 
USING (
  company_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'company'
  )
);

CREATE POLICY "Companies can create responses" 
ON public.service_request_responses 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'company'
  )
);

CREATE POLICY "Companies can update their own responses" 
ON public.service_request_responses 
FOR UPDATE 
USING (
  company_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'company'
  )
);

CREATE POLICY "Request owners can view all responses to their requests" 
ON public.service_request_responses 
FOR SELECT 
USING (
  request_id IN (
    SELECT id FROM public.service_inquiries WHERE user_id = auth.uid()
  )
);

-- Fix service_inquiries table constraints
ALTER TABLE public.service_inquiries 
DROP CONSTRAINT IF EXISTS service_inquiries_inquiry_type_check;

ALTER TABLE public.service_inquiries 
ADD CONSTRAINT service_inquiries_inquiry_type_check 
CHECK (inquiry_type IN ('contact', 'request_service', 'service_response'));

-- Update RLS policies for service_inquiries
DROP POLICY IF EXISTS "Anyone can view service requests" ON public.service_inquiries;
DROP POLICY IF EXISTS "Companies can respond to service requests" ON public.service_inquiries;
DROP POLICY IF EXISTS "Authenticated users can create service requests" ON public.service_inquiries;

-- Allow everyone to view service requests
CREATE POLICY "Anyone can view service requests" 
ON public.service_inquiries 
FOR SELECT 
USING (
  inquiry_type = 'request_service' AND 
  service_id IS NULL
);

-- Allow companies to respond to service requests (create contact inquiries)
CREATE POLICY "Companies can respond to service requests" 
ON public.service_inquiries 
FOR INSERT 
WITH CHECK (
  inquiry_type = 'contact' AND 
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to create service requests
CREATE POLICY "Authenticated users can create service requests" 
ON public.service_inquiries 
FOR INSERT 
WITH CHECK (
  inquiry_type = 'request_service' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- Add responses_count column if it doesn't exist
ALTER TABLE public.service_inquiries 
ADD COLUMN IF NOT EXISTS responses_count INTEGER DEFAULT 0;

-- Create function to update response count
CREATE OR REPLACE FUNCTION public.update_service_request_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.service_inquiries 
    SET responses_count = responses_count + 1 
    WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.service_inquiries 
    SET responses_count = responses_count - 1 
    WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for response count updates
DROP TRIGGER IF EXISTS update_response_count_trigger ON public.service_request_responses;
CREATE TRIGGER update_response_count_trigger
AFTER INSERT OR DELETE ON public.service_request_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_service_request_response_count();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_request_responses_request_id ON public.service_request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_responses_company_id ON public.service_request_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_service_inquiries_inquiry_type ON public.service_inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_service_inquiries_user_id ON public.service_inquiries(user_id);

-- Clean up any orphaned responses that might have wrong user_id
-- This will help identify responses that were created with wrong user_id
SELECT 
  si.id,
  si.inquirer_name,
  si.user_id,
  si.message,
  si.inquiry_type,
  si.created_at
FROM public.service_inquiries si
WHERE si.inquiry_type = 'contact' 
  AND si.message LIKE '%Response to your service request:%'
  AND si.user_id != (
    SELECT sr.user_id 
    FROM public.service_inquiries sr 
    WHERE sr.id = (
      SELECT regexp_match(si.message, 'Original Request ID: ([a-f0-9-]+)')::text[]
    )[1]::uuid
  );

-- Fix any existing responses that have wrong user_id
-- This will move responses to the correct user_id
UPDATE public.service_inquiries 
SET user_id = (
  SELECT sr.user_id 
  FROM public.service_inquiries sr 
  WHERE sr.id = (
    SELECT regexp_matches(service_inquiries.message, 'Original Request ID: ([a-f0-9-]+)')::text[]
  )[1]::uuid
)
WHERE inquiry_type = 'contact' 
  AND message LIKE '%Response to your service request:%'
  AND message LIKE '%Original Request ID:%';

-- Verify the fix worked
SELECT 
  'Fixed responses' as status,
  COUNT(*) as count
FROM public.service_inquiries si
WHERE si.inquiry_type = 'contact' 
  AND si.message LIKE '%Response to your service request:%'; 