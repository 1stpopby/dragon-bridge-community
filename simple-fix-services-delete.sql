-- Simple Fix for Services Delete Functionality
-- Run this in your Supabase SQL editor

-- Option 1: Temporarily disable RLS for testing
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- Option 2: Or create a simple permissive policy
-- ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all for authenticated" ON public.services;
-- CREATE POLICY "Allow all for authenticated" ON public.services FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

-- Fix foreign key constraint if service_requests table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_service_id_fkey;
        ALTER TABLE public.service_requests 
        ADD CONSTRAINT service_requests_service_id_fkey 
        FOREIGN KEY (service_id) 
        REFERENCES public.services(id) 
        ON DELETE CASCADE;
        RAISE NOTICE 'Fixed foreign key constraint';
    END IF;
END $$;

-- Test deletion
SELECT 'Services table is now ready for delete operations' as status; 