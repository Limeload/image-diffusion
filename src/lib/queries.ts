import { getServiceClient } from "./supabase";
import type { Comment, Post, User } from "@/types";

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const sb = getServiceClient();
  const { data } = await sb
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();
  return data ?? null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const sb = getServiceClient();
  const { data } = await sb
    .from("users")
    .select("*")
    .eq("username", username)
    .single();
  return data ?? null;
}

export async function upsertUser(params: {
  clerkId: string;
  username: string;
  avatarUrl?: string | null;
}): Promise<User> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("users")
    .upsert(
      { clerk_id: params.clerkId, username: params.username, avatar_url: params.avatarUrl ?? null },
      { onConflict: "clerk_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Posts ────────────────────────────────────────────────────────────────────

type RawPost = {
  id: string;
  user_id: string;
  image_url: string;
  prompt: string;
  is_public: boolean;
  created_at: string;
  users: { id: string; username: string; avatar_url: string | null };
  likes: [{ count: number }];
  comments: [{ count: number }];
};

function normalizePost(raw: RawPost, likedPostIds: Set<string>): Post {
  return {
    id: raw.id,
    user_id: raw.user_id,
    image_url: raw.image_url,
    prompt: raw.prompt,
    is_public: raw.is_public,
    created_at: raw.created_at,
    users: raw.users,
    like_count: raw.likes?.[0]?.count ?? 0,
    comment_count: raw.comments?.[0]?.count ?? 0,
    liked_by_me: likedPostIds.has(raw.id),
  };
}

const POST_SELECT = `
  id, user_id, image_url, prompt, is_public, created_at,
  users:user_id (id, username, avatar_url),
  likes(count),
  comments(count)
`;

export async function getFeedPosts(
  cursor: string | null,
  limit = 10,
  viewerUserId?: string | null
): Promise<Post[]> {
  const sb = getServiceClient();
  let q = sb
    .from("posts")
    .select(POST_SELECT)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    q = q.lt("created_at", cursor);
  }

  const { data, error } = await q;
  if (error) throw error;

  const likedSet = await getLikedPostIds(viewerUserId, (data ?? []).map(p => p.id));
  return (data as unknown as RawPost[]).map(p => normalizePost(p, likedSet));
}

export async function getPostById(
  id: string,
  viewerUserId?: string | null
): Promise<Post | null> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const likedSet = await getLikedPostIds(viewerUserId, [id]);
  return normalizePost(data as unknown as RawPost, likedSet);
}

export async function getPostsByUser(
  userId: string,
  viewerUserId?: string | null
): Promise<Post[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const likedSet = await getLikedPostIds(viewerUserId, (data ?? []).map(p => p.id));
  return (data as unknown as RawPost[]).map(p => normalizePost(p, likedSet));
}

export async function insertPost(params: {
  userId: string;
  imageUrl: string;
  prompt: string;
}): Promise<Post> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("posts")
    .insert({ user_id: params.userId, image_url: params.imageUrl, prompt: params.prompt })
    .select(POST_SELECT)
    .single();
  if (error) throw error;
  return normalizePost(data as unknown as RawPost, new Set());
}

// ─── Likes ────────────────────────────────────────────────────────────────────

async function getLikedPostIds(
  userId: string | null | undefined,
  postIds: string[]
): Promise<Set<string>> {
  if (!userId || postIds.length === 0) return new Set();
  const sb = getServiceClient();
  const { data } = await sb
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  return new Set((data ?? []).map(l => l.post_id));
}

export async function toggleLike(userId: string, postId: string): Promise<{ liked: boolean }> {
  const sb = getServiceClient();
  const { data: existing } = await sb
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .single();

  if (existing) {
    await sb.from("likes").delete().eq("id", existing.id);
    return { liked: false };
  } else {
    await sb.from("likes").insert({ user_id: userId, post_id: postId });
    return { liked: true };
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("comments")
    .select("id, post_id, user_id, body, created_at, users:user_id (id, username, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Comment[];
}

export async function insertComment(params: {
  userId: string;
  postId: string;
  body: string;
}): Promise<Comment> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("comments")
    .insert({ user_id: params.userId, post_id: params.postId, body: params.body })
    .select("id, post_id, user_id, body, created_at, users:user_id (id, username, avatar_url)")
    .single();
  if (error) throw error;
  return data as unknown as Comment;
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<{ following: boolean; followers: number }> {
  const sb = getServiceClient();
  const { data: existing } = await sb
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  if (existing) {
    await sb.from("follows").delete().eq("id", existing.id);
  } else {
    await sb.from("follows").insert({ follower_id: followerId, following_id: followingId });
  }

  const { count } = await sb
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", followingId)
    .then(r => ({ count: r.count ?? 0 }));

  return { following: !existing, followers: count };
}

export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const sb = getServiceClient();
  const [{ count: followers }, { count: following }] = await Promise.all([
    sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const sb = getServiceClient();
  const { data } = await sb
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();
  return !!data;
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const sb = getServiceClient();
  const { data } = await sb.from("follows").select("following_id").eq("follower_id", userId);
  return (data ?? []).map(r => r.following_id);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchPosts(
  query: string,
  viewerUserId?: string | null
): Promise<Post[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("posts")
    .select(POST_SELECT)
    .eq("is_public", true)
    .ilike("prompt", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  const likedSet = await getLikedPostIds(viewerUserId, (data ?? []).map(p => p.id));
  return (data as unknown as RawPost[]).map(p => normalizePost(p, likedSet));
}

// ─── Trending ─────────────────────────────────────────────────────────────────

export async function getTrendingPosts(viewerUserId?: string | null): Promise<Post[]> {
  const sb = getServiceClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await sb
    .from("posts")
    .select(POST_SELECT)
    .eq("is_public", true)
    .gte("created_at", since)
    .limit(60);

  if (error) throw error;
  const likedSet = await getLikedPostIds(viewerUserId, (data ?? []).map(p => p.id));
  const posts = (data as unknown as RawPost[]).map(p => normalizePost(p, likedSet));
  return posts.sort((a, b) => b.like_count - a.like_count).slice(0, 24);
}

// ─── Following feed ───────────────────────────────────────────────────────────

export async function getFollowingFeedPosts(
  viewerUserId: string,
  cursor: string | null,
  limit = 10
): Promise<Post[]> {
  const followingIds = await getFollowingIds(viewerUserId);
  if (followingIds.length === 0) return [];

  const sb = getServiceClient();
  let q = sb
    .from("posts")
    .select(POST_SELECT)
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) q = q.lt("created_at", cursor);

  const { data, error } = await q;
  if (error) throw error;

  const likedSet = await getLikedPostIds(viewerUserId, (data ?? []).map(p => p.id));
  return (data as unknown as RawPost[]).map(p => normalizePost(p, likedSet));
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

export async function updatePostEmbedding(postId: string, embedding: number[]): Promise<void> {
  const sb = getServiceClient();
  await sb.from("posts").update({ embedding: JSON.stringify(embedding) }).eq("id", postId);
}

export async function semanticSearchPosts(
  embedding: number[],
  viewerUserId?: string | null,
  limit = 20
): Promise<Post[]> {
  const sb = getServiceClient();
  const vectorStr = `[${embedding.join(",")}]`;

  // pgvector cosine distance — requires the search function in supabase/search.sql
  const { data, error } = await sb.rpc("search_posts_by_embedding", {
    query_embedding: vectorStr,
    match_count: limit,
    viewer_id: viewerUserId ?? null,
  });

  if (error) throw error;
  return (data ?? []) as Post[];
}
