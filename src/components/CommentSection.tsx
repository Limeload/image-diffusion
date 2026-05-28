"use client";

import { useState } from "react";
import Image from "next/image";
import { addToast } from "@/hooks/useToast";
import { BLUR_DATA_URL, MAX_COMMENT_LENGTH } from "@/lib/constants";
import type { Comment } from "@/types";

interface Props {
  postId: string;
  initialComments: Comment[];
}

export default function CommentSection({ postId, initialComments }: Props) {
  const [comments,   setComments]   = useState<Comment[]>(initialComments);
  const [body,       setBody]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const comment: Comment = await res.json();
      setComments(prev => [...prev, comment]);
      setBody("");
      addToast("Comment posted!", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="comments" className="flex flex-col gap-4">
      <h2 className="font-semibold">Comments ({comments.length})</h2>

      <ul className="flex flex-col gap-4">
        {comments.length === 0 && <li className="text-sm text-gray-400">No comments yet. Be the first!</li>}
        {comments.map(c => (
          <li key={c.id} className="flex gap-3">
            {c.users.avatar_url ? (
              <Image src={c.users.avatar_url} alt={c.users.username} width={32} height={32} className="rounded-full shrink-0 mt-0.5" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
            ) : (
              <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center text-xs font-bold uppercase mt-0.5">
                {c.users.username[0]}
              </span>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{c.users.username}</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{c.body}</p>
              <time className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</time>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            value={body}
            onChange={e => setBody(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            placeholder="Add a comment…"
            disabled={submitting}
            aria-label="Comment text"
            className="flex-1 p-2 text-sm rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
          />
          <button type="submit" disabled={submitting || !body.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50">
            Post
          </button>
        </div>
        {body.length > 0 && (
          <p className={`text-right text-[10px] tabular-nums ${body.length >= MAX_COMMENT_LENGTH ? "text-red-400" : "text-gray-400"}`}>
            {body.length}/{MAX_COMMENT_LENGTH}
          </p>
        )}
      </form>
    </section>
  );
}
