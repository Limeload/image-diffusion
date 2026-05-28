import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getUserByUsername, getUserByClerkId, getPostsByUser, getFollowCounts, isFollowing } from "@/lib/queries";
import { BLUR_DATA_URL } from "@/lib/constants";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";

interface Props { params: Promise<{ username: string }> }

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const profileUser = await getUserByUsername(username);
  if (!profileUser) notFound();

  const [posts, counts, following] = await Promise.all([
    getPostsByUser(profileUser.id, viewer?.id ?? null),
    getFollowCounts(profileUser.id),
    viewer && viewer.id !== profileUser.id ? isFollowing(viewer.id, profileUser.id) : Promise.resolve(false),
  ]);

  const isOwn = viewer?.id === profileUser.id;

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link href="/feed" className="text-2xl font-bold">Pentagram</Link>
        <div className="flex items-center gap-3">
          {isOwn && (
            <Link href="/profile/edit" className="text-sm px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors">
              Edit profile
            </Link>
          )}
          {isOwn && (
            <Link href="/generate" className="text-sm px-4 py-2 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
              + Generate
            </Link>
          )}
        </div>
      </header>

      {/* Profile header */}
      <div className="flex items-start gap-6 mb-10">
        {profileUser.avatar_url ? (
          <Image src={profileUser.avatar_url} alt={profileUser.username} width={80} height={80}
            className="rounded-full shrink-0" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
        ) : (
          <span className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center text-2xl font-bold uppercase">
            {profileUser.username[0]}
          </span>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">{profileUser.username}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span><strong className="text-foreground">{posts.length}</strong> posts</span>
            <span><strong className="text-foreground">{counts.followers}</strong> followers</span>
            <span><strong className="text-foreground">{counts.following}</strong> following</span>
          </div>
          {!isOwn && viewer && (
            <FollowButton username={profileUser.username} initialFollowing={!!following} initialFollowers={counts.followers} />
          )}
        </div>
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
          {isOwn
            ? <><span>No posts yet.</span><Link href="/generate" className="ml-1 underline">Generate your first image!</Link></>
            : "No public posts yet."
          }
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={isOwn ? undefined : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
