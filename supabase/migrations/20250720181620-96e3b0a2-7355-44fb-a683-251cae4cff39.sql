-- Fix service inquiries status constraint to include accepted and declined
ALTER TABLE public.service_inquiries 
DROP CONSTRAINT service_inquiries_status_check;

-- Add new constraint with all valid statuses
ALTER TABLE public.service_inquiries 
ADD CONSTRAINT service_inquiries_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'responded'::text, 'accepted'::text, 'declined'::text, 'closed'::text, 'completed'::text]));