-- Remove resources table completely
DROP TABLE IF EXISTS public.resources CASCADE;

-- Update categories table constraint to remove 'resources' from allowed types
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_type_check 
CHECK (type IN ('marketplace', 'events', 'groups', 'forum', 'services'));

-- Remove any resources-related categories
DELETE FROM public.categories WHERE type = 'resources';

-- Update any existing categories that might reference resources
-- This ensures no orphaned references remain 