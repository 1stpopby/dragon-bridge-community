-- Quick fix for forum categories constraint
-- Run this in your Supabase SQL editor

-- Drop the existing constraint
ALTER TABLE public.categories 
DROP CONSTRAINT IF EXISTS categories_type_check;

-- Add the new constraint that includes 'forum'
ALTER TABLE public.categories 
ADD CONSTRAINT categories_type_check 
CHECK (type IN ('marketplace', 'events', 'groups', 'forum', 'services'));

-- Verify the constraint is working
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'categories_type_check'; 