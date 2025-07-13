-- Create user_bans table for tracking banned users
CREATE TABLE public.user_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Create policies for user bans
CREATE POLICY "Admins can manage all user bans" 
ON public.user_bans 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX idx_user_bans_is_active ON public.user_bans(is_active);
CREATE INDEX idx_user_bans_expires_at ON public.user_bans(expires_at);

-- Create trigger for updated_at
CREATE TRIGGER update_user_bans_updated_at
  BEFORE UPDATE ON public.user_bans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_bans ub
    WHERE ub.user_id = check_user_id 
    AND ub.is_active = true
    AND (ub.expires_at IS NULL OR ub.expires_at > now())
  );
END;
$$;