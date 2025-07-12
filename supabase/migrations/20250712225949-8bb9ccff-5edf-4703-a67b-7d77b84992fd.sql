-- Create resources table for community resources
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('guide', 'video', 'website', 'document')),
  content_url TEXT, -- For downloads, video links, or website URLs
  file_url TEXT, -- For uploaded files
  author_name TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  duration TEXT, -- For videos
  file_size TEXT, -- For downloadable files
  tags TEXT[], -- Array of tags
  is_featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies for resources
CREATE POLICY "Anyone can view published resources" 
ON public.resources 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins and companies can create resources" 
ON public.resources 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND account_type = 'company'
    )
  )
);

CREATE POLICY "Admins and companies can update resources" 
ON public.resources 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND account_type = 'company'
    )
  )
);

CREATE POLICY "Admins and companies can delete resources" 
ON public.resources 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND account_type = 'company'
    )
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.resources (title, description, category, resource_type, author_name, download_count, tags) VALUES
('Complete Guide to NHS Registration', 'Step-by-step guide to registering with a GP, understanding NHS services, and accessing healthcare in the UK.', 'Healthcare', 'guide', 'UK Chinese Community Admin', 2450, ARRAY['NHS', 'Healthcare', 'Registration']),
('UK Tax System for New Residents', 'Understanding PAYE, National Insurance, tax codes, and filing requirements for Chinese residents.', 'Finance', 'guide', 'UK Chinese Community Admin', 1890, ARRAY['Tax', 'PAYE', 'National Insurance']),
('School Application Process', 'Comprehensive guide to applying for primary and secondary schools, including admissions criteria.', 'Education', 'guide', 'UK Chinese Community Admin', 1650, ARRAY['Education', 'Schools', 'Applications']),
('Your First Day in the UK', 'Essential tasks and tips for your first week after arriving in the UK.', 'General', 'video', 'UK Chinese Community Admin', 0, ARRAY['Arrival', 'Tips', 'General']),
('Gov.UK Official Portal', 'Official government website for all UK services and information.', 'Government', 'website', 'UK Chinese Community Admin', 0, ARRAY['Government', 'Official', 'Services']);