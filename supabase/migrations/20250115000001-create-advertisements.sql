-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  link_type TEXT NOT NULL DEFAULT 'external' CHECK (link_type IN ('external', 'company')),
  external_link TEXT,
  company_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  placement_locations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- ['home', 'forum', 'events', 'services', 'marketplace']
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  priority INTEGER DEFAULT 0, -- Higher number = higher priority
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Create policies for advertisements
CREATE POLICY "Admins can manage all advertisements" 
ON public.advertisements 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Everyone can view active advertisements" 
ON public.advertisements 
FOR SELECT 
USING (
  status = 'active' 
  AND (start_date IS NULL OR start_date <= now()) 
  AND (end_date IS NULL OR end_date > now())
);

-- Create indexes for performance
CREATE INDEX idx_advertisements_status ON public.advertisements(status);
CREATE INDEX idx_advertisements_placement_locations ON public.advertisements USING GIN(placement_locations);
CREATE INDEX idx_advertisements_start_date ON public.advertisements(start_date);
CREATE INDEX idx_advertisements_end_date ON public.advertisements(end_date);
CREATE INDEX idx_advertisements_priority ON public.advertisements(priority DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create functions for tracking ad interactions
CREATE OR REPLACE FUNCTION public.increment_ad_views(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.advertisements 
  SET view_count = view_count + 1 
  WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.advertisements 
  SET click_count = click_count + 1 
  WHERE id = ad_id;
END;
$$;

-- Insert sample advertisement
INSERT INTO public.advertisements (
  title, 
  description, 
  link_type, 
  external_link, 
  placement_locations, 
  status, 
  priority,
  created_by
) VALUES (
  'Welcome to UK Chinese Community',
  'Join our growing community of Chinese residents across the UK. Connect, share experiences, and build lasting friendships.',
  'external',
  'https://example.com/join',
  ARRAY['home', 'forum'],
  'active',
  1,
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
) ON CONFLICT DO NOTHING; 