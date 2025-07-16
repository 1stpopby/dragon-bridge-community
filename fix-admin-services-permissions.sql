-- Fix Admin Services Permissions and RLS Policies
-- Run this script in your Supabase SQL editor

-- 1. First, let's check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'services'
ORDER BY policyname;

-- 2. Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.services;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.services;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.services;
DROP POLICY IF EXISTS "Users can only delete their own services" ON public.services;
DROP POLICY IF EXISTS "Users can only update their own services" ON public.services;

-- 3. Create permissive policies for admin operations
CREATE POLICY "Allow all operations for authenticated users" ON public.services
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Alternative: If you want more specific policies
-- CREATE POLICY "Enable read access for all users" ON public.services
--     FOR SELECT USING (true);

-- CREATE POLICY "Enable insert for authenticated users" ON public.services
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable update for authenticated users" ON public.services
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable delete for authenticated users" ON public.services
--     FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Ensure RLS is enabled but not too restrictive
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions to authenticated users
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

-- 6. Check if there are any foreign key constraints blocking deletion
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

-- 7. If service_requests table exists and references services, we need to handle it
-- First, let's check if the service_requests table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        -- Add CASCADE deletion or handle dependencies
        ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_service_id_fkey;
        
        -- Recreate with CASCADE delete
        ALTER TABLE public.service_requests 
        ADD CONSTRAINT service_requests_service_id_fkey 
        FOREIGN KEY (service_id) 
        REFERENCES public.services(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated service_requests foreign key constraint with CASCADE delete';
    ELSE
        RAISE NOTICE 'service_requests table does not exist';
    END IF;
END $$;

-- 8. Test the permissions
DO $$ 
BEGIN
    -- Test insert
    INSERT INTO public.services (name, description, category, location, phone, email, specialty) 
    VALUES ('Test Service', 'Test Description', 'test', 'Test Location', '123-456-7890', 'test@test.com', 'Testing');
    
    -- Test delete
    DELETE FROM public.services WHERE name = 'Test Service';
    
    RAISE NOTICE 'Test insert and delete operations completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;

-- 9. Display current table permissions
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    hasinsert,
    hasupdate,
    hasdelete
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'services';

-- 10. Show final RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'services'
ORDER BY policyname; 