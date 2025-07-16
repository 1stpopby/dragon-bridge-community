-- Fix service system by adding 'completed' status to service_inquiries table
-- Run this in your Supabase SQL editor

-- 1. Drop the existing status constraint
ALTER TABLE public.service_inquiries 
DROP CONSTRAINT IF EXISTS service_inquiries_status_check;

-- 2. Add the new constraint with 'completed' status
ALTER TABLE public.service_inquiries 
ADD CONSTRAINT service_inquiries_status_check 
CHECK (status IN ('pending', 'responded', 'closed', 'completed'));

-- 3. Add updated_at column if it doesn't exist
ALTER TABLE public.service_inquiries 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 4. Create trigger for automatic timestamp updates on service_inquiries
CREATE OR REPLACE TRIGGER update_service_inquiries_updated_at
BEFORE UPDATE ON public.service_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create function to update main service request status when response is completed
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

-- 6. Create trigger to automatically update service request status when response is completed
CREATE OR REPLACE TRIGGER update_service_request_status_trigger
AFTER UPDATE ON public.service_request_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_service_request_status_on_completion();

-- 7. Update any existing service requests that should be marked as completed
UPDATE public.service_inquiries 
SET status = 'completed', updated_at = now()
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM public.service_request_responses 
  WHERE response_status = 'completed'
);

-- 8. Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_service_inquiries_status ON public.service_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_service_inquiries_user_id_status ON public.service_inquiries(user_id, status);

-- Verify the changes
SELECT 
  'service_inquiries' as table_name,
  'status constraint updated' as change_description,
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'service_inquiries_status_check'; 