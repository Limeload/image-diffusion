import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getPostById, getCommentsByPostId, getUserByClerkId } from "@/lib/queries";
import { BLUR_DATA_URL } from "@/lib/constants";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import RelativeTime from "@/components/RelativeTime";
import PostActions from "./PostActions";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.users.username} on Pentagram`,
    description: post.prompt,
    openGraph: {
      title: `${post.users.username} on Pentagram`,
      description: post.prompt,
      images: [{ url: post.image_url, width: 512, height: 512, alt: post.prompt }],
    },
    twitter: { card: "summary_large_image", images: [post.image_url] },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const [post, comments] = await Promise.all([
    getPostById(id, viewer?.id ?? null),
    getCommentsByPostId(id),
  ]);
  if (!post) notFound();

  const isOwner = viewer?.id === post.user_id;

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link href="/feed" className="text-2xl font-bold">Pentagram</Link>
        <Link href="/generate" className="text-sm px-4 py-2 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
          + Generate
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-black/[.08] dark:border-white/[.145]">
          <Image src={post.image_url} alt={post.prompt} fill placeholder="blur" blurDataURL={BLUR_DATA_URL}
            className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6">
          <Link href={`/profile/${post.users.username}`} className="flex items-center gap-3">
            {post.users.avatar_url ? (
              <Image src={post.users.avatar_url} alt={post.users.username} width={40} height={40} className="rounded-full" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
            ) : (
              <span className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold uppercase">
                {post.users.username[0]}
              </span>
            )}
            <div>
              <p className="font-medium">{post.users.username}</p>
              <RelativeTime iso={post.created_at} className="text-xs text-gray-400" />
            </div>
          </Link>

          <div>
            <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-1">Prompt</h2>
            <p className="text-sm leading-relaxed">{post.prompt}</p>
          </div>

          <div className="flex items-center gap-4">
            <LikeButton postId={post.id} initialLiked={post.liked_by_me} initialCount={post.like_count} />
            {/* Download */}
            <a href={post.image_url} download={`pentagram-${post.id}.webp`}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              ↓ Download
            </a>
            {/* Owner actions */}
            {isOwner && <PostActions postId={post.id} initialPublic={post.is_public} />}
          </div>

          <CommentSection postId={post.id} initialComments={comments} />
        </div>
      </div>
    </div>
  );
}
