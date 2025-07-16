-- Insert sample service requests from different users
-- Note: Replace the user_id values with actual user IDs from your auth.users table

INSERT INTO service_inquiries (
  inquirer_name,
  inquirer_email,
  inquirer_phone,
  message,
  inquiry_type,
  status,
  user_id
) VALUES 
(
  'John Smith',
  'john.smith@example.com',
  '+44 20 1234 5678',
  'Service Request:
Location: London
Category: legal
Service Type: Immigration Law
Budget: £500-£1000
Urgency: high

Description:
Need help with spouse visa application. Looking for experienced immigration lawyer who can assist with the application process.',
  'request_service',
  'pending',
  NULL  -- Set to NULL or a different user ID
),
(
  'Sarah Chen',
  'sarah.chen@example.com',
  '+44 161 987 6543',
  'Service Request:
Location: Manchester
Category: medical
Service Type: General Practice
Budget: NHS covered
Urgency: medium

Description:
Looking for a Chinese-speaking GP for regular health checkups and family medical care.',
  'request_service',
  'pending',
  NULL  -- Set to NULL or a different user ID
),
(
  'David Wong',
  'david.wong@example.com',
  '+44 121 456 7890',
  'Service Request:
Location: Birmingham
Category: financial
Service Type: Tax Advisory
Budget: £200-£500
Urgency: low

Description:
Need help with UK tax return filing and understanding tax obligations for new residents.',
  'request_service',
  'pending',
  NULL  -- Set to NULL or a different user ID
); 