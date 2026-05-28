import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, toggleLike } from "@/lib/queries";
import { getServiceClient } from "@/lib/supabase";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { id: postId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { liked } = await toggleLike(user.id, postId);

  // Return fresh like count
  const sb = getServiceClient();
  const { count } = await sb
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .then(r => ({ count: r.count ?? 0 }));

  return NextResponse.json({ liked, like_count: count });
}
