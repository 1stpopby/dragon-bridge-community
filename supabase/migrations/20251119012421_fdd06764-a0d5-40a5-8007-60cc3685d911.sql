-- Add favicon_url setting
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) 
VALUES ('favicon_url', '""', 'text', 'URL to the application favicon (ICO, PNG, or SVG format)', true)
ON CONFLICT (setting_key) DO NOTHING;