-- Update the account type for the company account
UPDATE public.profiles 
SET account_type = 'company', 
    company_name = 'My Company',
    updated_at = now()
WHERE contact_email = 'my@company.com';

-- Verify the update
SELECT user_id, account_type, display_name, company_name, contact_email 
FROM public.profiles 
WHERE contact_email = 'my@company.com'; 