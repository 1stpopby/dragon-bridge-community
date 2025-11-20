-- Add admin policies for managing all posts
CREATE POLICY "Admins can delete any post"
ON posts
FOR DELETE
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update any post"
ON posts
FOR UPDATE
TO authenticated
USING (is_admin_user(auth.uid()));

-- Add admin policies for forum posts
CREATE POLICY "Admins can delete any forum post"
ON forum_posts
FOR DELETE
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update any forum post"
ON forum_posts
FOR UPDATE
TO authenticated
USING (is_admin_user(auth.uid()));