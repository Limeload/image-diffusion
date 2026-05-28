"use client";

import { useState } from "react";

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ postId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    // Optimistic update
    setLiked(l => !l);
    setCount(c => (liked ? c - 1 : c + 1));
    setPending(true);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.like_count);
    } catch {
      // Roll back on error
      setLiked(l => !l);
      setCount(c => (liked ? c + 1 : c - 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={liked ? "Unlike" : "Like"}
      className="flex items-center gap-1 text-sm transition-colors disabled:opacity-60"
    >
      <span className={liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}>
        {liked ? "♥" : "♡"}
      </span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
