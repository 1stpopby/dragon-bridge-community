-- Update existing services that have feedback to completed status
UPDATE service_inquiries 
SET status = 'completed', updated_at = now()
WHERE id IN (
  SELECT DISTINCT request_id FROM service_feedback
);

-- Update service responses that have feedback to completed status
UPDATE service_request_responses 
SET response_status = 'completed', updated_at = now()
WHERE request_id IN (
  SELECT DISTINCT request_id FROM service_feedback
);

-- Create function to automatically mark services as completed when feedback is submitted
CREATE OR REPLACE FUNCTION public.mark_service_completed_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the service inquiry status to completed
  UPDATE public.service_inquiries 
  SET status = 'completed', updated_at = now()
  WHERE id = NEW.request_id;
  
  -- Update the service response status to completed
  UPDATE public.service_request_responses 
  SET response_status = 'completed', updated_at = now()
  WHERE id = NEW.response_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically mark services as completed when feedback is submitted
DROP TRIGGER IF EXISTS trigger_mark_service_completed_on_feedback ON public.service_feedback;
CREATE TRIGGER trigger_mark_service_completed_on_feedback
  AFTER INSERT ON public.service_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_service_completed_on_feedback();