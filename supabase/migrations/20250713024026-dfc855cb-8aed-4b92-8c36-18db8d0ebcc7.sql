-- Add company-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN company_description TEXT,
ADD COLUMN company_website TEXT,
ADD COLUMN company_phone TEXT,
ADD COLUMN company_address TEXT,
ADD COLUMN company_services TEXT[],
ADD COLUMN company_founded DATE,
ADD COLUMN company_size TEXT,
ADD COLUMN company_cover_image TEXT;

-- Create company_reviews table for feedback
CREATE TABLE public.company_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, reviewer_id)
);

-- Enable Row Level Security
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for company_reviews
CREATE POLICY "Anyone can view company reviews" 
ON public.company_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews" 
ON public.company_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" 
ON public.company_reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.company_reviews 
FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_company_reviews_updated_at
BEFORE UPDATE ON public.company_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();