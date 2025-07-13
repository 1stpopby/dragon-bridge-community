-- Create forum post reactions table for emoji likes
CREATE TABLE public.forum_post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on forum_post_reactions
ALTER TABLE public.forum_post_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for forum_post_reactions
CREATE POLICY "Anyone can view reactions" 
ON public.forum_post_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create reactions" 
ON public.forum_post_reactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions" 
ON public.forum_post_reactions 
FOR DELETE 
USING (true);

-- Add unique constraint to prevent duplicate reactions
CREATE UNIQUE INDEX unique_user_post_emoji_reaction 
ON public.forum_post_reactions(post_id, user_id, emoji) 
WHERE user_id IS NOT NULL;

-- Create unique constraint for anonymous users based on author_name and emoji
CREATE UNIQUE INDEX unique_anonymous_post_emoji_reaction 
ON public.forum_post_reactions(post_id, author_name, emoji) 
WHERE user_id IS NULL;