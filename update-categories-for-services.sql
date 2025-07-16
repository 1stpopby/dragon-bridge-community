-- Update categories table to include 'services' type
-- Run this in your Supabase SQL editor

-- Drop the existing constraint
ALTER TABLE public.categories 
DROP CONSTRAINT IF EXISTS categories_type_check;

-- Add the new constraint that includes 'services'
ALTER TABLE public.categories 
ADD CONSTRAINT categories_type_check 
CHECK (type IN ('marketplace', 'events', 'groups', 'resources', 'forum', 'services'));

-- Insert default service categories
INSERT INTO public.categories (name, description, type, icon, color, sort_order) 
VALUES
  ('Legal', 'Legal services and consultation', 'services', 'gavel', '#ef4444', 1),
  ('Medical', 'Healthcare and medical services', 'services', 'heart', '#10b981', 2),
  ('Financial', 'Financial and accounting services', 'services', 'dollar-sign', '#f59e0b', 3),
  ('Education', 'Educational and tutoring services', 'services', 'graduation-cap', '#3b82f6', 4),
  ('Technology', 'IT and technology services', 'services', 'monitor', '#8b5cf6', 5),
  ('Other', 'Other professional services', 'services', 'wrench', '#6b7280', 6)
ON CONFLICT (name, type) DO NOTHING;

-- Verify the constraint is working
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'categories_type_check'; 