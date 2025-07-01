-- 좋아요 수 증가 함수
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = likes_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;