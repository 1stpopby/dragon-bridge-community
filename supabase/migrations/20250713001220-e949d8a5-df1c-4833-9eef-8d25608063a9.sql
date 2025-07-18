-- Create categories table for marketplace, events, groups, and services
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('marketplace', 'events', 'groups', 'services')),
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, type)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all categories" 
ON public.categories 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories for each type
INSERT INTO public.categories (name, description, type, icon, color, sort_order) VALUES
-- Marketplace categories
('Electronics', 'Electronic devices and gadgets', 'marketplace', 'smartphone', '#3b82f6', 1),
('Furniture', 'Home and office furniture', 'marketplace', 'armchair', '#8b5cf6', 2),
('Books', 'Books and educational materials', 'marketplace', 'book', '#06b6d4', 3),
('Clothing', 'Clothing and accessories', 'marketplace', 'shirt', '#f59e0b', 4),
('Other', 'Miscellaneous items', 'marketplace', 'package', '#6b7280', 5),

-- Events categories
('Cultural', 'Cultural events and celebrations', 'events', 'drama', '#ef4444', 1),
('Educational', 'Workshops and learning events', 'events', 'graduation-cap', '#10b981', 2),
('Social', 'Social gatherings and networking', 'events', 'users', '#f59e0b', 3),
('Business', 'Business and professional events', 'events', 'briefcase', '#3b82f6', 4),
('Community', 'Community service and volunteer events', 'events', 'heart', '#ec4899', 5),

-- Groups categories
('Language Exchange', 'Language learning and practice groups', 'groups', 'languages', '#8b5cf6', 1),
('Professional', 'Professional networking groups', 'groups', 'briefcase', '#3b82f6', 2),
('Cultural', 'Cultural heritage and tradition groups', 'groups', 'crown', '#ef4444', 3),
('Hobby', 'Hobby and interest groups', 'groups', 'palette', '#06b6d4', 4),
('Sports', 'Sports and fitness groups', 'groups', 'dumbbell', '#10b981', 5),

