"use client";

import { useEffect, useRef, useState } from "react";
import PostCard from "./PostCard";
import type { Post } from "@/types";

interface Props {
  initialPosts: Post[];
  tab?: string;
}

export default function InfiniteScrollFeed({ initialPosts, tab = "all" }: Props) {
  const [posts,   setPosts]   = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === 10);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, posts]);

  async function loadMore() {
    const cursor = posts[posts.length - 1]?.created_at;
    if (!cursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor, limit: "10", tab });
      const res = await fetch(`/api/feed?${params}`);
      const data: Post[] = await res.json();
      setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === 10);
    } finally {
      setLoading(false);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-sm gap-2">
        {tab === "following"
          ? <><p>No posts from people you follow yet.</p><p>Follow some users to see their posts here.</p></>
          : <><p>No posts yet.</p><a href="/generate" className="underline">Generate the first one!</a></>
        }
      </div>
    );
  }

  return (
    <div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {posts.map(post => (
          <div key={post.id} className="break-inside-avoid">
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin text-gray-400" />
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-8">You&apos;ve seen everything!</p>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
