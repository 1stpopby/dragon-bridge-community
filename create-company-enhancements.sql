-- Enhanced Company Features SQL
-- This file creates the necessary tables and relationships for company services, feedback, and gallery

-- 1. Company Services Table (already exists, but adding service_id reference)
ALTER TABLE company_services ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

-- 2. Company Feedback Table (already exists, but adding user_review_id for company responses)
ALTER TABLE company_feedback ADD COLUMN IF NOT EXISTS user_review_id UUID REFERENCES service_feedback(id) ON DELETE SET NULL;
ALTER TABLE company_feedback ADD COLUMN IF NOT EXISTS company_response_text TEXT;
ALTER TABLE company_feedback ADD COLUMN IF NOT EXISTS company_response_rating INTEGER CHECK (company_response_rating >= 1 AND company_response_rating <= 5);

-- 3. Company Gallery Table (already exists, but adding service_response_id for completed services)
ALTER TABLE company_gallery ADD COLUMN IF NOT EXISTS service_response_id UUID REFERENCES service_request_responses(id) ON DELETE SET NULL;

-- 3. Company Gallery Table (already exists, but adding service_response_id reference)
ALTER TABLE company_gallery ADD COLUMN IF NOT EXISTS service_response_id UUID REFERENCES service_request_responses(id) ON DELETE SET NULL;

-- 4. Create a view for completed services to make it easier to query
CREATE OR REPLACE VIEW completed_services AS
SELECT DISTINCT
  sr.id as service_response_id,
  sr.company_id,
  sr.request_id,
  si.inquiry_type as service_type,
  si.message as service_description,
  si.created_at as service_date,
  sr.response_message,
  sr.estimated_cost,
  sr.created_at as completion_date,
  p.company_name,
  p.display_name as company_display_name
FROM service_request_responses sr
JOIN service_inquiries si ON sr.request_id = si.id
JOIN profiles p ON sr.company_id = p.id
WHERE sr.response_status = 'completed'
ORDER BY sr.created_at DESC;

-- 5. Add RLS policies for the new columns
ALTER TABLE company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_gallery ENABLE ROW LEVEL SECURITY;

-- Company Services RLS
CREATE POLICY "Users can view company services" ON company_services
  FOR SELECT USING (true);

CREATE POLICY "Company owners can manage their services" ON company_services
  FOR ALL USING (company_id = auth.uid());

-- Company Feedback RLS
CREATE POLICY "Users can view company feedback" ON company_feedback
  FOR SELECT USING (true);

CREATE POLICY "Users can create feedback for completed services" ON company_feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_request_responses sr
      JOIN service_inquiries si ON sr.request_id = si.id
      WHERE sr.id = user_review_id 
      AND sr.response_status = 'completed'
      AND si.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can respond to feedback" ON company_feedback
  FOR UPDATE USING (company_id = auth.uid());

-- Company Gallery RLS
CREATE POLICY "Users can view company gallery" ON company_gallery
  FOR SELECT USING (true);

CREATE POLICY "Company owners can manage their gallery" ON company_gallery
  FOR ALL USING (company_id = auth.uid());

-- 6. Create function to automatically create company feedback when user leaves feedback
CREATE OR REPLACE FUNCTION create_company_feedback_from_user_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create company feedback entry if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM company_feedback 
    WHERE user_review_id = NEW.id
  ) THEN
    INSERT INTO company_feedback (
      company_id,
      service_inquiry_id,
      user_review_id,
      reviewer_name,
      reviewer_email,
      rating,
      feedback_text,
      project_type,
      completion_date,
      is_verified,
      created_at,
      updated_at
    )
    SELECT 
      NEW.company_id,
      NEW.request_id,
      NEW.id,
      p.display_name,
      p.contact_email,
      NEW.rating,
      NEW.comment,
      si.inquiry_type,
      sr.created_at,
      true,
      NOW(),
      NOW()
    FROM profiles p
    JOIN service_inquiries si ON NEW.request_id = si.id
    JOIN service_request_responses sr ON NEW.response_id = sr.id
    WHERE p.user_id = si.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically create company feedback
DROP TRIGGER IF EXISTS trigger_create_company_feedback ON service_feedback;
CREATE TRIGGER trigger_create_company_feedback
  AFTER INSERT ON service_feedback
  FOR EACH ROW
  EXECUTE FUNCTION create_company_feedback_from_user_feedback();

-- 8. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_services_service_id ON company_services(service_id);
CREATE INDEX IF NOT EXISTS idx_company_feedback_user_review_id ON company_feedback(user_review_id);
CREATE INDEX IF NOT EXISTS idx_company_gallery_service_response_id ON company_gallery(service_response_id);
CREATE INDEX IF NOT EXISTS idx_service_request_responses_status ON service_request_responses(response_status);
CREATE INDEX IF NOT EXISTS idx_service_request_responses_company_status ON service_request_responses(company_id, response_status);

-- 9. Create function to get completed services for a company
CREATE OR REPLACE FUNCTION get_completed_services_for_company(company_uuid UUID)
RETURNS TABLE (
  service_response_id UUID,
  request_id UUID,
  service_type TEXT,
  service_description TEXT,
  service_date TIMESTAMPTZ,
  response_message TEXT,
  estimated_cost TEXT,
  completion_date TIMESTAMPTZ,
  inquirer_name TEXT,
  inquirer_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id as service_response_id,
    sr.request_id,
    si.inquiry_type as service_type,
    si.message as service_description,
    si.created_at as service_date,
    sr.response_message,
    sr.estimated_cost,
    sr.created_at as completion_date,
    si.inquirer_name,
    si.inquirer_email
  FROM service_request_responses sr
  JOIN service_inquiries si ON sr.request_id = si.id
  WHERE sr.company_id = company_uuid 
  AND sr.response_status = 'completed'
  ORDER BY sr.created_at DESC;
END;
$$ LANGUAGE plpgsql; 