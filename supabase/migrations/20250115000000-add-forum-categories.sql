-- Add category field to forum_posts table
ALTER TABLE public.forum_posts 
ADD COLUMN category TEXT;

-- Update the categories table to support forum type
ALTER TABLE public.categories 
DROP CONSTRAINT categories_type_check;

ALTER TABLE public.categories 
ADD CONSTRAINT categories_type_check 
CHECK (type IN ('marketplace', 'events', 'groups', 'forum', 'services'));

-- Insert default forum categories
INSERT INTO public.categories (name, description, type, icon, color, sort_order) VALUES
('General Discussion', 'General topics and conversations', 'forum', 'message-circle', '#3b82f6', 1),
('Community Support', 'Help and support for community members', 'forum', 'heart-handshake', '#10b981', 2),
('Local Events', 'Discussions about local events and activities', 'forum', 'calendar', '#8b5cf6', 3),
('Services & Business', 'Business and professional services discussions', 'forum', 'briefcase', '#f59e0b', 4),
('Culture & Lifestyle', 'Cultural topics and lifestyle discussions', 'forum', 'palette', '#ec4899', 5),
('Questions & Help', 'Questions and help requests', 'forum', 'help-circle', '#ef4444', 6);

-- Create index for forum posts category
CREATE INDEX idx_forum_posts_category ON public.forum_posts(category);

-- Update existing forum posts to have a default category
UPDATE public.forum_posts 
SET category = 'General Discussion' 
WHERE category IS NULL; 