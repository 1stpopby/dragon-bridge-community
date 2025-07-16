-- Create service_feedback table for user feedback on service responses
CREATE TABLE public.service_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.service_request_responses(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  would_recommend BOOLEAN DEFAULT true,
  service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(response_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.service_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for service_feedback
CREATE POLICY "Anyone can view service feedback" 
ON public.service_feedback 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create feedback for their own responses" 
ON public.service_feedback 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.service_inquiries 
    WHERE id = request_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own feedback" 
ON public.service_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" 
ON public.service_feedback 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_service_feedback_response_id ON public.service_feedback(response_id);
CREATE INDEX idx_service_feedback_request_id ON public.service_feedback(request_id);
CREATE INDEX idx_service_feedback_user_id ON public.service_feedback(user_id);
CREATE INDEX idx_service_feedback_company_id ON public.service_feedback(company_id);
CREATE INDEX idx_service_feedback_rating ON public.service_feedback(rating);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_service_feedback_updated_at
BEFORE UPDATE ON public.service_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update company rating based on feedback
CREATE OR REPLACE FUNCTION public.update_company_rating_from_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Update company's average rating based on service feedback
  UPDATE public.profiles 
  SET rating = (
    SELECT AVG(rating::float) 
    FROM public.service_feedback 
    WHERE company_id = NEW.company_id
  )
  WHERE id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update company ratings when feedback is added
CREATE TRIGGER update_company_rating_on_feedback
AFTER INSERT OR UPDATE ON public.service_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_company_rating_from_feedback();

-- Add rating field to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5);

-- Create index for rating queries
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating); 