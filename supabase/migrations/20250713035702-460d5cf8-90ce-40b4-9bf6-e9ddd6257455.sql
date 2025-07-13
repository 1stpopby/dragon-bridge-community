-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  target_audience TEXT[] DEFAULT ARRAY['all'], -- ['all', 'users', 'companies', 'admins']
  notification_sent BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all announcements" 
ON public.announcements 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Users can view published announcements" 
ON public.announcements 
FOR SELECT 
USING (
  status = 'published' 
  AND (published_at IS NULL OR published_at <= now()) 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Create index for performance
CREATE INDEX idx_announcements_status ON public.announcements(status);
CREATE INDEX idx_announcements_published_at ON public.announcements(published_at);
CREATE INDEX idx_announcements_expires_at ON public.announcements(expires_at);

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();