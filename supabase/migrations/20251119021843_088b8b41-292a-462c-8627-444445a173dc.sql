-- Add parent_reply_id to forum_replies to support threaded replies
ALTER TABLE public.forum_replies 
ADD COLUMN parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_forum_replies_parent_reply_id ON public.forum_replies(parent_reply_id);

-- Add index for better query performance on post_id
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON public.forum_replies(post_id);