import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTrendingPosts, getUserByClerkId } from "@/lib/queries";

export async function GET() {
  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;
  const posts = await getTrendingPosts(viewer?.id ?? null);
  return NextResponse.json(posts, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
