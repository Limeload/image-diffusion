import { NextResponse } from "next/server";
import { getUserByUsername, toggleFollow } from "@/lib/queries";
import { requireAuth } from "@/lib/auth";

interface Params { params: Promise<{ username: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { username } = await params;
  const { user: follower, error } = await requireAuth();
  if (error) return error;

  const target = await getUserByUsername(username);
  if (!target) return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  if (follower.id === target.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const result = await toggleFollow(follower.id, target.id);
  return NextResponse.json(result);
}
