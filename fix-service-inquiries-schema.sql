-- Fix service_inquiries table schema
-- Run this in your Supabase SQL editor

-- Add 'completed' to the allowed status values for service_inquiries table
ALTER TABLE public.service_inquiries 
DROP CONSTRAINT IF EXISTS service_inquiries_status_check;

ALTER TABLE public.service_inquiries 
ADD CONSTRAINT service_inquiries_status_check 
CHECK (status IN ('pending', 'responded', 'closed', 'completed'));

-- Add updated_at column if it doesn't exist
ALTER TABLE public.service_inquiries 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create trigger for automatic timestamp updates on service_inquiries
CREATE OR REPLACE TRIGGER update_service_inquiries_updated_at
BEFORE UPDATE ON public.service_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update main service request status when response is completed
CREATE OR REPLACE FUNCTION public.update_service_request_status_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a response is marked as completed, update the main service request status
  IF NEW.response_status = 'completed' AND OLD.response_status != 'completed' THEN
    UPDATE public.service_inquiries 
    SET status = 'completed', updated_at = now()
    WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on service_request_responses to update main table
CREATE OR REPLACE TRIGGER update_main_request_status_trigger
AFTER UPDATE ON public.service_request_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_service_request_status_on_completion();

-- Update any existing completed responses to also mark the main request as completed
UPDATE public.service_inquiries 
SET status = 'completed' 
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM public.service_request_responses 
  WHERE response_status = 'completed'
); 