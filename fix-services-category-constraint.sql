-- Fix services table category constraint to include all new categories
-- Run this in your Supabase SQL editor

-- Drop the existing constraint on services table
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_category_check;

-- Add the new constraint that includes all categories from the categories table
ALTER TABLE public.services 
ADD CONSTRAINT services_category_check 
CHECK (category IN ('legal', 'medical', 'financial', 'education', 'technology', 'other'));

-- Verify the constraint is working
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'services_category_check';

-- Show current categories in the categories table for reference
SELECT name, type FROM public.categories WHERE type = 'services' ORDER BY sort_order; 