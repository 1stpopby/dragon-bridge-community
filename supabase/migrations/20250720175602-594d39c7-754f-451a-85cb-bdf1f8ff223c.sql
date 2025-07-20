-- Create user_follows table for following functionality
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Create policies for user_follows
CREATE POLICY "Users can view all follows" 
ON public.user_follows 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own follows" 
ON public.user_follows 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE id = follower_id
));

CREATE POLICY "Users can delete their own follows" 
ON public.user_follows 
FOR DELETE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE id = follower_id
));

-- Add foreign key constraints
ALTER TABLE public.user_follows 
ADD CONSTRAINT user_follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_follows 
ADD CONSTRAINT user_follows_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;