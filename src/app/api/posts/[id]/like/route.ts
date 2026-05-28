import { NextResponse } from "next/server";
import { toggleLike } from "@/lib/queries";
import { getServiceClient } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { id: postId } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const { liked } = await toggleLike(user.id, postId);

  const sb = getServiceClient();
  const { count } = await sb
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .then(r => ({ count: r.count ?? 0 }));

  return NextResponse.json({ liked, like_count: count });
}
