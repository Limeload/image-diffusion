import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, insertComment } from "@/lib/queries";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id: postId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { body } = await request.json();
  if (!body?.trim()) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });

  const comment = await insertComment({ userId: user.id, postId, body: body.trim() });
  return NextResponse.json(comment, { status: 201 });
}
