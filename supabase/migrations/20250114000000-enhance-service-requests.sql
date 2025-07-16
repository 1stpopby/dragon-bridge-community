-- Enhance service request system for better company interaction

-- Create service_request_responses table to track company responses
CREATE TABLE public.service_request_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_message TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  estimated_cost TEXT,
  availability TEXT,
  response_status TEXT NOT NULL DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_request_matches table to track which companies can see which requests
CREATE TABLE public.service_request_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0,
  is_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, company_id)
);

-- Add additional fields to service_inquiries for better tracking
ALTER TABLE public.service_inquiries 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS responses_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);

-- Enable Row Level Security
ALTER TABLE public.service_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for service_request_responses
CREATE POLICY "Companies can view responses to their requests" 
ON public.service_request_responses 
FOR SELECT 
USING (
  company_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'company'
  )
);

CREATE POLICY "Companies can create responses" 
ON public.service_request_responses 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'company'
  )
);

CREATE POLICY "Companies can update their own responses" 
ON public.service_request_responses 
FOR UPDATE 
USING (
  company_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'company'
  )
);

CREATE POLICY "Request owners can view all responses to their requests" 
ON public.service_request_responses 
FOR SELECT 
USING (
  request_id IN (
    SELECT id FROM public.service_inquiries WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all responses" 
ON public.service_request_responses 
FOR ALL 
USING (is_admin_user(auth.uid()));

-- Create policies for service_request_matches
CREATE POLICY "Companies can view their matches" 
ON public.service_request_matches 
FOR SELECT 
USING (
  company_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND account_type = 'company'
  )
);

CREATE POLICY "System can create matches" 
ON public.service_request_matches 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update matches" 
ON public.service_request_matches 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can manage all matches" 
ON public.service_request_matches 
FOR ALL 
USING (is_admin_user(auth.uid()));

-- Create function to automatically match service requests with companies
CREATE OR REPLACE FUNCTION public.match_service_request_with_companies(request_id UUID)
RETURNS VOID AS $$
DECLARE
  request_record RECORD;
  company_record RECORD;
  match_score INTEGER;
BEGIN
  -- Get the service request details
  SELECT * INTO request_record FROM public.service_inquiries WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Find matching companies
  FOR company_record IN 
    SELECT p.* FROM public.profiles p 
    WHERE p.account_type = 'company' 
    AND p.is_verified = true
  LOOP
    match_score := 0;
    
    -- Calculate match score based on various factors
    -- Location match
    IF request_record.location IS NOT NULL AND company_record.location IS NOT NULL THEN
      IF LOWER(request_record.location) = LOWER(company_record.location) THEN
        match_score := match_score + 20;
      END IF;
    END IF;
    
    -- Category/service match
    IF request_record.category IS NOT NULL AND company_record.company_services IS NOT NULL THEN
      IF request_record.category = ANY(company_record.company_services) THEN
        match_score := match_score + 30;
      END IF;
    END IF;
    
    -- Insert match if score is above threshold
    IF match_score >= 10 THEN
      INSERT INTO public.service_request_matches (request_id, company_id, match_score)
      VALUES (request_id, company_record.id, match_score)
      ON CONFLICT (request_id, company_id) 
      DO UPDATE SET match_score = EXCLUDED.match_score;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update response count
CREATE OR REPLACE FUNCTION public.update_service_request_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.service_inquiries 
    SET responses_count = responses_count + 1 
    WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.service_inquiries 
    SET responses_count = responses_count - 1 
    WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_service_request_responses_updated_at
BEFORE UPDATE ON public.service_request_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_response_count_trigger
AFTER INSERT OR DELETE ON public.service_request_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_service_request_response_count();

-- Create trigger to automatically match requests with companies
CREATE OR REPLACE FUNCTION public.auto_match_service_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only match for service requests (not contact inquiries)
  IF NEW.inquiry_type = 'request_service' THEN
    PERFORM public.match_service_request_with_companies(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_match_service_request_trigger
AFTER INSERT ON public.service_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_service_request();

-- Create indexes for better performance
CREATE INDEX idx_service_request_responses_request_id ON public.service_request_responses(request_id);
CREATE INDEX idx_service_request_responses_company_id ON public.service_request_responses(company_id);
CREATE INDEX idx_service_request_matches_request_id ON public.service_request_matches(request_id);
CREATE INDEX idx_service_request_matches_company_id ON public.service_request_matches(company_id);
CREATE INDEX idx_service_inquiries_category ON public.service_inquiries(category);
CREATE INDEX idx_service_inquiries_location ON public.service_inquiries(location);
CREATE INDEX idx_service_inquiries_inquiry_type ON public.service_inquiries(inquiry_type); 