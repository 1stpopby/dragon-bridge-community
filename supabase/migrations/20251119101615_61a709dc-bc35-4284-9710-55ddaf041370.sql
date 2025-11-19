-- Add is_active field to services table to allow users to hide/show their listings
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add index for better performance when filtering active services
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view services" ON services;
  DROP POLICY IF EXISTS "Anyone can view active services" ON services;
  DROP POLICY IF EXISTS "Users can view their own services" ON services;
  DROP POLICY IF EXISTS "Users can update their own services" ON services;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policy to show only active services to public
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT
  USING (is_active = true);

-- Add policy for users to view their own services regardless of active status  
CREATE POLICY "Users can view their own services" ON services
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own services
CREATE POLICY "Users can update their own services" ON services
  FOR UPDATE
  USING (auth.uid() = user_id);