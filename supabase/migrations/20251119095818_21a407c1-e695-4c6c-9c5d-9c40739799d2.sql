-- Drop the existing constraint first
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;

-- Update existing categories to match new type names
UPDATE categories SET type = 'event' WHERE type = 'events';
UPDATE categories SET type = 'group' WHERE type = 'groups';
UPDATE categories SET type = 'service' WHERE type = 'services';

-- Delete resources categories as they're no longer used
DELETE FROM categories WHERE type = 'resources';

-- Now add the constraint with all valid types
ALTER TABLE categories ADD CONSTRAINT categories_type_check 
CHECK (type IN ('forum', 'event', 'marketplace', 'group', 'service', 'service_self_employed'));