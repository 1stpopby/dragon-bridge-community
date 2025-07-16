-- Check for potential issues with the services table
-- Run this in your Supabase SQL editor to diagnose issues

-- 1. Check if the services table exists and its structure
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'services'
ORDER BY ordinal_position;

-- 2. Check for any constraints on the services table
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.services'::regclass;

-- 3. Check RLS (Row Level Security) policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'services';

-- 4. Check if RLS is enabled on the services table
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'services';

-- 5. Check for any triggers on the services table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public' AND event_object_table = 'services';

-- 6. Check current user permissions
SELECT grantee, privilege_type, is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' AND table_name = 'services';

-- 7. Sample a few services to see current data
SELECT id, name, category, verified, featured, created_at
FROM public.services 
LIMIT 5; 