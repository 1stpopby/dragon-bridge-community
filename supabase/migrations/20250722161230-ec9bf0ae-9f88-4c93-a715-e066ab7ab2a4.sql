-- Fix existing comment counts that are out of sync
UPDATE posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM post_comments 
  WHERE post_comments.post_id = posts.id
)
WHERE comments_count != (
  SELECT COUNT(*) 
  FROM post_comments 
  WHERE post_comments.post_id = posts.id
);

-- Fix existing like counts that are out of sync  
UPDATE posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM post_likes 
  WHERE post_likes.post_id = posts.id
)
WHERE likes_count != (
  SELECT COUNT(*) 
  FROM post_likes 
  WHERE post_likes.post_id = posts.id
);