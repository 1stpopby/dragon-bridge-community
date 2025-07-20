-- Fix the existing pending response that should be accepted
UPDATE service_request_responses 
SET response_status = 'accepted', updated_at = now()
WHERE id = 'd072239c-60cc-44bb-9c0c-2ba0deb20ef3' 
AND response_status = 'pending'
AND request_id IN (
  SELECT id FROM service_inquiries WHERE status = 'accepted'
);

-- Add a trigger to automatically sync response status with inquiry status
CREATE OR REPLACE FUNCTION sync_response_status_with_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  -- When a service inquiry status changes to accepted/declined, 
  -- update all related response statuses accordingly
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'declined') THEN
    UPDATE service_request_responses 
    SET response_status = NEW.status, updated_at = now()
    WHERE request_id = NEW.id 
    AND response_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync statuses
CREATE TRIGGER sync_response_status_trigger
  AFTER UPDATE ON service_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION sync_response_status_with_inquiry();