-- Fix categories table constraint to allow forum type
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE public.categories 
DROP CONSTRAINT categories_type_check;

-- Add the new constraint that includes 'forum'
ALTER TABLE public.categories 
ADD CONSTRAINT categories_type_check 
CHECK (type IN ('marketplace', 'events', 'groups', 'resources', 'forum'));

-- Add category field to forum_posts table if it doesn't exist
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for forum posts category if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts(category);

-- Insert default forum categories if they don't exist
INSERT INTO public.categories (name, description, type, icon, color, sort_order) 
SELECT * FROM (VALUES
  ('General Discussion', 'General topics and conversations', 'forum', 'message-circle', '#3b82f6', 1),
  ('Community Support', 'Help and support for community members', 'forum', 'heart-handshake', '#10b981', 2),
  ('Local Events', 'Discussions about local events and activities', 'forum', 'calendar', '#8b5cf6', 3),
  ('Services & Business', 'Business and professional services discussions', 'forum', 'briefcase', '#f59e0b', 4),
  ('Culture & Lifestyle', 'Cultural topics and lifestyle discussions', 'forum', 'palette', '#ec4899', 5),
  ('Questions & Help', 'Questions and help requests', 'forum', 'help-circle', '#ef4444', 6)
) AS new_categories(name, description, type, icon, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories 
  WHERE categories.name = new_categories.name 
  AND categories.type = 'forum'
);

-- Update existing forum posts to have a default category
UPDATE public.forum_posts 
SET category = 'General Discussion' 
WHERE category IS NULL; 