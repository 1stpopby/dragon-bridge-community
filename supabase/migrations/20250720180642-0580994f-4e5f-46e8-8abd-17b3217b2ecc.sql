-- Fix saved_posts RLS policies to work with profiles table structure
DROP POLICY IF EXISTS "Users can insert their own saved posts" ON public.saved_posts;
DROP POLICY IF EXISTS "Users can view their own saved posts" ON public.saved_posts;
DROP POLICY IF EXISTS "Users can delete their own saved posts" ON public.saved_posts;

-- Create new policies that work with the profile.id structure
CREATE POLICY "Users can insert their own saved posts" 
ON public.saved_posts 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can view their own saved posts" 
ON public.saved_posts 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own saved posts" 
ON public.saved_posts 
FOR DELETE 
USING (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));