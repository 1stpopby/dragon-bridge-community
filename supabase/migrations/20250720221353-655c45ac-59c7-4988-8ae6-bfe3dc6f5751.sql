-- Create trigger function to notify service owners about new inquiries
CREATE OR REPLACE FUNCTION public.notify_service_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the service owner's user_id from the services table
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id,
    related_type
  )
  SELECT 
    s.user_id,
    'service_inquiry',
    'New Service Inquiry',
    'You received a new inquiry from ' || NEW.inquirer_name || ' for your service "' || s.name || '"',
    NEW.id,
    'service_inquiry'
  FROM services s
  WHERE s.id = NEW.service_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send notifications for new service inquiries
CREATE TRIGGER on_service_inquiry_created
  AFTER INSERT ON public.service_inquiries
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_service_inquiry();