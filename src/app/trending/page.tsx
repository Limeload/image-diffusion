import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, getTrendingPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";

export default async function TrendingPage() {
  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const posts = await getTrendingPosts(viewer?.id ?? null);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link href="/feed" className="text-2xl font-bold">Pentagram</Link>
        <nav className="flex gap-4 text-sm items-center">
          <Link href="/feed" className="hover:underline">Feed</Link>
          <Link href="/generate" className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
            + Generate
          </Link>
        </nav>
      </header>

      <h1 className="text-xl font-semibold mb-2">Trending</h1>
      <p className="text-sm text-gray-400 mb-8">Most-liked posts from the past 7 days</p>

      {posts.length === 0 ? (
        <EmptyState icon="↑" title="Nothing trending yet" description="Check back soon — liked posts from the past 7 days will appear here." />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {posts.map((post, i) => (
            <div key={post.id} className="break-inside-avoid relative">
              {i < 3 && (
                <span className="absolute top-2 left-2 z-10">
                  <Badge rank={i + 1} />
                </span>
              )}
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
