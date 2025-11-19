-- Add new columns to services table for self-employed listings
ALTER TABLE services ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'company' CHECK (listing_type IN ('self_employed', 'company'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS has_cscs boolean DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS utr_number text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS nino text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS right_to_work boolean DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE services ADD COLUMN IF NOT EXISTS valid_from date;

-- Update existing services to be company type
UPDATE services SET listing_type = 'company' WHERE listing_type IS NULL;

-- Add index for listing_type for better query performance
CREATE INDEX IF NOT EXISTS idx_services_listing_type ON services(listing_type);

COMMENT ON COLUMN services.listing_type IS 'Type of listing: self_employed (person looking for work) or company (business hiring)';
COMMENT ON COLUMN services.has_cscs IS 'CSCS card holder (for self-employed)';
COMMENT ON COLUMN services.utr_number IS 'UTR number (for self-employed)';
COMMENT ON COLUMN services.nino IS 'National Insurance Number (for self-employed)';
COMMENT ON COLUMN services.right_to_work IS 'Right to work in UK (for self-employed)';
COMMENT ON COLUMN services.years_experience IS 'Years of experience (for self-employed)';
COMMENT ON COLUMN services.valid_from IS 'Valid from date (for self-employed)';