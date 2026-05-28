"use client";

import { useState } from "react";
import { addToast } from "@/hooks/useToast";

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ postId, initialLiked, initialCount }: Props) {
  const [liked,   setLiked]   = useState(initialLiked);
  const [count,   setCount]   = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setCount(c => c + (next ? 1 : -1));
    setPending(true);

    try {
      const res  = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.like_count);
      if (data.liked) addToast("Liked!", "success");
    } catch {
      setLiked(l => !l);
      setCount(c => c + (liked ? 1 : -1));
      addToast("Couldn't update like", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      className="flex items-center gap-1 text-sm transition-colors disabled:opacity-60"
    >
      <span className={`inline-block transition-transform duration-150 ${liked ? "text-red-500 scale-125" : "text-gray-400 hover:text-red-400 scale-100"}`}>
        {liked ? "♥" : "♡"}
      </span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
