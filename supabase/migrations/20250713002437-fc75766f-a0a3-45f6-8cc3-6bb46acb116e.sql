-- Create app_settings table for global application configuration
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  setting_type TEXT NOT NULL CHECK (setting_type IN ('text', 'url', 'email', 'phone', 'json', 'boolean', 'number')),
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app_settings
CREATE POLICY "Anyone can view public settings" 
ON public.app_settings 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Admins can manage all settings" 
ON public.app_settings 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default app settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', '"UK Chinese Community"', 'text', 'Application name displayed throughout the site', true),
('app_description', '"Connect, share, and thrive together. Join thousands of Chinese residents across the UK sharing experiences, offering support, and celebrating our culture."', 'text', 'Application description for SEO and marketing', true),
('contact_email', '"admin@ukchinesecommunity.com"', 'email', 'Main contact email address', true),
('contact_phone', '"+44 20 1234 5678"', 'phone', 'Main contact phone number', true),
('address', '{"street": "123 Community Street", "city": "London", "postcode": "E1 6AN", "country": "United Kingdom"}', 'json', 'Organization address', true),
('social_links', '{"facebook": "", "twitter": "", "instagram": "", "linkedin": "", "wechat": ""}', 'json', 'Social media links', true),
('app_logo_url', '""', 'url', 'URL to the main application logo', true),
('app_favicon_url', '""', 'url', 'URL to the application favicon', true),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode to temporarily disable the site', false),
('registration_enabled', 'true', 'boolean', 'Allow new user registrations', false),
('max_file_upload_size', '10', 'number', 'Maximum file upload size in MB', false),
('theme_primary_color', '"#ef4444"', 'text', 'Primary theme color (hex code)', true),
('theme_secondary_color', '"#f59e0b"', 'text', 'Secondary theme color (hex code)', true),
('analytics_tracking_id', '""', 'text', 'Google Analytics tracking ID', false),
('smtp_settings', '{"host": "", "port": 587, "username": "", "password": "", "from_email": ""}', 'json', 'SMTP configuration for email sending', false);