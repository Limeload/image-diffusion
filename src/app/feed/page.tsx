import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getFeedPosts, getUserByClerkId } from "@/lib/queries";
import InfiniteScrollFeed from "@/components/InfiniteScrollFeed";

export default async function FeedPage() {
  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const posts = await getFeedPosts(null, 10, viewer?.id ?? null);

  return (
    <div className="min-h-screen flex flex-col p-8">
      <header className="flex items-center justify-between mb-8">
        <span className="text-2xl font-bold">Pentagram</span>
        <nav className="flex gap-4 text-sm items-center">
          <Link href="/generate" className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
            + Generate
          </Link>
          {viewer && (
            <Link href={`/profile/${viewer.username}`} className="hover:underline">
              {viewer.username}
            </Link>
          )}
        </nav>
      </header>

      <main>
        <InfiniteScrollFeed initialPosts={posts} />
      </main>
    </div>
  );
}
