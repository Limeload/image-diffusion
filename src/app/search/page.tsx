import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, searchPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import SearchInput from "./SearchInput";

interface Props { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const posts = q?.trim() ? await searchPosts(q.trim(), viewer?.id ?? null) : [];

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link href="/feed" className="text-2xl font-bold">Pentagram</Link>
        <Link href="/generate" className="text-sm px-4 py-2 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
          + Generate
        </Link>
      </header>

      <div className="mb-8">
        <SearchInput initialQuery={q ?? ""} />
      </div>

      {q && posts.length === 0 && (
        <p className="text-center text-gray-400 py-16">No results for &ldquo;{q}&rdquo;</p>
      )}

      {!q && (
        <p className="text-center text-gray-400 py-16">Type a prompt to search images</p>
      )}

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {posts.map(post => (
          <div key={post.id} className="break-inside-avoid">
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
