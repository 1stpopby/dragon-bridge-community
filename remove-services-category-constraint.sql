-- Remove the services category check constraint entirely
-- This allows any category value to be inserted into the services table
-- Run this in your Supabase SQL editor

-- Drop the constraint
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_category_check;

-- Verify the constraint has been removed
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.services'::regclass
AND conname = 'services_category_check';

-- This should return no rows if the constraint was successfully removed 