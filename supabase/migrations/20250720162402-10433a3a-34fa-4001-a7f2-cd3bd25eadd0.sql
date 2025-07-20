-- Create a dedicated table for service request messages
CREATE TABLE public.service_request_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  response_id UUID NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  message_type TEXT NOT NULL DEFAULT 'user_to_company'
);

-- Enable RLS
ALTER TABLE public.service_request_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can send messages" 
ON public.service_request_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their own messages" 
ON public.service_request_messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can update their received messages" 
ON public.service_request_messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Create index for better performance
CREATE INDEX idx_service_request_messages_request_id ON public.service_request_messages(request_id);
CREATE INDEX idx_service_request_messages_recipient_id ON public.service_request_messages(recipient_id);
CREATE INDEX idx_service_request_messages_sender_id ON public.service_request_messages(sender_id);