-- Add trigger to create notifications when messages are sent
CREATE OR REPLACE FUNCTION public.notify_message_recipient()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the recipient
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id,
    related_type
  ) VALUES (
    NEW.recipient_id,
    CASE 
      WHEN NEW.message_type = 'user_to_company' THEN 'service_message'
      WHEN NEW.message_type = 'company_to_user' THEN 'service_reply'
      ELSE 'message'
    END,
    CASE 
      WHEN NEW.message_type = 'user_to_company' THEN 'New Service Request Message'
      WHEN NEW.message_type = 'company_to_user' THEN 'Service Request Reply'
      ELSE 'New Message'
    END,
    CASE 
      WHEN NEW.message_type = 'user_to_company' THEN 'You received a new message about a service request'
      WHEN NEW.message_type = 'company_to_user' THEN 'A company replied to your service request'
      ELSE 'You have a new message'
    END,
    NEW.request_id,
    'service_request'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for service request messages
CREATE TRIGGER trigger_notify_message_recipient
  AFTER INSERT ON public.service_request_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_recipient();