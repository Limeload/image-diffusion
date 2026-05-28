"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToast } from "@/hooks/useToast";

interface Props {
  postId: string;
  initialPublic: boolean;
}

export default function PostActions({ postId, initialPublic }: Props) {
  const [isPublic,  setIsPublic]  = useState(initialPublic);
  const [deleting,  setDeleting]  = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const router = useRouter();

  async function toggleVisibility() {
    setToggling(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !isPublic }),
      });
      if (!res.ok) throw new Error();
      setIsPublic(v => !v);
      addToast(`Post is now ${!isPublic ? "public" : "private"}`, "info");
    } catch {
      addToast("Couldn't update visibility", "error");
    } finally {
      setToggling(false);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("Post deleted", "info");
      router.push("/feed");
    } catch {
      addToast("Couldn't delete post", "error");
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={toggleVisibility} disabled={toggling}
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50">
        {isPublic ? "Make private" : "Make public"}
      </button>
      <button onClick={deletePost} disabled={deleting}
        className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
