import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getUserByUsername, getUserByClerkId, getPostsByUser } from "@/lib/queries";
import PostCard from "@/components/PostCard";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const profileUser = await getUserByUsername(username);
  if (!profileUser) notFound();

  const posts = await getPostsByUser(profileUser.id, viewer?.id ?? null);
  const isOwn = viewer?.id === profileUser.id;

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link href="/feed" className="text-2xl font-bold">Pentagram</Link>
        {isOwn && (
          <Link href="/generate" className="text-sm px-4 py-2 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
            + Generate
          </Link>
        )}
      </header>

      {/* Profile header */}
      <div className="flex items-center gap-6 mb-10">
        {profileUser.avatar_url ? (
          <Image
            src={profileUser.avatar_url}
            alt={profileUser.username}
            width={80}
            height={80}
            className="rounded-full"
          />
        ) : (
          <span className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold uppercase">
            {profileUser.username[0]}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{profileUser.username}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
          {/* TODO: follower/following counts (requires follows table in Phase N) */}
        </div>
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
          {isOwn ? (
            <>No posts yet. <Link href="/generate" className="ml-1 underline">Generate your first image!</Link></>
          ) : (
            "No public posts yet."
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
