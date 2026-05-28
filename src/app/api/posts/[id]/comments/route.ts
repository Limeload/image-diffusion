import { NextResponse } from "next/server";
import { insertComment } from "@/lib/queries";
import { requireAuth } from "@/lib/auth";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id: postId } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const { body } = await request.json();
  const trimmed = body?.trim() ?? "";
  if (!trimmed) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  if (trimmed.length > MAX_COMMENT_LENGTH)
    return NextResponse.json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` }, { status: 422 });

  const comment = await insertComment({ userId: user.id, postId, body: trimmed });
  return NextResponse.json(comment, { status: 201 });
}
