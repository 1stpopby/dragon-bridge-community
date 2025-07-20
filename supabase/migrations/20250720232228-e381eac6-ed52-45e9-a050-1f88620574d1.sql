-- Improve the existing completion trigger to ensure both tables are updated properly
CREATE OR REPLACE FUNCTION public.mark_service_completed_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a service response is marked as completed, also mark the service inquiry as completed
  IF NEW.response_status = 'completed' AND OLD.response_status != 'completed' THEN
    UPDATE public.service_inquiries 
    SET status = 'completed', updated_at = now()
    WHERE id = NEW.request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update inquiry status when response is completed
DROP TRIGGER IF EXISTS mark_service_completed_on_response_completion ON public.service_request_responses;
CREATE TRIGGER mark_service_completed_on_response_completion
  AFTER UPDATE ON public.service_request_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_service_completed_on_completion();

-- Also improve the existing sync trigger to handle completion status
CREATE OR REPLACE FUNCTION sync_response_status_with_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  -- When a service inquiry status changes, update all related response statuses accordingly
  IF NEW.status != OLD.status THEN
    IF NEW.status IN ('accepted', 'declined', 'completed') THEN
      UPDATE service_request_responses 
      SET response_status = NEW.status, updated_at = now()
      WHERE request_id = NEW.id 
      AND response_status NOT IN ('completed'); -- Don't downgrade completed status
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;