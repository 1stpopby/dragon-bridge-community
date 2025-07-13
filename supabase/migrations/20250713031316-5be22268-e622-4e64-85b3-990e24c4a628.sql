-- Create group discussion reactions table for emoji likes
CREATE TABLE public.group_discussion_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on group_discussion_reactions
ALTER TABLE public.group_discussion_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for group_discussion_reactions - only group members can access
CREATE POLICY "Group members can view discussion reactions" 
ON public.group_discussion_reactions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.group_discussions 
  WHERE group_discussions.id = discussion_id 
  AND public.is_group_member(group_discussions.group_id, auth.uid())
));

CREATE POLICY "Group members can create discussion reactions" 
ON public.group_discussion_reactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.group_discussions 
  WHERE group_discussions.id = discussion_id 
  AND public.is_group_member(group_discussions.group_id, auth.uid())
));

CREATE POLICY "Users can delete their own discussion reactions" 
ON public.group_discussion_reactions 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND (
  auth.uid()::text = user_id::text OR 
  (user_id IS NULL AND author_name = (
    SELECT display_name FROM public.profiles WHERE user_id = auth.uid()
  ))
));

-- Add unique constraint to prevent duplicate reactions
CREATE UNIQUE INDEX unique_user_discussion_emoji_reaction 
ON public.group_discussion_reactions(discussion_id, user_id, emoji) 
WHERE user_id IS NOT NULL;

-- Create unique constraint for anonymous users based on author_name and emoji
CREATE UNIQUE INDEX unique_anonymous_discussion_emoji_reaction 
ON public.group_discussion_reactions(discussion_id, author_name, emoji) 
WHERE user_id IS NULL;