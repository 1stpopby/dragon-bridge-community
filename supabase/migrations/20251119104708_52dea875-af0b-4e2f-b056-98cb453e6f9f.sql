-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;

-- Create a new policy that allows both authenticated and anonymous users to insert
CREATE POLICY "Anyone can insert contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);