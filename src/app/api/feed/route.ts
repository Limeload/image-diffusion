import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFeedPosts, getFollowingFeedPosts, getUserByClerkId } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit  = Math.min(Number(searchParams.get("limit") ?? "10"), 50);
  const tab    = searchParams.get("tab") ?? "all";

  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  const posts = tab === "following" && viewer
    ? await getFollowingFeedPosts(viewer.id, cursor, limit)
    : await getFeedPosts(cursor, limit, viewer?.id ?? null);

  return NextResponse.json(posts);
}
