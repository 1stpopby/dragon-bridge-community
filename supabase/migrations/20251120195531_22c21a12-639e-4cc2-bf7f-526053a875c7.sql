-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;

-- Recreate the trigger to ensure it's properly attached
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Update existing posts to have correct like counts
UPDATE posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM post_likes 
  WHERE post_likes.post_id = posts.id
);