-- Add admin deletion policies for forum posts and replies

-- Allow admins to delete forum posts
CREATE POLICY "Admins can delete posts" 
ON public.forum_posts 
FOR DELETE 
USING (is_admin_user(auth.uid()));

-- Allow admins to update forum posts  
CREATE POLICY "Admins can update posts" 
ON public.forum_posts 
FOR UPDATE 
USING (is_admin_user(auth.uid()));

-- Allow admins to delete forum replies
CREATE POLICY "Admins can delete replies" 
ON public.forum_replies 
FOR DELETE 
USING (is_admin_user(auth.uid()));

-- Allow admins to update forum replies
CREATE POLICY "Admins can update replies" 
ON public.forum_replies 
FOR UPDATE 
USING (is_admin_user(auth.uid()));