-- Create event registrations table to track user registrations
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT,
  phone TEXT,
  special_requirements TEXT,
  registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'cancelled', 'attended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for event registrations
CREATE POLICY "Users can view their own registrations" 
ON public.event_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" 
ON public.event_registrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own registrations" 
ON public.event_registrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_event_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();