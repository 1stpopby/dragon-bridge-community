-- Drop the existing constraint if it exists
ALTER TABLE public.categories 
DROP CONSTRAINT IF EXISTS categories_type_check;

-- Update 'group' to 'groups' to match frontend
UPDATE public.categories SET type = 'groups' WHERE type = 'group';

-- Add the new constraint without validation first
ALTER TABLE public.categories 
ADD CONSTRAINT categories_type_check 
CHECK (type IN ('marketplace', 'events', 'groups', 'forum', 'service', 'service_self_employed')) NOT VALID;

-- Now validate the constraint for future inserts/updates
ALTER TABLE public.categories VALIDATE CONSTRAINT categories_type_check;