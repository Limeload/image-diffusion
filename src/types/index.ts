export interface User {
  id: string;
  clerk_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  prompt: string;
  is_public: boolean;
  created_at: string;
  users: Pick<User, "id" | "username" | "avatar_url">;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  users: Pick<User, "id" | "username" | "avatar_url">;
}
