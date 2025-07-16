-- COPY AND PASTE THIS INTO YOUR SUPABASE SQL EDITOR
-- This will fix the service system by adding 'completed' status support

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

-- Verify the changes worked
SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests
FROM public.service_inquiries 
WHERE inquiry_type = 'request_service'; 