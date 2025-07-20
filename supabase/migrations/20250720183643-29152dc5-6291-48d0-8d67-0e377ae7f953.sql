-- Create notification function for feedback
CREATE OR REPLACE FUNCTION notify_feedback_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify company when they receive feedback
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id,
    related_type
  ) 
  SELECT 
    p.user_id,
    'feedback_received',
    'New Customer Feedback',
    'You received a ' || NEW.rating || '-star review: "' || LEFT(NEW.title, 50) || '"',
    NEW.id,
    'service_feedback'
  FROM profiles p
  WHERE p.id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback notifications
DROP TRIGGER IF EXISTS trigger_notify_feedback_received ON service_feedback;
CREATE TRIGGER trigger_notify_feedback_received
  AFTER INSERT ON service_feedback
  FOR EACH ROW EXECUTE FUNCTION notify_feedback_received();

-- Create notification function for new forum replies
CREATE OR REPLACE FUNCTION notify_forum_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify original post author
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id,
    related_type
  )
  SELECT 
    fp.user_id,
    'forum_reply',
    'New Reply on Your Post',
    NEW.author_name || ' replied to your forum post',
    NEW.post_id,
    'forum_post'
  FROM forum_posts fp
  WHERE fp.id = NEW.post_id 
  AND fp.user_id != NEW.user_id; -- Don't notify if replying to own post
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for forum reply notifications
DROP TRIGGER IF EXISTS trigger_notify_forum_reply ON forum_replies;
CREATE TRIGGER trigger_notify_forum_reply
  AFTER INSERT ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION notify_forum_reply();

-- Create notification function for marketplace inquiries
CREATE OR REPLACE FUNCTION notify_marketplace_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify item owner when someone inquires about their listing
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id,
    related_type
  )
  SELECT 
    mi.user_id,
    'marketplace_inquiry',
    'New Inquiry on Your Listing',
    NEW.inquirer_name || ' is interested in your listing',
    NEW.item_id,
    'marketplace_item'
  FROM marketplace_items mi
  WHERE mi.id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for marketplace inquiry notifications
DROP TRIGGER IF EXISTS trigger_notify_marketplace_inquiry ON marketplace_inquiries;
CREATE TRIGGER trigger_notify_marketplace_inquiry
  AFTER INSERT ON marketplace_inquiries
  FOR EACH ROW EXECUTE FUNCTION notify_marketplace_inquiry();

-- Create notification function for new group members
CREATE OR REPLACE FUNCTION notify_new_group_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify group organizer when someone joins their group
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id,
    related_type
  )
  SELECT 
    cg.user_id,
    'new_group_member',
    'New Group Member',
    NEW.member_name || ' joined your group "' || cg.name || '"',
    NEW.group_id,
    'community_group'
  FROM community_groups cg
  WHERE cg.id = NEW.group_id
  AND cg.user_id != NEW.user_id; -- Don't notify if organizer joins own group
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new group member notifications
DROP TRIGGER IF EXISTS trigger_notify_new_group_member ON group_memberships;
CREATE TRIGGER trigger_notify_new_group_member
  AFTER INSERT ON group_memberships
  FOR EACH ROW EXECUTE FUNCTION notify_new_group_member();

-- Create notification function for post comments
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify post author when someone comments on their post
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id,
    related_type
  )
  SELECT 
    p.user_id,
    'post_comment',
    'New Comment on Your Post',
    NEW.author_name || ' commented on your post',
    NEW.post_id,
    'post'
  FROM posts p
  WHERE p.id = NEW.post_id 
  AND p.user_id != NEW.user_id; -- Don't notify if commenting on own post
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post comment notifications
DROP TRIGGER IF EXISTS trigger_notify_post_comment ON post_comments;
CREATE TRIGGER trigger_notify_post_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION notify_post_comment();

-- Create notification function for service requests (enhanced)
CREATE OR REPLACE FUNCTION notify_new_service_request()
RETURNS TRIGGER AS $$
BEGIN
  -- This will notify relevant companies when a new service request is created
  -- For now, we'll just create a basic notification
  -- In a real system, you might want to match based on service categories/skills
  
  IF NEW.inquiry_type = 'request_service' THEN
    -- You could add logic here to notify specific companies based on:
    -- - Service category
    -- - Location proximity  
    -- - Company specialties
    -- For now, we'll just log that a new request was created
    
    NULL; -- Placeholder - companies will see requests in their dashboard
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for service request notifications  
DROP TRIGGER IF EXISTS trigger_notify_new_service_request ON service_inquiries;
CREATE TRIGGER trigger_notify_new_service_request
  AFTER INSERT ON service_inquiries
  FOR EACH ROW EXECUTE FUNCTION notify_new_service_request();