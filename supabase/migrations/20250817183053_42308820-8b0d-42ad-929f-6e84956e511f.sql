-- Fix critical security issue: marketplace_inquiries table is publicly readable
-- This migration restricts inquiry access to only the inquirer and item owner

-- Drop the existing insecure policies that allow everyone to view inquiries
DROP POLICY IF EXISTS "Anyone can view inquiries" ON public.marketplace_inquiries;

-- Create secure policies for the marketplace_inquiries table

-- Policy 1: Users can view inquiries they created
CREATE POLICY "Users can view their own inquiries" 
ON public.marketplace_inquiries 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Item owners can view inquiries for their items
CREATE POLICY "Item owners can view inquiries for their items" 
ON public.marketplace_inquiries 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_items mi
    WHERE mi.id = marketplace_inquiries.item_id 
    AND mi.user_id = auth.uid()
  )
);

-- Policy 3: Admins can view all inquiries for moderation purposes
CREATE POLICY "Admins can view all marketplace inquiries" 
ON public.marketplace_inquiries 
FOR SELECT 
TO authenticated
USING (is_admin_user(auth.uid()));

-- Update the insert policy to ensure user_id is set correctly
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.marketplace_inquiries;

CREATE POLICY "Authenticated users can create inquiries" 
ON public.marketplace_inquiries 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add update and delete policies for inquiry management
CREATE POLICY "Users can update their own inquiries" 
ON public.marketplace_inquiries 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inquiries" 
ON public.marketplace_inquiries 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create a safe function to get inquiry count for items without exposing personal data
CREATE OR REPLACE FUNCTION public.get_item_inquiry_count(item_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.marketplace_inquiries mi
  WHERE mi.item_id = item_uuid;
$$;