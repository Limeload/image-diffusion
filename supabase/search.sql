-- Run in Supabase SQL editor after schema.sql and follows.sql

-- Semantic search using pgvector cosine distance
CREATE OR REPLACE FUNCTION search_posts_by_embedding(
  query_embedding vector(1536),
  match_count     int,
  viewer_id       uuid DEFAULT NULL
)
RETURNS TABLE (
  id            uuid,
  user_id       uuid,
  image_url     text,
  prompt        text,
  is_public     boolean,
  created_at    timestamptz,
  users         json,
  like_count    bigint,
  comment_count bigint,
  liked_by_me   boolean
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.user_id,
    p.image_url,
    p.prompt,
    p.is_public,
    p.created_at,
    json_build_object('id', u.id, 'username', u.username, 'avatar_url', u.avatar_url) AS users,
    COUNT(DISTINCT l.id)                                                               AS like_count,
    COUNT(DISTINCT c.id)                                                               AS comment_count,
    CASE WHEN viewer_id IS NULL THEN FALSE
         ELSE EXISTS (SELECT 1 FROM likes lv WHERE lv.post_id = p.id AND lv.user_id = viewer_id)
    END                                                                                AS liked_by_me
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN likes    l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  WHERE p.is_public = TRUE
    AND p.embedding IS NOT NULL
  GROUP BY p.id, u.id
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;
