"use client";

import { useState } from "react";
import { addToast } from "@/hooks/useToast";

interface Props {
  username: string;
  initialFollowing: boolean;
  initialFollowers: number;
}

export default function FollowButton({ username, initialFollowing, initialFollowers }: Props) {
  const [following,  setFollowing]  = useState(initialFollowing);
  const [followers,  setFollowers]  = useState(initialFollowers);
  const [pending,    setPending]    = useState(false);

  async function toggle() {
    if (pending) return;
    const next = !following;
    setFollowing(next);
    setFollowers(c => c + (next ? 1 : -1));
    setPending(true);

    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowing(data.following);
      setFollowers(data.followers);
      addToast(data.following ? `Following ${username}` : `Unfollowed ${username}`, "info");
    } catch {
      setFollowing(f => !f);
      setFollowers(c => c + (following ? 1 : -1));
      addToast("Couldn't update follow", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={pending}
        aria-pressed={following}
        className={`px-4 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 ${following ? "border-black/[.2] dark:border-white/[.2] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-300" : "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] border-transparent"}`}
      >
        {pending ? (following ? "Unfollowing…" : "Following…") : (following ? "Following" : "Follow")}
      </button>
      <span className="text-sm text-gray-500 tabular-nums">{followers} followers</span>
    </div>
  );
}
