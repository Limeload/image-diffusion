"use client";

import Image from "next/image";
import Link from "next/link";
import LikeButton from "./LikeButton";
import type { Post } from "@/types";

interface Props {
  post: Post;
}

function ShareButton({ postId }: { postId: string }) {
  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
  }
  return (
    <button onClick={copy} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
      Share
    </button>
  );
}

export default function PostCard({ post }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Image */}
      <Link href={`/post/${post.id}`} className="block relative aspect-square w-full rounded-xl overflow-hidden border border-black/[.08] dark:border-white/[.145] bg-black/[.04] dark:bg-white/[.04]">
        <Image
          src={post.image_url}
          alt={post.prompt}
          fill
          className="object-cover hover:scale-[1.02] transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>

      {/* Meta */}
      <div className="flex items-center justify-between px-1">
        <Link href={`/profile/${post.users.username}`} className="flex items-center gap-2 min-w-0">
          {post.users.avatar_url ? (
            <Image
              src={post.users.avatar_url}
              alt={post.users.username}
              width={24}
              height={24}
              className="rounded-full shrink-0"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center text-[10px] font-bold uppercase">
              {post.users.username[0]}
            </span>
          )}
          <span className="text-sm truncate">{post.users.username}</span>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <LikeButton postId={post.id} initialLiked={post.liked_by_me} initialCount={post.like_count} />
          <Link href={`/post/${post.id}#comments`} className="flex items-center gap-1 text-sm text-gray-400">
            <span>💬</span>
            <span className="tabular-nums">{post.comment_count}</span>
          </Link>
          <ShareButton postId={post.id} />
        </div>
      </div>

      {/* Prompt */}
      <p className="text-xs text-gray-500 dark:text-gray-400 px-1 line-clamp-2">{post.prompt}</p>
    </div>
  );
}
