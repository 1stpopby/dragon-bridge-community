-- Fix RLS policies for service requests
-- Run this in your Supabase SQL editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own inquiries and service owners can view inquiries for their services" ON public.service_inquiries;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON public.service_inquiries;
DROP POLICY IF EXISTS "Users can update their own inquiries" ON public.service_inquiries;

-- Create new policies that allow proper access to service requests
CREATE POLICY "Users can view their own inquiries" 
ON public.service_inquiries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service owners can view inquiries for their services" 
ON public.service_inquiries 
FOR SELECT 
USING (
  service_id IS NOT NULL AND 
  auth.uid() IN (
    SELECT user_id FROM public.services WHERE id = service_inquiries.service_id
  )
);

CREATE POLICY "Anyone can view service requests" 
ON public.service_inquiries 
FOR SELECT 
USING (
  inquiry_type = 'request_service' AND 
  service_id IS NULL
);

-- Allow companies to respond to service requests
CREATE POLICY "Companies can respond to service requests" 
ON public.service_inquiries 
FOR INSERT 
WITH CHECK (
  inquiry_type = 'contact' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND account_type = 'company'
  )
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

-- Allow users to update their own inquiries
CREATE POLICY "Users can update their own inquiries" 
ON public.service_inquiries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_inquiries_type_service_id ON public.service_inquiries(inquiry_type, service_id); 