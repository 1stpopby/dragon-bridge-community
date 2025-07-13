-- Create group discussions table for private group forums
CREATE TABLE public.group_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0
);

-- Create group discussion replies table
CREATE TABLE public.group_discussion_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.group_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_discussion_replies ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is a member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(group_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_memberships
    WHERE group_memberships.group_id = is_group_member.group_id
      AND group_memberships.user_id = is_group_member.user_id
  )
$$;

-- RLS policies for group discussions - only group members can access
CREATE POLICY "Group members can view discussions" 
ON public.group_discussions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can create discussions" 
ON public.group_discussions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can update their own discussions" 
ON public.group_discussions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussions" 
ON public.group_discussions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for group discussion replies - only group members can access
CREATE POLICY "Group members can view replies" 
ON public.group_discussion_replies 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.group_discussions 
  WHERE group_discussions.id = discussion_id 
  AND public.is_group_member(group_discussions.group_id, auth.uid())
));

CREATE POLICY "Group members can create replies" 
ON public.group_discussion_replies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.group_discussions 
  WHERE group_discussions.id = discussion_id 
  AND public.is_group_member(group_discussions.group_id, auth.uid())
));

CREATE POLICY "Users can update their own replies" 
ON public.group_discussion_replies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" 
ON public.group_discussion_replies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_group_discussions_updated_at
BEFORE UPDATE ON public.group_discussions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_discussion_replies_updated_at
BEFORE UPDATE ON public.group_discussion_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update reply counts
CREATE OR REPLACE FUNCTION public.update_group_discussion_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_discussions 
    SET replies_count = replies_count + 1 
    WHERE id = NEW.discussion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.group_discussions 
    SET replies_count = replies_count - 1 
    WHERE id = OLD.discussion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reply count updates
CREATE TRIGGER update_group_discussion_replies_count_trigger
AFTER INSERT OR DELETE ON public.group_discussion_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_group_discussion_replies_count();