
-- Fix existing posts with incorrect likes_count
UPDATE public.posts p
SET likes_count = (
  SELECT COUNT(*)::integer
  FROM public.post_likes pl
  WHERE pl.post_id = p.id
)
WHERE EXISTS (
  SELECT 1
  FROM public.post_likes pl
  WHERE pl.post_id = p.id
  HAVING COUNT(*) != p.likes_count
);
