-- First, we need to create the user account with email and password
-- Since we can't directly insert into auth.users, we'll use the assign_admin_role_to_email function
-- But first, let's create a temporary function to create a user and assign admin role

-- Let's manually assign admin role to the existing user for now and tell user to sign up first
SELECT assign_admin_role_to_email('fpopescum@gmail.com');