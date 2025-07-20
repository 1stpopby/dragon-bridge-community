-- Insert Google Maps API key setting into app_settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description, is_public, created_at, updated_at)
VALUES (
  'google_maps_api_key',
  '""',
  'integration',
  'Google Maps API key for location services and maps',
  false,
  NOW(),
  NOW()
) ON CONFLICT (setting_key) DO NOTHING;