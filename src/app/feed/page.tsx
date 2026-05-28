import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getFeedPosts, getFollowingFeedPosts, getUserByClerkId } from "@/lib/queries";
import InfiniteScrollFeed from "@/components/InfiniteScrollFeed";

interface Props { searchParams: Promise<{ tab?: string }> }

export default async function FeedPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const isFollowing = tab === "following";

  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const posts = isFollowing && viewer
    ? await getFollowingFeedPosts(viewer.id, null)
    : await getFeedPosts(null, 10, viewer?.id ?? null);

  return (
    <div className="min-h-screen flex flex-col p-8">
      <header className="flex items-center justify-between mb-6">
        <span className="text-2xl font-bold">Pentagram</span>
        <nav className="hidden sm:flex gap-4 text-sm items-center">
          <Link href="/trending" className="hover:underline">Trending</Link>
          <Link href="/search" className="hover:underline">Search</Link>
          <Link href="/generate" className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
            + Generate
          </Link>
          {viewer && <Link href={`/profile/${viewer.username}`} className="hover:underline">{viewer.username}</Link>}
        </nav>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-black/[.08] dark:border-white/[.08]">
        {[
          { label: "For you",   href: "/feed" },
          { label: "Following", href: "/feed?tab=following" },
        ].map(({ label, href }) => {
          const active = label === "Following" ? isFollowing : !isFollowing;
          return (
            <Link key={label} href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? "border-foreground text-foreground" : "border-transparent text-gray-400 hover:text-foreground"}`}>
              {label}
            </Link>
          );
        })}
      </div>

      <main>
        <InfiniteScrollFeed initialPosts={posts} tab={tab ?? "all"} />
      </main>
    </div>
  );
}
