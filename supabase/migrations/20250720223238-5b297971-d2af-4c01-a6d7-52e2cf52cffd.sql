-- Create table for service inquiry conversations (back-and-forth messages)
CREATE TABLE public.service_inquiry_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'company')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_inquiry_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for service inquiry conversations
CREATE POLICY "Users can view conversations for their own inquiries"
ON public.service_inquiry_conversations
FOR SELECT
USING (
  inquiry_id IN (
    SELECT si.id 
    FROM service_inquiries si
    WHERE si.user_id = auth.uid()
  )
  OR inquiry_id IN (
    SELECT si.id 
    FROM service_inquiries si
    JOIN services s ON si.service_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages for their own inquiries"
ON public.service_inquiry_conversations
FOR INSERT
WITH CHECK (
  (sender_type = 'user' AND sender_id = auth.uid() AND inquiry_id IN (
    SELECT si.id 
    FROM service_inquiries si
    WHERE si.user_id = auth.uid()
  ))
  OR 
  (sender_type = 'company' AND sender_id = auth.uid() AND inquiry_id IN (
    SELECT si.id 
    FROM service_inquiries si
    JOIN services s ON si.service_id = s.id
    WHERE s.user_id = auth.uid()
  ))
);

-- Create function to notify about new conversation messages
CREATE OR REPLACE FUNCTION public.notify_inquiry_conversation_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the other party in the conversation
  IF NEW.sender_type = 'user' THEN
    -- User sent message, notify company
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
      'service_inquiry_message',
      'New Message on Service Inquiry',
      'A customer sent a new message regarding their service inquiry',
      NEW.inquiry_id,
      'service_inquiry'
    FROM service_inquiries si
    JOIN services s ON si.service_id = s.id
    WHERE si.id = NEW.inquiry_id;
  ELSE
    -- Company sent message, notify user
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      content,
      related_id,
      related_type
    )
    SELECT 
      si.user_id,
      'service_inquiry_message',
      'New Message from Company',
      'A company sent a new message regarding your service inquiry',
      NEW.inquiry_id,
      'service_inquiry'
    FROM service_inquiries si
    WHERE si.id = NEW.inquiry_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_inquiry_conversation_message_created
  AFTER INSERT ON public.service_inquiry_conversations
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_inquiry_conversation_message();