-- Comprehensive Service Deletion Diagnostic and Fix Script
-- Run this in your Supabase SQL editor to diagnose and fix service deletion issues

-- 1. Check foreign key constraints that might prevent deletion
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'services';

-- 2. Check RLS policies on services table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'services';

-- 3. Check if RLS is enabled and see current user
SELECT 
    schemaname, 
    tablename, 
    rowsecurity, 
    forcerowsecurity,
    current_user as current_db_user
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'services';

-- 4. Check service_requests table for references
SELECT COUNT(*) as service_requests_count
FROM public.service_requests 
WHERE service_id IS NOT NULL;

-- 5. Try to identify specific services that might have references
SELECT 
    s.id,
    s.name,
    COUNT(sr.id) as request_count
FROM public.services s
LEFT JOIN public.service_requests sr ON s.id = sr.service_id::uuid
GROUP BY s.id, s.name
ORDER BY request_count DESC;

-- 6. Check current user's role and permissions
SELECT 
    current_user,
    current_role,
    session_user;

-- 7. If you're admin, temporarily disable RLS to test deletion
-- UNCOMMENT THE FOLLOWING LINES ONLY IF YOU'RE ADMIN AND WANT TO TEST
-- WARNING: This affects security, re-enable after testing

-- ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
-- 
-- -- Test delete a specific service (replace with actual ID)
-- DELETE FROM public.services WHERE id = 'YOUR_SERVICE_ID_HERE';
-- 
-- -- Re-enable RLS
-- ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 8. Check for any service_requests that might be blocking deletion
SELECT 
    sr.id as request_id,
    sr.service_id,
    s.name as service_name,
    sr.created_at
FROM public.service_requests sr
JOIN public.services s ON sr.service_id::uuid = s.id
ORDER BY sr.created_at DESC
LIMIT 10;

-- 9. Create a safe delete function that handles dependencies
CREATE OR REPLACE FUNCTION safe_delete_service(service_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    request_count INTEGER;
    result_message TEXT;
BEGIN
    -- Check for dependent service requests
    SELECT COUNT(*) INTO request_count
    FROM public.service_requests 
    WHERE service_id::uuid = service_uuid;
    
    IF request_count > 0 THEN
        -- Option 1: Delete dependent records first
        DELETE FROM public.service_requests WHERE service_id::uuid = service_uuid;
        result_message := 'Deleted ' || request_count || ' service requests, ';
    END IF;
    
    -- Now delete the service
    DELETE FROM public.services WHERE id = service_uuid;
    
    IF FOUND THEN
        result_message := COALESCE(result_message, '') || 'Service deleted successfully';
    ELSE
        result_message := 'Service not found or could not be deleted';
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant necessary permissions (run as admin)
-- GRANT DELETE ON public.services TO authenticated;
-- GRANT DELETE ON public.service_requests TO authenticated;

-- Example usage of safe delete function:
-- SELECT safe_delete_service('your-service-uuid-here'); 