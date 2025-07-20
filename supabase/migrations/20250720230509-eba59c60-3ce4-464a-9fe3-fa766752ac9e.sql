-- Clean up conflicting user_follows policies
-- Drop the old policies that use auth.uid() directly
DROP POLICY IF EXISTS "Users can create their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON user_follows;

-- Keep the correct policies that use profile IDs
-- These should already exist:
-- "Users can follow others" for INSERT
-- "Users can unfollow others" for DELETE  
-- "Users can view all follows" for SELECT