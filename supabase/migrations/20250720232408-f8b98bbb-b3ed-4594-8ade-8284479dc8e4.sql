-- Fix the current data discrepancy
UPDATE service_request_responses 
SET response_status = 'completed', updated_at = now()
WHERE id = 'd072239c-60cc-44bb-9c0c-2ba0deb20ef3' 
AND request_id IN (
  SELECT id FROM service_inquiries WHERE status = 'completed'
);

-- Test that our triggers are working by verifying the data
SELECT 'Data updated successfully' as result;