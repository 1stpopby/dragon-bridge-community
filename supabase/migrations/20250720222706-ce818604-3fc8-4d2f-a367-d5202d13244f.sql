-- Create table for service inquiry responses (simple company replies to contact messages)
CREATE TABLE public.service_inquiry_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_message TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_inquiry_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for service inquiry responses
CREATE POLICY "Companies can insert responses to inquiries for their services"
ON public.service_inquiry_responses
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'company'
  )
  AND inquiry_id IN (
    SELECT si.id 
    FROM service_inquiries si
    JOIN services s ON si.service_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can view responses to inquiries for their services"
ON public.service_inquiry_responses
FOR SELECT
USING (
  company_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'company'
  )
  OR inquiry_id IN (
    SELECT si.id 
    FROM service_inquiries si
    WHERE si.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view responses to their own inquiries"
ON public.service_inquiry_responses
FOR SELECT
USING (
  inquiry_id IN (
    SELECT si.id 
    FROM service_inquiries si
    WHERE si.user_id = auth.uid()
  )
);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_service_inquiry_responses_updated_at
  BEFORE UPDATE ON public.service_inquiry_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to notify users when companies reply to their inquiries
CREATE OR REPLACE FUNCTION public.notify_service_inquiry_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the user who made the original inquiry
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
    'service_inquiry_response',
    'Company Response to Your Inquiry',
    'A company has responded to your service inquiry',
    NEW.inquiry_id,
    'service_inquiry'
  FROM service_inquiries si
  WHERE si.id = NEW.inquiry_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_service_inquiry_response_created
  AFTER INSERT ON public.service_inquiry_responses
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_service_inquiry_response();