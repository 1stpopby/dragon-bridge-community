-- Add verification fields to profiles table for companies
ALTER TABLE public.profiles 
ADD COLUMN is_verified BOOLEAN DEFAULT false,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_by UUID,
ADD COLUMN verification_notes TEXT;

-- Create index for verification queries
CREATE INDEX idx_profiles_verification ON public.profiles(account_type, is_verified);

-- Create company verification requests table
CREATE TABLE public.company_verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_verification_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for company verification requests
CREATE POLICY "Admins can manage all verification requests" 
ON public.company_verification_requests 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_company_verification_requests_updated_at
  BEFORE UPDATE ON public.company_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();